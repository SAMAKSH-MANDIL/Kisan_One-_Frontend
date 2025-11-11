import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from './CartContext';

const prepareProducts = (section, baseProducts) => {
  // Return only the actual products from the home page section
  // Prefix IDs with section name to avoid conflicts
  return baseProducts.map((product, index) => ({
    ...product,
    id: `${section}-${product.id || index}`,
  }));
};

const sectionTitles = {
  recommended: 'Recommended Products',
  offers: "Today's Offer",
  best: 'Best Selling Products',
};

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

export default function ProductsViewAllScreen({ route, navigation }) {
  const { section = 'recommended', baseProducts = [] } = route.params || {};
  const { addToCart, increment, decrement, items: cartItems } = useCart();
  const products = prepareProducts(section, baseProducts);
  const title = sectionTitles[section] || 'Products';

  const renderProduct = ({ item }) => {
    const isInCart = cartItems.find((it) => it.id === item.id);
    const priceValue = Number(String(item.price).replace(/[^0-9.]/g, '')) || 0;

    return (
      <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>
        )}
        <View style={styles.productImage}>
          {getProductImageSource(item) ? (
            <Image source={getProductImageSource(item)} style={styles.productImageTag} resizeMode="contain" />
          ) : (
            <Text style={styles.productEmoji}>{item.image || '📦'}</Text>
          )}
        </View>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>{item.price}</Text>
          <Text style={styles.originalPrice}>{item.originalPrice}</Text>
        </View>
        <View style={styles.savedContainer}>
          <Text style={styles.savedIcon}>💚</Text>
          <Text style={styles.savedText}>Saved {item.saved}</Text>
        </View>
        <Text style={styles.productSize}>Size: {item.size}</Text>
        {isInCart ? (
          <View style={styles.qtyControls}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(item.id)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{isInCart.quantity || 0}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(item.id)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e?.stopPropagation?.();
              addToCart({ id: item.id, name: item.name, brand: item.brand, priceValue, image: item.image });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
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
  listContent: {
    padding: 16,
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
    height: 120,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  productImageTag: {
    width: '100%',
    height: '100%',
  },
  productEmoji: {
    fontSize: 40,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    lineHeight: 16,
    minHeight: 32,
  },
  productBrand: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 6,
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
  savedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  savedIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  savedText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
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
});

