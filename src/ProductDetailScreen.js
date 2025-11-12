import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from './CartContext';
import { useOrders } from './OrdersContext';
import { useStock } from './StockContext';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

// Map of local asset paths used in product.imageUri to require()
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

const productDescriptions = {
  'Farmson Biotech FB GRIVA Pea Seeds 500GM': 'Premium quality pea seeds with high germination rate. Ideal for home gardens and commercial farming. Disease resistant variety with excellent yield.',
  'Farmson Biotech FB SAKET F1 Hybrid Okra (Bhindi) Seeds': 'High yielding F1 hybrid okra seeds. Produces uniform, tender fruits with excellent taste. Resistant to common diseases and suitable for all seasons.',
  'Farmson Biotech FB MARUTI F1 Hybrid Corn Seeds 500GM': 'Superior F1 hybrid corn variety with high sugar content. Produces large, sweet cobs perfect for fresh consumption and processing.',
  'Farmson Biotech FB SUVARN Clusterbean Seeds 250GM': 'Top quality clusterbean (guar) seeds with excellent pod quality. Suitable for vegetable production with good yield potential.',
  'Katyayani Activated Humic Acid + Fulvic Acid 98 Fertilizer': 'Premium organic fertilizer enriched with humic and fulvic acids. Improves soil structure, nutrient uptake, and overall plant health.',
  'Katyayani Seaweed Extract Liquid Organic fertilizer': 'Natural seaweed extract rich in micronutrients and growth hormones. Enhances plant growth, stress tolerance, and crop quality.',
  'katyayani Pro Grow (Gibberellic Acid 0.001% L) Plant Growth Regulator': 'Advanced plant growth regulator for improved flowering, fruit setting, and overall plant development. Increases crop yield significantly.',
  'Agri Venture GIBBER Gibberelic Acid 0.001% SL': 'High-quality gibberellic acid solution for promoting plant growth and breaking seed dormancy. Ideal for various crops.',
  'Katyayani EMA 5 Emamectin Benzoate 5 SG Chemical Insecticide': 'Effective insecticide for controlling caterpillars and other leaf-eating pests. Quick action with long-lasting protection.',
  'Agri Venture Carzone Chlorantraniliprole 18.5% SC Chemical Insecticide': 'Broad-spectrum insecticide with excellent efficacy against various insect pests. Safe for beneficial insects when used as directed.',
  'Agri Venture Emabenz Gold Emamectin Benzoate 5% SG Chemical Insecticide': 'Premium quality insecticide for effective control of lepidopteran pests. Provides extended protection with minimal environmental impact.',
  'Katyayani Antivirus viricide Special Chilli Tomato Brinjal': 'Specialized viricide for protecting vegetable crops from viral diseases. Safe and effective formulation for organic farming.',
  'Money Marble Pothos': 'Beautiful variegated pothos plant perfect for indoor decoration. Low maintenance with air-purifying qualities.',
  'Manjula Variegated Pothos': 'Stunning variegated pothos variety with cream and green leaves. Excellent for hanging baskets and home decor.',
  'Manjula Green Pothos': 'Classic green pothos plant known for its hardy nature and easy care. Perfect for beginners and experienced gardeners.',
  'Golden Money Plant': 'Popular golden variety of money plant. Brings prosperity and purifies indoor air naturally.',
  'SSE450 HANDY FOGGING MACHINE THERMAL': 'Professional-grade thermal fogging machine for pest control and sanitization. Portable and efficient for large areas.',
  'Geolife No Virus Bio Viricide': 'Advanced bio-viricide solution for effective protection against plant viruses. Safe for use on all crops and environmentally friendly.',
  'Antracol Fungicide - Propineb': 'Broad-spectrum fungicide providing excellent protection against a wide range of fungal diseases in various crops.',
  'Fantac Plus Growth Promoter': 'Premium growth promoter that enhances plant growth, flowering, and fruit development while improving overall crop yield.',
  'UPL Saathi Herbicide': 'Effective herbicide for controlling weeds in field crops, ensuring better crop growth and higher yields.',
  'Roundup Glyphosate': 'Systemic herbicide for effective weed control in agricultural fields and orchards.',
  'Multiplex Falcon Growth Promoter': 'Natural growth promoter that stimulates root development and improves nutrient uptake in plants.',
  'Syngenta Nativo Fungicide': 'Advanced fungicide offering superior protection against fungal diseases in fruits and vegetables.',
  'Indian Organic Vermicompost': '100% organic compost rich in nutrients, beneficial microorganisms, and organic matter for healthy plant growth.',
  default: 'High-quality agricultural product designed to enhance crop productivity and plant health.',
};

// Map product IDs to image paths for fallback
const productIdToImageMap = {
  // Seeds
  1001: '../assets/data/seed1.png',
  1002: '../assets/data/seed2.png',
  1003: '../assets/data/seed3.png',
  1004: '../assets/data/seed4.png',
  // Crop Nutrition
  2001: '../assets/data/cropnutri1.png',
  2002: '../assets/data/cropnutri2.png',
  2003: '../assets/data/cropnutri3.png',
  2004: '../assets/data/cropnutri4.png',
  // Crop Protection
  3001: '../assets/data/cropprotection1.png',
  3002: '../assets/data/cropprotection2.png',
  3003: '../assets/data/cropprotection3.png',
  3004: '../assets/data/cropprotection4.png',
  // Garden Care
  4001: '../assets/data/gardencare1.png',
  4002: '../assets/data/gardencare2.png',
  4003: '../assets/data/gardencare3.png',
  4004: '../assets/data/gardencare4.png',
  // Agri Equipment
  5001: '../assets/data/agriequip1.png',
};

// Helper function to get product image source (improved to handle all cases)
const getProductImageSource = (product) => {
  if (!product) return null;
  
  // Priority 1: imageRequire (direct require statement)
  if (product.imageRequire) {
    return product.imageRequire;
  }
  
  // Priority 2: imageUri from localImageMap
  if (product.imageUri) {
    if (localImageMap[product.imageUri]) {
      return localImageMap[product.imageUri];
    }
    // Check if it's a remote URL
    if (/^https?:/i.test(product.imageUri)) {
      return { uri: product.imageUri };
    }
  }
  
  // Priority 3: Try to get image from product ID mapping
  if (product.id) {
    // Handle section-prefixed IDs (e.g., "recommended-1001", "best-1003")
    const baseId = typeof product.id === 'string' 
      ? parseInt(product.id.split('-').pop()) 
      : product.id;
    
    if (productIdToImageMap[baseId]) {
      const imagePath = productIdToImageMap[baseId];
      if (localImageMap[imagePath]) {
        return localImageMap[imagePath];
      }
    }
  }
  
  // Priority 4: Try to reconstruct imageUri from product properties
  // Check if product has image property that might be a path
  if (product.image && typeof product.image === 'string' && product.image.includes('../assets')) {
    if (localImageMap[product.image]) {
      return localImageMap[product.image];
    }
  }
  
  // No valid image source found
  return null;
};

const generateProductImages = (product) => {
  const imageSource = getProductImageSource(product);
  if (imageSource) {
    return [{ id: 1, source: imageSource }];
  }
  const baseEmoji = product.image || '📦';
  return [{ id: 1, emoji: baseEmoji }];
};

export default function ProductDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { product } = route.params || {};
  const { addToCart, increment, decrement, items: cartItems } = useCart();
  const { addOrder } = useOrders();
  const { getStockStatus, reduceStock } = useStock();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [stock, setStock] = useState(() => getStockStatus(product?.id || 0));
  
  // Check if product is in cart
  const isInCart = cartItems.find((it) => it.id === product?.id);
  const cartQuantity = isInCart ? isInCart.quantity : 0;

  // Update stock when product changes or when stock updates
  useEffect(() => {
    if (product?.id) {
      const updatedStock = getStockStatus(product.id);
      setStock(updatedStock);
    }
  }, [product?.id, getStockStatus]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const description = productDescriptions[product.name] || productDescriptions.default;
  const images = generateProductImages(product);
  const basePriceValue = Number(String(product.price).replace(/[^0-9.]/g, '')) || 0;
  // Pack/quantity options
  const defaultPacks = [
    { label: '200 gm' },
    { label: '500 gm' },
    { label: '1 kg' },
  ];
  const packOptions = Array.isArray(product?.packOptions) && product.packOptions.length > 0
    ? product.packOptions
    : defaultPacks;
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const selectedPack = packOptions[selectedPackIndex] || packOptions[0];
  const displayedPriceText = selectedPack?.price ?? product.price;
  const displayedPriceValue = Number(String(displayedPriceText).replace(/[^0-9.]/g, '')) || basePriceValue;
  const displayedOriginalPrice = selectedPack?.originalPrice ?? product.originalPrice;
  const displayedSaved = selectedPack?.saved ?? product.saved;
  const displayedSize = selectedPack?.size ?? selectedPack?.label ?? product.size;

  // Update stock display
  const currentStockStatus = getStockStatus(product.id);
  
  const handleAddToCart = () => {
    if (currentStockStatus.count === 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      brand: product.brand,
      priceValue: displayedPriceValue,
      image: product.image,
      pack: selectedPack?.label || null,
    });
    Alert.alert('Success', 'Product added to cart!');
  };

  const checkUserAddress = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        return false;
      }
      const doc = await firestore().collection('users').doc(user.uid).get();
      if (doc.exists) {
        const data = doc.data() || {};
        // Check if all address fields are present and not empty
        if (data.name && data.state && data.city && data.address) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.log('Address check error:', error);
      return false;
    }
  };

  const handleBuyNow = async () => {
    if (currentStockStatus.count === 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }
    
    // Check if user has saved address
    const hasAddress = await checkUserAddress();
    if (!hasAddress) {
      Alert.alert(
        'Address Required',
        'Please save your full address before placing an order.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Profile',
            onPress: () => navigation.navigate('MyProfile'),
          },
        ]
      );
      return;
    }
    
    // Reduce stock by 1
    reduceStock(product.id, 1);
    
    // Format date
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    // Generate order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    
    // Add to orders - match the structure expected by MyOrdersScreen
    const order = {
      id: Date.now().toString(),
      orderNumber: orderNumber,
      date: formattedDate,
      status: 'Pending',
      total: displayedPriceText,
      items: 1,
      products: [
        {
          name: product.name,
          quantity: 1,
          price: displayedPriceText,
          pack: selectedPack?.label || null,
        },
      ],
    };
    
    addOrder(order);
    
    // Update local stock display
    setStock(getStockStatus(product.id));
    
    Alert.alert('Order Placed', 'Your order has been placed successfully!', [
      { text: 'OK', onPress: () => navigation.navigate('Dashboard', { screen: 'My Orders' }) },
    ]);
  };

  const onImageScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.scrollContainer}>
        <ScrollView contentContainerStyle={styles.content}>
        {/* Image Slider */}
        <View style={styles.imageSliderContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onImageScroll}
            style={styles.imageSlider}
          >
            {images.map((img) => (
              <View key={img.id} style={styles.imageSlide}>
                <View style={styles.productImageContainer}>
                  {img.source ? (
                    <Image 
                      source={img.source} 
                      style={styles.detailImageTag}
                      resizeMode="contain"
                      onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
                    />
                  ) : (
                    <Text style={styles.productEmoji}>{img.emoji}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
          
          {/* Image Indicators */}
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          {/* Discount Badge */}
          {product.discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount}</Text>
            </View>
          )}
        </View>

        {/* Product Name */}
        <View style={styles.nameContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productBrand}>{product.brand}</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        {/* Price Section */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.currentPrice}>{displayedPriceText}</Text>
              {displayedOriginalPrice && (
                <Text style={styles.originalPrice}>{displayedOriginalPrice}</Text>
              )}
            </View>
            {displayedSaved && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedText}>You save {displayedSaved}</Text>
              </View>
            )}
          </View>
          {displayedSize && (
            <Text style={styles.sizeText}>Size: {displayedSize}</Text>
          )}
          {/* Pack/Quantity Options */}
          <View style={styles.packContainer}>
            <Text style={styles.packLabel}>Select Pack</Text>
            <View style={styles.packRow}>
              {packOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={`${opt.label}-${idx}`}
                  style={[styles.packChip, selectedPackIndex === idx && styles.packChipActive]}
                  onPress={() => setSelectedPackIndex(idx)}
                >
                  <Text style={[styles.packChipText, selectedPackIndex === idx && styles.packChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Stock Information */}
        <View style={styles.stockContainer}>
          <Text style={styles.stockLabel}>Availability:</Text>
          <View style={[styles.stockBadge, { backgroundColor: (stock.color || currentStockStatus.color) + '20' }]}>
            <View style={[styles.stockDot, { backgroundColor: stock.color || currentStockStatus.color }]} />
            <Text style={[styles.stockText, { color: stock.color || currentStockStatus.color }]}>
              {stock.status || currentStockStatus.status} ({(stock.count !== undefined ? stock.count : currentStockStatus.count)} units available)
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Sticky Bottom Buttons */}
      <View style={[
        styles.bottomActionContainer,
        { paddingBottom: 12 + (insets?.bottom || 0) }
      ]}>
        {/* Left Side: Add to Cart or Quantity Controls */}
        {isInCart && cartQuantity > 0 ? (
          <View style={styles.qtyControlContainer}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => decrement(product.id)}
            >
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{cartQuantity}</Text>
            <TouchableOpacity
              style={[styles.qtyButton, (stock.count === 0 || currentStockStatus.count === 0 || cartQuantity >= (stock.count || currentStockStatus.count)) && styles.qtyButtonDisabled]}
              onPress={() => {
                const maxAvailable = stock.count || currentStockStatus.count;
                if (cartQuantity < maxAvailable) {
                  increment(product.id);
                } else {
                  Alert.alert('Stock Limit', `Only ${maxAvailable} units available.`);
                }
              }}
              disabled={stock.count === 0 || currentStockStatus.count === 0 || cartQuantity >= (stock.count || currentStockStatus.count)}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addToCartButton, (stock.count === 0 || currentStockStatus.count === 0) && styles.buttonDisabled]}
            onPress={handleAddToCart}
            disabled={stock.count === 0 || currentStockStatus.count === 0}
          >
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}

        {/* Right Side: Buy Now Button */}
        <TouchableOpacity
          style={[styles.buyNowButton, (stock.count === 0 || currentStockStatus.count === 0) && styles.buttonDisabled]}
          onPress={handleBuyNow}
          disabled={stock.count === 0 || currentStockStatus.count === 0}
        >
          <Text style={styles.buyNowButtonText}>Buy Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginTop: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    paddingBottom: 160,
  },
  imageSliderContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  imageSlider: {
    height: 300,
  },
  imageSlide: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageContainer: {
    width: '80%',
    height: '80%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailImageTag: {
    width: '100%',
    height: '100%',
  },
  productEmoji: {
    fontSize: 120,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#2E7D32',
    width: 24,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nameContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  productBrand: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  descriptionContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  priceSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  savedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savedText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
  },
  packContainer: {
    marginTop: 12,
  },
  packLabel: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 8,
  },
  packRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  packChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  packChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  packChipTextActive: {
    color: '#FFFFFF',
  },
  sizeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  stockLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 12,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 8,
  },
  addToCartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  qtyControlContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 8,
  },
  qtyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  qtyText: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 12,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  buyNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
});