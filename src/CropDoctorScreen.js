import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CropDoctorScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const openCamera = async () => {
    try {
      // Dynamic import to avoid loading native module at startup
      const ImagePicker = await import('expo-image-picker');
      
      if (!ImagePicker || !ImagePicker.requestCameraPermissionsAsync) {
        throw new Error('ImagePicker native module not available');
      }
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed.');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setShowReport(false);
        setReportData(null);
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert(
        'Native Module Error', 
        'expo-image-picker native module is not available.\n\n' +
        'Please ensure:\n' +
        '1. You are NOT using Expo Go\n' +
        '2. The app has been rebuilt with: npx expo run:android\n' +
        '3. The build completed successfully\n\n' +
        'Native modules require a development build.\n\n' +
        'Start with: npx expo start --dev-client'
      );
    }
  };

  const openGallery = async () => {
    try {
      // Dynamic import to avoid loading native module at startup
      const ImagePicker = await import('expo-image-picker');
      
      if (!ImagePicker || !ImagePicker.requestMediaLibraryPermissionsAsync) {
        throw new Error('ImagePicker native module not available');
      }
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Gallery permission is needed.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setShowReport(false);
        setReportData(null);
      }
    } catch (err) {
      console.error('Gallery error:', err);
      Alert.alert(
        'Native Module Error', 
        'expo-image-picker native module is not available.\n\n' +
        'Please ensure:\n' +
        '1. You are NOT using Expo Go\n' +
        '2. The app has been rebuilt with: npx expo run:android\n' +
        '3. The build completed successfully\n\n' +
        'Native modules require a development build.\n\n' +
        'Start with: npx expo start --dev-client'
      );
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      Alert.alert('No image selected', 'Please capture or select an image first.');
      return;
    }

    setIsAnalyzing(true);
    setShowReport(false);
    setReportData(null);

    try {
      const formData = new FormData();
      const fileName = imageUri.split('/').pop() || 'crop-diagnosis.jpg';
      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName || '');
      const extension = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const mimeType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
      const normalizedUri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;

      formData.append('image', {
        uri: normalizedUri,
        name: fileName,
        type: mimeType,
      });
          // link has to be change when we deploy the backend
      const response = await fetch('https://650fa7f6fe45.ngrok-free.app/api/v1/crop-doctor/analyze', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed (${response.status})`);
      }

      const data = await response.json();
      const normalized = {
        crop_name: data?.crop_name || 'Unknown crop',
        crop_disease: data?.crop_disease || 'Unknown disease',
        crop_disease_symptoms: Array.isArray(data?.crop_disease_symptoms) ? data.crop_disease_symptoms : [],
        crop_disease_cause: Array.isArray(data?.crop_disease_cause) ? data.crop_disease_cause : [],
        crop_disease_management: Array.isArray(data?.crop_disease_management) ? data.crop_disease_management : [],
        crop_disease_prevention: Array.isArray(data?.crop_disease_prevention) ? data.crop_disease_prevention : [],
        crop_disease_management_steps: Array.isArray(data?.crop_disease_management_steps) ? data.crop_disease_management_steps : [],
        confidence_score: typeof data?.confidence_score === 'number' ? data.confidence_score : null,
      };

      setReportData(normalized);
      setShowReport(true);
    } catch (err) {
      console.error('Crop doctor analyze error:', err);
      Alert.alert('Analysis failed', 'We were unable to analyze this image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatConfidenceScore = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 'N/A';
    }
    if (value <= 1) {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (value <= 100) {
      return `${value.toFixed(1)}%`;
    }
    return value.toFixed(1);
  };

  const renderListSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.reportSection}>
        <Text style={styles.reportLabel}>{title}:</Text>
        {items.map((item, index) => (
          <View key={`${title}-${index}`} style={styles.treatmentItem}>
            <Text style={styles.treatmentBullet}>•</Text>
            <Text style={styles.treatmentText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStepsSection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.reportSection}>
        <Text style={styles.reportLabel}>{title}:</Text>
        {items.map((item, index) => (
          <View key={`${title}-step-${index}`} style={styles.stepItem}>
            <View style={styles.stepIndex}>
              <Text style={styles.stepIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />

      {/* Modern Header with Gradient Background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="medical" size={24} color="#FFFFFF" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>Crop Doctor</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="leaf" size={48} color="#2E7D32" />
          </View>
          <Text style={styles.title}>AI-Powered Crop Disease Detection</Text>
          <Text style={styles.subtitle}>
            Capture or upload a photo of your crop leaves to get instant AI-powered disease diagnosis with detailed treatment recommendations
          </Text>
        </View>

        {/* Image Capture Section */}
        <View style={styles.captureSection}>
          <Text style={styles.sectionTitle}>📷 Capture or Select Image</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.cta, styles.cameraBtn]} 
              onPress={openCamera}
              activeOpacity={0.8}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.ctaText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cta, styles.galleryBtn]} 
              onPress={openGallery}
              activeOpacity={0.8}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="images" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.ctaText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {imageUri ? (
          <>
            {/* Image Preview Card */}
            <View style={styles.previewSection}>
              <View style={styles.previewCard}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageBtn}
                  onPress={() => {
                    setImageUri(null);
                    setShowReport(false);
                    setReportData(null);
                  }}
                >
                  <Ionicons name="close-circle" size={28} color="#EF4444" />
                </TouchableOpacity>
              </View>
              
              {/* Generate Report Button */}
              <TouchableOpacity 
                style={[styles.generateReportBtn, isAnalyzing && styles.generateReportBtnDisabled]} 
                onPress={analyzeImage}
                disabled={isAnalyzing}
                activeOpacity={0.8}
              >
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.generateReportBtnText}>Analyzing Image...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="analytics" size={22} color="#FFFFFF" />
                    <Text style={styles.generateReportBtnText}>Analyze & Generate Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            {showReport && reportData && (
              <View style={styles.reportCard}>
                {/* Report Header with Badge */}
                <View style={styles.reportHeader}>
                  <View style={styles.reportTitleContainer}>
                    <Ionicons name="document-text" size={28} color="#2E7D32" />
                    <Text style={styles.reportTitle}>Diagnosis Report</Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.confidenceBadgeText}>
                      {formatConfidenceScore(reportData.confidence_score)}
                    </Text>
                  </View>
                </View>

                {/* Key Information Cards */}
                <View style={styles.infoCardsRow}>
                  <View style={styles.infoCard}>
                    <Ionicons name="leaf-outline" size={20} color="#2E7D32" />
                    <Text style={styles.infoCardLabel}>Crop</Text>
                    <Text style={styles.infoCardValue} numberOfLines={2}>
                      {reportData.crop_name}
                    </Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Ionicons name="warning" size={20} color="#EF4444" />
                    <Text style={styles.infoCardLabel}>Disease</Text>
                    <Text style={styles.infoCardValue} numberOfLines={2}>
                      {reportData.crop_disease}
                    </Text>
                  </View>
                </View>

                {/* Report Sections */}
                <View style={styles.reportContent}>
                  {renderListSection('Symptoms', reportData.crop_disease_symptoms)}
                  {renderListSection('Cause', reportData.crop_disease_cause)}
                  {renderListSection('Management', reportData.crop_disease_management)}
                  {renderListSection('Prevention', reportData.crop_disease_prevention)}
                  {renderStepsSection('Management Steps', reportData.crop_disease_management_steps)}
                </View>
              </View>
            )}
          </>
        ) : null}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Tips for Better Results</Text>
          </View>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="camera-outline" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.tipText}>Take clear, well-lit photos</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="eye-outline" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.tipText}>Focus on affected leaves</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="flash-off-outline" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.tipText}>Avoid blurry or dark images</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipIcon}>
                <Ionicons name="contrast-outline" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.tipText}>Include both healthy and diseased parts</Text>
            </View>
          </View>
        </View>

        {/* Supported Crops Section */}
        <View style={styles.cropsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={22} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Supported Crops</Text>
          </View>
          <View style={styles.chipsWrap}>
            {['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Tomato', 'Potato', 'Chili']
              .map((c) => (
                <View key={c} style={styles.chip}>
                  <Ionicons name="leaf-outline" size={14} color="#2E7D32" />
                  <Text style={styles.chipText}>{c}</Text>
                </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  captureSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1F2937',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cta: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cameraBtn: {
    backgroundColor: '#2E7D32',
  },
  galleryBtn: {
    backgroundColor: '#0284C7',
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewSection: {
    marginBottom: 24,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  generateReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateReportBtnDisabled: {
    opacity: 0.7,
  },
  generateReportBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E8F5E9',
  },
  reportTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  confidenceBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  infoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 20,
  },
  reportContent: {
    marginTop: 8,
  },
  reportSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  treatmentItem: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
    alignItems: 'flex-start',
  },
  treatmentBullet: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '700',
    marginTop: 2,
  },
  treatmentText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepIndexText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  cropsSection: {
    marginBottom: 20,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chipText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
});
