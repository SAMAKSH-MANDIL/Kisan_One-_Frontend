import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from './utils/responsive';

export default function SchemeDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { scheme } = route.params || {};

  if (!scheme) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0e7c36" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Scheme information not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleVisitWebsite = () => {
    if (scheme.website) {
      Linking.openURL(scheme.website).catch(() => {
        Alert.alert('Error', 'Could not open website. Please check the URL.');
      });
    } else {
      Alert.alert('Info', 'Website URL not available for this scheme.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0e7c36" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets?.top || 0, 10) + 12 }] }>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheme Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 + (insets?.bottom || 0) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Scheme Name */}
        <View style={styles.nameContainer}>
          <MaterialIcons name="policy" size={32} color="#0e7c36" />
          <Text style={styles.schemeName}>{scheme.name}</Text>
        </View>

        {/* State Badge */}
        {scheme.state && (
          <View style={styles.stateBadge}>
            <Ionicons name="location" size={16} color="#0e7c36" />
            <Text style={styles.stateText}>{scheme.state}</Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionContent}>{scheme.desc}</Text>
        </View>

        {/* Full Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.sectionContent}>{scheme.content}</Text>
        </View>

        {/* Additional Info if available */}
        {scheme.additionalInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <Text style={styles.sectionContent}>{scheme.additionalInfo}</Text>
          </View>
        )}
      </ScrollView>

      {/* Visit Website Button */}
      <View style={[styles.buttonContainer, { paddingBottom: 16 + (insets?.bottom || 0) }]}>
        <TouchableOpacity
          style={styles.websiteButton}
          onPress={handleVisitWebsite}
        >
          <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
          <Text style={styles.websiteButtonText}>Visit Official Website</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#0e7c36',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  nameContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  schemeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 30,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 20,
    gap: 6,
  },
  stateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0e7c36',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0e7c36',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 24,
    textAlign: 'justify',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  websiteButton: {
    backgroundColor: '#0e7c36',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  websiteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0e7c36',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

