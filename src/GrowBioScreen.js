import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCart } from './CartContext';

export default function GrowBioScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addToCart, increment, decrement, items: cartItems } = useCart();
  const [activeTab, setActiveTab] = useState('Bio Products');
  const tabBarHeight = useBottomTabBarHeight() || 60;

  const totalCartQuantity = (cartItems || []).reduce((sum, it) => sum + (it.quantity || 0), 0);

  const tabs = ['Bio Products', 'Organic Seeds', 'Bio Fertilizers', 'Bio Pesticides'];

  const bioProducts = [
    {
      id: 1,
      name: 'Organic Compost Mix',
      brand: 'GreenEarth',
      price: '₹899',
      originalPrice: '₹1,199',
      discount: '25% OFF',
      rating: 4.8,
      image: '🌿',
      description: '100% organic compost for healthy soil',
    },
    {
      id: 2,
      name: 'Bio Growth Promoter',
      brand: 'NatureBio',
      price: '₹1,250',
      originalPrice: '₹1,500',
      discount: '17% OFF',
      rating: 4.6,
      image: '🌱',
      description: 'Natural growth enhancer for plants',
    },
    {
      id: 3,
      name: 'Organic Pest Control',
      brand: 'EcoSafe',
      price: '₹650',
      originalPrice: '₹850',
      discount: '24% OFF',
      rating: 4.7,
      image: '🛡️',
      description: 'Chemical-free pest management',
    },
  ];

  const organicSeeds = [
    {
      id: 1,
      name: 'Organic Tomato Seeds',
      variety: 'Cherry',
      price: '₹150',
      quantity: '50 seeds',
      image: '🍅',
    },
    {
      id: 2,
      name: 'Organic Wheat Seeds',
      variety: 'Durum',
      price: '₹200',
      quantity: '1 kg',
      image: '🌾',
    },
    {
      id: 3,
      name: 'Organic Rice Seeds',
      variety: 'Basmati',
      price: '₹180',
      quantity: '500g',
      image: '🌾',
    },
  ];

  const bioFertilizers = [
    {
      id: 1,
      name: 'Vermicompost',
      brand: 'BioRich',
      price: '₹300',
      quantity: '5 kg',
      image: '🐛',
    },
    {
      id: 2,
      name: 'Seaweed Extract',
      brand: 'OceanBio',
      price: '₹450',
      quantity: '1 liter',
      image: '🌊',
    },
    {
      id: 3,
      name: 'Neem Cake',
      brand: 'GreenGuard',
      price: '₹250',
      quantity: '2 kg',
      image: '🌿',
    },
  ];

  const bioPesticides = [
    {
      id: 1,
      name: 'Neem Oil',
      brand: 'PureNeem',
      price: '₹350',
      quantity: '500ml',
      image: '🛡️',
    },
    {
      id: 2,
      name: 'Garlic Extract',
      brand: 'NatureShield',
      price: '₹280',
      quantity: '250ml',
      image: '🧄',
    },
    {
      id: 3,
      name: 'Chili Extract',
      brand: 'HotGuard',
      price: '₹320',
      quantity: '300ml',
      image: '🌶️',
    },
  ];

  const getQuantityForProduct = (productId) => {
    const item = (cartItems || []).find((it) => it.id === productId);
    return item ? (item.quantity || 0) : 0;
  };

  const renderProducts = (products) => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 + (insets?.bottom || 0) + (tabBarHeight || 60), paddingHorizontal: 0 }}
    >
      <View style={styles.productsContainer}>
      {products.map((product) => (
        <View key={product.id} style={styles.productCard}>
          <View style={styles.productCardHeader}>
            <View style={styles.productImageContainer}>
              <View style={styles.productImage}>
                <Text style={styles.productEmoji}>{product.image}</Text>
              </View>
              {product.discount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{product.discount}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productBrand}>{product.brand}</Text>
              
              {product.rating && (
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>⭐ {product.rating}</Text>
                </View>
              )}
            </View>
          </View>
          
          {product.description && (
            <Text style={styles.productDescription}>{product.description}</Text>
          )}
          
          {product.variety && (
            <View style={styles.varietyContainer}>
              <Text style={styles.varietyLabel}>Variety:</Text>
              <Text style={styles.productVariety}>{product.variety}</Text>
            </View>
          )}
          
          <View style={styles.productCardFooter}>
            <View style={styles.priceSection}>
              <View style={styles.priceContainer}>
                <Text style={styles.currentPrice}>{product.price}</Text>
                {product.originalPrice && (
                  <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                )}
              </View>
              {product.quantity && (
                <Text style={styles.productQuantity}>{product.quantity}</Text>
              )}
            </View>
            
            {getQuantityForProduct(product.id) > 0 ? (
              <View style={styles.qtyControls}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => decrement(product.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.qtyDisplay}>
                  <Text style={styles.qtyText}>{getQuantityForProduct(product.id)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => increment(product.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => {
                  const priceValue = Number(String(product.price).replace(/[^0-9.]/g, '')) || 0;
                  addToCart({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    priceValue,
                    image: product.image,
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Bio Products': return renderProducts(bioProducts);
      case 'Organic Seeds': return renderProducts(organicSeeds);
      case 'Bio Fertilizers': return renderProducts(bioFertilizers);
      case 'Bio Pesticides': return renderProducts(bioPesticides);
      default: return renderProducts(bioProducts);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GrowBio</Text>
        <Text style={styles.headerSubtitle}>100% Organic & Bio Products</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Bottom Actions - Just above nav bar */}
      <View style={[
        styles.bottomActions,
        {
          bottom: tabBarHeight || 60,
        }
      ]}>
        <TouchableOpacity style={styles.cartButton} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          <Text style={styles.cartText}>Cart ({totalCartQuantity})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#E8F5E9',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeTab: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productsContainer: {
    paddingHorizontal: 4,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  productCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  productEmoji: {
    fontSize: 40,
  },
  discountBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 24,
  },
  productBrand: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  productDescription: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 12,
    lineHeight: 18,
    paddingLeft: 4,
  },
  varietyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 4,
  },
  varietyLabel: {
    fontSize: 13,
    color: '#666666',
    marginRight: 6,
    fontWeight: '500',
  },
  productVariety: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  ratingContainer: {
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '600',
  },
  productCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  priceSection: {
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  productQuantity: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  addToCartButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 20,
  },
  qtyDisplay: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    position: 'absolute',
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 10,
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cartIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  cartText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
