import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Linking,
  Platform,
  PermissionsAndroid,
  Keyboard,
  Image,
  Animated,
  Easing,
  BackHandler,
  AppState,
  Dimensions,
  ScrollView,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Voice from '@react-native-voice/voice';
import * as Location from 'expo-location';
import { useLanguage } from './LanguageContext';
import { generateGeminiReply, setGeminiApiKey } from './services/gemini';

export default function AIToolsScreen() {
  const navigation = useNavigation();
  const { getVoiceLocale } = useLanguage();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showAccuracyModal, setShowAccuracyModal] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationName, setLocationName] = useState('Set your location');
  const [hasAskedLocation, setHasAskedLocation] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [showMoreExpanded, setShowMoreExpanded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Safely get tab bar height
  let tabBarHeight = 56; // Default fallback
  try {
    if (typeof useBottomTabBarHeight === 'function') {
      tabBarHeight = useBottomTabBarHeight();
    }
  } catch (error) {
    console.warn('Error getting tab bar height:', error);
    tabBarHeight = 56; // Use default
  }
  const TAB_BAR_OFFSET = tabBarHeight; // height of the app's bottom tab bar
  const drawerWidth = Math.round((typeof Dimensions !== 'undefined' ? Dimensions.get('window').width : 360) * 0.75);
  const drawerTranslateX = React.useRef(new Animated.Value(-drawerWidth)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const [profileName, setProfileName] = useState('Farmer');
  const [isListening, setIsListening] = useState(false);
  const micPulse = React.useRef(new Animated.Value(1)).current;
  const micLoopRef = React.useRef(null);

  // Chat modal state
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', text: 'Hi! Ask me anything related to crops, pests, weather, or inputs.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = React.useRef(null);
  const searchInputRef = React.useRef(null);
  // Enable smooth layout transitions for expanding/collapsing "More" (Android requires this)
  useEffect(() => {
    try {
      if (Platform.OS === 'android' && UIManager && typeof UIManager.setLayoutAnimationEnabledExperimental === 'function') {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    } catch (_) {}
  }, []);

  // Configure Gemini API key (prefers EXPO_PUBLIC_GEMINI_API_KEY; falls back to provided key)
  useEffect(() => {
    try {
      // Try to get API key from environment variable first
      const envKey = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_GEMINI_API_KEY) 
        ? process.env.EXPO_PUBLIC_GEMINI_API_KEY 
        : null;
      
      // Always set the API key explicitly (either from env or fallback)
      if (envKey && envKey.trim()) {
        setGeminiApiKey(envKey);
      } else {
        // Fallback to hardcoded key if no env key is available
        setGeminiApiKey('AIzaSyCgYM3Key2yLV0ck0HrBCwLAQqMffNHbKU');
      }
    } catch (error) {
      console.log('Error setting Gemini API key:', error);
      // Still try to set fallback key even if there's an error
      try {
        setGeminiApiKey('AIzaSyCgYM3Key2yLV0ck0HrBCwLAQqMffNHbKU');
      } catch (_) {}
    }
  }, []);

  // Auto-scroll to latest message when new messages arrive or chat opens
  useEffect(() => {
    if (!chatVisible) return;
    const t = setTimeout(() => {
      try { chatScrollRef.current?.scrollToEnd({ animated: true }); } catch (_) {}
    }, 50);
    return () => clearTimeout(t);
  }, [chatVisible, chatMessages, chatLoading]);

  const isRequestingLocationRef = React.useRef(false);
  const requestAndSetLocation = async () => {
    if (isRequestingLocationRef.current) return;
    isRequestingLocationRef.current = true;
    try {
      // Check if Location module is available
      if (!Location || typeof Location.getForegroundPermissionsAsync !== 'function') {
        console.warn('Location module not available');
        setLocationName('Location service unavailable');
        setLocationEnabled(false);
        isRequestingLocationRef.current = false;
        return;
      }
      
      // Check existing permission first to avoid duplicate prompts
      let perm = null;
      try {
        perm = await Location.getForegroundPermissionsAsync();
      } catch (permError) {
        console.error('Error getting location permission:', permError);
        setLocationName('Location permission error');
        setLocationEnabled(false);
        isRequestingLocationRef.current = false;
        return;
      }
      
      if (!perm || perm.status !== 'granted') {
        try {
          perm = await Location.requestForegroundPermissionsAsync();
        } catch (requestError) {
          console.error('Error requesting location permission:', requestError);
          setLocationName('Location permission denied');
          setLocationEnabled(false);
          isRequestingLocationRef.current = false;
          return;
        }
      }
      if (!perm || perm.status !== 'granted') {
        setLocationEnabled(false);
        setLocationName('Location permission not enabled');
        isRequestingLocationRef.current = false;
        return;
      }

      // Get current position with a retry to avoid transient errors right after grant
      let position = null;
      try {
        if (typeof Location.getCurrentPositionAsync !== 'function') {
          throw new Error('getCurrentPositionAsync not available');
        }
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000,
          maximumAge: 5000,
        });
      } catch (firstErr) {
        console.log('First location attempt failed, retrying with balanced accuracy:', firstErr);
        try {
          await new Promise(r => setTimeout(r, 800));
          position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 15000,
            maximumAge: 5000,
          });
        } catch (secondErr) {
          console.error('Second location attempt also failed:', secondErr);
          throw secondErr;
        }
      }

      const { latitude, longitude } = position.coords || {};
      
      if (latitude == null || longitude == null) {
        setLocationName('Unable to fetch location');
        setLocationEnabled(false);
        return;
      }

      // Try to get readable address using expo-location's built-in reverse geocoding
      let locationText = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
      
      try {
        // First try expo-location's reverse geocoding (built-in and reliable)
        const geocodeResult = await Location.reverseGeocodeAsync({ latitude, longitude });
        
          if (geocodeResult && geocodeResult.length > 0) {
          const addr = geocodeResult[0];
          // Build readable address - prioritize city/state for India
          const addressParts = [];
          
          // For Indian addresses, prioritize city/town/village
          if (addr.city) {
            addressParts.push(addr.city);
          } else if (addr.subregion && !addr.subregion.includes('District')) {
            addressParts.push(addr.subregion);
          } else if (addr.district) {
            addressParts.push(addr.district);
          }
          
          // Add state/region
          if (addr.region) {
            addressParts.push(addr.region);
          } else if (addr.state) {
            addressParts.push(addr.state);
          }
          
          // If we got a good address, use it; otherwise try formattedAddress
          if (addressParts.length > 0) {
            locationText = addressParts.join(', ');
          } else if (addr.formattedAddress) {
            // Parse formattedAddress to extract city and state
            const formatted = addr.formattedAddress;
            // Try to extract city and state from formatted address
            const parts = formatted.split(', ').filter(p => p.trim());
            if (parts.length >= 2) {
              // Usually format is: Street, City, State, Country
              // For India, we want: City, State
              locationText = parts.slice(-3, -1).join(', '); // Get last 2 parts before country
            } else {
              locationText = formatted;
            }
          }
        }
      } catch (expoGeoErr) {
        console.log('Expo geocoding error:', expoGeoErr);
        
        // Fallback to Nominatim OpenStreetMap API
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'KisanOne-App/1.0' // Required by Nominatim
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            
            // Build address from multiple possible fields (for Indian addresses)
            const addressParts = [];
            
            // City/Town/Village - prioritize this for readability
            const city = address.city || address.town || address.village || address.suburb || address.locality || '';
            if (city) {
              addressParts.push(city);
            }
            
            // District (only if different from city and meaningful)
            const district = address.district || address.county || '';
            if (district && district !== city && !district.toLowerCase().includes(city.toLowerCase())) {
              // Only add district if it's different from city
              addressParts.push(district);
            }
            
            // State - always add if available
            const state = address.state || address.region || address.state_district || '';
            if (state) {
              addressParts.push(state);
            }
            
            // Build final location text
            if (addressParts.length > 0) {
              // Format: "City, State" or "City, District, State"
              locationText = addressParts.join(', ');
            } else if (data.display_name) {
              // Parse display_name as fallback
              // Format is usually: "Street, Village/Town/City, District, State, Country"
              const parts = data.display_name.split(', ').filter(p => p.trim());
              
              if (parts.length >= 2) {
                // For Indian addresses: "..., City, District, State, India"
                // We want: "City, State"
                
                // Remove country if it's at the end
                const withoutCountry = parts[parts.length - 1].toLowerCase().includes('india') 
                  ? parts.slice(0, -1) 
                  : parts;
                
                // Get last 2 parts (usually City, State) or (District, State)
                if (withoutCountry.length >= 2) {
                  locationText = withoutCountry.slice(-2).join(', ');
                } else {
                  locationText = withoutCountry.join(', ');
                }
              } else {
                locationText = data.display_name;
              }
            }
          }
        } catch (nominatimErr) {
          console.log('Nominatim geocoding error:', nominatimErr);
          // Keep lat/long as fallback
        }
      }
      
      setLocationName(locationText);
      setLocationEnabled(true);
      setShowLocationModal(false);
      setShowAccuracyModal(false);
    } catch (e) {
      console.log('Location exception:', e);
      // Fail silently to avoid error-after-grant UX; leave previous name if any
      if (!locationEnabled) {
        setLocationName('Unable to fetch location');
      }
      setLocationEnabled(false);
    } finally {
      isRequestingLocationRef.current = false;
    }
  };

  const checkLocationPermission = async () => {
    try {
      // Check if Location module is available
      if (!Location || typeof Location.getForegroundPermissionsAsync !== 'function') {
        console.warn('Location module not available');
        setLocationName('Location service unavailable');
        setLocationEnabled(false);
        return;
      }
      
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        await requestAndSetLocation();
      } else if (status === 'undetermined' && !hasAskedLocation) {
        // Permission not asked yet - show modal to ask
        setShowLocationModal(true);
        setHasAskedLocation(true);
      } else if (status === 'denied') {
        // Permission denied - show option to open settings
        setLocationEnabled(false);
        setLocationName('Location permission denied');
      }
    } catch (e) {
      console.log('Permission check error:', e);
      setLocationName('Location service unavailable');
      setLocationEnabled(false);
    }
  };

  const openPermissionFlow = () => {
    setShowLocationModal(true);
  };

  const handleEnableLocation = async () => {
    setShowLocationModal(false);
    await requestAndSetLocation();
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
  };

  const handleTurnOnAccuracy = async () => {
    setShowAccuracyModal(false);
    await requestAndSetLocation();
  };

  const handleNoThanks = () => {
    setShowAccuracyModal(false);
  };

  const openLocationSettings = () => {
    // Always request GPS location - manual selection removed
    if (locationEnabled) {
      // If already enabled, refresh location
      requestAndSetLocation();
    } else {
      // If not enabled, show permission modal
      openPermissionFlow();
    }
  };

  const handleToolPress = (toolName) => {
    if (toolName === 'Crop Doctor') {
      navigation.navigate('CropDoctor');
      return;
    }
    if (toolName === 'Crop Recommendation') {
      navigation.navigate('CropRecommendation');
      return;
    }
    Alert.alert('Tool Selected', `You selected ${toolName}`);
  };

  const handleSearch = (textOverride) => {
    // Open chat when pressing send on the fixed bar
    setChatVisible(true);
    const candidate = (typeof textOverride === 'string') ? textOverride : (typeof searchQuery === 'string' ? searchQuery : '');
    const queryToSend = String(candidate || '').trim();
    if (queryToSend) {
      // seed the chat with current query
      setTimeout(() => {
        setChatInput(queryToSend);
        setSearchQuery('');
        handleSendMessage(queryToSend);
      }, 0);
    }
  };

  const handleQuickAsk = (labelText) => {
    // Show the label briefly in the input, open chat, then auto-send
    try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (_) {}
    setShowMoreExpanded(false);
    setSearchQuery(labelText);
    handleSearch(labelText);
  };

  const openChatOnFocus = () => {
    // Close expanded More options with a smooth transition when focusing the search bar
    if (showMoreExpanded) {
      try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (_) {}
      setShowMoreExpanded(false);
    }
    if (!chatVisible) {
      setChatVisible(true);
    }
  };

  const handleSendMessage = async (textOverride) => {
    const messageText = (textOverride ?? chatInput).trim();
    if (!messageText) return;
    const nextMessages = [...chatMessages, { role: 'user', text: messageText }];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      // Ensure API key is set before making request
      const envKey = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_GEMINI_API_KEY) 
        ? process.env.EXPO_PUBLIC_GEMINI_API_KEY 
        : null;
      if (!envKey || !envKey.trim()) {
        setGeminiApiKey('AIzaSyCgYM3Key2yLV0ck0HrBCwLAQqMffNHbKU');
      }
      
      const reply = await generateGeminiReply(nextMessages);
      setChatMessages((prev) => [...prev, { role: 'model', text: reply }]);
    } catch (e) {
      console.log('Gemini error:', e);
      // Show more helpful error message
      let errorMessage = 'Sorry, I had an issue contacting Gemini.';
      if (e && e.message) {
        if (e.message.includes('API key')) {
          errorMessage = 'API key issue detected. Please check your Gemini API key configuration.';
        } else if (e.message.includes('401') || e.message.includes('403')) {
          errorMessage = 'Authentication failed. The API key may be invalid or expired.';
        } else if (e.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        } else {
          errorMessage = `Error: ${e.message}`;
        }
      }
      setChatMessages((prev) => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setChatLoading(false);
    }
  };

  const openImageOptions = () => {
    setShowImagePickerModal(true);
  };

  const pickFromCamera = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Camera error', e);
      Alert.alert('Camera unavailable', 'Please install expo-image-picker or try again.');
    } finally {
      setShowImagePickerModal(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Gallery permission is needed.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Gallery error', e);
      Alert.alert('Gallery unavailable', 'Please install expo-image-picker or try again.');
    } finally {
      setShowImagePickerModal(false);
    }
  };

  const clearSelectedImage = () => setSelectedImageUri(null);

  const isFocused = useIsFocused();

  // Check location permission when screen is focused
  useEffect(() => {
    if (isFocused) {
      // Check and request location permission when user enters AI Tools screen
      // Add delay to prevent crash on initial mount
      const timer = setTimeout(() => {
        try {
          checkLocationPermission();
        } catch (error) {
          console.error('Error checking location permission on focus:', error);
          setLocationName('Location service unavailable');
          setLocationEnabled(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  // When leaving this tab/screen, hide overlays so they don't overlap other tabs
  useEffect(() => {
    if (!isFocused) {
      try { Keyboard.dismiss(); } catch (_) {}
      setChatVisible(false);
      setShowMoreExpanded(false);
    }
  }, [isFocused]);

  // If user toggles permission in OS settings, refresh on app foreground
  useEffect(() => {
    let sub = null;
    try {
      sub = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          try {
            checkLocationPermission();
          } catch (error) {
            console.error('Error checking location on app state change:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up app state listener:', error);
    }
    return () => {
      try {
        if (sub && typeof sub.remove === 'function') {
          sub.remove();
        }
      } catch (error) {
        console.error('Error removing app state listener:', error);
      }
    };
  }, []);

  // Listen to keyboard to adjust layout
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      // Hide AI chat only if the search input is not focused to avoid focus loops
      try {
        const stillFocused = !!(searchInputRef.current && typeof searchInputRef.current.isFocused === 'function' && searchInputRef.current.isFocused());
        if (!stillFocused) {
          setChatVisible(false);
        }
      } catch (_) {
        setChatVisible(false);
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Back closes drawer on Android
  useEffect(() => {
    const onBack = () => {
      if (isDrawerOpen) {
        try {
          closeDrawer();
        } catch (error) {
          console.error('Error closing drawer:', error);
          setIsDrawerOpen(false);
        }
        return true;
      }
      return false;
    };
    let sub = null;
    try {
      sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    } catch (error) {
      console.error('Error setting up back handler:', error);
    }
    return () => {
      try {
        if (sub && typeof sub.remove === 'function') {
          sub.remove();
        }
      } catch (error) {
        console.error('Error removing back handler:', error);
      }
    };
  }, [isDrawerOpen]);

  // Load profile name from Firestore
  useEffect(() => {
    let unsub = null;
    try {
      const u = auth().currentUser;
      if (!u) {
        setProfileName('Farmer');
        return;
      }
      
      const ref = firestore().collection('users').doc(u.uid);
      unsub = ref.onSnapshot(
        (doc) => {
          try {
            if (!doc || !doc.exists) {
              setProfileName('Farmer');
              return;
            }
            const d = doc.data() || {};
            setProfileName((d.name && d.name.trim()) ? d.name : 'Farmer');
          } catch (error) {
            console.error('Error processing profile data:', error);
            setProfileName('Farmer');
          }
        },
        (error) => {
          console.error('Error loading profile:', error);
          setProfileName('Farmer');
        }
      );
    } catch (error) {
      console.error('Error setting up profile listener:', error);
      setProfileName('Farmer');
    }
    
    return () => {
      try {
        if (unsub) {
          unsub();
        }
      } catch (error) {
        console.error('Error unsubscribing from profile:', error);
      }
    };
  }, []);

  const openDrawer = () => {
    // Hide interactive overlays so drawer doesn't overlap them
    try { Keyboard.dismiss(); } catch (_) {}
    setChatVisible(false);
    setShowMoreExpanded(false);
    setIsDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerTranslateX, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  // Check if Voice module is available
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  // Voice recognition handlers for search bar
  useEffect(() => {
    // Check if Voice module is available
    if (!Voice) {
      console.warn('Voice module is not available. App needs to be rebuilt.');
      setVoiceAvailable(false);
      return;
    }

    // Initialize Voice event listeners
    const setupVoice = async () => {
      try {
        // Check if Voice methods are available
        if (typeof Voice.destroy !== 'function' || typeof Voice.removeAllListeners !== 'function') {
          console.warn('Voice module methods not available. App needs to be rebuilt.');
          setVoiceAvailable(false);
          return;
        }

        // Clean up any existing instance first
        try {
          await Voice.destroy();
          Voice.removeAllListeners();
        } catch (err) {
          // Ignore cleanup errors if module isn't initialized yet
          console.log('Cleanup (expected on first load):', err);
        }

        // Set up event listeners only if Voice is available
        if (Voice && typeof Voice === 'object') {
          Voice.onSpeechStart = () => {
            console.log('Voice recognition started');
            setIsListening(true);
          };
          
          Voice.onSpeechEnd = () => {
            console.log('Voice recognition ended');
            setIsListening(false);
          };
          
          Voice.onSpeechError = (e) => {
            console.error('Voice recognition error:', e);
            setIsListening(false);
            Alert.alert(
              'Voice Error',
              'Could not process your voice. Please try again.',
              [{ text: 'OK' }]
            );
          };
          
          Voice.onSpeechResults = (e) => {
            console.log('Voice recognition results:', e);
            const text = (e && e.value && e.value.length > 0) ? e.value[0] : '';
            if (text) {
              console.log('Setting search query to:', text);
              setSearchQuery(text);
              setIsListening(false);
            }
          };
          
          Voice.onSpeechPartialResults = (e) => {
            // Update search bar with partial results while speaking
            const text = (e && e.value && e.value.length > 0) ? e.value[0] : '';
            if (text) {
              setSearchQuery(text);
            }
          };

          setVoiceAvailable(true);
        } else {
          console.warn('Voice module is null. App needs to be rebuilt.');
          setVoiceAvailable(false);
        }
      } catch (err) {
        console.error('Error setting up Voice:', err);
        setVoiceAvailable(false);
      }
    };

    setupVoice();
    
    return () => {
      // Cleanup on unmount
      const cleanup = async () => {
        try {
          if (Voice && typeof Voice.destroy === 'function') {
            await Voice.destroy();
            if (typeof Voice.removeAllListeners === 'function') {
              Voice.removeAllListeners();
            }
          }
        } catch (err) {
          console.error('Error cleaning up voice:', err);
        }
      };
      cleanup();
    };
  }, []);

  const startVoiceRecognition = async () => {
    try {
      // Check if already listening
      if (isListening) {
        await stopVoiceRecognition();
        return;
      }

      // Simple check - if Voice doesn't exist, show rebuild message
      if (!Voice || typeof Voice.start !== 'function') {
        Alert.alert(
          'Voice Recognition Unavailable',
          'Voice module is not linked. Please rebuild the app:\n\nnpx expo prebuild --clean\nnpx expo run:android',
          [{ text: 'OK' }]
        );
        return;
      }

      // Request microphone permission
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Microphone permission is needed.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
      }

      // Get voice locale from language context and start
      const currentVoiceLocale = getVoiceLocale();
      await Voice.start(currentVoiceLocale);
      console.log('Voice started with locale:', currentVoiceLocale);
    } catch (error) {
      console.error('Voice error:', error);
      setIsListening(false);
      if (error.message?.includes('null') || error.message?.includes('startSpeech')) {
        Alert.alert(
          'Rebuild Required',
          'Please rebuild the app: npx expo run:android',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const stopVoiceRecognition = async () => {
    try {
      if (!Voice || Voice === null) {
        setIsListening(false);
        return;
      }

      // Try to stop first
      try {
        if (typeof Voice.stop === 'function') {
          await Voice.stop();
        }
      } catch (stopErr) {
        console.log('Stop error (may already be stopped):', stopErr);
      }
      
      // Then destroy to ensure clean state
      try {
        if (typeof Voice.destroy === 'function') {
          await Voice.destroy();
        }
      } catch (destroyErr) {
        console.log('Destroy error:', destroyErr);
      }
      
      setIsListening(false);
      console.log('Voice recognition stopped');
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      setIsListening(false);
    }
  };

  const handleMicPress = () => {
    if (isListening) stopVoiceRecognition(); else startVoiceRecognition();
  };

  // Simple pulse animation while listening
  useEffect(() => {
    if (isListening) {
      micLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.15, duration: 450, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1.0, duration: 450, useNativeDriver: true }),
        ])
      );
      micLoopRef.current.start();
    } else {
      try { micLoopRef.current?.stop(); } catch (_) {}
      micPulse.setValue(1);
    }
  }, [isListening]);

  const closeDrawer = () => {
    try {
      Animated.parallel([
        Animated.timing(drawerTranslateX, { toValue: -drawerWidth, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        try {
          setIsDrawerOpen(false);
        } catch (error) {
          console.error('Error setting drawer state:', error);
        }
      });
    } catch (error) {
      console.error('Error closing drawer:', error);
      setIsDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    const parent = navigation.getParent?.() || navigation;
    parent.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      {(() => {
        // Calculate responsive max height for chat based on viewport and keyboard
        const windowHeight = (typeof Dimensions !== 'undefined' ? Dimensions.get('window').height : 720);
        // Leave at least ~200dp for content below and search bar area
        const maxByAvailable = Math.max(220, windowHeight - (keyboardHeight + 200));
        // Also clamp to 55% of screen height
        var __chatMaxHeight = Math.min(windowHeight * 0.55, maxByAvailable);
        // Expose on global for inline style usage below
        // eslint-disable-next-line no-undef
        global.__chatMaxHeight = __chatMaxHeight;
        return null;
      })()}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: 12 + (insets?.top || 0) }]}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        
        <View style={styles.locationContainer}>
          <TouchableOpacity onPress={openLocationSettings} activeOpacity={0.7}>
            <View>
              <Text style={[styles.locationText, locationEnabled ? styles.locationTextEnabled : styles.locationTextDisabled]}>
                {locationName}
              </Text>
              <Text style={styles.locationSubText}>{locationEnabled ? 'Tap to refresh location' : 'Tap to enable location'}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.locationIconContainer}
          onPress={requestAndSetLocation}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="location-outline" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={[
        styles.content,
        isKeyboardVisible ? styles.contentWhenKeyboard : null,
      ]}>
        {/* Question */}
        <Text style={styles.question}>What can I help with?</Text>

        {/* Tool Cards */}
        <View style={styles.toolsContainer}>
          {/* First Row: Crop Doctor and Crop Recommendation (2 in a row) */}
          <View style={styles.toolsRow}>
            <TouchableOpacity 
              style={styles.toolCardPill}
              onPress={() => handleToolPress('Crop Doctor')}
            >
              <Image 
                source={require('../assets/doctorOverGreen.png')} 
                style={styles.toolIconPill}
                resizeMode="contain"
                onError={(error) => {
                  console.log('Error loading Crop Doctor image:', error);
                }}
              />
              <Text style={styles.toolNamePill} numberOfLines={1}>Crop Doctor</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toolCardPill}
              onPress={() => handleToolPress('Crop Recommendation')}
            >
              <Image 
                source={require('../assets/recommendationOverGreen.png')} 
                style={styles.toolIconPill}
                resizeMode="contain"
                onError={(error) => {
                  console.log('Error loading Crop Recommendation image:', error);
                }}
              />
              <Text style={styles.toolNamePill} numberOfLines={1}>Crop Recommendation</Text>
            </TouchableOpacity>
          </View>

          {/* Second Row: More Button (Centered) */}
          {!showMoreExpanded && (
            <View style={styles.toolsRowCentered}>
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => {
                  try { Keyboard.dismiss(); } catch (_) {}
                  try { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); } catch (_) {}
                  setShowMoreExpanded(true);
                }}
              >
                <Text style={styles.toolNamePill} numberOfLines={1}>More</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Expanded More Options - 4 rows x 2 columns */}
          {showMoreExpanded && (
            <View style={styles.expandedMoreContainer}>
              {/* Row 1 */}
              <View style={styles.toolsRow}>
                <TouchableOpacity 
                  style={styles.toolCardPill}
                  onPress={() => handleQuickAsk('Weather Forecast')}
                >
                  <Ionicons name="partly-sunny-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                  <Text style={styles.toolNamePill} numberOfLines={1} ellipsizeMode="tail">Weather Forecast</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolCardPill}
                  onPress={() => handleQuickAsk('Soil Testing')}
                >
                  <Ionicons name="flask-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                  <Text style={styles.toolNamePill} numberOfLines={1} ellipsizeMode="tail">Soil Testing</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.toolsRow}>
                <TouchableOpacity 
                  style={styles.toolCardPill}
                  onPress={() => handleQuickAsk('Market Prices')}
                >
                  <Ionicons name="trending-up-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                  <Text style={styles.toolNamePill} numberOfLines={1} ellipsizeMode="tail">Market Prices</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolCardPill}
                  onPress={() => handleQuickAsk('Crop Calendar')}
                >
                  <Ionicons name="calendar-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                  <Text style={styles.toolNamePill} numberOfLines={1} ellipsizeMode="tail">Crop Calendar</Text>
                </TouchableOpacity>
              </View>

              {/* Row 3 */}
              <View style={styles.toolsRow}>
                <TouchableOpacity 
                  style={styles.toolCardPill}
                  onPress={() => handleQuickAsk('Fertilizer Calculator')}
                >
                  <Ionicons name="calculator-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                  <Text style={styles.toolNamePill} numberOfLines={1} ellipsizeMode="tail">Fertilizer Calculator</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolCardPill}
                  onPress={() => handleQuickAsk('Irrigation Guide')}
                >
                  <Ionicons name="water-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                  <Text style={styles.toolNamePill} numberOfLines={1} ellipsizeMode="tail">Irrigation Guide</Text>
                </TouchableOpacity>
              </View>

              {/* Row 4 */}
              <View style={styles.toolsRow}>
                <TouchableOpacity 
                  style={styles.toolCardPill}
                  onPress={() => handleQuickAsk('Pest Management')}
                >
                  <Ionicons name="bug-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                  <Text style={styles.toolNamePill} numberOfLines={1} ellipsizeMode="tail">Pest Management</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.toolCardPill}
                  onPress={() => handleQuickAsk('Expert Consultation')}
                >
                  <Ionicons name="people-outline" size={24} color="#374151" style={{ marginRight: 12 }} />
                  <Text style={styles.toolNamePill} numberOfLines={1} ellipsizeMode="tail">Expert Consultation</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Fixed Search Bar Container (only when focused and drawer closed) */}
      {isFocused && (
      <View 
        style={[
          styles.fixedSearchContainer,
          {
            bottom: Math.max(0, ((isKeyboardVisible ? keyboardHeight : TAB_BAR_OFFSET) + (insets?.bottom || 0) - 8)),
            paddingBottom: 0,
            zIndex: isDrawerOpen ? 0 : 20,
          }
        ]}
        pointerEvents={isDrawerOpen ? 'none' : 'auto'}
      >
        <View style={styles.searchContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={openImageOptions}>
            <Ionicons name="image-outline" size={24} color="#47afcfff" />
          </TouchableOpacity>

          {selectedImageUri ? (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.previewClear} onPress={clearSelectedImage}>
                <Ionicons name="close" size={16} color="#47afcfff" />
              </TouchableOpacity>
            </View>
          ) : null}

          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Ask anything ..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={openChatOnFocus}
            onSubmitEditing={() => handleSearch()}
          />

          {(searchQuery.trim() || selectedImageUri) ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSearch}>
              <Ionicons name="arrow-up" size={20} color="#47afcfff" />
            </TouchableOpacity>
          ) : (
            <Animated.View style={{ transform: [{ scale: micPulse }] }}>
              <TouchableOpacity 
                style={[
                  styles.iconButton, 
                  isListening && { backgroundColor: '#F1F5F9', borderRadius: 18 },
                  !voiceAvailable && { opacity: 0.5 }
                ]} 
                onPress={handleMicPress}
                disabled={!voiceAvailable}
              >
                <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={24} color="#47afcfff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
      )}

      {/* Location Permission Modal - Step 1 */}
      <Modal
        visible={showLocationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#3A3A3A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="location" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Allow Kisan_One1 to access this device's location?</Text>
            <View style={styles.locationOptionsRow}>
              <View style={styles.locationOption}>
                <View style={styles.locationIconCircle}>
                  <Ionicons name="location" size={28} color="#4A90E2" />
                  <View style={styles.gridOverlay} />
                </View>
                <Text style={styles.locationOptionText}>Precise</Text>
              </View>
              <View style={styles.locationOption}>
                <View style={styles.locationIconCircle}>
                  <Ionicons name="map-outline" size={28} color="#F5A623" />
                </View>
                <Text style={styles.locationOptionText}>Approximate</Text>
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.enableButton]} onPress={handleEnableLocation}>
                <Text style={styles.enableButtonText}>While using the app</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.neutralButton]} onPress={() => { setShowLocationModal(false); requestAndSetLocation(); }}>
                <Text style={styles.neutralButtonText}>Only this time</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleSkipLocation}>
                <Text style={styles.cancelButtonText}>Don't allow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Location Accuracy Modal - Step 2 */}
      <Modal
        visible={showAccuracyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccuracyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>For a better experience, your device will need to use Location Accuracy</Text>
            <Text style={styles.modalMessage}>
              The following settings should be on:{'\n\n'}
              • Device location{'\n\n'}
              • Location Accuracy, which provides more accurate location for apps and services. To do this, Google periodically processes information about device sensors and wireless signals from your device to crowdsource wireless signal locations. These are used without identifying you to improve location accuracy and location-based services and to improve, provide and maintain Google's services based on Google's and third parties' legitimate interests to serve users' needs.
            </Text>
            <Text style={styles.modalFooter}>
              You can change this at any time in location settings. <Text style={styles.linkText}>Manage settings</Text> or <Text style={styles.linkText}>learn more</Text>
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleNoThanks}>
                <Text style={styles.cancelButtonText}>No, thanks</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.enableButton]} onPress={handleTurnOnAccuracy}>
                <Text style={styles.enableButtonText}>Turn on</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Slide-in Drawer */}
      {isDrawerOpen && (
        <View style={styles.drawerOverlay}> 
          <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX: drawerTranslateX }] }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerAvatar}><Text style={{ fontSize: 22 }}>👨‍🌾</Text></View>
              <View>
                <Text style={styles.drawerTitle}>{profileName}</Text>
              </View>
            </View>

            <View style={styles.drawerMenu}>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('MyProfile'); }}>
                <Ionicons name="person-outline" size={20} color="#2E7D32" />
                <Text style={styles.drawerItemText}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('Cart'); }}>
                <Ionicons name="cart-outline" size={20} color="#2E7D32" />
                <Text style={styles.drawerItemText}>Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('Help'); }}>
                <Ionicons name="help-circle-outline" size={20} color="#2E7D32" />
                <Text style={styles.drawerItemText}>Help</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.drawerItem} onPress={() => { closeDrawer(); navigation.navigate('LanguageSelect'); }}>
                <Ionicons name="language-outline" size={20} color="#2E7D32" />
                <Text style={styles.drawerItemText}>Language</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.drawerItem, { marginTop: 12 }]} onPress={() => { closeDrawer(); handleLogout(); }}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={[styles.drawerItemText, { color: '#EF4444' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          <Animated.View style={[styles.drawerBackdrop, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} />
          </Animated.View>
        </View>
      )}

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Attach image</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.enableButton]} onPress={pickFromCamera}>
                <Text style={styles.enableButtonText}>From camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={pickFromGallery}>
                <Text style={styles.cancelButtonText}>From gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.skipButton} onPress={() => setShowImagePickerModal(false)}>
              <Text style={styles.skipButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Inline Chat Box (non-fullscreen) */}
      {isFocused && chatVisible && !isDrawerOpen && (
        <View style={[
          styles.chatSheet,
          // Keep the chat box above the search bar with a comfy margin
          { bottom: keyboardHeight + 110 + (insets?.bottom || 0), maxHeight: (global && global.__chatMaxHeight) ? global.__chatMaxHeight : undefined },
        ]}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>AI Assistant</Text>
            <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.chatCloseBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={chatScrollRef}
            style={styles.chatMessages}
            contentContainerStyle={{ padding: 12 }}
            showsVerticalScrollIndicator={true}
            onContentSizeChange={() => { try { chatScrollRef.current?.scrollToEnd({ animated: true }); } catch (_) {} }}
          >
            {chatMessages.map((m, idx) => (
              <View key={idx} style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.modelBubble]}>
                <Text style={[styles.bubbleText, m.role === 'user' ? styles.userText : styles.modelText]}>{m.text}</Text>
              </View>
            ))}
            {chatLoading ? (
              <View style={[styles.bubble, styles.modelBubble]}>
                <Text style={[styles.bubbleText, styles.modelText]}>Thinking...</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#333333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationTextEnabled: {
    color: '#10B981',
  },
  locationTextDisabled: {
    color: '#EF4444',
  },
  locationSubText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWhenKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingBottom: 24,
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
  },
  toolsContainer: {
    width: '100%',
    marginBottom: 0,
    alignItems: 'center',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    width: '100%',
  },
  toolsRowCentered: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    width: '100%',
  },
  toolCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flex: 1,
    marginHorizontal: 6,
    minWidth: 0,
  },
  toolIconPill: {
    width: 32,
    height: 32,
    marginRight: 12,
    flexShrink: 0,
  },
  toolNamePill: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    flexShrink: 1,
    minWidth: 0,
    textAlign: 'center',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 1,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#47afcfff',
  },
  fixedSearchContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 0,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 1000,
  },
  drawer: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  drawerMenu: {
    marginTop: 8,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  drawerItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  iconButton: {
    marginHorizontal: 6,
  },
  previewWrapper: {
    marginHorizontal: 6,
    width: 34,
    height: 34,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#3A3A3A',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewClear: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#47afcfff',
  },
  sendButton: {
    marginLeft: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButton: {
    marginRight: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  langButtonText: {
    color: '#47afcfff',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
    marginBottom: 16,
    width: '100%',
  },
  modalFooter: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    width: '100%',
  },
  linkText: {
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
  locationOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    marginTop: 16,
  },
  locationOption: {
    alignItems: 'center',
  },
  locationIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  locationOptionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  modalButtons: {
    width: '100%',
    gap: 10,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#333333',
    fontSize: 15,
    fontWeight: '500',
  },
  neutralButton: {
    backgroundColor: '#E5E7EB',
    borderWidth: 0,
  },
  neutralButtonText: {
    textAlign: 'center',
    color: '#333333',
    fontSize: 15,
    fontWeight: '500',
  },
  enableButton: {
    backgroundColor: '#4A90E2',
    borderWidth: 0,
  },
  enableButtonText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  skipButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  expandedMoreContainer: {
    marginTop: 12,
    width: '100%',
  },
  // Chat styles (inline sheet)
  chatSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    paddingTop: 44,
    zIndex: 30,
  },
  chatHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chatCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
  },
  chatMessages: {
    flex: 1,
  },
  bubble: {
    maxWidth: '85%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCFCE7',
  },
  modelBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#065F46',
  },
  modelText: {
    color: '#111827',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
    marginRight: 8,
  },
  chatSend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
});