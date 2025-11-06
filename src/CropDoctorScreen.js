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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CropDoctorScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);

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

  const generateReport = () => {
    // Simulate report generation - in a real app, this would call an API
    const mockReport = {
      disease: 'Leaf Blight',
      confidence: '85%',
      severity: 'Moderate',
      crop: 'Tomato',
      description: 'The image analysis indicates the presence of early blight on tomato leaves. This is a common fungal disease that affects tomato plants.',
      treatment: [
        'Remove and dispose of affected leaves immediately',
        'Apply fungicide containing chlorothalonil or copper-based products',
        'Improve air circulation by pruning dense foliage',
        'Avoid overhead watering to reduce leaf wetness',
        'Apply treatment every 7-10 days until symptoms clear'
      ],
      prevention: [
        'Use disease-resistant varieties',
        'Maintain proper spacing between plants',
        'Rotate crops annually',
        'Water at the base of plants, not leaves'
      ]
    };
    setReportData(mockReport);
    setShowReport(true);
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
              style={styles.generateReportBtn} 
              onPress={generateReport}
            >
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
              <Text style={styles.generateReportBtnText}>Generate Report</Text>
            </TouchableOpacity>
            
            {showReport && reportData && (
              <View style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportTitle}>Diagnosis Report</Text>
                  <Ionicons name="medical" size={24} color="#22A06B" />
                </View>
                
                <View style={styles.reportSection}>
                  <Text style={styles.reportLabel}>Disease Detected:</Text>
                  <Text style={styles.reportValue}>{reportData.disease}</Text>
                </View>
                
                <View style={styles.reportRow}>
                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Confidence:</Text>
                    <Text style={styles.reportValue}>{reportData.confidence}</Text>
                  </View>
                  <View style={styles.reportSection}>
                    <Text style={styles.reportLabel}>Severity:</Text>
                    <Text style={styles.reportValue}>{reportData.severity}</Text>
                  </View>
                </View>
                
                <View style={styles.reportSection}>
                  <Text style={styles.reportLabel}>Crop Type:</Text>
                  <Text style={styles.reportValue}>{reportData.crop}</Text>
                </View>
                
                <View style={styles.reportSection}>
                  <Text style={styles.reportLabel}>Description:</Text>
                  <Text style={styles.reportDescription}>{reportData.description}</Text>
                </View>
                
                <View style={styles.reportSection}>
                  <Text style={styles.reportLabel}>Treatment Recommendations:</Text>
                  {reportData.treatment.map((item, index) => (
                    <View key={index} style={styles.treatmentItem}>
                      <Text style={styles.treatmentBullet}>•</Text>
                      <Text style={styles.treatmentText}>{item}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.reportSection}>
                  <Text style={styles.reportLabel}>Prevention Tips:</Text>
                  {reportData.prevention.map((item, index) => (
                    <View key={index} style={styles.treatmentItem}>
                      <Text style={styles.treatmentBullet}>•</Text>
                      <Text style={styles.treatmentText}>{item}</Text>
                    </View>
                  ))}
                </View>
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
});
