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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from './CartContext';
import { useOrders } from './OrdersContext';
import { useStock } from './StockContext';

const { width } = Dimensions.get('window');

const productDescriptions = {
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

// Removed random stock function - using StockContext instead

const generateProductImages = (product) => {
  // Generate multiple images for slider (using emoji variations or multiple views)
  const baseEmoji = product.image || '🧪';
  return [
    { id: 1, emoji: baseEmoji },
    { id: 2, emoji: baseEmoji },
    { id: 3, emoji: baseEmoji },
    { id: 4, emoji: baseEmoji },
  ];
};

export default function ProductDetailScreen({ route, navigation }) {
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
  }, [product?.id]);

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Product not found</Text>
      </SafeAreaView>
    );
  }

  const description = productDescriptions[product.name] || productDescriptions.default;
  const images = generateProductImages(product);
  const priceValue = Number(String(product.price).replace(/[^0-9.]/g, '')) || 0;

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
      priceValue,
      image: product.image,
    });
    Alert.alert('Success', 'Product added to cart!');
  };

  const handleBuyNow = () => {
    if (currentStockStatus.count === 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
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
      total: product.price,
      items: 1,
      products: [
        {
          name: product.name,
          quantity: 1,
          price: product.price,
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
                  <Text style={styles.productEmoji}>{img.emoji}</Text>
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
              <Text style={styles.currentPrice}>{product.price}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>{product.originalPrice}</Text>
              )}
            </View>
            {product.saved && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedText}>You save {product.saved}</Text>
              </View>
            )}
          </View>
          {product.size && (
            <Text style={styles.sizeText}>Size: {product.size}</Text>
          )}
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
      <View style={styles.bottomActionContainer}>
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
    paddingBottom: 100,
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

