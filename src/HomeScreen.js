import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Easing,
  PanResponder,
  BackHandler,
  Alert,
  Keyboard,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useCart } from './CartContext';
import { Ionicons, EvilIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLanguage } from './LanguageContext';
import Voice from '@react-native-voice/voice';
import { vh, ms } from './utils/responsive';
import { useNotifications } from './NotificationsContext';
import { getProductForNavigation, getProductImageSource, resolvePackOptions, UNIT_TYPES } from './utils/products';

const { width } = Dimensions.get('window');
// Width for horizontal product cards: exactly 2 cards per viewport with spacing
const HORIZONTAL_CARD_GAP = 12;
const HORIZONTAL_SCREEN_PADDING = 16; // left and right
const HORIZONTAL_CARD_WIDTH = Math.floor(
  (width - (HORIZONTAL_SCREEN_PADDING * 2) - HORIZONTAL_CARD_GAP) / 2
);

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return 'Just now';

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return 'Just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} mo${diffMonths === 1 ? '' : 's'} ago`;
  }

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} yr${diffYears === 1 ? '' : 's'} ago`;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addToCart, increment, decrement, items: cartItems } = useCart();
  const { getVoiceLocale, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // Refs for scrolling to sections
  const scrollViewRef = useRef(null);
  const recommendedSectionRef = useRef(null);
  const todaysOfferSectionRef = useRef(null);
  const bestSellingSectionRef = useRef(null);
  const productsSectionRef = useRef(null);
  
  // Store section positions
  const [sectionPositions, setSectionPositions] = useState({
    recommended: 0,
    todaysOffer: 0,
    bestSelling: 0,
    products: 0,
  });
  const isInitialMount = useRef(true);
  const hasScrolledToTop = useRef(false);
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerWidth = Math.round(width * 0.75);
  const drawerTranslateX = useRef(new Animated.Value(-drawerWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragX = useRef(0).current;
  const [profileName, setProfileName] = useState('Farmer');
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  // State for selected pack/quantity per product
  const [selectedPackById, setSelectedPackById] = useState({});
  const [sizePickerProductId, setSizePickerProductId] = useState(null);

  const getPackInfo = useCallback((product) => {
    const packOptions = resolvePackOptions(product);
    const selectedIdx = typeof selectedPackById[product.id] === 'number'
      ? selectedPackById[product.id]
      : 0;
    const selectedPack = packOptions[selectedIdx] || packOptions[0] || { label: '', size: '' };
    return { packOptions, selectedPack, selectedIdx };
  }, [selectedPackById]);

  // Calculate total quantity of items in cart
  const totalCartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Load profile name and recent searches from Firestore
  useEffect(() => {
    const u = auth().currentUser;
    if (!u) return;
    
    try {
      const ref = firestore().collection('users').doc(u.uid);
      const unsub = ref.onSnapshot(
        (doc) => {
          try {
            if (!doc || !doc.exists) {
              setProfileName('Farmer');
              setRecentSearches([]);
              return;
            }
            const d = doc.data() || {};
            setProfileName((d.name && d.name.trim()) ? d.name : 'Farmer');
            if (d.recentSearches && Array.isArray(d.recentSearches)) {
              setRecentSearches(d.recentSearches.slice(0, 10));
            } else {
              setRecentSearches([]);
            }
          } catch (error) {
            console.error('Error processing user data:', error);
            setProfileName('Farmer');
            setRecentSearches([]);
          }
        },
        (error) => {
          console.error('Error loading user profile:', error);
          setProfileName('Farmer');
          setRecentSearches([]);
        }
      );
      return () => {
        try {
          unsub();
        } catch (error) {
          console.error('Error unsubscribing from user profile:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up user profile listener:', error);
      setProfileName('Farmer');
      setRecentSearches([]);
    }
  }, []);

  // Load user orders for recommendations
  const [userOrders, setUserOrders] = useState([]);
  useEffect(() => {
    const u = auth().currentUser;
    if (!u) {
      setUserOrders([]);
      return;
    }
    
    let unsub = null;
    try {
      unsub = firestore()
        .collection('orders')
        .where('userId', '==', u.uid)
        .limit(20)
        .onSnapshot(
          (snapshot) => {
            try {
              if (!snapshot) {
                setUserOrders([]);
                return;
              }
              const orders = [];
              snapshot.forEach((doc) => {
                try {
                  if (doc && doc.exists) {
                    const data = doc.data();
                    if (data && data.items && Array.isArray(data.items)) {
                      const itemsWithTimestamp = data.items.map(item => ({
                        ...item,
                        orderTimestamp: data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : 0) : 0,
                      }));
                      orders.push(...itemsWithTimestamp);
                    }
                  }
                } catch (docError) {
                  console.error('Error processing order document:', docError);
                }
              });
              
              orders.sort((a, b) => (b.orderTimestamp || 0) - (a.orderTimestamp || 0));
              setUserOrders(orders.slice(0, 10));
            } catch (error) {
              console.error('Error processing orders:', error);
              setUserOrders([]);
            }
          },
          (error) => {
            console.error('Orders query error:', error);
            if (error.code === 'failed-precondition') {
              console.log('Firestore index not created. Recommendations will use default products.');
            } else if (error.code === 'permission-denied') {
              console.log('Permission denied for orders query. Recommendations will use default products.');
            }
            setUserOrders([]);
          }
        );
    } catch (error) {
      console.error('Error setting up orders listener:', error);
      setUserOrders([]);
    }
    
    return () => {
      try {
        if (unsub) {
          unsub();
        }
      } catch (error) {
        console.error('Error unsubscribing from orders:', error);
      }
    };
  }, []);

  // Back button closes drawer (Android)
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

  // Voice recognition handlers
  useEffect(() => {
    let isMounted = true;
    
    try {
      if (Voice && typeof Voice === 'object') {
        Voice.onSpeechStart = () => {
          if (isMounted) setIsListening(true);
        };
        Voice.onSpeechEnd = () => {
          if (isMounted) setIsListening(false);
        };
        Voice.onSpeechError = (error) => {
          if (isMounted) {
            setIsListening(false);
            // Only show alert for non-trivial errors
            if (error?.error?.message !== '7') { // Error 7 is "no match" which is normal
              console.warn('Voice recognition error:', error);
            }
          }
        };
        Voice.onSpeechResults = (e) => {
          if (isMounted) {
            try {
              const result = e && e.value && e.value[0];
              if (result) {
                openSearchScreen(result, { submitOnOpen: true });
              }
              setIsListening(false);
            } catch (error) {
              console.error('Error processing voice result:', error);
              setIsListening(false);
            }
          }
        };
      } else {
        console.warn('Voice module is null. Skipping listener registration. Rebuild may be required.');
      }
    } catch (err) {
      console.warn('Voice setup error:', err);
    }

    return () => {
      isMounted = false;
      try {
        if (Voice && typeof Voice.destroy === 'function') {
          Voice.destroy().then(() => {
            if (typeof Voice.removeAllListeners === 'function') {
              Voice.removeAllListeners();
            }
          }).catch((error) => {
            console.warn('Error cleaning up voice module:', error);
          });
        }
      } catch (error) {
        console.warn('Error in voice cleanup:', error);
      }
    };
  }, [openSearchScreen]);

  const startVoiceRecognition = async () => {
    try {
      if (!Voice || typeof Voice.start !== 'function') {
        Alert.alert('Voice Not Available', 'Please rebuild the app to enable voice recognition.');
        return;
      }
      const voiceLocale = getVoiceLocale();
      await Voice.start(voiceLocale);
    } catch (e) {
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
  };

  const handleMicPress = () => {
    if (isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  };

  // Edge swipe to open/close drawer
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        const nearEdge = g.moveX <= 24;
        const draggingHoriz = Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20;
        return (nearEdge && draggingHoriz && !isDrawerOpen && g.dx > 0) || (isDrawerOpen && draggingHoriz);
      },
      onPanResponderMove: (_, g) => {
        let tx = isDrawerOpen ? Math.min(0, g.dx) : Math.max(-(drawerWidth - g.dx), -drawerWidth);
        if (!isDrawerOpen) tx = Math.min(0, Math.max(-drawerWidth + g.dx, -drawerWidth));
        drawerTranslateX.setValue(tx);
        const progress = 1 - Math.abs(tx) / drawerWidth;
        overlayOpacity.setValue(progress);
      },
      onPanResponderRelease: (_, g) => {
        const shouldOpen = isDrawerOpen ? g.dx > -drawerWidth * 0.33 : g.dx > drawerWidth * 0.33;
        if (shouldOpen) {
          openDrawer();
        } else {
          closeDrawer();
        }
      },
    })
  ).current;

  const openDrawer = () => {
    Keyboard.dismiss();
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerTranslateX, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerTranslateX, {
        toValue: -drawerWidth,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setIsDrawerOpen(false));
  };

  const handleLogout = () => {
    const parent = navigation.getParent?.() || navigation;
    parent.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const categories = [
    { id: 0, name: 'All', imageSource: require('../assets/data/all_icon.png') },
    { id: 1, name: 'Seeds', imageSource: require('../assets/data/seeds.png') },
    { id: 2, name: 'Crop Nutrition', imageSource: require('../assets/data/Crop Nutrition.png') },
    { id: 3, name: 'Crop Protection', imageSource: require('../assets/data/Crop Protection.png') },
    { id: 4, name: 'Garden Care', imageSource: require('../assets/data/Garden Care.png') },
    { id: 5, name: 'Agri Equipment', imageSource: require('../assets/data/Agri Equipment.png') },
  ];

  const recommendedProducts = [
    // Seeds
    {
      id: 1001,
      name: 'Farmson Biotech FB GRIVA Pea Seeds 500GM',
      brand: 'Farmson Biotech',
      price: '₹344.00',
      originalPrice: '₹398.00',
      discount: '14% OFF',
      size: '500 GM',
      saved: '₹54.00',
      imageRequire: require('../assets/data/seed1.png'),
      category: 'Seeds',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 1002,
      name: 'Farmson Biotech FB SAKET F1 Hybrid Okra (Bhindi) Seeds',
      brand: 'Farmson Biotech',
      price: '₹929.00',
      originalPrice: '₹1,118.00',
      discount: '17% OFF',
      saved: '₹189.00',
      imageRequire: require('../assets/data/seed2.png'),
      category: 'Seeds',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 1003,
      name: 'Farmson Biotech FB MARUTI F1 Hybrid Corn Seeds 500GM',
      brand: 'Farmson Biotech',
      price: '₹1,379.00',
      originalPrice: '₹1,558.00',
      discount: '11% OFF',
      size: '500 GM',
      badge: '100+ Farmers Have ordered recently!',
      saved: '₹179.00',
      imageRequire: require('../assets/data/seed3.png'),
      category: 'Seeds',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 1004,
      name: 'Farmson Biotech FB SUVARN Clusterbean Seeds 250GM',
      brand: 'Farmson Biotech',
      price: '₹309.00',
      originalPrice: '₹398.00',
      discount: '22% OFF',
      size: '250 GM',
      badge: '100+ Farmers Have ordered recently!',
      saved: '₹89.00',
      imageRequire: require('../assets/data/seed4.png'),
      category: 'Seeds',
      unitType: UNIT_TYPES.SOLID,
    },
    // Crop Nutrition
    {
      id: 2001,
      name: 'Katyayani Activated Humic Acid + Fulvic Acid 98 Fertilizer',
      brand: 'Katyayani Organics',
      price: '₹412.00',
      originalPrice: '₹450.00',
      discount: '8% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropnutri1.png'),
      category: 'Crop Nutrition',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 2002,
      name: 'Katyayani Seaweed Extract Liquid Organic fertilizer',
      brand: 'Katyayani Organics',
      price: '₹398.00',
      originalPrice: '',
      discount: '5% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropnutri2.png'),
      category: 'Crop Nutrition',
      unitType: UNIT_TYPES.LIQUID,
    },
    {
      id: 2003,
      name: 'katyayani Pro Grow (Gibberellic Acid 0.001% L) Plant Growth Regulator',
      brand: 'Katyayani Organics',
      price: '₹622.00',
      originalPrice: '₹930.00',
      discount: '36% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropnutri3.png'),
      category: 'Crop Nutrition',
      unitType: UNIT_TYPES.LIQUID,
    },
    {
      id: 2004,
      name: 'Agri Venture GIBBER Gibberelic Acid 0.001% SL',
      brand: 'Agri Venture',
      price: '₹475.00',
      originalPrice: '₹499.00',
      discount: '9% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropnutri4.png'),
      category: 'Crop Nutrition',
      unitType: UNIT_TYPES.LIQUID,
    },
    // Crop Protection
    {
      id: 3001,
      name: 'Katyayani EMA 5 Emamectin Benzoate 5 SG Chemical Insecticide',
      brand: 'Katyayani Organics',
      price: '₹437.00',
      originalPrice: '₹510.00',
      discount: '14% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropprotection1.png'),
      category: 'Crop Protection',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 3002,
      name: 'Agri Venture Carzone Chlorantraniliprole 18.5% SC Chemical Insecticide',
      brand: 'Agri Venture',
      price: '₹399.00',
      originalPrice: '₹1,600.00',
      discount: '79% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropprotection2.png'),
      category: 'Crop Protection',
      unitType: UNIT_TYPES.LIQUID,
    },
    {
      id: 3003,
      name: 'Agri Venture Emabenz Gold Emamectin Benzoate 5% SG Chemical Insecticide',
      brand: 'Agri Venture',
      price: '₹399.00',
      originalPrice: '₹499.00',
      discount: '20% OFF',
      imageRequire: require('../assets/data/cropprotection3.png'),
      category: 'Crop Protection',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 3004,
      name: 'Katyayani Antivirus viricide Special Chilli Tomato Brinjal',
      brand: 'Katyayani Organics',
      price: '₹463.00',
      originalPrice: '₹741.00',
      discount: '47% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropprotection4.png'),
      category: 'Crop Protection',
      unitType: UNIT_TYPES.LIQUID,
    },
    // Garden Care
    {
      id: 4001,
      name: 'Money Marble Pothos',
      brand: 'NURSERY NISARGA',
      price: '₹261.00',
      originalPrice: '₹349.00',
      discount: '25% OFF',
      imageRequire: require('../assets/data/gardencare1.png'),
      category: 'Garden Care',
      unitType: UNIT_TYPES.UNIT,
    },
    {
      id: 4002,
      name: 'Manjula Variegated Pothos',
      brand: 'NURSERY NISARGA',
      price: '₹313.00',
      originalPrice: '₹399.00',
      discount: '22% OFF',
      imageRequire: require('../assets/data/gardencare2.png'),
      category: 'Garden Care',
      unitType: UNIT_TYPES.UNIT,
    },
    {
      id: 4003,
      name: 'Manjula Green Pothos',
      brand: 'NURSERY NISARGA',
      price: '₹261.00',
      originalPrice: '₹349.00',
      discount: '25% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/gardencare3.png'),
      category: 'Garden Care',
      unitType: UNIT_TYPES.UNIT,
    },
    {
      id: 4004,
      name: 'Golden Money Plant',
      brand: 'NURSERY NISARGA',
      price: '₹261.00',
      originalPrice: '₹349.00',
      discount: '25% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/gardencare4.png'),
      category: 'Garden Care',
      unitType: UNIT_TYPES.UNIT,
    },
    // Agri Equipment
    {
      id: 5001,
      name: 'SSE450 HANDY FOGGING MACHINE THERMAL',
      brand: 'SAI SHREE ENTERPRISES',
      price: '₹7,670.00',
      originalPrice: '₹20,000.00',
      discount: '62% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/agriequip1.png'),
      category: 'Agri Equipment',
      unitType: UNIT_TYPES.UNIT,
    },
  ];

  const bestSellingProducts = [
    {
      id: 1003,
      name: 'Farmson Biotech FB MARUTI F1 Hybrid Corn Seeds 500GM',
      brand: 'Farmson Biotech',
      price: '₹1,379.00',
      originalPrice: '₹1,558.00',
      discount: '11% OFF',
      size: '500 GM',
      badge: '100+ Farmers Have ordered recently!',
      saved: '₹179.00',
      imageRequire: require('../assets/data/seed3.png'),
      category: 'Seeds',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 1004,
      name: 'Farmson Biotech FB SUVARN Clusterbean Seeds 250GM',
      brand: 'Farmson Biotech',
      price: '₹309.00',
      originalPrice: '₹398.00',
      discount: '22% OFF',
      size: '250 GM',
      badge: '100+ Farmers Have ordered recently!',
      saved: '₹89.00',
      imageRequire: require('../assets/data/seed4.png'),
      category: 'Seeds',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 2001,
      name: 'Katyayani Activated Humic Acid + Fulvic Acid 98 Fertilizer',
      brand: 'Katyayani Organics',
      price: '₹412.00',
      originalPrice: '₹450.00',
      discount: '8% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropnutri1.png'),
      category: 'Crop Nutrition',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 2003,
      name: 'katyayani Pro Grow (Gibberellic Acid 0.001% L) Plant Growth Regulator',
      brand: 'Katyayani Organics',
      price: '₹622.00',
      originalPrice: '₹930.00',
      discount: '36% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropnutri3.png'),
      category: 'Crop Nutrition',
      unitType: UNIT_TYPES.LIQUID,
    },
    {
      id: 3001,
      name: 'Katyayani EMA 5 Emamectin Benzoate 5 SG Chemical Insecticide',
      brand: 'Katyayani Organics',
      price: '₹437.00',
      originalPrice: '₹510.00',
      discount: '14% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropprotection1.png'),
      category: 'Crop Protection',
      unitType: UNIT_TYPES.SOLID,
    },
    {
      id: 3002,
      name: 'Agri Venture Carzone Chlorantraniliprole 18.5% SC Chemical Insecticide',
      brand: 'Agri Venture',
      price: '₹399.00',
      originalPrice: '₹1,600.00',
      discount: '79% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/cropprotection2.png'),
      category: 'Crop Protection',
      unitType: UNIT_TYPES.LIQUID,
    },
    {
      id: 4003,
      name: 'Manjula Green Pothos',
      brand: 'NURSERY NISARGA',
      price: '₹261.00',
      originalPrice: '₹349.00',
      discount: '25% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/gardencare3.png'),
      category: 'Garden Care',
      unitType: UNIT_TYPES.UNIT,
    },
    {
      id: 4004,
      name: 'Golden Money Plant',
      brand: 'NURSERY NISARGA',
      price: '₹261.00',
      originalPrice: '₹349.00',
      discount: '25% OFF',
      badge: '100+ Farmers Have ordered recently!',
      imageRequire: require('../assets/data/gardencare4.png'),
      category: 'Garden Care',
      unitType: UNIT_TYPES.UNIT,
    },
  ];
  // Ensure arrays are defined before combining
  const safeBestSelling = Array.isArray(bestSellingProducts) ? bestSellingProducts : [];
  const safeRecommended = Array.isArray(recommendedProducts) ? recommendedProducts : [];
  const allProducts = [...safeBestSelling, ...safeRecommended];

  // Get recommended products based on user orders
  const getRecommendedFromOrders = useCallback(() => {
    try {
      // Ensure arrays are valid
      const safeRecommended = Array.isArray(recommendedProducts) ? recommendedProducts : [];
      const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];
      const safeUserOrders = Array.isArray(userOrders) ? userOrders : [];
      
      if (safeUserOrders.length === 0) {
        return safeRecommended.slice(0, 3);
      }
      
      const orderedProductNames = [...new Set(safeUserOrders
        .filter(item => item && item.name)
        .map(item => item.name.toLowerCase()))];
      
      if (orderedProductNames.length === 0) {
        return safeRecommended.slice(0, 3);
      }
      
      const recommended = safeAllProducts.filter(product => {
        if (!product || !product.name) return false;
        const productName = product.name.toLowerCase();
        return orderedProductNames.some(ordered => 
          productName.includes(ordered) || ordered.includes(productName) ||
          (product.brand && product.brand.toLowerCase() === ordered)
        );
      });
      
      return recommended.length > 0 ? recommended.slice(0, 3) : safeRecommended.slice(0, 3);
    } catch (error) {
      console.error('Error getting recommended products:', error);
      // Return safe fallback
      const safeRecommended = Array.isArray(recommendedProducts) ? recommendedProducts : [];
      return safeRecommended.slice(0, 3);
    }
  }, [recommendedProducts, allProducts, userOrders]);

  const trendingProducts = allProducts.slice(0, 20);

  // Filter products based on search query and category
  const filterProducts = (products) => {
    let result = products;
    
    // Filter by category (if not "All")
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(p => (p.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }
    
    return result;
  };

  const filteredRecommended = filterProducts(recommendedProducts);
  const filteredBestSelling = filterProducts(bestSellingProducts);
  const filteredProducts = filterProducts(allProducts);
  const todaysOfferProducts = filteredRecommended.slice(0, 2);
  
  // Reset scroll to top when screen is focused (when user navigates to Home tab)
  useFocusEffect(
    useCallback(() => {
      // Reset scroll to top when screen comes into focus
      const timer = setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: 0,
            animated: false, // Instant scroll to top
          });
          hasScrolledToTop.current = true;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  // Ensure scroll starts at top on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Reset scroll to top on initial mount
      const timer = setTimeout(() => {
        if (scrollViewRef.current && !hasScrolledToTop.current) {
          scrollViewRef.current.scrollTo({
            y: 0,
            animated: false,
          });
          hasScrolledToTop.current = true;
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Scroll to first section with products when category changes (but not on initial mount or when "All" is selected)
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current || !hasScrolledToTop.current) {
      return;
    }
    
    if (!scrollViewRef.current) return;
    
    // Don't auto-scroll when "All" is selected - keep user at their current position or top
    if (selectedCategory === 'All') {
      return;
    }
    
    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      let targetPosition = null;
      
      // Check which sections have products and scroll to the first one
      if (filteredRecommended.length > 0 && sectionPositions.recommended > 0) {
        targetPosition = sectionPositions.recommended;
      } else if (todaysOfferProducts.length > 0 && sectionPositions.todaysOffer > 0) {
        targetPosition = sectionPositions.todaysOffer;
      } else if (filteredBestSelling.length > 0 && sectionPositions.bestSelling > 0) {
        targetPosition = sectionPositions.bestSelling;
      } else if (filteredProducts.length > 0 && sectionPositions.products > 0) {
        targetPosition = sectionPositions.products;
      }
      
      if (targetPosition !== null) {
        scrollViewRef.current.scrollTo({
          y: targetPosition - 20, // Offset for better visibility
          animated: true,
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedCategory, sectionPositions, filteredRecommended.length, todaysOfferProducts.length, filteredBestSelling.length, filteredProducts.length]);

  // Helper function to sanitize products for navigation (remove non-serializable properties)
  const sanitizeProductForNavigation = useCallback((product) => {
    if (!product || typeof product !== 'object') return null;
    try {
      // Helper to check if a value is serializable
      const isSerializable = (value) => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
        if (Array.isArray(value)) return value.every(isSerializable);
        if (typeof value === 'object') {
          try {
            JSON.stringify(value);
            return true;
          } catch {
            return false;
          }
        }
        return false;
      };

      // Helper to sanitize a value
      const sanitizeValue = (value) => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
        if (Array.isArray(value)) {
          return value.map(sanitizeValue).filter(v => v !== undefined);
        }
        if (typeof value === 'object') {
          const sanitized = {};
          for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
              const sanitizedVal = sanitizeValue(value[key]);
              if (sanitizedVal !== undefined && isSerializable(sanitizedVal)) {
                sanitized[key] = sanitizedVal;
              }
            }
          }
          return Object.keys(sanitized).length > 0 ? sanitized : undefined;
        }
        return undefined;
      };

      // Create a clean copy without imageRequire (which can't be serialized)
      // Only include primitive values and serializable data structures
      const sanitized = {
        id: typeof product.id !== 'undefined' ? String(product.id) : undefined,
        name: typeof product.name === 'string' ? product.name : '',
        brand: typeof product.brand === 'string' ? product.brand : undefined,
        price: typeof product.price !== 'undefined' ? (typeof product.price === 'number' ? product.price : String(product.price)) : undefined,
        originalPrice: typeof product.originalPrice !== 'undefined' ? (typeof product.originalPrice === 'number' ? product.originalPrice : String(product.originalPrice)) : undefined,
        discount: typeof product.discount !== 'undefined' ? (typeof product.discount === 'number' ? product.discount : String(product.discount)) : undefined,
        size: typeof product.size === 'string' ? product.size : undefined,
        saved: typeof product.saved === 'boolean' ? product.saved : undefined,
        badge: typeof product.badge === 'string' ? product.badge : undefined,
        category: typeof product.category === 'string' ? product.category : undefined,
        unitType: typeof product.unitType === 'string' ? product.unitType : undefined,
        // Only include imageUri/image (strings), not imageRequire (require() result)
        imageUri: typeof product.imageUri === 'string' ? product.imageUri : (typeof product.image === 'string' ? product.image : undefined),
      };

      // Sanitize packOptions and packs arrays
      if (Array.isArray(product.packOptions) && product.packOptions.length > 0) {
        const sanitizedPacks = product.packOptions
          .map(opt => {
            if (!opt || typeof opt !== 'object') return null;
            const sanitizedOpt = {
              label: typeof opt.label === 'string' ? opt.label : undefined,
              size: typeof opt.size === 'string' ? opt.size : undefined,
              quantity: typeof opt.quantity === 'number' ? opt.quantity : undefined,
              unit: typeof opt.unit === 'string' ? opt.unit : undefined,
              price: typeof opt.price !== 'undefined' ? (typeof opt.price === 'number' ? opt.price : String(opt.price)) : undefined,
            };
            // Remove undefined values
            Object.keys(sanitizedOpt).forEach(key => {
              if (sanitizedOpt[key] === undefined) delete sanitizedOpt[key];
            });
            return Object.keys(sanitizedOpt).length > 0 ? sanitizedOpt : null;
          })
          .filter(Boolean);
        if (sanitizedPacks.length > 0) {
          sanitized.packOptions = sanitizedPacks;
        }
      }

      if (Array.isArray(product.packs) && product.packs.length > 0) {
        const sanitizedPacks = product.packs
          .map(pack => {
            if (!pack || typeof pack !== 'object') return null;
            const sanitizedPack = {
              label: typeof pack.label === 'string' ? pack.label : undefined,
              size: typeof pack.size === 'string' ? pack.size : undefined,
              quantity: typeof pack.quantity === 'number' ? pack.quantity : undefined,
              unit: typeof pack.unit === 'string' ? pack.unit : undefined,
              price: typeof pack.price !== 'undefined' ? (typeof pack.price === 'number' ? pack.price : String(pack.price)) : undefined,
            };
            // Remove undefined values
            Object.keys(sanitizedPack).forEach(key => {
              if (sanitizedPack[key] === undefined) delete sanitizedPack[key];
            });
            return Object.keys(sanitizedPack).length > 0 ? sanitizedPack : null;
          })
          .filter(Boolean);
        if (sanitizedPacks.length > 0) {
          sanitized.packs = sanitizedPacks;
        }
      }

      // Remove undefined/null values to reduce payload size and ensure serializability
      Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined || sanitized[key] === null) {
          delete sanitized[key];
        } else if (!isSerializable(sanitized[key])) {
          console.warn(`Removing non-serializable property: ${key}`, sanitized[key]);
          delete sanitized[key];
        }
      });

      // Final validation - ensure the object is serializable
      try {
        JSON.stringify(sanitized);
        return sanitized;
      } catch (e) {
        console.error('Product still not serializable after sanitization:', e);
        // Return minimal safe product
        return {
          id: String(product?.id || ''),
          name: String(product?.name || ''),
          brand: String(product?.brand || ''),
          price: typeof product?.price !== 'undefined' ? (typeof product.price === 'number' ? product.price : String(product.price)) : '',
          category: String(product?.category || ''),
        };
      }
    } catch (error) {
      console.error('Error sanitizing product:', error);
      // Return minimal safe product
      return {
        id: String(product?.id || ''),
        name: String(product?.name || ''),
        brand: String(product?.brand || ''),
        price: typeof product?.price !== 'undefined' ? (typeof product.price === 'number' ? product.price : String(product.price)) : '',
        category: String(product?.category || ''),
      };
    }
  }, []);

  const openSearchScreen = useCallback(
    (initialQuery = '', options = {}) => {
      try {
        // Check if navigation is available
        if (!navigation || typeof navigation.navigate !== 'function') {
          console.error('Navigation not available');
          Alert.alert('Error', 'Navigation is not available. Please try again.');
          return;
        }

        // Ensure all data is valid before navigation
        const safeRecentSearches = Array.isArray(recentSearches) ? recentSearches : [];
        const safeRecommendedProducts = Array.isArray(recommendedProducts) ? recommendedProducts : [];
        const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];
        
        // Safely get recommended from orders
        let contextualRecommended = [];
        try {
          if (getRecommendedFromOrders && typeof getRecommendedFromOrders === 'function') {
            contextualRecommended = getRecommendedFromOrders();
          }
          if (!Array.isArray(contextualRecommended)) {
            contextualRecommended = [];
          }
        } catch (error) {
          console.error('Error getting recommended from orders:', error);
          contextualRecommended = safeRecommendedProducts.slice(0, 3);
        }
        
        // Ensure contextualRecommended is an array
        if (!Array.isArray(contextualRecommended)) {
          contextualRecommended = [];
        }
        
        // Sanitize all products to remove non-serializable properties (like imageRequire)
        const sanitizeProducts = (products) => {
          if (!Array.isArray(products)) return [];
          // Limit the number of products to prevent navigation payload from being too large
          const limitedProducts = products.slice(0, 100); // Limit to 100 products max
          return limitedProducts
            .filter(p => p != null)
            .map(p => sanitizeProductForNavigation(p))
            .filter(p => p != null);
        };
        
        // Prepare navigation params with sanitized, serializable data
        const navParams = {
          initialQuery: String(initialQuery || ''),
          prefetchedRecentSearches: Array.isArray(safeRecentSearches) ? safeRecentSearches.slice(0, 10) : [],
          recommendedProducts: sanitizeProducts(safeRecommendedProducts),
          contextualRecommended: sanitizeProducts(contextualRecommended),
          allProducts: sanitizeProducts(safeAllProducts),
          submitOnOpen: Boolean(options.submitOnOpen),
        };

        // Final validation - ensure params are serializable
        try {
          JSON.stringify(navParams);
        } catch (e) {
          console.error('Navigation params not serializable, using minimal params:', e);
          // Use minimal safe params if serialization fails
          return navigation.navigate('Search', {
            initialQuery: String(initialQuery || ''),
            prefetchedRecentSearches: [],
            recommendedProducts: [],
            contextualRecommended: [],
            allProducts: [],
            submitOnOpen: false,
          });
        }
        
        // Navigate with safe, serializable data
        navigation.navigate('Search', navParams);
      } catch (error) {
        console.error('Error opening search screen:', error);
        console.error('Error stack:', error.stack);
        // Fallback navigation with minimal data
        try {
          if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Search', {
              initialQuery: String(initialQuery || ''),
              prefetchedRecentSearches: [],
              recommendedProducts: [],
              contextualRecommended: [],
              allProducts: [],
              submitOnOpen: false,
            });
          } else {
            Alert.alert('Error', 'Unable to open search. Please try again.');
          }
        } catch (navError) {
          console.error('Navigation error:', navError);
          console.error('Navigation error stack:', navError.stack);
          Alert.alert('Error', 'Unable to open search. Please try again.');
        }
      }
    },
    [
      navigation,
      recentSearches,
      recommendedProducts,
      getRecommendedFromOrders,
      allProducts,
      sanitizeProductForNavigation,
    ],
  );

  const getNotificationIconName = useCallback((type) => {
    switch ((type || '').toLowerCase()) {
      case 'order':
      case 'order_update':
      case 'orders':
        return 'cube-outline';
      case 'promotion':
      case 'promo':
      case 'offer':
      case 'marketing':
        return 'pricetag-outline';
      case 'support':
      case 'help':
        return 'chatbubble-ellipses-outline';
      case 'alert':
        return 'warning-outline';
      default:
        return 'notifications-outline';
    }
  }, []);

  const handleNotificationPress = useCallback(
    (notificationItem) => {
      if (!notificationItem) return;

      if (notificationItem.id && !notificationItem.read) {
        markAsRead(notificationItem.id);
      }

      const targetScreen =
        notificationItem?.cta?.screen ||
        notificationItem?.data?.screen ||
        notificationItem?.data?.route;
      const params =
        notificationItem?.cta?.params || notificationItem?.data?.params || {};

      if (targetScreen) {
        try {
          navigation.navigate(targetScreen, params);
          setIsNotificationsVisible(false);
        } catch (error) {
          console.warn('Unable to navigate from notification:', error);
        }
      }
    },
    [markAsRead, navigation],
  );

  const renderNotificationItem = useCallback(
    ({ item }) => {
      if (!item) return null;
      const isUnread = !item.read;
      const iconName = getNotificationIconName(item.type);
      return (
        <TouchableOpacity
          style={[
            styles.notificationItem,
            isUnread && styles.notificationItemUnread,
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.notificationIcon,
              isUnread && styles.notificationIconUnread,
            ]}
          >
            <Ionicons
              name={iconName}
              size={18}
              color={isUnread ? '#1E7C31' : '#64748B'}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle} numberOfLines={2}>
              {item.title || 'Notification'}
            </Text>
            {item.body ? (
              <Text style={styles.notificationBody} numberOfLines={2}>
                {item.body}
              </Text>
            ) : null}
            <Text style={styles.notificationTime}>
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
          {isUnread ? <View style={styles.notificationUnreadDot} /> : null}
        </TouchableOpacity>
      );
    },
    [getNotificationIconName, handleNotificationPress],
  );

  const notificationKeyExtractor = useCallback(
    (item, index) => item?.id || `notification-${index}`,
    [],
  );

  useEffect(() => {
    if (!isNotificationsVisible) return;
    refreshNotifications();
  }, [isNotificationsVisible, refreshNotifications]);

  const features = [
    { icon: '🛡️', title: 'Safe & Secure Payment', subtitle: '100% Protected' },
    { icon: '💬', title: 'Expert Advice', subtitle: '24/7 Support' },
    { icon: '👍', title: 'Best Price Assured', subtitle: 'Lowest Rates' },
  ];

  const brands = [
    { id: 1, name: 'Bayer', logo: '🔬' },
    { id: 2, name: 'Syngenta', logo: '🌾' },
    { id: 3, name: 'UPL', logo: '🌱' },
    { id: 4, name: 'Coromandel', logo: '🏭' },
    { id: 5, name: 'Mahindra', logo: '🚜' },
    { id: 6, name: 'John Deere', logo: '🌾' },
    { id: 7, name: 'Rallis', logo: '🌿' },
    { id: 8, name: 'Dhanuka', logo: '🌾' },
    { id: 9, name: 'Adama', logo: '🌱' },
  ];

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" translucent={false} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets?.top || 0, 10) + 12 }]}>
        <View style={styles.headerContent}>
          {/* User Profile & Weather */}
          <View style={styles.userSection}>
            <TouchableOpacity style={styles.profileIcon} onPress={openDrawer}>
              <Text style={styles.profileEmoji}>👨‍🌾</Text>
            </TouchableOpacity>
            <View style={styles.weatherInfo}>
              <Image
                source={require('../assets/kisan1WhiteoverGreen.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Rewards & Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setIsNotificationsVisible(true);
                if (unreadCount > 0) {
                  markAllAsRead().catch((error) =>
                    console.warn('Failed to mark notifications as read:', error)
                  );
                }
              }}
            >
              <View>
                <EvilIcons name="bell" size={24} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Cart')}>
              <View>
                <EvilIcons name="cart" size={28} color="#FFFFFF" />
                {totalCartQuantity > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {totalCartQuantity > 99 ? '99+' : totalCartQuantity}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.85}
            onPress={() => {
              try {
                if (openSearchScreen && typeof openSearchScreen === 'function') {
                  openSearchScreen();
                } else {
                  console.error('openSearchScreen is not a function');
                  // Fallback: try direct navigation with minimal safe params
                  try {
                    if (navigation && typeof navigation.navigate === 'function') {
                      navigation.navigate('Search', {
                        initialQuery: '',
                        prefetchedRecentSearches: [],
                        recommendedProducts: [],
                        contextualRecommended: [],
                        allProducts: [],
                        submitOnOpen: false,
                      });
                    } else {
                      Alert.alert('Error', 'Unable to open search. Please try again.');
                    }
                  } catch (navErr) {
                    console.error('Direct navigation error:', navErr);
                    Alert.alert('Error', 'Unable to open search. Please try again.');
                  }
                }
              } catch (error) {
                console.error('Error opening search:', error);
                console.error('Error stack:', error.stack);
                // Try direct navigation as last resort with absolutely minimal params
                try {
                  if (navigation && typeof navigation.navigate === 'function') {
                    navigation.navigate('Search', {
                      initialQuery: '',
                      prefetchedRecentSearches: [],
                      recommendedProducts: [],
                      contextualRecommended: [],
                      allProducts: [],
                      submitOnOpen: false,
                    });
                  } else {
                    Alert.alert('Error', 'Unable to open search. Please try again.');
                  }
                } catch (finalErr) {
                  console.error('Final navigation attempt error:', finalErr);
                  Alert.alert('Error', 'Unable to open search. Please try again.');
                }
              }
            }}
          >
            <EvilIcons name="search" size={22} color="#666666" style={{ marginRight: 12 }} />
            <Text style={styles.searchPlaceholder}>{t('searchProducts')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={() => {
              try {
                handleMicPress();
              } catch (error) {
                console.error('Error with mic press:', error);
              }
            }}
          >
            <Ionicons name={isListening ? "mic" : "mic-outline"} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        contentContainerStyle={{ paddingBottom: (insets?.bottom || 0) + 16 }}
      >
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, paddingBottom: 4 }}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                selectedCategory === category.name && styles.categoryItemActive
              ]}
              onPress={() => {
                setSelectedCategory(category.name);
              }}
            >
              <View style={[
                styles.categoryIcon,
                selectedCategory === category.name && styles.categoryIconActive
              ]}>
                <Image source={category.imageSource || { uri: category.imageUri }} style={styles.categoryImage} />
              </View>
              <Text style={[
                styles.categoryName,
                selectedCategory === category.name && styles.categoryNameActive
              ]}>{category.name}</Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>

        {/* Banner */}
        <View style={styles.imageBannerContainer}>
          <View style={styles.imageBanner}>
            <Text style={styles.bannerImageEmoji}>🌾🏭</Text>
          </View>
        </View>

        {/* Brands Section */}
        <View style={styles.brandsSectionContainer}>
          <View style={styles.brandsSectionHeader}>
            <Text style={styles.brandsSectionTitle}>{t('brands')}</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('BrandsViewAll')}>
              <Text style={styles.viewAllBtnText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.brandsGrid}>
            {brands.map((brand) => (
              <TouchableOpacity key={brand.id} style={styles.brandCard} onPress={() => navigation.navigate('BrandDetail', { brand })}>
                <View style={styles.brandIcon}>
                  <Text style={styles.brandEmoji}>{brand.logo}</Text>
                </View>
                <Text style={styles.brandName}>{brand.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recommended Products */}
        <View 
          ref={recommendedSectionRef}
          style={styles.sectionContainer}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setSectionPositions((prev) => ({ ...prev, recommended: y }));
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recommended')}</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProductsViewAll', { section: 'recommended', baseProducts: recommendedProducts })}>
              <Text style={styles.viewAllBtnText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            {filteredRecommended.map((product, index) => {
              const totalItems = filteredRecommended.length;
              const { packOptions, selectedPack } = getPackInfo(product);
              const displayedSize = selectedPack?.size ?? selectedPack?.label ?? product.size;
              const displayedPrice = selectedPack?.price ?? product.price;
              const priceValue = Number(String(displayedPrice).replace(/[^0-9.]/g, '')) || Number(String(product.price).replace(/[^0-9.]/g, '')) || 0;
              const marginLeft = index === 0 ? HORIZONTAL_SCREEN_PADDING : HORIZONTAL_CARD_GAP / 2;
              const marginRight = index === totalItems - 1 ? HORIZONTAL_SCREEN_PADDING : HORIZONTAL_CARD_GAP / 2;
              
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.productCard,
                    { width: HORIZONTAL_CARD_WIDTH, marginLeft, marginRight },
                  ]}
                  onPress={() => navigation.navigate('ProductDetail', { product: getProductForNavigation(product) })}
                  activeOpacity={0.9}
                >
                  <View style={styles.productCardContent}>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{product.discount}</Text>
                    </View>
                    <View style={styles.productImage}>
                      {getProductImageSource(product) ? (
                        <Image source={getProductImageSource(product)} style={styles.productImageTag} />
                      ) : (
                        <Text style={styles.productEmoji}>📦</Text>
                      )}
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.currentPrice}>{displayedPrice}</Text>
                      <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                    </View>
                    <View style={styles.savedContainer}>
                      <Text style={styles.savedIcon}>💚</Text>
                      <Text style={styles.savedText}>Saved Price {product.saved}</Text>
                    </View>
                    {packOptions.length > 0 ? (
                      <TouchableOpacity 
                        style={styles.sizeDropdown}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setSizePickerProductId(product.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.sizeDropdownText}>Size: {displayedSize}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666666" />
                      </TouchableOpacity>
                    ) : (
                      displayedSize ? <Text style={styles.productSize}>Size {displayedSize}</Text> : null
                    )}
                  </View>
                  {cartItems.find((it) => it.id === product.id) ? (
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e?.stopPropagation?.(); decrement(product.id); }}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{cartItems.find((it) => it.id === product.id)?.quantity || 0}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e?.stopPropagation?.(); increment(product.id); }}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addToCartButton} 
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        addToCart({
                          id: product.id,
                          name: product.name,
                          brand: product.brand,
                          priceValue: priceValue,
                          image: product.image || product.imageUri,
                          pack: displayedSize,
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Today's Offers */}
        <View 
          ref={todaysOfferSectionRef}
          style={styles.sectionContainer}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setSectionPositions((prev) => ({ ...prev, todaysOffer: y }));
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Offer</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProductsViewAll', { section: 'offers', baseProducts: todaysOfferProducts })}>
              <Text style={styles.viewAllBtnText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            {todaysOfferProducts.map((product, index) => {
              const totalItems = todaysOfferProducts.length;
              const { packOptions, selectedPack } = getPackInfo(product);
              const displayedSize = selectedPack?.size ?? selectedPack?.label ?? product.size;
              const displayedPrice = selectedPack?.price ?? product.price;
              const priceValue = Number(String(displayedPrice).replace(/[^0-9.]/g, '')) || Number(String(product.price).replace(/[^0-9.]/g, '')) || 0;
              const marginLeft = index === 0 ? HORIZONTAL_SCREEN_PADDING : HORIZONTAL_CARD_GAP / 2;
              const marginRight = index === totalItems - 1 ? HORIZONTAL_SCREEN_PADDING : HORIZONTAL_CARD_GAP / 2;
              
              return (
                <TouchableOpacity
                  key={`offer-${product.id}`}
                  style={[
                    styles.productCard,
                    { width: HORIZONTAL_CARD_WIDTH, marginLeft, marginRight },
                  ]}
                  onPress={() => navigation.navigate('ProductDetail', { product: getProductForNavigation(product) })}
                  activeOpacity={0.9}
                >
                  <View style={styles.productCardContent}>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{product.discount}</Text>
                    </View>
                    <View style={styles.productImage}>
                      {getProductImageSource(product) ? (
                        <Image source={getProductImageSource(product)} style={styles.productImageTag} />
                      ) : (
                        <Text style={styles.productEmoji}>📦</Text>
                      )}
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.currentPrice}>{displayedPrice}</Text>
                      <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                    </View>
                    <View style={styles.savedContainer}>
                      <Text style={styles.savedIcon}>💚</Text>
                      <Text style={styles.savedText}>Saved Price {product.saved}</Text>
                    </View>
                    {packOptions.length > 0 ? (
                      <TouchableOpacity 
                        style={styles.sizeDropdown}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setSizePickerProductId(product.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.sizeDropdownText}>Size: {displayedSize}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666666" />
                      </TouchableOpacity>
                    ) : (
                      displayedSize ? <Text style={styles.productSize}>Size {displayedSize}</Text> : null
                    )}
                  </View>
                  {cartItems.find((it) => it.id === product.id) ? (
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e?.stopPropagation?.(); decrement(product.id); }}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{cartItems.find((it) => it.id === product.id)?.quantity || 0}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e?.stopPropagation?.(); increment(product.id); }}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addToCartButton} 
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        addToCart({
                          id: product.id,
                          name: product.name,
                          brand: product.brand,
                          priceValue: priceValue,
                          image: product.image || product.imageUri,
                          pack: displayedSize,
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Best Selling Products */}
        <View 
          ref={bestSellingSectionRef}
          style={styles.sectionContainer}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setSectionPositions((prev) => ({ ...prev, bestSelling: y }));
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('bestSelling')}</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProductsViewAll', { section: 'best', baseProducts: bestSellingProducts })}>
              <Text style={styles.viewAllBtnText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
              {filteredBestSelling.map((product, index) => {
                const totalItems = filteredBestSelling.length;
                const { packOptions, selectedPack } = getPackInfo(product);
                const displayedSize = selectedPack?.size ?? selectedPack?.label ?? product.size;
                const displayedPrice = selectedPack?.price ?? product.price;
                const priceValue = Number(String(displayedPrice).replace(/[^0-9.]/g, '')) || Number(String(product.price).replace(/[^0-9.]/g, '')) || 0;
                const marginLeft = index === 0 ? HORIZONTAL_SCREEN_PADDING : HORIZONTAL_CARD_GAP / 2;
                const marginRight = index === totalItems - 1 ? HORIZONTAL_SCREEN_PADDING : HORIZONTAL_CARD_GAP / 2;
                
                return (
                  <TouchableOpacity
                    key={`best-${product.id}`}
                    style={[
                      styles.productCard,
                      { width: HORIZONTAL_CARD_WIDTH, marginLeft, marginRight },
                    ]}
                    onPress={() => navigation.navigate('ProductDetail', { product: getProductForNavigation(product) })}
                    activeOpacity={0.9}
                  >
                    <View style={styles.productCardContent}>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{product.discount}</Text>
                      </View>
                      <View style={styles.productImage}>
                        {getProductImageSource(product) ? (
                          <Image source={getProductImageSource(product)} style={styles.productImageTag} />
                        ) : (
                          <Text style={styles.productEmoji}>📦</Text>
                        )}
                      </View>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productBrand}>{product.brand}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.currentPrice}>{displayedPrice}</Text>
                        <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                      </View>
                      <View style={styles.savedContainer}>
                        <Text style={styles.savedIcon}>💚</Text>
                        <Text style={styles.savedText}>Saved Price {product.saved}</Text>
                      </View>
                      {packOptions.length > 0 ? (
                        <TouchableOpacity 
                          style={styles.sizeDropdown}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            setSizePickerProductId(product.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.sizeDropdownText}>Size: {displayedSize}</Text>
                          <Ionicons name="chevron-down" size={16} color="#666666" />
                        </TouchableOpacity>
                      ) : (
                        displayedSize ? <Text style={styles.productSize}>Size {displayedSize}</Text> : null
                      )}
                    </View>
                    {cartItems.find((it) => it.id === product.id) ? (
                      <View style={styles.qtyControls}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e?.stopPropagation?.(); decrement(product.id); }}>
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{cartItems.find((it) => it.id === product.id)?.quantity || 0}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e?.stopPropagation?.(); increment(product.id); }}>
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.addToCartButton} 
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          addToCart({
                            id: product.id,
                            name: product.name,
                            brand: product.brand,
                            priceValue: priceValue,
                            image: product.image || product.imageUri,
                            pack: displayedSize,
                          });
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>

        {/* Products - All (grid 2 per row) */}
        <View 
          ref={productsSectionRef}
          style={styles.sectionContainer}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setSectionPositions((prev) => ({ ...prev, products: y }));
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
          </View>
          <View style={styles.productsGrid}>
            {filteredProducts.map((product, idx) => {
              const { packOptions, selectedPack } = getPackInfo(product);
              const displayedSize = selectedPack?.size ?? selectedPack?.label ?? product.size;
              const displayedPrice = selectedPack?.price ?? product.price;
              const priceValue = Number(String(displayedPrice).replace(/[^0-9.]/g, '')) || Number(String(product.price).replace(/[^0-9.]/g, '')) || 0;
              
              return (
                <TouchableOpacity 
                  key={`all-${idx}-${product.id}`} 
                  style={[styles.productCard, styles.productCardGridOverride]}
                  onPress={() => navigation.navigate('ProductDetail', { product: getProductForNavigation(product) })}
                  activeOpacity={0.9}
                >
                  <View style={styles.productCardContent}>
                    {product.discount ? (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{product.discount}</Text>
                      </View>
                    ) : null}
                    <View style={styles.productImage}>
                      {getProductImageSource(product) ? (
                        <Image source={getProductImageSource(product)} style={styles.productImageTag} />
                      ) : (
                        <Text style={styles.productEmoji}>📦</Text>
                      )}
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.currentPrice}>{displayedPrice}</Text>
                      <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                    </View>
                    {product.saved ? (
                      <View style={styles.savedContainer}>
                        <Text style={styles.savedIcon}>💚</Text>
                        <Text style={styles.savedText}>Saved Price {product.saved}</Text>
                      </View>
                    ) : null}
                    {packOptions.length > 0 ? (
                      <TouchableOpacity 
                        style={styles.sizeDropdown}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setSizePickerProductId(product.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.sizeDropdownText}>Size: {displayedSize}</Text>
                        <Ionicons name="chevron-down" size={16} color="#666666" />
                      </TouchableOpacity>
                    ) : (
                      displayedSize ? <Text style={styles.productSize}>Size {displayedSize}</Text> : null
                    )}
                  </View>
                  {cartItems.find((it) => it.id === product.id) ? (
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e?.stopPropagation?.(); decrement(product.id); }}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{cartItems.find((it) => it.id === product.id)?.quantity || 0}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={(e) => { e?.stopPropagation?.(); increment(product.id); }}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addToCartButton} 
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        addToCart({
                          id: product.id,
                          name: product.name,
                          brand: product.brand,
                          priceValue: priceValue,
                          image: product.image || product.imageUri,
                          pack: displayedSize,
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={isNotificationsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsNotificationsVisible(false)}
      >
        <TouchableOpacity
          style={styles.notificationsOverlay}
          activeOpacity={1}
          onPress={() => setIsNotificationsVisible(false)}
        >
          <View
            style={[
              styles.notificationsSheet,
              { paddingBottom: 24 + (insets?.bottom || 0) },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.notificationsHeader}>
              <Text style={styles.notificationsTitle}>
                {t('notificationsTitle') || 'Notifications'}
              </Text>
              <View style={styles.notificationsHeaderActions}>
                <TouchableOpacity
                  style={styles.notificationsCloseButton}
                  onPress={() => setIsNotificationsVisible(false)}
                >
                  <Ionicons name="close" size={22} color="#1F2937" />
                </TouchableOpacity>
              </View>
            </View>
            {notificationsLoading ? (
              <View style={styles.notificationsLoader}>
                <ActivityIndicator size="small" color="#2E7D32" />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.notificationsEmptyContainer}>
                <Text style={styles.notificationsEmptyEmoji}>🔔</Text>
                <Text style={styles.notificationsEmptyTitle}>
                  {t('notificationsEmptyTitle') || 'No alerts yet'}
                </Text>
                <Text style={styles.notificationsEmptyText}>
                  {t('notificationsEmptyMessage') ||
                    "We'll notify you when something new arrives."}
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={notificationKeyExtractor}
                renderItem={renderNotificationItem}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => (
                  <View style={styles.notificationSeparator} />
                )}
                contentContainerStyle={styles.notificationsList}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Size Picker Modal */}
      <Modal
        visible={sizePickerProductId !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSizePickerProductId(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSizePickerProductId(null)}
        >
          <View 
            style={styles.sizePickerModalContent}
            onStartShouldSetResponder={() => true}
          >
            {(() => {
              const product = allProducts.find(p => p.id === sizePickerProductId);
              if (!product) return null;
              const packOptions = resolvePackOptions(product);
              const selectedIdx = typeof selectedPackById[product.id] === 'number' 
                ? selectedPackById[product.id] 
                : 0;
              
              return (
                <>
                  <View style={styles.sizePickerHeader}>
                    <Text style={styles.sizePickerTitle}>Select Size</Text>
                    <TouchableOpacity 
                      onPress={() => setSizePickerProductId(null)}
                      style={styles.sizePickerCloseBtn}
                    >
                      <Ionicons name="close" size={24} color="#666666" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.sizePickerOptions}>
                    {packOptions.map((opt, idx) => {
                      const isSelected = selectedIdx === idx;
                      const sizeText = opt.label || opt.size || '';
                      const isLast = idx === packOptions.length - 1;
                      return (
                        <TouchableOpacity
                          key={`size-${idx}`}
                          style={[styles.sizePickerOption, isSelected && styles.sizePickerOptionSelected, isLast && { marginBottom: 0 }]}
                          onPress={() => {
                            setSelectedPackById((prev) => ({ ...prev, [product.id]: idx }));
                            setSizePickerProductId(null);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.sizePickerOptionText, isSelected && styles.sizePickerOptionTextSelected]}>
                            {sizeText}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal
        visible={zoomedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setZoomedImage(null)}
      >
        <TouchableOpacity 
          style={styles.zoomModalOverlay}
          activeOpacity={1}
          onPress={() => setZoomedImage(null)}
        >
          <View style={styles.zoomModalContent}>
            {zoomedImage && (
              <Image 
                source={zoomedImage} 
                style={styles.zoomedImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity 
              style={styles.closeZoomButton}
              onPress={() => setZoomedImage(null)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Slide-in Drawer */}
      {isDrawerOpen && (
        <View style={styles.drawerOverlay}>
          <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX: drawerTranslateX }] }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerAvatar}>
                <Text style={{ fontSize: 22 }}>👨‍🌾</Text>
              </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileEmoji: {
    fontSize: 20,
  },
  weatherInfo: {
    alignItems: 'flex-start',
  },
  temperature: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weatherText: {
    fontSize: 12,
    color: '#E8F5E8',
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardsContainer: {
    backgroundColor: '#FFA726',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  headerLogo: {
    width: 120,
    height: 36,
  },
  rewardsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButton: {
    marginLeft: 12,
    position: 'relative',
  },
  actionIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFB020',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    paddingVertical: 8,
    maxHeight: Dimensions.get('window').height * 0.7, // 70% of screen height
    minHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    zIndex: 3000,
  },
  searchDropdownBox: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    marginTop: 0,
    overflow: 'hidden',
    zIndex: 3000,
  },
  dropdownScrollView: {
    flex: 1,
    paddingTop: 16,
  },
  dropdownSection: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
  },
  dropdownSectionTitleBold: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  horizontalScrollContent: {
    paddingRight: 16,
    paddingTop: 4,
  },
  // Recent Searches - Circular Cards
  recentSearchCard: {
    width: 96,
    alignItems: 'center',
    marginRight: 14,
  },
  recentSearchIcon: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  recentSearchText: {
    fontSize: 12,
    color: '#0F172A',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  // Product Cards inside dropdown (horizontal menus)
  dropdownProductCard: {
    width: 150,
    marginRight: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 190,
  },
  dropdownProductCardImage: {
    width: '100%',
    height: 108,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dropdownProductCardEmoji: {
    fontSize: 50,
  },
  dropdownProductCardText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 6,
    minHeight: 34,
  },
  dropdownProductCardBrand: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  dropdownProductCardPrice: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '800',
    textAlign: 'center',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#666666',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#999999',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
    transform: [{ scale: 1.1 }],
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  scanButton: {
    padding: 4,
  },
  scanIcon: {
    fontSize: 20,
    color: '#666666',
  },
  content: {
    flex: 1,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 2000,
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
  drawerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
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
  categoriesContainer: {
    paddingVertical: 20,
    paddingLeft: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
  },
  featuresStrip: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E8',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  banner: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    marginBottom: 12,
  },
  shopNowButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  shopNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerImage: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerEmoji: {
    fontSize: 40,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  viewAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewAllBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  productCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  productCardContent: {
    flex: 1,
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productImage: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  productEmoji: {
    fontSize: 40,
  },
  productImageTag: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    lineHeight: 18,
  },
  productBrand: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  savedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  savedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  productSize: {
    fontSize: 12,
    color: '#666666',
  },
  sizeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  sizeDropdownText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sizePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sizePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sizePickerCloseBtn: {
    padding: 4,
  },
  sizePickerOptions: {
    // gap not supported in React Native, use marginBottom on children instead
  },
  sizePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  sizePickerOptionSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  sizePickerOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sizePickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  imageBannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  imageBanner: {
    height: vh(22),
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImageEmoji: {
    fontSize: 60,
  },
  brandsSectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  brandsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  brandCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandEmoji: {
    fontSize: 24,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  productsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCardGridOverride: {
    width: '48%',
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 12,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  qtyText: {
    width: 32,
    textAlign: 'center',
    marginHorizontal: 8,
    fontWeight: '700',
    color: '#111827',
  },
  postIssuesContainer: {
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  postIssuesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  postIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  postPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#999999',
  },
  postButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  notificationsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  notificationsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 12,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  notificationsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationsCloseButton: {
    padding: 6,
  },
  notificationsLoader: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 12,
  },
  notificationsEmptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  notificationsEmptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  notificationsEmptyText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  notificationsList: {
    paddingBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  notificationItemUnread: {
    backgroundColor: '#ECFDF3',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconUnread: {
    backgroundColor: '#BBF7D0',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  notificationUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E7C31',
    marginLeft: 8,
  },
  notificationSeparator: {
    height: 12,
  },
});