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

  const openCamera = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
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
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open camera.');
    }
  };

  const openGallery = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
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
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open gallery.');
    }
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
          <View style={styles.previewCard}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          </View>
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
});
