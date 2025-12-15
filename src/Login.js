import React, { useState, useRef, useMemo } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    SafeAreaView, 
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    Dimensions,
    ScrollView
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get device dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size) => (screenWidth / 375) * size; // Base width is 375 (iPhone 6/7/8)
const verticalScale = (size) => (screenHeight / 667) * size; // Base height is 667 (iPhone 6/7/8)
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [code, setCode] = useState("");
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const otpRefs = useRef([]);
    const insets = useSafeAreaInsets();

    // Get auth and firestore instances once using useMemo to avoid deprecation warnings
    const authInstance = useMemo(() => auth(), []);
    const firestoreInstance = useMemo(() => firestore(), []);

    const signInWithPhoneNumber = async () => {
        // Clean phone number: remove all non-digit characters
        const cleanedPhone = phoneNumber.trim().replace(/\D/g, '');
        
        if (!cleanedPhone) {
            Alert.alert("Error", "Please enter your phone number");
            return;
        }
        
        // Validate Indian phone number (10 digits, not starting with 0 or 1)
        if (cleanedPhone.length !== 10) {
            Alert.alert("Invalid Phone Number", "Please enter a valid 10-digit phone number");
            return;
        }
        
        if (cleanedPhone[0] === '0' || cleanedPhone[0] === '1') {
            Alert.alert("Invalid Phone Number", "Phone number cannot start with 0 or 1");
            return;
        }
        
        setLoading(true);
        try {
            // Format phone number in E.164 format: +[country code][subscriber number]
            // India country code is 91, subscriber number is 10 digits
            const formattedPhoneNumber = `+91${cleanedPhone}`;
            
            // Verify auth instance exists
            if (!authInstance) {
                throw new Error('Firebase Auth is not initialized. Please rebuild the app.');
            }
            
            console.log('====================================');
            console.log('Firebase Auth Debug Info:');
            console.log('Phone Number:', formattedPhoneNumber);
            console.log('Auth Instance:', authInstance ? 'Initialized' : 'Not Initialized');
            console.log('Auth Instance Type:', typeof authInstance);
            console.log('SignInWithPhoneNumber Method:', typeof authInstance.signInWithPhoneNumber);
            console.log('====================================');
            
            // Use the memoized auth instance
            console.log('Calling signInWithPhoneNumber...');
            const confirmation = await authInstance.signInWithPhoneNumber(formattedPhoneNumber);
            
            console.log('Confirmation received:', confirmation ? 'Yes' : 'No');
            console.log('Confirmation object:', confirmation);
            
            if (!confirmation) {
                throw new Error('No confirmation object received from Firebase');
            }
            
            setConfirm(confirmation);
            
            Alert.alert(
                "Code Sent", 
                "Verification code has been sent to your phone number.\n\nPlease check your SMS inbox."
            );
        } catch (error) {
            console.error('====================================');
            console.error('Firebase Auth Error Details:');
            console.error('Error Object:', error);
            console.error('Error Type:', typeof error);
            console.error('Error Code:', error?.code);
            console.error('Error Message:', error?.message);
            console.error('Error Stack:', error?.stack);
            console.error('Full Error:', JSON.stringify(error, null, 2));
            console.error('====================================');
            
            let errorMessage = "Failed to send verification code. Please try again.";
            let errorTitle = "Error";
            let showDetailedInfo = false;
            
            // Handle specific Firebase Auth errors
            if (error?.code) {
                switch (error.code) {
                    case 'auth/invalid-phone-number':
                        errorTitle = "Invalid Phone Number";
                        errorMessage = "The phone number format is invalid. Please enter a valid 10-digit Indian phone number.";
                        break;
                    case 'auth/too-many-requests':
                        errorTitle = "Too Many Requests";
                        errorMessage = "Too many verification attempts. Please wait a few minutes before trying again.";
                        break;
                    case 'auth/quota-exceeded':
                        errorTitle = "Quota Exceeded";
                        errorMessage = "SMS quota exceeded. Please try again later or contact support.";
                        break;
                    case 'auth/network-request-failed':
                        errorTitle = "Network Error";
                        errorMessage = "Network connection failed. Please check your internet connection and try again.";
                        break;
                    case 'auth/operation-not-allowed':
                        errorTitle = "Operation Not Allowed";
                        errorMessage = "Phone authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method > Phone.";
                        showDetailedInfo = true;
                        break;
                    case 'auth/captcha-check-failed':
                        errorTitle = "Verification Failed";
                        errorMessage = "Captcha verification failed. Please try again.";
                        break;
                    default:
                        errorMessage = `Error: ${error.code || 'Unknown error'}\n${error?.message || 'Please check Firebase configuration.'}`;
                        showDetailedInfo = true;
                        break;
                }
            } else if (error?.message) {
                // Check for common setup issues
                if (error.message.includes('not initialized') || error.message.includes('native module')) {
                    errorTitle = "Firebase Not Configured";
                    errorMessage = "Firebase Auth is not properly initialized. Please:\n\n1. Rebuild the app: npx expo run:android\n2. Ensure Firebase plugins are installed\n3. Check google-services.json is correct";
                } else {
                    errorMessage = error.message;
                }
                showDetailedInfo = true;
            }
            
            // Show detailed error info in console for debugging
            if (showDetailedInfo) {
                console.error('Troubleshooting Steps:');
                console.error('1. Check Firebase Console: https://console.firebase.google.com');
                console.error('2. Enable Phone Authentication in: Authentication > Sign-in method > Phone');
                console.error('3. For Android: Add SHA-1 certificate in Project Settings > Your App');
                console.error('4. Rebuild the app: npx expo run:android');
                console.error('5. Ensure google-services.json is in android/app/ directory');
            }
            
            Alert.alert(errorTitle, errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const confirmCode = async () => {
        if (!code.trim()) {
            Alert.alert("Error", "Please enter the verification code");
            return;
        }
        
        setLoading(true);
        try {
            const userCredential = await confirm.confirm(code);
            const user = userCredential.user;

            //check if the user is new or existing
            const userDocument = await firestoreInstance
                .collection("users")
                .doc(user.uid)
                .get();

            if (userDocument.exists) {
                // user is existing, go to Dashboard (Splash will keep them logged in next opens)
                navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
            } else {
                //user is new,navigate to detail
                navigation.navigate("Detail", { uid: user.uid });
            }
        } catch (error) {
            console.log("Invalid code.", error);
            Alert.alert("Error", "Invalid verification code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: Math.max(insets?.bottom || 0, verticalScale(20)) + verticalScale(40) }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={[
                        styles.header,
                        { paddingTop: Math.max(insets?.top || 0, verticalScale(10)) }
                    ]}>
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
                        <Text style={styles.welcomeText}>
                            {!confirm ? "Welcome to Kisan One" : "Verify Your Number"}
                        </Text>
                        <Text style={styles.subtitleText}>
                            {!confirm 
                                ? "Enter your phone number to continue" 
                                : "Enter the verification code sent to your phone"
                            }
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {!confirm ? (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <View style={styles.phoneInputContainer}>
                                        <View style={styles.countryCode}>
                                            <Text style={styles.countryCodeText}>+91</Text>
                                        </View>
                                        <TextInput
                                            style={styles.phoneInput}
                                            value={phoneNumber}
                                            onChangeText={(text) => {
                                                // Only allow digits and limit to 10 digits
                                                const digits = text.replace(/\D/g, '').slice(0, 10);
                                                setPhoneNumber(digits);
                                            }}
                                            keyboardType="phone-pad"
                                            autoFocus
                                            placeholder="Enter 10-digit number"
                                            placeholderTextColor="#999999"
                                            autoCorrect={false}
                                            autoCapitalize="none"
                                            underlineColorAndroid="transparent"
                                            maxLength={10}
                                        />
                                    </View>
                                </View>
                                
                                <TouchableOpacity
                                    onPress={signInWithPhoneNumber}
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? "Sending..." : "Send Verification Code"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => navigation.navigate('LanguageSelection')}
                                    style={styles.backButton}
                                >
                                    <Text style={styles.backButtonText}>Back to Language Selection</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Verification Code</Text>
                                    <View style={styles.otpContainer}>
                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => (otpRefs.current[index] = ref)}
                                                style={styles.otpBox}
                                                value={code[index] || ''}
                                                onChangeText={(text) => {
                                                    const newCode = code.split('');
                                                    newCode[index] = text;
                                                    const updatedCode = newCode.join('');
                                                    setCode(updatedCode);
                                                    
                                                    // Auto-focus next box
                                                    if (text && index < 5) {
                                                        otpRefs.current[index + 1]?.focus();
                                                    }
                                                }}
                                                onKeyPress={({ nativeEvent }) => {
                                                    if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
                                                        otpRefs.current[index - 1]?.focus();
                                                    }
                                                }}
                                                keyboardType="numeric"
                                                maxLength={1}
                                                autoFocus={index === 0}
                                            />
                                        ))}
                                    </View>
                                </View>
                                
                                <TouchableOpacity
                                    onPress={confirmCode}
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? "Verifying..." : "Verify Code"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setConfirm(null)}
                                    style={styles.resendButton}
                                >
                                    <Text style={styles.resendButtonText}>Resend Code</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            By continuing, you agree to our Terms of Service and Privacy Policy
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: verticalScale(40),
    },
    header: {
        alignItems: 'center',
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(20),
        paddingHorizontal: scale(20),
        minHeight: verticalScale(180),
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    logoPlaceholder: {
        width: Math.min(scale(80), screenWidth * 0.2),
        height: Math.min(scale(80), screenWidth * 0.2),
        borderRadius: Math.min(scale(40), screenWidth * 0.1),
        backgroundColor: '#2E7D32',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    logoText: {
        fontSize: moderateScale(40),
    },
    logoImage: {
        width: '100%',
        height: '100%',
        borderRadius: Math.min(scale(40), screenWidth * 0.1),
        borderWidth: 1,
        borderColor: 'green',
    },
    wordmark: {
        width: Math.min(scale(260), screenWidth * 0.7),
        height: verticalScale(48),
        marginTop: verticalScale(4),
        maxWidth: '90%',
    },
    appName: {
        fontSize: moderateScale(28),
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    welcomeText: {
        fontSize: moderateScale(22),
        fontWeight: '600',
        color: '#333333',
        marginBottom: verticalScale(8),
        textAlign: 'center',
        paddingHorizontal: scale(10),
    },
    subtitleText: {
        fontSize: moderateScale(14),
        color: '#666666',
        textAlign: 'center',
        lineHeight: moderateScale(20),
        paddingHorizontal: scale(10),
    },
    formContainer: {
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(10),
        paddingBottom: verticalScale(10),
    },
    inputContainer: {
        marginBottom: verticalScale(20),
    },
    inputLabel: {
        fontSize: moderateScale(15),
        fontWeight: '500',
        color: '#333333',
        marginBottom: verticalScale(8),
    },
    textInput: {
        height: Math.max(verticalScale(50), 50),
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(16),
        fontSize: moderateScale(16),
        backgroundColor: '#F8F9FA',
        color: '#333333',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: moderateScale(12),
        borderWidth: 2,
        borderColor: '#E0E0E0',
        height: Math.max(verticalScale(50), 50),
        overflow: 'hidden',
    },
    countryCode: {
        backgroundColor: '#E8F5E8',
        paddingHorizontal: scale(12),
        paddingVertical: verticalScale(14),
        borderTopLeftRadius: moderateScale(10),
        borderBottomLeftRadius: moderateScale(10),
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        minWidth: scale(50),
        justifyContent: 'center',
        alignItems: 'center',
    },
    countryCodeText: {
        fontSize: moderateScale(15),
        fontWeight: '600',
        color: '#2E7D32',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: scale(12),
        fontSize: moderateScale(16),
        color: '#333333',
        textAlignVertical: 'center',
        includeFontPadding: false,
        lineHeight: moderateScale(20),
        minWidth: 0,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: verticalScale(8),
        paddingHorizontal: scale(2),
        flexWrap: 'wrap',
    },
    otpBox: {
        width: Math.min(scale(48), (screenWidth - scale(60)) / 6 - scale(4)),
        height: Math.max(verticalScale(50), 50),
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: moderateScale(12),
        textAlign: 'center',
        fontSize: moderateScale(18),
        fontWeight: 'bold',
        backgroundColor: '#F8F9FA',
        color: '#333333',
        marginHorizontal: scale(2),
        minWidth: 40,
    },
    button: {
        backgroundColor: '#2E7D32',
        height: Math.max(verticalScale(50), 50),
        borderRadius: moderateScale(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: verticalScale(12),
        paddingHorizontal: scale(16),
        shadowColor: '#2E7D32',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: moderateScale(16),
        fontWeight: '600',
        textAlign: 'center',
    },
    resendButton: {
        marginTop: verticalScale(16),
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    resendButtonText: {
        color: '#2E7D32',
        fontSize: moderateScale(15),
        fontWeight: '500',
    },
    backButton: {
        marginTop: verticalScale(12),
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    backButtonText: {
        color: '#2E7D32',
        fontSize: moderateScale(15),
        fontWeight: '500',
        textDecorationLine: 'underline',
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(10),
        marginTop: verticalScale(10),
    },
    footerText: {
        fontSize: moderateScale(11),
        color: '#999999',
        textAlign: 'center',
        lineHeight: moderateScale(16),
        paddingHorizontal: scale(10),
    },
});