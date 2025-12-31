import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { languages, useLanguage } from './LanguageContext';

const LANGUAGE_STORAGE_KEY = '@kisanone_language';

export default function LanguageSelection() {
  const navigation = useNavigation();
  const { changeLanguage, t, currentLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  
  // Update selected language when currentLanguage changes
  useEffect(() => {
    if (currentLanguage) {
      setSelectedLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleContinue = async () => {
    // Save language preference before navigating
    try {
      // Save to AsyncStorage immediately
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
      
      // Update language context
      await changeLanguage(selectedLanguage);
      
      // Also save to Firestore if user is already logged in
      const user = auth().currentUser;
      if (user) {
        await firestore().collection('users').doc(user.uid).update({
          language: selectedLanguage,
        });
      } else {
        // For non-logged-in users, set temp language for immediate effect
        global._tempLanguage = selectedLanguage;
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
    
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require('../assets/splash-icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
            <Image
              source={require('../assets/kisan-one-wordmark.png')}
              style={styles.wordmark}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeText}>{t('chooseLanguage')}</Text>
          <Text style={styles.subtitleText}>{t('chooseLanguage')}</Text>
        </View>

        {/* Language Options */}
        <View style={styles.languageContainer}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                selectedLanguage === language.code && styles.selectedLanguage,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.languageText,
                    selectedLanguage === language.code && styles.selectedLanguageText,
                  ]}
                >
                  {language.name}
                </Text>
                <Text style={styles.languageNative}>{language.native}</Text>
              </View>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
      {/* Sticky Continue Button */}
      <View style={styles.stickyBar}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0e7c36',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 40,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'green',
  },
  wordmark: {
    width: 260,
    height: 48,
    marginTop: 4,
  },
  appName: {
    display: 'none',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 18,
    color: '#666666',
  },
  languageContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    backgroundColor: '#E8F5E8',
    borderColor: '#0e7c36',
  },
  languageText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
  },
  languageNative: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    fontWeight: '400',
  },
  selectedLanguageText: {
    color: '#0e7c36',
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0e7c36',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#0e7c36',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0e7c36',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
