import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
export default function PaymentFailedScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '700' }}>
        Payment Failed ❌
      </Text>

      <TouchableOpacity
        style={{ marginTop: 20 }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: 'red' }}>
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
}