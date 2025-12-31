import React, { useState } from 'react';
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
import { useOrders } from './OrdersContext';
import { useCart } from './CartContext';
import { getProductImageSource } from './utils/products';

export default function FinalReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { addOrder } = useOrders();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const {
    items = [],
    subtotal = 0,
    shoppingCharges = 0,
    total = 0,
    address = null,
    buyNowProduct = null,
    reorderItems = null,
  } = route.params || {};

  const handlePlaceOrder = async () => {
    if (!address) {
      Alert.alert('Error', 'Address is required');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const orderNumber = `ORD-${now.getTime()}`;
      const formattedDate = now.toISOString().split('T')[0];

      const order = {
        id: orderNumber,
        orderNumber,
        date: formattedDate,
        status: 'Pending',
        total: `₹${total.toFixed(2)}`,
        items: items.reduce((sum, item) => sum + item.quantity, 0),
        products: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: `₹${((item.priceValue || 0) * item.quantity).toFixed(2)}`,
          pack: item.pack || null,
        })),
        address: address,
      };

      addOrder(order);

      // Clear cart if not Buy Now or Reorder (these items aren't in cart)
      if (!buyNowProduct && !reorderItems) {
        clearCart();
      }

      Alert.alert('Order Placed', 'Thank you! Your order has been placed successfully.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [
                { name: 'Dashboard', params: { screen: 'My Orders' } },
              ],
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.headerTitle}>Review Order</Text>
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
          {items.map((item) => (
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
                  ₹{(item.priceValue || 0).toFixed(2)} × {item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Address Section */}
        {address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{address.fullName || address.name}</Text>
              <Text style={styles.addressMobile}>{address.mobileNumber || address.mobile}</Text>
              <Text style={styles.addressText}>
                {[
                  address.flatHouseNo,
                  address.streetArea || address.address,
                  address.city,
                  address.district,
                  address.state,
                  address.pinCode || address.pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Place Order Button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: 12 + (insets.bottom || 0) },
        ]}
      >
        <View style={styles.footerLeft}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.placeOrderButtonText}>
            {loading ? 'Placing...' : 'Place Order'}
          </Text>
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
    color: '#0e7c36',
  },
  addressCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  addressMobile: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
  placeOrderButton: {
    backgroundColor: '#0e7c36',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 16,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

