import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const brandDescriptions = {
  'Bayer': 'Leading agricultural solutions provider committed to sustainable farming practices and innovative crop protection technologies.',
  'Syngenta': 'Global agricultural company focused on innovative seed and crop protection solutions for sustainable agriculture.',
  'UPL': 'Premier provider of sustainable agricultural solutions, focusing on post-patent agricultural solutions worldwide.',
  'Coromandel': 'Leading manufacturer of fertilizers and agri-inputs, committed to enhancing agricultural productivity.',
  'Mahindra': 'Comprehensive agricultural solutions including farm equipment, seeds, and agri-services.',
  'John Deere': 'World-renowned manufacturer of agricultural machinery and equipment for modern farming.',
  'Rallis': 'Trusted name in crop protection, seeds, and plant nutrition solutions for Indian farmers.',
  'Dhanuka': 'Leading crop protection company providing innovative solutions for better crop yields.',
  'Adama': 'Global agricultural solutions company delivering innovative crop protection products to farmers.',
  default: 'Trusted brand delivering quality agricultural products to farmers worldwide.',
};

const getBrandProducts = (brandName) => {
  return Array.from({ length: 15 }).map((_, i) => ({
    id: `${brandName.toLowerCase().replace(' ', '-')}-product-${i + 1}`,
    name: `${brandName} Product ${i + 1}`,
    price: (199 + i * 50).toFixed(0),
    originalPrice: (299 + i * 50).toFixed(0),
    discount: `${10 + (i % 3) * 5}% OFF`,
    image: i % 3 === 0 ? '🧪' : i % 3 === 1 ? '🌿' : '💧',
    size: ['250 ml', '500 ml', '1 liter', '250 gms', '500 gms'][i % 5],
  }));
};

export default function BrandDetailScreen({ route, navigation }) {
  const { brand } = route.params || { brand: { name: 'Brand 1', logo: '🔬' } };
  const description = brandDescriptions[brand.name] || brandDescriptions.default;
  const products = getBrandProducts(brand.name);

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={styles.productCard}>
      <View style={styles.discountBadge}>
        <Text style={styles.discountText}>{item.discount}</Text>
      </View>
      <View style={styles.productImage}>
        <Text style={styles.productEmoji}>{item.image}</Text>
      </View>
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={styles.priceContainer}>
        <Text style={styles.currentPrice}>₹{item.price}</Text>
        <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
      </View>
      <Text style={styles.productSize}>Size: {item.size}</Text>
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{brand.name}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Brand Logo - Centered */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>{brand.logo}</Text>
          </View>
        </View>

        {/* Company Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={styles.productsTitle}>Products</Text>
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            numColumns={2}
            columnWrapperStyle={styles.productRow}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  logoEmoji: {
    fontSize: 60,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    textAlign: 'center',
  },
  productsSection: {
    paddingHorizontal: 16,
  },
  productsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 10,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
    lineHeight: 16,
    minHeight: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  productSize: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

