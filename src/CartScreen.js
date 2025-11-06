import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from './CartContext';
import { useOrders } from './OrdersContext';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function CartScreen() {
  const navigation = useNavigation();
  const { items, increment, decrement, totalAmount, clearCart } = useCart();
  const { addOrder } = useOrders();
  const insets = useSafeAreaInsets();

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

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Cart empty', 'Add some products first.');
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

    const now = new Date();
    const orderNumber = `ORD-${now.getTime()}`;
    const total = totalAmount.toFixed(2);
    const order = {
      id: orderNumber,
      orderNumber,
      date: now.toISOString().slice(0,10),
      status: 'Pending',
      total: `₹${total}`,
      items: items.reduce((s,i)=>s+i.quantity,0),
      products: items.map((i)=>({ name: i.name, quantity: i.quantity, price: `₹${(i.priceValue*i.quantity).toFixed(2)}` })),
    };
    addOrder(order);
    Alert.alert('Order placed', 'Thank you! Your order has been placed.', [
      { text: 'OK', onPress: () => { clearCart(); navigation.navigate('Dashboard', { screen: 'MyOrders' }); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <TouchableOpacity onPress={clearCart} style={styles.headerRightBtn}>
          <Text style={styles.headerRightText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 + (insets?.bottom || 0) }]}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        ) : (
          items.map((it) => (
            <View key={it.id} style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <View style={styles.itemThumb}><Text style={{ fontSize: 18 }}>{it.image || '🛒'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                  <Text style={styles.itemBrand}>{it.brand}</Text>
                  <Text style={styles.itemPrice}>₹{it.priceValue?.toFixed(2) || it.price?.replace('₹','') || '0'}</Text>
                </View>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(it.id)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{it.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(it.id)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 8 + (insets?.bottom || 0) }] }>
        <View style={{ flex: 1 }}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.checkoutText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerRightBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
  headerRightText: { color: '#EF4444', fontWeight: '700' },
  content: { padding: 16 },
  emptyText: { textAlign: 'center', color: '#6B7280', paddingTop: 40 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  itemThumb: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  itemBrand: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemPrice: { fontSize: 14, color: '#2E7D32', fontWeight: '700', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  qtyText: { width: 28, textAlign: 'center', marginHorizontal: 6, fontWeight: '700', color: '#111827' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 6,
  },
  totalLabel: { color: '#6B7280', fontSize: 12 },
  totalValue: { color: '#111827', fontWeight: '800', fontSize: 18 },
  checkoutBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  checkoutText: { color: '#FFFFFF', fontWeight: '700' },
});
