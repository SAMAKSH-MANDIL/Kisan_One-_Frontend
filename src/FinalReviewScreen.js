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
import RazorpayCheckout from 'react-native-razorpay';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

import { useCart } from './CartContext';
import { getProductImageSource } from './utils/products';

/* ---------------- AXIOS (INLINE) ---------------- */

const api = axios.create({
  baseURL: 'https://YOUR_BACKEND_URL/api/v1', // 👈 CHANGE THIS
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ------------------------------------------------ */

export default function FinalReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const {
    items = [],
    total = 0,
    address = null,
  } = route.params || {};

  const handlePlaceOrder = async () => {
    if (!address) {
      Alert.alert('Error', 'Address is required');
      return;
    }

    setLoading(true);

    try {
      /* 1️⃣ CREATE ORDER (Backend already handles Razorpay order) */
      const res = await api.post('/orders/create', {
        items: items.map(item => ({
          product_id: item.id,      // backend UUID
          quantity: item.quantity,
        })),
      });

      const {
        order_id,
        razorpay_order_id,
        amount,
        razorpay_key,
      } = res.data;

      /* 2️⃣ OPEN RAZORPAY CHECKOUT */
      await RazorpayCheckout.open({
        key: razorpay_key,
        amount: amount * 100,       // paise
        currency: 'INR',
        name: 'KisanOne',
        description: 'Order Payment',
        order_id: razorpay_order_id,
        prefill: {
          contact: address.mobileNumber || address.mobile,
        },
        theme: { color: '#0e7c36' },
      });

      /* 3️⃣ SUCCESS UI ONLY (Webhook will update DB) */
      clearCart();

      navigation.replace('PaymentSuccess', {
        orderId: order_id,
      });

    } catch (err) {
      console.error('Payment error:', err);
      navigation.replace('PaymentFailed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top || 0, 12) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          {items.map(item => (
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
                <Text style={styles.productPrice}>
                  ₹{item.priceValue.toFixed(2)} × {item.quantity}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Address */}
        {address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{address.fullName || address.name}</Text>
              <Text style={styles.addressMobile}>
                {address.mobileNumber || address.mobile}
              </Text>
              <Text style={styles.addressText}>
                {[
                  address.flatHouseNo,
                  address.streetArea || address.address,
                  address.city,
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

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: 12 + (insets.bottom || 0) }]}>
        <View style={styles.footerLeft}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.placeOrderButtonText}>
            {loading ? 'Processing...' : 'Pay Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- STYLES (UNCHANGED) ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
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
  },
  productImage: { width: '100%', height: '100%' },
  productEmoji: { fontSize: 40 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#0e7c36' },
  addressCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  addressMobile: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  addressText: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerLeft: { flex: 1 },
  totalLabel: { fontSize: 12, color: '#6B7280' },
  totalValue: { fontSize: 20, fontWeight: '700' },
  placeOrderButton: {
    backgroundColor: '#0e7c36',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginLeft: 16,
  },
  placeOrderButtonDisabled: { backgroundColor: '#9CA3AF' },
  placeOrderButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});