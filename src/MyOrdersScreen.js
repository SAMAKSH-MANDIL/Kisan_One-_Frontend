import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

import { useOrders } from './OrdersContext';

export default function MyOrdersScreen() {
  const [activeTab, setActiveTab] = useState('All');
  const { orders: placedOrders, addOrder } = useOrders();

  const tabs = ['All', 'Pending', 'Delivered', 'Cancelled'];

  const sampleOrders = [
    {
      id: 1,
      orderNumber: 'ORD-001',
      date: '2024-01-15',
      status: 'Delivered',
      total: '₹1,250',
      items: 3,
      products: [
        { name: 'Geolife No Virus Bio Viricide', quantity: 1, price: '₹285' },
        { name: 'Antracol Fungicide', quantity: 2, price: '₹554' },
      ],
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      date: '2024-01-14',
      status: 'Pending',
      total: '₹890',
      items: 2,
      products: [
        { name: 'Fantac Plus Growth Promoter', quantity: 1, price: '₹289' },
        { name: 'Falcon Growth Promoter', quantity: 1, price: '₹163' },
      ],
    },
    {
      id: 3,
      orderNumber: 'ORD-003',
      date: '2024-01-13',
      status: 'Delivered',
      total: '₹2,100',
      items: 4,
      products: [
        { name: 'Sunflower Seeds', quantity: 2, price: '₹800' },
        { name: 'Tomato Seeds', quantity: 2, price: '₹600' },
      ],
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return '#4CAF50';
      case 'Pending': return '#FF9800';
      case 'Cancelled': return '#F44336';
      default: return '#666666';
    }
  };

  const mergedOrders = useMemo(() => {
    // Ensure placedOrders is an array
    const orders = Array.isArray(placedOrders) ? placedOrders : [];
    return [...orders, ...sampleOrders];
  }, [placedOrders]);

  const filteredOrders = activeTab === 'All' 
    ? mergedOrders 
    : mergedOrders.filter(order => order.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Track your agricultural purchases</Text>
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

      {/* Orders List */}
      <ScrollView style={styles.ordersContainer} showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'All' 
                ? "You haven't placed any orders yet"
                : `No ${activeTab.toLowerCase()} orders`
              }
            </Text>
            <TouchableOpacity style={styles.shopButton}>
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <Text style={styles.itemsCount}>{order.items} items</Text>
                <Text style={styles.orderTotal}>{order.total}</Text>
              </View>

              <View style={styles.productsContainer}>
                {order.products && Array.isArray(order.products) ? order.products.map((product, index) => (
                  <View key={index} style={styles.productItem}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDetails}>
                      Qty: {product.quantity} • {product.price}
                    </Text>
                  </View>
                )) : null}
              </View>

              <View style={styles.orderActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Track Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => {
                    const today = new Date();
                    const formattedDate = today.toISOString().split('T')[0];
                    const newOrder = {
                      id: Date.now().toString(),
                      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
                      date: formattedDate,
                      status: 'Pending',
                      total: order.total,
                      items: order.items,
                      products: order.products,
                    };
                    addOrder(newOrder);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Reorder</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    paddingBottom: 30,
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
  ordersContainer: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsCount: {
    fontSize: 14,
    color: '#666666',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  productsContainer: {
    marginBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  productName: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  productDetails: {
    fontSize: 12,
    color: '#666666',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
