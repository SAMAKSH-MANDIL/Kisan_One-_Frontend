import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from './utils/responsive';

export default function AgriStoreScreen() {
  const [activeTab, setActiveTab] = useState('Categories');
  const insets = useSafeAreaInsets();

  const tabs = ['Categories', 'Brands', 'Offers', 'New Arrivals'];

  const categories = [
    { id: 1, name: 'Seeds', icon: '🌱', color: '#4CAF50' },
    { id: 2, name: 'Fertilizers', icon: '🌿', color: '#8BC34A' },
    { id: 3, name: 'Pesticides', icon: '🧪', color: '#FF9800' },
    { id: 4, name: 'Tools', icon: '🔧', color: '#607D8B' },
    { id: 5, name: 'Equipment', icon: '🚜', color: '#795548' },
    { id: 6, name: 'Irrigation', icon: '💧', color: '#2196F3' },
    { id: 7, name: 'Protection', icon: '🛡️', color: '#9C27B0' },
    { id: 8, name: 'Accessories', icon: '📦', color: '#FF5722' },
  ];

  const brands = [
    { id: 1, name: 'Bayer', logo: '🔬', description: 'Leading agricultural solutions' },
    { id: 2, name: 'Syngenta', logo: '🌾', description: 'Innovative crop protection' },
    { id: 3, name: 'UPL', logo: '🌱', description: 'Sustainable agriculture' },
    { id: 4, name: 'Coromandel', logo: '🏭', description: 'Fertilizer specialists' },
    { id: 5, name: 'Mahindra', logo: '🚜', description: 'Farm equipment & solutions' },
    { id: 6, name: 'John Deere', logo: '🌾', description: 'Agricultural machinery' },
  ];

  const offers = [
    {
      id: 1,
      title: 'Diwali Special',
      discount: 'Up to 60% OFF',
      description: 'Celebrate Diwali with amazing deals',
      image: '🎆',
      validUntil: '31st October',
    },
    {
      id: 2,
      title: 'Seed Sale',
      discount: '40% OFF',
      description: 'Premium quality seeds at discounted prices',
      image: '🌱',
      validUntil: '15th November',
    },
    {
      id: 3,
      title: 'Tool Kit Offer',
      discount: 'Buy 2 Get 1 FREE',
      description: 'Essential farming tools bundle',
      image: '🔧',
      validUntil: '20th November',
    },
  ];

  const newArrivals = [
    {
      id: 1,
      name: 'Smart Irrigation Controller',
      brand: 'TechFarm',
      price: '₹15,999',
      originalPrice: '₹19,999',
      discount: '20% OFF',
      image: '💧',
      rating: 4.5,
    },
    {
      id: 2,
      name: 'Organic Compost Mix',
      brand: 'GreenEarth',
      price: '₹899',
      originalPrice: '₹1,199',
      discount: '25% OFF',
      image: '🌿',
      rating: 4.8,
    },
    {
      id: 3,
      name: 'Precision Seeder',
      brand: 'AgriTech',
      price: '₹8,500',
      originalPrice: '₹10,000',
      discount: '15% OFF',
      image: '🌱',
      rating: 4.3,
    },
  ];

  const renderCategories = () => (
    <View style={styles.categoriesGrid}>
      {categories.map((category) => (
        <TouchableOpacity key={category.id} style={styles.categoryCard}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Text style={styles.categoryEmoji}>{category.icon}</Text>
          </View>
          <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBrands = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {brands.map((brand) => (
        <TouchableOpacity key={brand.id} style={styles.brandCard}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandEmoji}>{brand.logo}</Text>
          </View>
          <View style={styles.brandInfo}>
            <Text style={styles.brandName}>{brand.name}</Text>
            <Text style={styles.brandDescription}>{brand.description}</Text>
          </View>
          <TouchableOpacity style={styles.viewBrandButton}>
            <Text style={styles.viewBrandText}>View Products</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderOffers = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {offers.map((offer) => (
        <TouchableOpacity key={offer.id} style={styles.offerCard}>
          <View style={styles.offerImage}>
            <Text style={styles.offerEmoji}>{offer.image}</Text>
          </View>
          <View style={styles.offerContent}>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.offerDiscount}>{offer.discount}</Text>
            <Text style={styles.offerDescription}>{offer.description}</Text>
            <Text style={styles.offerValid}>Valid until {offer.validUntil}</Text>
          </View>
          <TouchableOpacity style={styles.shopNowButton}>
            <Text style={styles.shopNowText}>Shop Now</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderNewArrivals = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {newArrivals.map((product) => (
        <TouchableOpacity key={product.id} style={styles.productCard}>
          <View style={styles.productImage}>
            <Text style={styles.productEmoji}>{product.image}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount}</Text>
            </View>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productBrand}>{product.brand}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {product.rating}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>{product.price}</Text>
              <Text style={styles.originalPrice}>{product.originalPrice}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addToCartButton}>
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'Categories': return renderCategories();
      case 'Brands': return renderBrands();
      case 'Offers': return renderOffers();
      case 'New Arrivals': return renderNewArrivals();
      default: return renderCategories();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agri Store</Text>
        <Text style={styles.headerSubtitle}>Everything for your farm</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, brands..."
            placeholderTextColor="#999999"
          />
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterIcon}>🔧</Text>
          </TouchableOpacity>
        </View>
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

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: 16 + (insets?.bottom || 0) }]}>
        <TouchableOpacity style={styles.cartButton}>
          <Text style={styles.cartIcon}>🛒</Text>
          <Text style={styles.cartText}>Cart (3)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkoutButton}>
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: '#666666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  filterButton: {
    padding: 4,
  },
  filterIcon: {
    fontSize: 20,
    color: '#666666',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  brandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brandLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  brandEmoji: {
    fontSize: 24,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  brandDescription: {
    fontSize: 14,
    color: '#666666',
  },
  viewBrandButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewBrandText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  offerEmoji: {
    fontSize: 32,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  offerDiscount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  offerValid: {
    fontSize: 12,
    color: '#999999',
  },
  shopNowButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shopNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    height: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  productEmoji: {
    fontSize: 48,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  productInfo: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  cartIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
