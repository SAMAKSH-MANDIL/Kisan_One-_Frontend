import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function LanguageSelectScreen() {
  const navigation = useNavigation();

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'ka', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kho', name: 'Khorta', native: 'Khorta' },
  ];

  const handleLanguageSelect = (lang) => {
    Alert.alert('Language Selected', `${lang.name}`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="globe" size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Select Language</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Languages</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred language</Text>
        </View>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={styles.langCard}
            onPress={() => handleLanguageSelect(lang)}
            activeOpacity={0.7}
          >
            <View style={styles.langContent}>
              <Text style={styles.langName}>{lang.name}</Text>
              <Text style={styles.langNative}>{lang.native}</Text>
            </View>
            <View style={styles.checkContainer}>
              <Ionicons name="checkmark-circle" size={26} color="#2E7D32" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 24 },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280' },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#E8F5E9',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  langIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E8F5E9',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  langEmoji: { fontSize: 28 },
  langContent: { flex: 1 },
  langName: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4, letterSpacing: 0.3 },
  langNative: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  checkContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

