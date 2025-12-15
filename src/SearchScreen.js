import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Keyboard,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useLanguage } from './LanguageContext';
import { getProductForNavigation, getProductImageSource } from './utils/products';
import Voice from '@react-native-voice/voice';

const MAX_RECENT_SEARCHES = 10;

const emptyArray = [];

const SearchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { t, getVoiceLocale } = useLanguage();

  const {
    initialQuery = '',
    prefetchedRecentSearches = emptyArray,
    recommendedProducts: recommendedFromRoute = emptyArray,
    contextualRecommended: contextualFromRoute = emptyArray,
    allProducts: allProductsFromRoute = emptyArray,
    submitOnOpen = false,
  } = route.params || {};

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState(
    Array.isArray(prefetchedRecentSearches) ? prefetchedRecentSearches : emptyArray,
  );
  const [isListening, setIsListening] = useState(false);

  const searchInputRef = useRef(null);
  const micPulse = useRef(new Animated.Value(1)).current;
  const micLoopRef = useRef(null);

  const persistRecentSearches = useCallback(async (entries) => {
    const trimmedEntries = entries
      .filter(Boolean)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, MAX_RECENT_SEARCHES);

    const user = auth().currentUser;
    if (!user) return;

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .set({ recentSearches: trimmedEntries }, { merge: true });
    } catch (error) {
      console.error('Error saving search:', error);
    }
  }, []);

  const handleSearchSubmit = useCallback(
    async (query) => {
      const trimmed = (query || '').trim();
      if (!trimmed) return;

      setSearchQuery(trimmed);
      setRecentSearches((prev) => {
        const uniqueList = [trimmed, ...prev.filter((item) => item !== trimmed)];
        const updated = uniqueList.slice(0, MAX_RECENT_SEARCHES);
        persistRecentSearches(updated);
        return updated;
      });
      Keyboard.dismiss();
    },
    [persistRecentSearches],
  );

  useEffect(() => {
    const current = auth().currentUser;
    if (!current) return undefined;

    const unsubscribe = firestore()
      .collection('users')
      .doc(current.uid)
      .onSnapshot((doc) => {
        const data = doc.data() || {};
        if (Array.isArray(data.recentSearches)) {
          setRecentSearches(data.recentSearches.slice(0, MAX_RECENT_SEARCHES));
        }
      });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (submitOnOpen && initialQuery) {
      handleSearchSubmit(initialQuery);
    }
  }, [submitOnOpen, initialQuery, handleSearchSubmit]);

  // Voice recognition handlers
  useEffect(() => {
    try {
      if (Voice && typeof Voice === 'object') {
        Voice.onSpeechStart = () => setIsListening(true);
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechError = (e) => {
          console.error('Speech error:', e);
          setIsListening(false);
          if (e?.error?.message !== '7') { // Ignore error 7 (no match)
            Alert.alert('Error', 'Could not process your voice. Please try again.');
          }
        };
        Voice.onSpeechResults = (e) => {
          const result = e && e.value && e.value[0];
          if (result) {
            setSearchQuery(result);
            handleSearchSubmit(result);
          }
          setIsListening(false);
        };
      } else {
        console.warn('Voice module is null. Skipping listener registration. Rebuild may be required.');
      }
    } catch (err) {
      console.warn('Voice setup error:', err);
    }

    return () => {
      try {
        if (Voice && typeof Voice.destroy === 'function') {
          Voice.destroy().then(() => {
            if (typeof Voice.removeAllListeners === 'function') Voice.removeAllListeners();
          }).catch(() => {});
        }
      } catch (_) {}
    };
  }, [handleSearchSubmit]);

  // Pulse animation while listening
  useEffect(() => {
    if (isListening) {
      micLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1.0, duration: 500, useNativeDriver: true }),
        ])
      );
      micLoopRef.current.start();
    } else {
      try { micLoopRef.current?.stop(); } catch (_) {}
      micPulse.setValue(1);
    }
  }, [isListening]);

  const combinedRecommended = useMemo(() => {
    const seen = new Map();
    const combined = [
      ...(Array.isArray(contextualFromRoute) ? contextualFromRoute : emptyArray),
      ...(Array.isArray(recommendedFromRoute) ? recommendedFromRoute : emptyArray),
    ];
    combined.forEach((product) => {
      if (product && product.id != null && !seen.has(product.id)) {
        seen.set(product.id, product);
      }
    });
    return Array.from(seen.values());
  }, [contextualFromRoute, recommendedFromRoute]);

  const allProducts = useMemo(() => {
    if (Array.isArray(allProductsFromRoute) && allProductsFromRoute.length > 0) {
      return allProductsFromRoute;
    }
    return combinedRecommended;
  }, [allProductsFromRoute, combinedRecommended]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return combinedRecommended;
    }
    const matches = (allProducts || []).filter((product) => {
      const name = product?.name?.toLowerCase() || '';
      const brand = product?.brand?.toLowerCase() || '';
      const category = product?.category?.toLowerCase() || '';
      return name.includes(query) || brand.includes(query) || category.includes(query);
    });
    return matches.length > 0 ? matches : combinedRecommended;
  }, [searchQuery, allProducts, combinedRecommended]);

  const handleRecentTap = useCallback(
    (item) => {
      if (!item) return;
      setSearchQuery(item);
      handleSearchSubmit(item);
    },
    [handleSearchSubmit],
  );

  const handleProductPress = useCallback(
    (product) => {
      if (!product) return;
      if (product.name) {
        handleSearchSubmit(product.name);
      }
      navigation.navigate('ProductDetail', {
        product: getProductForNavigation(product),
      });
    },
    [handleSearchSubmit, navigation],
  );

  const startVoiceRecognition = async () => {
    try {
      if (!Voice || typeof Voice.start !== 'function') {
        Alert.alert('Voice Not Available', 'Please rebuild the app to enable voice recognition.');
        return;
      }
      const voiceLocale = getVoiceLocale();
      await Voice.start(voiceLocale);
      Keyboard.dismiss();
    } catch (e) {
      console.error('Voice start error:', e);
      setIsListening(false);
      Alert.alert('Error', 'Could not start voice recognition. Please check permissions.');
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      if (Voice && typeof Voice.stop === 'function') {
        await Voice.stop();
      }
    } catch (e) {
      console.log('Error stopping voice:', e);
    }
    setIsListening(false);
  };

  const handleMicPress = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  const renderRecentSearch = useCallback(
    ({ item }) => (
      <TouchableOpacity style={styles.recentChip} onPress={() => handleRecentTap(item)}>
        <Ionicons name="time-outline" size={16} color="#475569" style={{ marginRight: 6 }} />
        <Text style={styles.recentChipText} numberOfLines={1}>
          {item}
        </Text>
      </TouchableOpacity>
    ),
    [handleRecentTap],
  );

  const renderProductItem = useCallback(
    ({ item }) => {
      const productName = item?.name || '';
      const brand = item?.brand || '';
      const category = item?.category || '';
      const packInfo = item?.pack || item?.quantity || '';
      
      return (
        <TouchableOpacity
          style={styles.productCard}
          activeOpacity={0.85}
          onPress={() => handleProductPress(item)}
        >
          <View style={styles.productImageContainer}>
            {getProductImageSource(item) ? (
              <Image source={getProductImageSource(item)} style={styles.productImage} />
            ) : (
              <Text style={styles.productImagePlaceholder}>📦</Text>
            )}
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productBrandName} numberOfLines={2}>
              {brand && productName ? `${brand} ${productName}` : productName || brand}
            </Text>
            {packInfo && (
              <Text style={styles.productPackInfo} numberOfLines={1}>
                {packInfo}
              </Text>
            )}
            {category && (
              <Text style={styles.productCategory} numberOfLines={1}>
                {category}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      );
    },
    [handleProductPress, t],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top || 0, 12) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={handleMicPress}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: micPulse }] }}>
              <Ionicons 
                name={isListening ? "mic" : "mic-outline"} 
                size={22} 
                color={isListening ? "#EF4444" : "#666666"} 
              />
            </Animated.View>
          </TouchableOpacity>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            value={searchQuery}
            placeholder={t('searchProducts')}
            placeholderTextColor="#94A3B8"
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearchSubmit(searchQuery)}
            returnKeyType="search"
            autoFocus
          />
        </View>
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery('');
              searchInputRef.current?.focus();
            }}
          >
            <Ionicons name="close" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('recentSearches')}</Text>
          {recentSearches.length === 0 ? (
            <Text style={styles.emptyStateText}>
              {t('searchNoHistory') || 'Start searching to see history here.'}
            </Text>
          ) : (
            <FlatList
              data={recentSearches}
              keyExtractor={(item, index) => `${item}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
              renderItem={renderRecentSearch}
            />
          )}
        </View>

        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.sectionTitle}>
            Products for You
          </Text>
          {filteredProducts.length === 0 ? (
            <Text style={styles.emptyStateText}>
              {t('searchNoResults') || 'No matching products yet.'}
            </Text>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item, index) => `${item?.id ?? index}`}
              renderItem={renderProductItem}
              ItemSeparatorComponent={() => <View style={styles.productSeparator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productList}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingLeft: 8,
    paddingRight: 12,
    height: 42,
  },
  micButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 16,
  },
  micButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 16,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  clearButtonPlaceholder: {
    marginLeft: 12,
    width: 32,
    height: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  recentList: {
    paddingVertical: 4,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  recentChipText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    maxWidth: 160,
  },
  productList: {
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productSeparator: {
    height: 12,
  },
  productImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  productImagePlaceholder: {
    fontSize: 30,
  },
  productDetails: {
    flex: 1,
  },
  productBrandName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  productPackInfo: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});

