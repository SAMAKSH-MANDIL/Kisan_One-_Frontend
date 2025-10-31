import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Linking,
  Platform,
  PermissionsAndroid,
  Keyboard,
  Image,
  Animated,
  Easing,
  BackHandler,
  AppState,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function AIToolsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationName, setLocationName] = useState('Set your location');
  const [manualState, setManualState] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [hasAskedLocation, setHasAskedLocation] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerWidth = Math.round((typeof Dimensions !== 'undefined' ? Dimensions.get('window').width : 360) * 0.75);
  const drawerTranslateX = React.useRef(new Animated.Value(-drawerWidth)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const [profileName, setProfileName] = useState('Farmer');

  const requestAndSetLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLocationEnabled(false);
          setLocationName('Location permission not enabled');
          return;
        }
      }

      // Use navigator.geolocation (built-in browser/RN API)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Try to reverse geocode to get location name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              const data = await response.json();
              const address = data.address || {};
              const city = address.city || address.town || address.village || '';
              const state = address.state || '';
              const locationText = [city, state].filter(Boolean).join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
              setLocationName(locationText);
            } catch (error) {
              // Fallback to coordinates
              setLocationName(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            }
            
            setLocationEnabled(true);
            setShowLocationModal(false);
            setShowAccuracyModal(false);
          },
          (error) => {
            console.log('Location error:', error);
            setLocationName('Unable to fetch location');
            setLocationEnabled(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        setLocationName('Unable to fetch location');
        setLocationEnabled(false);
      }
    } catch (e) {
      console.log('Location exception:', e);
      setLocationName('Unable to fetch location');
      setLocationEnabled(false);
    }
  };

  const checkLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (!granted && !hasAskedLocation) {
          setShowLocationModal(true);
          setHasAskedLocation(true);
        } else if (granted && !locationEnabled) {
          await requestAndSetLocation();
        }
      } else {
        // For iOS, show modal on first visit
        if (!hasAskedLocation) {
          setShowLocationModal(true);
          setHasAskedLocation(true);
        }
      }
    } catch (e) {
      console.log('Permission check error:', e);
    }
  };

  const openPermissionFlow = () => {
    setShowLocationModal(true);
  };

  const handleEnableLocation = () => {
    setShowLocationModal(false);
    setShowAccuracyModal(true);
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    openManualLocationSelector();
  };

  const handleTurnOnAccuracy = async () => {
    setShowAccuracyModal(false);
    await requestAndSetLocation();
  };

  const handleNoThanks = () => {
    setShowAccuracyModal(false);
    openManualLocationSelector();
  };

  const openManualLocationSelector = () => {
    setShowLocationModal(false);
    setShowAccuracyModal(false);
    setManualCity('');
    setManualState('');
    setShowManualModal(true);
  };

  const saveManualLocation = () => {
    const state = (manualState || '').trim();
    const city = (manualCity || '').trim();
    if (!state && !city) {
      Alert.alert('Location required', 'Please enter state or city.');
      return;
    }
    const formatted = [city, state].filter(Boolean).join(', ');
    setLocationName(formatted);
    setLocationEnabled(true);
    setShowManualModal(false);
  };

  const openLocationSettings = () => {
    if (locationEnabled) {
      openManualLocationSelector();
    } else {
      openPermissionFlow();
    }
  };

  const handleToolPress = (toolName) => {
    if (toolName === 'Crop Doctor') {
      navigation.navigate('CropDoctor');
      return;
    }
    Alert.alert('Tool Selected', `You selected ${toolName}`);
  };

  const handleSearch = () => {
    if (!searchQuery.trim() && !selectedImageUri) return;
    Alert.alert('Search', `Query: ${searchQuery || '(no text)'}\nImage: ${selectedImageUri ? 'attached' : 'none'}`);
  };

  const openImageOptions = () => {
    setShowImagePickerModal(true);
  };

  const pickFromCamera = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Camera error', e);
      Alert.alert('Camera unavailable', 'Please install expo-image-picker or try again.');
    } finally {
      setShowImagePickerModal(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Gallery permission is needed.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Gallery error', e);
      Alert.alert('Gallery unavailable', 'Please install expo-image-picker or try again.');
    } finally {
      setShowImagePickerModal(false);
    }
  };

  const clearSelectedImage = () => setSelectedImageUri(null);

  const isFocused = useIsFocused();

  // Check location permission when screen is focused
  useEffect(() => {
    if (isFocused) {
      checkLocationPermission();
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isFocused) {
        checkLocationPermission();
      }
    });
    return () => sub.remove();
  }, [isFocused]);

  // Listen to keyboard to adjust layout
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Back closes drawer on Android
  useEffect(() => {
    const onBack = () => {
      if (isDrawerOpen) {
        closeDrawer();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [isDrawerOpen]);

  // Load profile name from Firestore
  useEffect(() => {
    const u = auth().currentUser;
    if (!u) return;
    const ref = firestore().collection('users').doc(u.uid);
    const unsub = ref.onSnapshot((doc) => {
      const d = doc.data() || {};
      setProfileName((d.name && d.name.trim()) ? d.name : 'Farmer');
    });
    return () => unsub();
  }, []);

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerTranslateX, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerTranslateX, { toValue: -drawerWidth, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setIsDrawerOpen(false));
  };

  const handleLogout = () => {
    const parent = navigation.getParent?.() || navigation;
    parent.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.locationContainer}>
          <TouchableOpacity onPress={openLocationSettings} activeOpacity={0.7}>
            <View>
              <Text style={[styles.locationText, locationEnabled ? styles.locationTextEnabled : styles.locationTextDisabled]}>
                {locationName}
              </Text>
              <Text style={styles.locationSubText}>{locationEnabled ? 'Tap to change location' : 'Tap to enable'}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.locationIconContainer}
          onPress={openPermissionFlow}
        >
          <Ionicons name="location-outline" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={[
        styles.content,
        isKeyboardVisible ? styles.contentWhenKeyboard : null,
      ]}>
        {/* Question */}
        <Text style={styles.question}>What can I help with?</Text>

        {/* Tool Cards */}
        <View style={styles.toolsContainer}>
          {/* First Row: Crop Advisory and Crop Recommendation side by side */}
          <View style={styles.toolsRow}>
            <TouchableOpacity 
              style={[
                styles.toolCard,
                isKeyboardVisible ? styles.toolCardHalfSmall : styles.toolCardHalf,
                styles.cropAdvisoryCard,
              ]}
              onPress={() => handleToolPress('Crop Advisory')}
            >
              <Text style={[styles.toolEmoji, isKeyboardVisible && styles.toolEmojiSmall]}></Text>
              <Text style={styles.toolName} numberOfLines={1} ellipsizeMode="clip">Crop Advisory</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.toolCard,
                isKeyboardVisible ? styles.toolCardHalfSmall : styles.toolCardHalf,
                styles.cropRecommendationCard,
              ]}
              onPress={() => handleToolPress('Crop Recommendation')}
            >
              <Text style={[styles.toolEmoji, isKeyboardVisible && styles.toolEmojiSmall]}></Text>
              <Text style={styles.toolName} numberOfLines={1} ellipsizeMode="clip">Crop Doctorr</Text>
            </TouchableOpacity>
          </View>

          {/* Second Row: Crop Doctor centered below */}
          <View style={[styles.centerRow, isKeyboardVisible && styles.centerRowSmall]}>
            <TouchableOpacity 
              style={[
                styles.toolCard,
                isKeyboardVisible ? styles.toolCardCenterSmall : styles.toolCardCenter,
                styles.cropDoctorCard,
              ]}
              onPress={() => handleToolPress('Crop Doctor')}
            >
              <Text style={[styles.toolEmoji, isKeyboardVisible && styles.toolEmojiSmall]}></Text>
              <Text style={styles.toolName} numberOfLines={1} ellipsizeMode="clip">Crop Recommendation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Fixed Search Bar Container */}
      <View style={[styles.fixedSearchContainer, { bottom: keyboardHeight + 10 }]}>
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={openImageOptions}>
            <Ionicons name="image-outline" size={24} color="#47afcfff" />
          </TouchableOpacity>

          {selectedImageUri ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.previewClear} onPress={clearSelectedImage}>
                <Ionicons name="close" size={16} color="#47afcfff" />
              </TouchableOpacity>
            </View>
          ) : null}

          <TextInput
            style={styles.searchInput}
            placeholder="Ask anything ..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />

          {(searchQuery.trim() || selectedImageUri) ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSearch}>
              <Ionicons name="arrow-up" size={20} color="#47afcfff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Voice', 'Start voice input...')}>
              <Ionicons name="mic-outline" size={24} color="#47afcfff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Location Permission Modal - Step 1 */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#3A3A3A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="location" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Allow Kisan_One1 to access this device's location?</Text>
            <View style={styles.locationOptionsRow}>
              <View style={styles.locationOption}>
                <View style={styles.locationIconCircle}>
                  <Ionicons name="location" size={28} color="#4A90E2" />
                  <View style={styles.gridOverlay} />
                </View>
                <Text style={styles.locationOptionText}>Precise</Text>
              </View>
              <View style={styles.locationOption}>
                <View style={styles.locationIconCircle}>
                  <Ionicons name="map-outline" size={28} color="#F5A623" />
                </View>
                <Text style={styles.locationOptionText}>Approximate</Text>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.enableButton]} onPress={handleEnableLocation}>
                <Text style={styles.enableButtonText}>While using the app</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.neutralButton]} onPress={() => { setShowLocationModal(false); requestAndSetLocation(); }}>
                <Text style={styles.neutralButtonText}>Only this time</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleSkipLocation}>
                <Text style={styles.cancelButtonText}>Don't allow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Accuracy Modal - Step 2 */}
      <Modal
        visible={showAccuracyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccuracyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>For a better experience, your device will need to use Location Accuracy</Text>
            <Text style={styles.modalMessage}>
              The following settings should be on:{'\n\n'}
              • Device location{'\n\n'}
              • Location Accuracy, which provides more accurate location for apps and services. To do this, Google periodically processes information about device sensors and wireless signals from your device to crowdsource wireless signal locations. These are used without identifying you to improve location accuracy and location-based services and to improve, provide and maintain Google's services based on Google's and third parties' legitimate interests to serve users' needs.
            </Text>
            <Text style={styles.modalFooter}>
              You can change this at any time in location settings. <Text style={styles.linkText}>Manage settings</Text> or <Text style={styles.linkText}>learn more</Text>
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleNoThanks}>
                <Text style={styles.cancelButtonText}>No, thanks</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.enableButton]} onPress={handleTurnOnAccuracy}>
                <Text style={styles.enableButtonText}>Turn on</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Location Selector */}
      <Modal
        visible={showManualModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select location manually</Text>
            <Text style={styles.modalMessage}>Enter your State and City to personalize AI tools</Text>
            <View style={{ width: '100%', gap: 10 }}>
              <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12 }}>
                <TextInput placeholder="State" placeholderTextColor="#999999" value={manualState} onChangeText={setManualState} style={{ height: 44, color: '#333333' }} />
              </View>
              <View style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12 }}>
                <TextInput placeholder="City" placeholderTextColor="#999999" value={manualCity} onChangeText={setManualCity} style={{ height: 44, color: '#333333' }} />
              </View>
            </View>
            <View style={[styles.modalButtons, { marginTop: 16 }]}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowManualModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.enableButton]} onPress={saveManualLocation}>
                <Text style={styles.enableButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Slide-in Drawer */}
      {isDrawerOpen && (
        <View style={styles.drawerOverlay}> 
          <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX: drawerTranslateX }] }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerAvatar}><Text style={{ fontSize: 22 }}>👨‍🌾</Text></View>
              <View>
                <Text style={styles.drawerTitle}>{profileName}</Text>
              </View>
            </View>

            <View style={styles.drawerMenu}>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('MyProfile'); }}>
                <Ionicons name="person-outline" size={20} color="#2E7D32" />
                <Text style={styles.drawerItemText}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('Cart'); }}>
                <Ionicons name="cart-outline" size={20} color="#2E7D32" />
                <Text style={styles.drawerItemText}>Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('Help'); }}>
                <Ionicons name="help-circle-outline" size={20} color="#2E7D32" />
                <Text style={styles.drawerItemText}>Help</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('LanguageSelect'); }}>
                <Ionicons name="language-outline" size={20} color="#2E7D32" />
                <Text style={styles.drawerItemText}>Language</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.drawerItem, { marginTop: 12 }]} onPress={() => { closeDrawer(); handleLogout(); }}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={[styles.drawerItemText, { color: '#EF4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          <Animated.View style={[styles.drawerBackdrop, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} />
          </Animated.View>
        </View>
      )}

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Attach image</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.enableButton]} onPress={pickFromCamera}>
                <Text style={styles.enableButtonText}>From camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={pickFromGallery}>
                <Text style={styles.cancelButtonText}>From gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.skipButton} onPress={() => setShowImagePickerModal(false)}>
              <Text style={styles.skipButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#333333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationTextEnabled: {
    color: '#10B981',
  },
  locationTextDisabled: {
    color: '#EF4444',
  },
  locationSubText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWhenKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingBottom: 24,
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
  },
  toolsContainer: {
    width: '100%',
    marginBottom: 0,
    alignItems: 'center',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  centerRow: {
    width: '70%',
    alignSelf: 'center',
  },
  centerRowSmall: {
    width: '70%',
  },
  toolCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolCardHalf: {
    width: '48%',
    padding: 20,
  },
  toolCardHalfSmall: {
    width: '48%',
    padding: 14,
  },
  toolCardCenter: {
    width: '100%',
    padding: 20,
  },
  toolCardCenterSmall: {
    width: '100%',
    padding: 14,
  },
  cropAdvisoryCard: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E8F5E8',
  },
  cropRecommendationCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE0B2',
  },
  cropDoctorCard: {
    backgroundColor: '#FCE4EC',
    borderColor: '#F8BBD9',
  },
  toolEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  toolEmojiSmall: {
    fontSize: 36,
    marginBottom: 8,
  },
  toolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 6,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#47afcfff',
  },
  fixedSearchContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  drawer: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  drawerMenu: {
    marginTop: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  drawerItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  iconButton: {
    marginHorizontal: 6,
  },
  previewWrapper: {
    marginHorizontal: 6,
    width: 34,
    height: 34,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#3A3A3A',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewClear: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#47afcfff',
  },
  sendButton: {
    marginLeft: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
    marginBottom: 16,
    width: '100%',
  },
  modalFooter: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    width: '100%',
  },
  linkText: {
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  locationOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    marginTop: 16,
  },
  locationOption: {
    alignItems: 'center',
  },
  locationIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  locationOptionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  modalButtons: {
    width: '100%',
    gap: 10,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#333333',
    fontSize: 15,
    fontWeight: '500',
  },
  neutralButton: {
    backgroundColor: '#E5E7EB',
    borderWidth: 0,
  },
  neutralButtonText: {
    textAlign: 'center',
    color: '#333333',
    fontSize: 15,
    fontWeight: '500',
  },
  enableButton: {
    backgroundColor: '#4A90E2',
    borderWidth: 0,
  },
  enableButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  skipButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
});