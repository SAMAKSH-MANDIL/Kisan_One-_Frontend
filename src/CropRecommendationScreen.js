import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from './LanguageContext';
import * as Location from 'expo-location';
import axios from 'axios';

export default function CropRecommendationScreen({ navigation }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Fetching location...');
  const [topCrops, setTopCrops] = useState([]);
  const [fieldInfo, setFieldInfo] = useState({
    nitrogen: 0,
    phosphorous: 0,
    potassium: 0,
    temperature: 0,
    humidity: 0,
    ph: 0,
    rain: 0,
  });
  const [error, setError] = useState(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRecommendations();
  }, []);

  // Loading animation
  useEffect(() => {
    if (loading) {
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      // Fade animation for text
      const fade = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Rotate animation
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      pulse.start();
      fade.start();
      rotate.start();

      return () => {
        pulse.stop();
        fade.stop();
        rotate.stop();
      };
    }
  }, [loading]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Get location
      setLoadingMessage('Fetching location...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to get crop recommendations');
        setLoading(false);
        return;
      }

      setLoadingMessage('Getting your location...');
      let position;
      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000,
        });
      } catch (locationError) {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 15000,
        });
      }

      const { latitude, longitude } = position.coords;
      
      if (!latitude || !longitude) {
        setError('Unable to get your location. Please try again.');
        setLoading(false);
        return;
      }

      // Step 2: Fetching data
      setLoadingMessage('Fetching data...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Analysing
      setLoadingMessage('Analysing soil conditions...');
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 4: Inferencing model
      setLoadingMessage('Inferencing model...');
      
      // Make API call
      const apiUrl = `https://kisanone-backend-render-deployment.onrender.com/api/v1/crop-recommendations/recommend?lat=${latitude}&lon=${longitude}`;
      
      const response = await axios.post(apiUrl, {}, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      // Step 5: Processing results
      setLoadingMessage('Processing results...');
      await new Promise(resolve => setTimeout(resolve, 400));

      const data = response.data;

      // Map API response to our format
      if (data.imputed_values) {
        setFieldInfo({
          nitrogen: data.imputed_values.N || 0,
          phosphorous: data.imputed_values.P || 0,
          potassium: data.imputed_values.K || 0,
          temperature: data.imputed_values.temperature || 0,
          humidity: data.imputed_values.humidity || 0,
          ph: data.imputed_values.ph || 0,
          rain: data.imputed_values.rainfall || 0,
        });
      }

      // Map recommendations
      if (data.recommendations && Array.isArray(data.recommendations)) {
        const crops = data.recommendations.map((rec, index) => {
          const [name, probability, reason] = rec;
          return {
            id: index + 1,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            icon: '🌾',
            reasons: reason ? [reason] : [],
            suitability: Math.round(probability * 100),
          };
        });
        setTopCrops(crops);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load crop recommendations. Please try again.');
      setLoading(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getQualityColor = (value, type) => {
    if (type === 'ph') {
      if (value >= 6.0 && value <= 7.5) return '#22A06B';
      if (value >= 5.5 && value < 6.0) return '#F5A623';
      return '#EF4444';
    }
    if (value >= 70) return '#22A06B';
    if (value >= 50) return '#F5A623';
    return '#EF4444';
  };

  const getQualityBgColor = (value, type) => {
    const color = getQualityColor(value, type);
    // Convert hex to rgba with 20% opacity
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  };

  const getQualityLabel = (value, type) => {
    if (type === 'ph') {
      if (value >= 6.0 && value <= 7.5) return 'Optimal';
      if (value >= 5.5 && value < 6.0) return 'Good';
      return 'Needs Attention';
    }
    if (value >= 70) return 'Excellent';
    if (value >= 50) return 'Good';
    return 'Low';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop Recommendation</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingIconContainer,
              {
                transform: [
                  { scale: pulseAnim },
                  { rotate: spin },
                ],
              },
            ]}
          >
            <Ionicons name="leaf" size={64} color="#22A06B" />
          </Animated.View>
          <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </Animated.View>
          <View style={styles.loadingDots}>
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
            <Animated.View style={[styles.dot, { opacity: fadeAnim }]} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crop Recommendation</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRecommendations}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Recommendation</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Top 3 Crops for Your Field</Text>
        <Text style={styles.subtitle}>Based on your location and field conditions</Text>

        {/* Top 3 Crops */}
        {topCrops.map((crop, index) => (
          <View key={crop.id} style={styles.cropCard}>
            <View style={styles.cropHeader}>
              <View style={styles.cropIconContainer}>
                <Text style={styles.cropIcon}>{crop.icon}</Text>
                <View style={[styles.rankBadge, index === 0 && styles.rankBadgeGold]}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
              </View>
              <View style={styles.cropInfo}>
                <Text style={styles.cropName}>{crop.name}</Text>
                <View style={styles.suitabilityContainer}>
                  <Text style={styles.suitabilityLabel}>Suitability:</Text>
                  <View style={styles.suitabilityBar}>
                    <View 
                      style={[
                        styles.suitabilityFill, 
                        { width: `${crop.suitability}%`, backgroundColor: '#22A06B' }
                      ]} 
                    />
                  </View>
                  <Text style={styles.suitabilityPercent}>{crop.suitability}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.reasonsSection}>
              <Text style={styles.reasonsTitle}>Why this crop?</Text>
              {crop.reasons.map((reason, idx) => (
                <View key={idx} style={styles.reasonItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#22A06B" />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Field Info Section */}
        <Text style={styles.sectionTitle}>Field Information</Text>
        <View style={styles.fieldInfoCard}>
          <View style={styles.fieldInfoRow}>
            <View style={styles.fieldInfoItem}>
              <Ionicons name="leaf-outline" size={24} color="#22A06B" />
              <Text style={styles.fieldInfoLabel}>Nitrogen</Text>
              <Text style={styles.fieldInfoValue}>{fieldInfo.nitrogen} ppm</Text>
              <View style={[styles.qualityBadge, { backgroundColor: getQualityBgColor(fieldInfo.nitrogen) }]}>
                <Text style={[styles.qualityText, { color: getQualityColor(fieldInfo.nitrogen) }]}>
                  {getQualityLabel(fieldInfo.nitrogen)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldInfoItem}>
              <Ionicons name="nuclear-outline" size={24} color="#3B82F6" />
              <Text style={styles.fieldInfoLabel}>Phosphorous</Text>
              <Text style={styles.fieldInfoValue}>{fieldInfo.phosphorous} ppm</Text>
              <View style={[styles.qualityBadge, { backgroundColor: getQualityBgColor(fieldInfo.phosphorous) }]}>
                <Text style={[styles.qualityText, { color: getQualityColor(fieldInfo.phosphorous) }]}>
                  {getQualityLabel(fieldInfo.phosphorous)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.fieldInfoRow}>
            <View style={styles.fieldInfoItem}>
              <Ionicons name="flask-outline" size={24} color="#F59E0B" />
              <Text style={styles.fieldInfoLabel}>Potassium</Text>
              <Text style={styles.fieldInfoValue}>{fieldInfo.potassium} ppm</Text>
              <View style={[styles.qualityBadge, { backgroundColor: getQualityBgColor(fieldInfo.potassium) }]}>
                <Text style={[styles.qualityText, { color: getQualityColor(fieldInfo.potassium) }]}>
                  {getQualityLabel(fieldInfo.potassium)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldInfoItem}>
              <Ionicons name="thermometer-outline" size={24} color="#EF4444" />
              <Text style={styles.fieldInfoLabel}>Temperature</Text>
              <Text style={styles.fieldInfoValue}>{fieldInfo.temperature}°C</Text>
              <View style={[styles.qualityBadge, { backgroundColor: getQualityBgColor(fieldInfo.temperature) }]}>
                <Text style={[styles.qualityText, { color: getQualityColor(fieldInfo.temperature) }]}>
                  {getQualityLabel(fieldInfo.temperature)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.fieldInfoRow}>
            <View style={styles.fieldInfoItem}>
              <Ionicons name="water-outline" size={24} color="#3B82F6" />
              <Text style={styles.fieldInfoLabel}>Humidity</Text>
              <Text style={styles.fieldInfoValue}>{fieldInfo.humidity}%</Text>
              <View style={[styles.qualityBadge, { backgroundColor: getQualityBgColor(fieldInfo.humidity) }]}>
                <Text style={[styles.qualityText, { color: getQualityColor(fieldInfo.humidity) }]}>
                  {getQualityLabel(fieldInfo.humidity)}
                </Text>
              </View>
            </View>

            <View style={styles.fieldInfoItem}>
              <Ionicons name="pulse-outline" size={24} color="#8B5CF6" />
              <Text style={styles.fieldInfoLabel}>pH</Text>
              <Text style={styles.fieldInfoValue}>{fieldInfo.ph}</Text>
              <View style={[styles.qualityBadge, { backgroundColor: getQualityBgColor(fieldInfo.ph, 'ph') }]}>
                <Text style={[styles.qualityText, { color: getQualityColor(fieldInfo.ph, 'ph') }]}>
                  {getQualityLabel(fieldInfo.ph, 'ph')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.fieldInfoRow}>
            <View style={[styles.fieldInfoItem, styles.fieldInfoItemFull]}>
              <Ionicons name="rainy-outline" size={24} color="#0EA5E9" />
              <Text style={styles.fieldInfoLabel}>Rainfall</Text>
              <Text style={styles.fieldInfoValue}>{fieldInfo.rain} mm</Text>
              <View style={[styles.qualityBadge, { backgroundColor: getQualityBgColor(fieldInfo.rain) }]}>
                <Text style={[styles.qualityText, { color: getQualityColor(fieldInfo.rain) }]}>
                  {getQualityLabel(fieldInfo.rain)}
                </Text>
              </View>
            </View>
          </View>
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
    marginTop: 30,
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
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22A06B',
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22A06B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#22A06B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  cropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cropHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  cropIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  cropIcon: {
    fontSize: 48,
  },
  rankBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#22A06B',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  rankBadgeGold: {
    backgroundColor: '#F59E0B',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  suitabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suitabilityLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  suitabilityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  suitabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  suitabilityPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22A06B',
    minWidth: 40,
  },
  reasonsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 16,
  },
  fieldInfoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  fieldInfoItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fieldInfoItemFull: {
    flex: 0,
    width: '100%',
  },
  fieldInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  fieldInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

