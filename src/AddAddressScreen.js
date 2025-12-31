import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useOrders } from './OrdersContext';
import { useCart } from './CartContext';

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { addOrder } = useOrders();
  const { clearCart } = useCart();
  
  const {
    items = [],
    subtotal = 0,
    shoppingCharges = 0,
    total = 0,
    buyNowProduct = null,
    reorderItems = null,
  } = route.params || {};

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [flatHouseNo, setFlatHouseNo] = useState('');
  const [streetArea, setStreetArea] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [landmark, setLandmark] = useState('');
  const [country] = useState('India');
  const [loading, setLoading] = useState(false);

  // Load saved address on mount
  useEffect(() => {
    const loadAddress = async () => {
      try {
        const user = auth().currentUser;
        if (!user) return;

        const doc = await firestore().collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data() || {};
          setFullName(data.fullName || data.name || '');
          setMobileNumber(data.mobileNumber || data.mobile || '');
          setFlatHouseNo(data.flatHouseNo || '');
          setStreetArea(data.streetArea || data.address || '');
          setPinCode(data.pinCode || data.pincode || '');
          setCity(data.city || '');
          setDistrict(data.district || '');
          setState(data.state || '');
          setLandmark(data.landmark || '');
        }
      } catch (error) {
        console.error('Error loading address:', error);
      }
    };
    loadAddress();
  }, []);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please fill the correct details');
      return false;
    }
    if (!mobileNumber.trim() || mobileNumber.length < 10) {
      Alert.alert('Validation Error', 'Please fill the correct details');
      return false;
    }
    if (!streetArea.trim()) {
      Alert.alert('Validation Error', 'Please fill the correct details');
      return false;
    }
    if (!pinCode.trim() || pinCode.length < 6) {
      Alert.alert('Validation Error', 'Please fill the correct details');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Validation Error', 'Please fill the correct details');
      return false;
    }
    if (!district.trim()) {
      Alert.alert('Validation Error', 'Please fill the correct details');
      return false;
    }
    if (!state.trim()) {
      Alert.alert('Validation Error', 'Please fill the correct details');
      return false;
    }
    return true;
  };

  const handleProceedToCheckout = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        navigation.goBack();
        return;
      }

      // Save address to Firestore
      const addressData = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        flatHouseNo: flatHouseNo.trim(),
        streetArea: streetArea.trim(),
        pinCode: pinCode.trim(),
        city: city.trim(),
        district: district.trim(),
        state: state.trim(),
        landmark: landmark.trim(),
        country: 'India',
        // Keep backward compatibility
        name: fullName.trim(),
        mobile: mobileNumber.trim(),
        address: streetArea.trim(),
        pincode: pinCode.trim(),
      };

      await firestore()
        .collection('users')
        .doc(user.uid)
        .set(addressData, { merge: true });

      // Navigate to Final Review screen
      navigation.navigate('FinalReview', {
        items,
        subtotal,
        shoppingCharges,
        total,
        address: addressData,
        buyNowProduct: buyNowProduct || null,
        reorderItems: reorderItems || null,
      });
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top || 0, 12) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Address</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 100 + (insets.bottom || 0) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter Name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Mobile Number <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.mobileInputContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={[styles.input, styles.mobileInput]}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="Enter Mobile Number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Flat / House no */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Flat / House No (If Any)
            </Text>
            <TextInput
              style={styles.input}
              value={flatHouseNo}
              onChangeText={setFlatHouseNo}
              placeholder="Enter Flat / House No"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Street / Area / Colony / Village / Mandal / Taluk */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Street / Area / Colony / Village / Mandal / Taluk{' '}
              <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={streetArea}
              onChangeText={setStreetArea}
              placeholder="Enter Street / Area / Colony / Village / Mandal / Taluk"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Pin Code and City Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Pincode <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="Enter Pincode"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                City <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Enter City"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* District and State Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                District <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={district}
                onChangeText={setDistrict}
                placeholder="Enter District"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                State <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="Please Select"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Landmark */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Enter Landmark (Optional)"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Country */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Country <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.input, styles.disabledInput]}>
              <Text style={styles.disabledText}>India</Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Proceed to Checkout Button */}
        <View
          style={[
            styles.footer,
            { paddingBottom: 12 + (insets.bottom || 0) },
          ]}
        >
          <TouchableOpacity
            style={[styles.proceedButton, loading && styles.proceedButtonDisabled]}
            onPress={handleProceedToCheckout}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.proceedButtonText}>
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
    marginBottom: 0,
  },
  mobileInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 0,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  mobileInput: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  disabledText: {
    color: '#6B7280',
    fontSize: 16,
  },
  footer: {
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
  proceedButton: {
    backgroundColor: '#0e7c36',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

