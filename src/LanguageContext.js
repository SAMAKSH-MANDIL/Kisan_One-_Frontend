import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getTranslation } from './translations';

const LanguageContext = createContext();

export const languages = [
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

// Voice locale mapping
export const voiceLocaleMap = {
  'en': 'en-US',
  'hi': 'hi-IN',
  'bn': 'bn-IN',
  'gu': 'gu-IN',
  'ka': 'kn-IN',
  'mr': 'mr-IN',
  'pa': 'pa-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'sa': 'en-US', // Fallback to English
  'kho': 'en-US', // Fallback to English
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Load saved language on mount and when auth state changes
  useEffect(() => {
    loadLanguage();
    
    // Listen for auth state changes to reload language
    const unsubscribe = auth().onAuthStateChanged((user) => {
      if (user) {
        loadLanguage();
      }
    });
    
    return () => unsubscribe();
  }, []);

  const loadLanguage = async () => {
    try {
      // Check for temp language from LanguageSelection screen
      if (global._tempLanguage) {
        setCurrentLanguage(global._tempLanguage);
        global._tempLanguage = null;
      }

      // Then try Firestore for logged-in users
      const user = auth().currentUser;
      if (user) {
        const doc = await firestore().collection('users').doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data() || {};
          if (data.language) {
            setCurrentLanguage(data.language);
          }
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      // Update state immediately
      setCurrentLanguage(languageCode);

      // Save to Firestore for logged-in users
      const user = auth().currentUser;
      if (user) {
        await firestore().collection('users').doc(user.uid).update({
          language: languageCode,
        });
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const getVoiceLocale = () => {
    return voiceLocaleMap[currentLanguage] || 'en-US';
  };

  // Translation function
  const t = (key) => {
    return getTranslation(currentLanguage, key);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    getVoiceLocale,
    languages,
    t, // Translation function
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

