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

export default function GrowBioScreen() {
  const [activeTab, setActiveTab] = useState('Bio Products');

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

  const renderProducts = (products) => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {products.map((product) => (
        <TouchableOpacity key={product.id} style={styles.productCard}>
          <View style={styles.productImage}>
            <Text style={styles.productEmoji}>{product.image}</Text>
            {product.discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productBrand}>{product.brand}</Text>
            
            {product.description && (
              <Text style={styles.productDescription}>{product.description}</Text>
            )}
            
            {product.variety && (
              <Text style={styles.productVariety}>Variety: {product.variety}</Text>
            )}
            
            {product.rating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingText}>⭐ {product.rating}</Text>
              </View>
            )}
            
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>{product.price}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>{product.originalPrice}</Text>
              )}
            </View>
            
            <Text style={styles.productQuantity}>{product.quantity}</Text>
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

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.cartButton}>
          <Text style={styles.cartIcon}>🛒</Text>
          <Text style={styles.cartText}>Cart (2)</Text>
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
    paddingTop: 40,
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
  productCard: {
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
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  productEmoji: {
    fontSize: 32,
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
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
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
    lineHeight: 16,
  },
  productVariety: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 4,
  },
  ratingContainer: {
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  productQuantity: {
    fontSize: 12,
    color: '#666666',
  },
  addToCartButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addToCartText: {
    fontSize: 12,
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
