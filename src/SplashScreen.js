import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((user) => {
      // small delay to allow splash to be visible briefly
      setTimeout(() => {
        if (user) {
          navigation.replace('Dashboard');
        } else {
          navigation.replace('LanguageSelection');
        }
      }, 1200);
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" translucent={false} />
      
      {/* Background with gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* App Logo Placeholder */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.appName}>Kisan One</Text>
        <Text style={styles.tagline}>Your Agricultural Partner</Text>
      </View>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, styles.loadingDotDelay]} />
        <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E7D32',
    opacity: 0.9,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 60,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#E8F5E8',
    textAlign: 'center',
    opacity: 0.9,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    opacity: 0.3,
  },
  loadingDotDelay: {
    opacity: 0.6,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
});
