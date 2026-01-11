import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function PaymentSuccessScreen({ navigation, route }) {
  const { orderId } = route.params;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>
        Payment Successful 🎉
      </Text>

      <Text style={{ marginTop: 8 }}>
        Order ID: {orderId}
      </Text>

      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => navigation.navigate('MyOrders')}
      >
        <Text style={{ color: '#0e7c36', fontWeight: '600' }}>
          Go to My Orders
        </Text>
      </TouchableOpacity>
    </View>
  );
}