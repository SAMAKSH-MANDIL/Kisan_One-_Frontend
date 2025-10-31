import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useCart } from './CartContext';
import { Ionicons, EvilIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Voice from '@react-native-voice/voice';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { addToCart, increment, decrement, items: cartItems } = useCart();
  const [activeTab, setActiveTab] = useState('Home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerWidth = Math.round(width * 0.75);
  const drawerTranslateX = useRef(new Animated.Value(-drawerWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const dragX = useRef(0).current;
  const [profileName, setProfileName] = useState('Farmer');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Calculate total quantity of items in cart
  const totalCartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

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
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = () => {
      setIsListening(false);
      Alert.alert('Error', 'Could not process your voice. Please try again.');
    };
    Voice.onSpeechResults = (e) => {
      const result = e.value[0];
      if (result) {
        setSearchQuery(result);
      }
      setIsListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startVoiceRecognition = async () => {
    try {
      await Voice.start('en-US');
    } catch (e) {
      Alert.alert('Error', 'Could not start voice recognition. Please check permissions.');
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      await Voice.stop();
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
        // Start near left edge to open, or anywhere when drawer open to close
        const nearEdge = g.moveX <= 24;
        const draggingHoriz = Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20;
        return (nearEdge && draggingHoriz && !isDrawerOpen && g.dx > 0) || (isDrawerOpen && draggingHoriz);
      },
      onPanResponderMove: (_, g) => {
        let tx = isDrawerOpen ? Math.min(0, g.dx) : Math.max(-(drawerWidth - g.dx), -drawerWidth);
        // Clamp while opening: from -drawerWidth to 0
        if (!isDrawerOpen) tx = Math.min(0, Math.max(-drawerWidth + g.dx, -drawerWidth));
        drawerTranslateX.setValue(tx);
        const progress = 1 - Math.abs(tx) / drawerWidth; // 0..1
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
    { id: 1, name: 'Offers', icon: '🛒', color: '#FF6B6B' },
    { id: 2, name: 'Insecticides', icon: '🧪', color: '#4ECDC4' },
    { id: 3, name: 'Nutrients', icon: '📦', color: '#45B7D1' },
    { id: 4, name: 'Fungicides', icon: '🌿', color: '#96CEB4' },
    { id: 5, name: 'Vegetable', icon: '🥬', color: '#FFEAA7' },
    { id: 6, name: 'Seeds', icon: '🌱', color: '#DDA0DD' },
    { id: 7, name: 'Tools', icon: '🔧', color: '#98D8C8' },
    { id: 8, name: 'Equipment', icon: '🚜', color: '#F7DC6F' },
  ];

  const recommendedProducts = [
    {
      id: 1,
      name: 'Geolife No Virus Bio Viricide',
      brand: 'Geolife Agritech',
      price: '₹285',
      originalPrice: '₹700',
      discount: '59% OFF',
      size: '250 ml',
      saved: '₹415',
      image: '🧪',
    },
    {
      id: 2,
      name: 'Antracol Fungicide - Propineb',
      brand: 'Bayer',
      price: '₹277',
      originalPrice: '₹350',
      discount: '21% OFF',
      size: '250 gms',
      saved: '₹73',
      image: '🌿',
    },
    {
      id: 3,
      name: 'Fantac Plus Growth Promoter',
      brand: 'Coromandel International',
      price: '₹289',
      originalPrice: '₹430',
      discount: '33% OFF',
      size: '100 ml',
      saved: '₹141',
      image: '💧',
    },
  ];

  const bestSellingProducts = [
    {
      id: 1,
      name: 'UPL Saathi Herbicide',
      brand: 'UPL',
      price: '₹1,450',
      originalPrice: '₹1,800',
      discount: '19% OFF',
      size: '500 ml',
      saved: '₹350',
      image: '🌾',
    },
    {
      id: 2,
      name: 'Roundup Glyphosate',
      brand: 'Bayer',
      price: '₹2,200',
      originalPrice: '₹2,600',
      discount: '15% OFF',
      size: '1 liter',
      saved: '₹400',
      image: '🌿',
    },
    {
      id: 3,
      name: 'Multiplex Falcon Growth Promoter',
      brand: 'Multiplex',
      price: '₹320',
      originalPrice: '₹450',
      discount: '29% OFF',
      size: '250 ml',
      saved: '₹130',
      image: '💧',
    },
    {
      id: 4,
      name: 'Syngenta Nativo Fungicide',
      brand: 'Syngenta',
      price: '₹3,500',
      originalPrice: '₹4,000',
      discount: '13% OFF',
      size: '1 kg',
      saved: '₹500',
      image: '🛡️',
    },
    {
      id: 5,
      name: 'Indian Organic Vermicompost',
      brand: 'GreenEarth',
      price: '₹150',
      originalPrice: '₹200',
      discount: '25% OFF',
      size: '5 kg',
      saved: '₹50',
      image: '🌱',
    },
  ];

  const allProducts = [...bestSellingProducts, ...recommendedProducts];

  // Filter products based on search query
  const filterProducts = (products) => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query)
    );
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
      <View style={styles.header}>
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
              <Text style={styles.actionIcon}>🔔</Text>
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
          <View style={styles.searchBar}>
            <EvilIcons name="search" size={22} color="#666666" style={{ marginRight: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products here"
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 8 }}>
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
            {/* Image search icon temporarily disabled per request */}
            {false && (
              <TouchableOpacity style={styles.scanButton}>
                <MaterialIcons name="image-search" size={24} color="#666666" />
              </TouchableOpacity>
            )}
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryItem}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Banner - Only Photo */}
        <View style={styles.imageBannerContainer}>
          <View style={styles.imageBanner}>
            <Text style={styles.bannerImageEmoji}>🌾🏭</Text>
          </View>
        </View>

        {/* Brands Section */}
        <View style={styles.brandsSectionContainer}>
          <View style={styles.brandsSectionHeader}>
            <Text style={styles.brandsSectionTitle}>Popular Brands</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('BrandsViewAll')}>
              <Text style={styles.viewAllBtnText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Brands Grid - 3 rows x 3 columns */}
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
            <Text style={styles.sectionTitle}>Recommended Products</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProductsViewAll', { section: 'recommended', baseProducts: recommendedProducts })}>
              <Text style={styles.viewAllBtnText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredRecommended.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product })}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{product.discount}</Text>
                </View>
                <View style={styles.productImage}>
                  <Text style={styles.productEmoji}>{product.image}</Text>
                </View>
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
                    image: product.image,
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredRecommended.slice(0, 2).map((product) => (
              <TouchableOpacity key={`offer-${product.id}`} style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product })}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{product.discount}</Text>
                </View>
                <View style={styles.productImage}>
                  <Text style={styles.productEmoji}>{product.image}</Text>
                </View>
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
                    image: product.image,
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
            <Text style={styles.sectionTitle}>Best Selling Products</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('ProductsViewAll', { section: 'best', baseProducts: bestSellingProducts })}>
              <Text style={styles.viewAllBtnText}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredBestSelling.map((product) => (
              <TouchableOpacity key={`best-${product.id}`} style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product })}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{product.discount}</Text>
                </View>
                <View style={styles.productImage}>
                  <Text style={styles.productEmoji}>{product.image}</Text>
                </View>
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
                    image: product.image,
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
              <TouchableOpacity key={`all-${idx}-${product.id}`} style={[styles.productCard, styles.productCardGridOverride]} onPress={() => navigation.navigate('ProductDetail', { product })}>
                {product.discount ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{product.discount}</Text>
                  </View>
                ) : null}
                <View style={styles.productImage}>
                  <Text style={styles.productEmoji}>{product.image}</Text>
                </View>
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
                    image: product.image,
                  })}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

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
  },
  categoryEmoji: {
    fontSize: 24,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    height: 150,
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