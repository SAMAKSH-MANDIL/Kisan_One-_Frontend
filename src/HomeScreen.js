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
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Modal,
} from 'react-native';
import { LayoutAnimation, UIManager, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useCart } from './CartContext';
import { Ionicons, EvilIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from './LanguageContext';
import Voice from '@react-native-voice/voice';
import { vh, ms } from './utils/responsive';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addToCart, increment, decrement, items: cartItems } = useCart();
  const { getVoiceLocale, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // Local images map to bundle assets in release APK
  const localImageMap = {
    '../assets/data/seed1.png': require('../assets/data/seed1.png'),
    '../assets/data/seed2.png': require('../assets/data/seed2.png'),
    '../assets/data/seed3.png': require('../assets/data/seed3.png'),
    '../assets/data/seed4.png': require('../assets/data/seed4.png'),
    '../assets/data/cropnutri1.png': require('../assets/data/cropnutri1.png'),
    '../assets/data/cropnutri2.png': require('../assets/data/cropnutri2.png'),
    '../assets/data/cropnutri3.png': require('../assets/data/cropnutri3.png'),
    '../assets/data/cropnutri4.png': require('../assets/data/cropnutri4.png'),
    '../assets/data/cropprotection1.png': require('../assets/data/cropprotection1.png'),
    '../assets/data/cropprotection2.png': require('../assets/data/cropprotection2.png'),
    '../assets/data/cropprotection3.png': require('../assets/data/cropprotection3.png'),
    '../assets/data/cropprotection4.png': require('../assets/data/cropprotection4.png'),
    '../assets/data/gardencare1.png': require('../assets/data/gardencare1.png'),
    '../assets/data/gardencare2.png': require('../assets/data/gardencare2.png'),
    '../assets/data/gardencare3.png': require('../assets/data/gardencare3.png'),
    '../assets/data/gardencare4.png': require('../assets/data/gardencare4.png'),
    '../assets/data/agriequip1.png': require('../assets/data/agriequip1.png'),
  };

  const getProductImageSource = (product) => {
    // Priority: imageRequire > imageUri (from localImageMap) > imageUri (http) > null
    if (product?.imageRequire) return product.imageRequire;
    if (product?.imageUri) {
      // Check if it's in our local map
      if (localImageMap[product.imageUri]) {
        return localImageMap[product.imageUri];
      }
      // Check if it's a remote URL
      if (/^https?:/i.test(product.imageUri)) {
        return { uri: product.imageUri };
      }
    }
    // No valid image source
    return null;
  };

  // Helper to ensure product has imageUri for navigation (since imageRequire can't be serialized)
  const getProductForNavigation = (product) => {
    if (!product) return product;
    // If imageUri is already set, return as is
    if (product.imageUri) return product;
    // If imageRequire is set, try to find corresponding imageUri from product ID
    if (product.imageRequire && product.id) {
      const productIdToImageMap = {
        1001: '../assets/data/seed1.png',
        1002: '../assets/data/seed2.png',
        1003: '../assets/data/seed3.png',
        1004: '../assets/data/seed4.png',
        2001: '../assets/data/cropnutri1.png',
        2002: '../assets/data/cropnutri2.png',
        2003: '../assets/data/cropnutri3.png',
        2004: '../assets/data/cropnutri4.png',
        3001: '../assets/data/cropprotection1.png',
        3002: '../assets/data/cropprotection2.png',
        3003: '../assets/data/cropprotection3.png',
        3004: '../assets/data/cropprotection4.png',
        4001: '../assets/data/gardencare1.png',
        4002: '../assets/data/gardencare2.png',
        4003: '../assets/data/gardencare3.png',
        4004: '../assets/data/gardencare4.png',
        5001: '../assets/data/agriequip1.png',
      };
      const baseId = typeof product.id === 'string' 
        ? parseInt(product.id.split('-').pop()) 
        : product.id;
      const imagePath = productIdToImageMap[baseId];
      if (imagePath) {
        return { ...product, imageUri: imagePath };
      }
    }
    return product;
  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerWidth = Math.round(width * 0.75);
  const drawerTranslateX = useRef(new Animated.Value(-drawerWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragX = useRef(0).current;
  const [profileName, setProfileName] = useState('Farmer');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const homeSearchInputRef = useRef(null);

  // Calculate total quantity of items in cart
  const totalCartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Load profile name and recent searches from Firestore
  useEffect(() => {
    const u = auth().currentUser;
    if (!u) return;
    const ref = firestore().collection('users').doc(u.uid);
    const unsub = ref.onSnapshot((doc) => {
      const d = doc.data() || {};
      setProfileName((d.name && d.name.trim()) ? d.name : 'Farmer');
      if (d.recentSearches && Array.isArray(d.recentSearches)) {
        setRecentSearches(d.recentSearches.slice(0, 10));
      } else {
        setRecentSearches([]);
      }
    });
    return () => unsub();
  }, []);

  // Enable smooth layout transitions for dropdown (Android requires this)
  useEffect(() => {
    try {
      if (Platform.OS === 'android' && UIManager && typeof UIManager.setLayoutAnimationEnabledExperimental === 'function') {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    } catch (_) {}
  }, []);

  // Load user orders for recommendations
  const [userOrders, setUserOrders] = useState([]);
  useEffect(() => {
    const u = auth().currentUser;
    if (!u) return;
    
    const unsub = firestore()
      .collection('orders')
      .where('userId', '==', u.uid)
      .limit(20)
      .onSnapshot((snapshot) => {
        if (!snapshot) {
          setUserOrders([]);
          return;
        }
        const orders = [];
        try {
          snapshot.forEach((doc) => {
            if (doc && doc.exists) {
              const data = doc.data();
              if (data && data.items && Array.isArray(data.items)) {
                const itemsWithTimestamp = data.items.map(item => ({
                  ...item,
                  orderTimestamp: data.createdAt ? data.createdAt.toMillis() : 0,
                }));
                orders.push(...itemsWithTimestamp);
              }
            }
          });
          
          orders.sort((a, b) => (b.orderTimestamp || 0) - (a.orderTimestamp || 0));
          setUserOrders(orders.slice(0, 10));
        } catch (error) {
          console.error('Error processing orders:', error);
          setUserOrders([]);
        }
      }, (error) => {
        console.error('Orders query error:', error);
        if (error.code === 'failed-precondition') {
          console.log('Firestore index not created. Recommendations will use default products.');
        }
        setUserOrders([]);
      });
    return () => unsub();
  }, []);

  // Refresh search dropdown data
  const refreshSearchData = useCallback(async () => {
    const u = auth().currentUser;
    if (!u) return;

    try {
      const userDoc = await firestore().collection('users').doc(u.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data() || {};
        if (data.recentSearches && Array.isArray(data.recentSearches)) {
          setRecentSearches(data.recentSearches.slice(0, 10));
        } else {
          setRecentSearches([]);
        }
      }

      const ordersSnapshot = await firestore()
        .collection('orders')
        .where('userId', '==', u.uid)
        .limit(20)
        .get();
      
      if (ordersSnapshot && !ordersSnapshot.empty) {
        const orders = [];
        ordersSnapshot.forEach((doc) => {
          if (doc && doc.exists) {
            const data = doc.data();
            if (data && data.items && Array.isArray(data.items)) {
              const itemsWithTimestamp = data.items.map(item => ({
                ...item,
                orderTimestamp: data.createdAt ? data.createdAt.toMillis() : 0,
              }));
              orders.push(...itemsWithTimestamp);
            }
          }
        });
        orders.sort((a, b) => (b.orderTimestamp || 0) - (a.orderTimestamp || 0));
        setUserOrders(orders.slice(0, 10));
      } else {
        setUserOrders([]);
      }
    } catch (error) {
      console.error('Error refreshing search data:', error);
    }
  }, []);

  // Save search to recent searches
  const handleSearchSubmit = useCallback(async (query) => {
    if (!query || !query.trim()) return;
    
    const trimmedQuery = query.trim();
    
    const updated = [trimmedQuery, ...recentSearches.filter(s => s !== trimmedQuery)].slice(0, 10);
    setRecentSearches(updated);
    
    const u = auth().currentUser;
    if (u) {
      try {
        await firestore().collection('users').doc(u.uid).update({
          recentSearches: updated,
        });
      } catch (error) {
        console.error('Error saving search:', error);
      }
    }
    
    setShowSearchDropdown(false);
    setSearchQuery(trimmedQuery);
  }, [recentSearches]);

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
    try {
      if (Voice && typeof Voice === 'object') {
        Voice.onSpeechStart = () => setIsListening(true);
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechError = () => {
          setIsListening(false);
          Alert.alert('Error', 'Could not process your voice. Please try again.');
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
    setShowSearchDropdown(false);
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
    },
  ];
  const allProducts = [...bestSellingProducts, ...recommendedProducts];

  // Get recommended products based on user orders
  const getRecommendedFromOrders = () => {
    if (!userOrders || !Array.isArray(userOrders) || userOrders.length === 0) {
      return recommendedProducts.slice(0, 3);
    }
    
    try {
      const orderedProductNames = [...new Set(userOrders
        .filter(item => item && item.name)
        .map(item => item.name.toLowerCase()))];
      
      if (orderedProductNames.length === 0) {
        return recommendedProducts.slice(0, 3);
      }
      
      const recommended = allProducts.filter(product => {
        if (!product || !product.name) return false;
        const productName = product.name.toLowerCase();
        return orderedProductNames.some(ordered => 
          productName.includes(ordered) || ordered.includes(productName) ||
          (product.brand && product.brand.toLowerCase() === ordered)
        );
      });
      
      return recommended.length > 0 ? recommended.slice(0, 3) : recommendedProducts.slice(0, 3);
    } catch (error) {
      console.error('Error getting recommended products:', error);
      return recommendedProducts.slice(0, 3);
    }
  };

  const trendingProducts = allProducts.slice(0, 20);

  // Filter products based on search query and category
  const filterProducts = (products) => {
    let result = products;
    
    // Filter by category (if not "All")
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(p => (p.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query)
      );
    }
    
    return result;
  };

  const filteredRecommended = filterProducts(recommendedProducts);
  const filteredBestSelling = filterProducts(bestSellingProducts);
  const filteredProducts = filterProducts(allProducts);

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
            <TouchableOpacity style={styles.actionButton}>
              <EvilIcons name="bell" size={24} color="#FFFFFF" />
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
        <View 
          style={[styles.searchContainer, isDrawerOpen && { zIndex: 0 }]}
          pointerEvents={isDrawerOpen ? 'none' : 'auto'}
        >
          <View style={styles.searchBar}>
            <EvilIcons name="search" size={22} color="#666666" style={{ marginRight: 12 }} />
            <TextInput
              ref={homeSearchInputRef}
              style={styles.searchInput}
              placeholder={t('searchProducts')}
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (_) {}
                setShowSearchDropdown(true);
              }}
              onFocus={async () => {
                try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (_) {}
                setShowSearchDropdown(true);
                await refreshSearchData();
              }}
              onSubmitEditing={() => handleSearchSubmit(searchQuery)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }} 
                style={{ marginRight: 8 }}
              >
                <EvilIcons name="close" size={18} color="#666666" />
              </TouchableOpacity>
            )}
            <View style={styles.searchActions}>
              <TouchableOpacity
                style={[styles.micButton, isListening && styles.micButtonActive]}
                onPress={handleMicPress}
              >
                <Ionicons name={isListening ? "mic" : "mic-outline"} size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.separator} />
            </View>
          </View>
          
          {/* Search Dropdown */}
          {showSearchDropdown && (
            <View style={[styles.searchDropdown, { paddingBottom: 8 + (insets?.bottom || 0) }]}>
              <View style={{ alignItems: 'center', paddingTop: 6, paddingBottom: 2 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
              </View>
              <ScrollView 
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="always"
                decelerationRate="normal"
                bounces={true}
                overScrollMode="always"
                scrollEnabled={true}
                keyboardDismissMode="on-drag"
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 12 + (insets?.bottom || 0) }}
              >
                {/* Recently Searched */}
                {recentSearches.length > 0 && (
                  <View style={styles.dropdownSection}>
                    <Text style={styles.dropdownSectionTitleBold}>{t('recentSearches')}</Text>
                    <FlatList
                      data={(recentSearches || []).filter(Boolean)}
                      keyExtractor={(item, idx) => `${item}-${idx}`}
                      renderItem={({ item: search }) => (
                        <TouchableOpacity
                          style={styles.recentSearchCard}
                          onPress={() => {
                            setSearchQuery(search);
                            handleSearchSubmit(search);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.recentSearchIcon}>
                            <Ionicons name="time-outline" size={20} color="#666666" />
                          </View>
                          <Text style={styles.recentSearchText} numberOfLines={2}>{search}</Text>
                        </TouchableOpacity>
                      )}
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={styles.horizontalScrollContent}
                      nestedScrollEnabled
                      decelerationRate="fast"
                      snapToAlignment="start"
                      bounces
                    />
                  </View>
                )}
                
                {/* Recommended Products */}
                <View style={styles.dropdownSection}>
                  <Text style={styles.dropdownSectionTitleBold}>{t('recommendedForYou')}</Text>
                  <FlatList
                    data={(getRecommendedFromOrders() || recommendedProducts).slice(0, 30).filter(p => p && p.id)}
                    keyExtractor={(item, idx) => `rec-${item.id}-${idx}`}
                    renderItem={({ item: product, index: idx }) => (
                      <TouchableOpacity
                        key={`rec-${product.id}-${idx}`}
                        style={styles.dropdownProductCard}
                        onPress={() => {
                          if (product.name) {
                            setSearchQuery(product.name);
                            handleSearchSubmit(product.name);
                            navigation.navigate('ProductDetail', { product: getProductForNavigation(product) });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownProductCardImage}>
                          {getProductImageSource(product) ? (
                            <Image source={getProductImageSource(product)} style={styles.dropdownProductImage} />
                          ) : (
                            <Text style={styles.dropdownProductCardEmoji}>📦</Text>
                          )}
                        </View>
                        <Text style={styles.dropdownProductCardText} numberOfLines={2}>{product.name || ''}</Text>
                        <Text style={styles.dropdownProductCardBrand} numberOfLines={1}>{product.brand || ''}</Text>
                        <Text style={styles.dropdownProductCardPrice}>{product.price || ''}</Text>
                      </TouchableOpacity>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={styles.horizontalScrollContent}
                    nestedScrollEnabled
                    decelerationRate="fast"
                    snapToAlignment="start"
                    bounces
                  />
                </View>
                
                {/* Popular Products */}
                <View style={styles.dropdownSection}>
                  <Text style={styles.dropdownSectionTitleBold}>{t('popularProducts')}</Text>
                  <FlatList
                    data={(trendingProducts || []).slice(0, 20).filter(p => p && p.id)}
                    keyExtractor={(item, idx) => `pop-${item.id}-${idx}`}
                    renderItem={({ item: product, index: idx }) => (
                      <TouchableOpacity
                        key={`pop-${product.id}-${idx}`}
                        style={styles.dropdownProductCard}
                        onPress={() => {
                          if (product.name) {
                            setSearchQuery(product.name);
                            handleSearchSubmit(product.name);
                            navigation.navigate('ProductDetail', { product: getProductForNavigation(product) });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownProductCardImage}>
                          {getProductImageSource(product) ? (
                            <Image source={getProductImageSource(product)} style={styles.dropdownProductImage} />
                          ) : (
                            <Text style={styles.dropdownProductCardEmoji}>📦</Text>
                          )}
                        </View>
                        <Text style={styles.dropdownProductCardText} numberOfLines={2}>{product.name || ''}</Text>
                        <Text style={styles.dropdownProductCardBrand} numberOfLines={1}>{product.brand || ''}</Text>
                        <Text style={styles.dropdownProductCardPrice}>{product.price || ''}</Text>
                      </TouchableOpacity>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={styles.horizontalScrollContent}
                    nestedScrollEnabled
                    decelerationRate="fast"
                    snapToAlignment="start"
                    bounces
                  />
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Click outside to close dropdown */}
      {showSearchDropdown && (
        <TouchableWithoutFeedback onPress={() => {
          try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (_) {}
          setShowSearchDropdown(false);
          Keyboard.dismiss();
        }}>
          <View style={styles.dropdownOverlay} />
        </TouchableWithoutFeedback>
      )}

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        scrollEnabled={!showSearchDropdown}
        onScrollBeginDrag={() => { if (!showSearchDropdown) { try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (_) {} } setShowSearchDropdown(false); }}
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
                setSearchQuery('');
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
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recommended')}</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProductsViewAll', { section: 'recommended', baseProducts: recommendedProducts })}>
              <Text style={styles.viewAllBtnText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, paddingBottom: 4 }}>
            {filteredRecommended.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard} onPress={() => {
                navigation.navigate('ProductDetail', { product: getProductForNavigation(product) });
              }}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{product.discount}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.productImage}
                  onPress={() => setZoomedImage(getProductImageSource(product))}
                >
                  {getProductImageSource(product) ? (
                    <Image source={getProductImageSource(product)} style={styles.productImageTag} />
                  ) : (
                    <Text style={styles.productEmoji}>📦</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currentPrice}>{product.price}</Text>
                  <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                </View>
                <View style={styles.savedContainer}>
                  <Text style={styles.savedIcon}>💚</Text>
                  <Text style={styles.savedText}>Saved Price {product.saved}</Text>
                </View>
                <Text style={styles.productSize}>Size {product.size}</Text>
                {cartItems.find((it) => it.id === product.id) ? (
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(product.id)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{cartItems.find((it) => it.id === product.id)?.quantity || 0}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(product.id)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    priceValue: Number(String(product.price).replace(/[^0-9.]/g, '')) || 0,
                    image: product.image || product.imageUri,
                  })}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Today's Offers */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Offer</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProductsViewAll', { section: 'offers', baseProducts: filteredRecommended.slice(0, 2) })}>
              <Text style={styles.viewAllBtnText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, paddingBottom: 4 }}>
            {filteredRecommended.slice(0, 2).map((product) => (
              <TouchableOpacity key={`offer-${product.id}`} style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: getProductForNavigation(product) })}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{product.discount}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.productImage}
                  onPress={() => setZoomedImage(getProductImageSource(product))}
                >
                  {getProductImageSource(product) ? (
                    <Image source={getProductImageSource(product)} style={styles.productImageTag} />
                  ) : (
                    <Text style={styles.productEmoji}>📦</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currentPrice}>{product.price}</Text>
                  <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                </View>
                <View style={styles.savedContainer}>
                  <Text style={styles.savedIcon}>💚</Text>
                  <Text style={styles.savedText}>Saved Price {product.saved}</Text>
                </View>
                <Text style={styles.productSize}>Size {product.size}</Text>
                {cartItems.find((it) => it.id === product.id) ? (
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(product.id)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{cartItems.find((it) => it.id === product.id)?.quantity || 0}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(product.id)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    priceValue: Number(String(product.price).replace(/[^0-9.]/g, '')) || 0,
                    image: product.image || product.imageUri,
                  })}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Best Selling Products */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('bestSelling')}</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProductsViewAll', { section: 'best', baseProducts: bestSellingProducts })}>
              <Text style={styles.viewAllBtnText}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16, paddingBottom: 4 }}>
              {filteredBestSelling.map((product) => (
                <TouchableOpacity key={`best-${product.id}`} style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: getProductForNavigation(product) })}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{product.discount}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.productImage}
                    onPress={() => setZoomedImage(getProductImageSource(product))}
                  >
                    {getProductImageSource(product) ? (
                      <Image source={getProductImageSource(product)} style={styles.productImageTag} />
                    ) : (
                      <Text style={styles.productEmoji}>📦</Text>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productBrand}>{product.brand}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.currentPrice}>{product.price}</Text>
                    <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                  </View>
                  <View style={styles.savedContainer}>
                    <Text style={styles.savedIcon}>💚</Text>
                    <Text style={styles.savedText}>Saved Price {product.saved}</Text>
                  </View>
                  <Text style={styles.productSize}>Size {product.size}</Text>
                  {cartItems.find((it) => it.id === product.id) ? (
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(product.id)}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{cartItems.find((it) => it.id === product.id)?.quantity || 0}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(product.id)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart({
                      id: product.id,
                      name: product.name,
                      brand: product.brand,
                      priceValue: Number(String(product.price).replace(/[^0-9.]/g, '')) || 0,
                      image: product.image || product.imageUri,
                    })}>
                      <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* Products - All (grid 2 per row) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
          </View>
          <View style={styles.productsGrid}>
            {filteredProducts.map((product, idx) => (
              <TouchableOpacity key={`all-${idx}-${product.id}`} style={[styles.productCard, styles.productCardGridOverride]} onPress={() => navigation.navigate('ProductDetail', { product: getProductForNavigation(product) })}>
                {product.discount ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{product.discount}</Text>
                  </View>
                ) : null}
                <TouchableOpacity 
                  style={styles.productImage}
                  onPress={() => setZoomedImage(getProductImageSource(product))}
                >
                  {getProductImageSource(product) ? (
                    <Image source={getProductImageSource(product)} style={styles.productImageTag} />
                  ) : (
                    <Text style={styles.productEmoji}>📦</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.currentPrice}>{product.price}</Text>
                  <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                </View>
                {product.saved ? (
                  <View style={styles.savedContainer}>
                    <Text style={styles.savedIcon}>💚</Text>
                    <Text style={styles.savedText}>Saved Price {product.saved}</Text>
                  </View>
                ) : null}
                {product.size ? (
                  <Text style={styles.productSize}>Size {product.size}</Text>
                ) : null}
                {cartItems.find((it) => it.id === product.id) ? (
                  <View style={styles.qtyControls}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(product.id)}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{cartItems.find((it) => it.id === product.id)?.quantity || 0}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(product.id)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    priceValue: Number(String(product.price).replace(/[^0-9.]/g, '')) || 0,
                    image: product.image || product.imageUri,
                  })}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

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
  searchContainer: {
    marginTop: 8,
    position: 'relative',
    zIndex: 1000,
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
  dropdownScrollView: {
    flex: 1,
    paddingBottom: 8,
  },
  dropdownSection: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownSectionTitleBold: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
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
    marginRight: 8,
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
    marginLeft: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    marginTop: 8,
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
    marginTop: 8,
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
});