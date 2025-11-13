import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from './CartContext';
import { getProductImageSource } from './utils/products';

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { items: cartItems, increment, decrement, totalAmount } = useCart();
  
  // Get items from route params (for Buy Now, Reorder) or from cart
  const { buyNowProduct, reorderItems: reorderItemsParam } = route.params || {};
  const [buyNowQuantity, setBuyNowQuantity] = useState(1);
  const [reorderQuantities, setReorderQuantities] = useState({});
  
  // Initialize reorder quantities on mount
  useEffect(() => {
    if (reorderItemsParam && Array.isArray(reorderItemsParam)) {
      const initialQuantities = {};
      reorderItemsParam.forEach((item) => {
        if (item.id) {
          initialQuantities[item.id] = item.quantity || 1;
        }
      });
      setReorderQuantities(initialQuantities);
    }
  }, [reorderItemsParam]);
  
  // Get display items based on source
  const displayItems = useMemo(() => {
    if (reorderItemsParam && Array.isArray(reorderItemsParam) && reorderItemsParam.length > 0) {
      // For reorder, use quantities from state
      return reorderItemsParam.map((item) => ({
        ...item,
        quantity: reorderQuantities[item.id] || item.quantity || 1,
      }));
    } else if (buyNowProduct) {
      // For buy now, use buyNowQuantity
      return [{ ...buyNowProduct, quantity: buyNowQuantity }];
    } else {
      // For cart, use cart items
      return cartItems;
    }
  }, [reorderItemsParam, reorderQuantities, buyNowProduct, buyNowQuantity, cartItems]);

  // Calculate bill details
  const subtotal = useMemo(() => {
    return displayItems.reduce((sum, item) => {
      const price = item.priceValue || 0;
      return sum + (price * item.quantity);
    }, 0);
  }, [displayItems]);

  const deliveryCharges = 50; // Fixed delivery charge
  const taxCharges = subtotal * 0.05; // 5% tax
  const total = subtotal + deliveryCharges + taxCharges;

  const handleProceed = () => {
    if (displayItems.length === 0) {
      Alert.alert('Error', 'No items to checkout.');
      return;
    }
    
    // Use displayItems which already has correct quantities
    navigation.navigate('AddAddress', {
      items: displayItems,
      subtotal,
      deliveryCharges,
      taxCharges,
      total,
      buyNowProduct: buyNowProduct || null,
      reorderItems: reorderItemsParam || null,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top || 0, 12) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 120 + (insets.bottom || 0) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          {displayItems.map((item) => (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                {getProductImageSource(item) ? (
                  <Image
                    source={getProductImageSource(item)}
                    style={styles.productImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.productEmoji}>📦</Text>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.brand && (
                  <Text style={styles.productBrand}>{item.brand}</Text>
                )}
                {item.pack && (
                  <Text style={styles.productPack}>Pack: {item.pack}</Text>
                )}
                <Text style={styles.productPrice}>
                  ₹{(item.priceValue || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (reorderItemsParam && Array.isArray(reorderItemsParam) && reorderItemsParam.length > 0) {
                      // Handle reorder quantity decrease
                      const currentQty = reorderQuantities[item.id] || item.quantity || 1;
                      if (currentQty > 1) {
                        setReorderQuantities((prev) => ({
                          ...prev,
                          [item.id]: currentQty - 1,
                        }));
                      }
                    } else if (buyNowProduct) {
                      if (buyNowQuantity > 1) {
                        setBuyNowQuantity(buyNowQuantity - 1);
                      }
                    } else {
                      decrement(item.id);
                    }
                  }}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => {
                    if (reorderItemsParam && Array.isArray(reorderItemsParam) && reorderItemsParam.length > 0) {
                      // Handle reorder quantity increase
                      const currentQty = reorderQuantities[item.id] || item.quantity || 1;
                      setReorderQuantities((prev) => ({
                        ...prev,
                        [item.id]: currentQty + 1,
                      }));
                    } else if (buyNowProduct) {
                      setBuyNowQuantity(buyNowQuantity + 1);
                    } else {
                      increment(item.id);
                    }
                  }}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Bill Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Charges</Text>
            <Text style={styles.billValue}>₹{deliveryCharges.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax (5%)</Text>
            <Text style={styles.billValue}>₹{taxCharges.toFixed(2)}</Text>
          </View>
          <View style={[styles.billRow, styles.billRowTotal]}>
            <Text style={styles.billLabelTotal}>Total</Text>
            <Text style={styles.billValueTotal}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Proceed Button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: 12 + (insets.bottom || 0) },
        ]}
      >
        <View style={styles.footerLeft}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceed}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productEmoji: {
    fontSize: 40,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  productPack: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  qtyText: {
    width: 40,
    textAlign: 'center',
    marginHorizontal: 8,
    fontWeight: '700',
    color: '#111827',
    fontSize: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 0,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  billLabelTotal: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
  },
  billValueTotal: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  footerLeft: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  proceedButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 16,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

