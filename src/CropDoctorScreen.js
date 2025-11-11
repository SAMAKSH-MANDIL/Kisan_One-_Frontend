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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Doctor</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI-Powered Crop Disease Detection</Text>
        <Text style={styles.subtitle}>
          Take a photo of your crop leaves and get instant disease
          diagnosis with treatment recommendations.
        </Text>

        <Text style={styles.sectionTitle}>Step 1: Capture Image</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.cta, styles.cameraBtn]} onPress={openCamera}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.cta, styles.galleryBtn]} onPress={openGallery}>
            <Ionicons name="image" size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {imageUri ? (
          <>
            <View style={styles.previewCard}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            </View>
            <TouchableOpacity 
              style={[styles.generateReportBtn, isAnalyzing && styles.generateReportBtnDisabled]} 
              onPress={analyzeImage}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.generateReportBtnText}>Analyzing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color="#FFFFFF" />
                  <Text style={styles.generateReportBtnText}>Generate Report</Text>
                </>
              )}
            </TouchableOpacity>
            
            {showReport && reportData && (
              <View style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>Diagnosis Report</Text>
                  <Ionicons name="medical" size={24} color="#22A06B" />
                </View>
                
                <View style={styles.reportSection}>
                  <Text style={styles.reportLabel}>Crop Name:</Text>
                  <Text style={styles.reportValue}>{reportData.crop_name}</Text>
                </View>

                <View style={styles.reportSection}>
                  <Text style={styles.reportLabel}>Disease Detected:</Text>
                  <Text style={styles.reportValue}>{reportData.crop_disease}</Text>
                </View>

                <View style={styles.reportSection}>
                  <Text style={styles.reportLabel}>Confidence Score:</Text>
                  <Text style={styles.reportValue}>{formatConfidenceScore(reportData.confidence_score)}</Text>
                </View>

                {renderListSection('Symptoms', reportData.crop_disease_symptoms)}
                {renderListSection('Cause', reportData.crop_disease_cause)}
                {renderListSection('Management', reportData.crop_disease_management)}
                {renderListSection('Prevention', reportData.crop_disease_prevention)}
                {renderStepsSection('Management Steps', reportData.crop_disease_management_steps)}
              </View>
            )}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Tips for Better Results</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📸 Photo Guidelines:</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>• Take clear, well-lit photos</Text>
            <Text style={styles.bullet}>• Focus on affected leaves</Text>
            <Text style={styles.bullet}>• Avoid blurry or dark images</Text>
            <Text style={styles.bullet}>• Include both healthy and diseased parts</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Supported Crops</Text>
        <View style={styles.chipsWrap}>
          {['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Tomato', 'Potato', 'Chili']
            .map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
          ))}
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
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  cameraBtn: {
    backgroundColor: '#22A06B',
  },
  galleryBtn: {
    backgroundColor: '#3B82F6',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  bullets: {
    gap: 6,
  },
  bullet: {
    fontSize: 14,
    color: '#374151',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 40,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
  },
  generateReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22A06B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateReportBtnDisabled: {
    opacity: 0.8,
  },
  generateReportBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22A06B',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  reportSection: {
    marginBottom: 16,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  reportValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  reportDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 4,
  },
  treatmentItem: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  treatmentBullet: {
    fontSize: 16,
    color: '#22A06B',
    fontWeight: '700',
  },
  treatmentText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22A06B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepIndexText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
