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
import { useLanguage } from './LanguageContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const scale = (size) => (screenWidth / 375) * size;
const verticalScale = (size) => (screenHeight / 667) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const otpRefs = useRef([]);
    const insets = useSafeAreaInsets();
    const { t } = useLanguage();

    const authInstance = useMemo(() => auth(), []);
    const firestoreInstance = useMemo(() => firestore(), []);

    const signInWithPhoneNumber = async () => {
        const cleanedPhone = phoneNumber.trim().replace(/\D/g, '');
        
        if (!cleanedPhone) {
            Alert.alert("Error", "Please enter your phone number");
            return;
        }
        
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
            const formattedPhoneNumber = `+91${cleanedPhone}`;
            
            if (!authInstance) {
                throw new Error('Firebase Auth is not initialized. Please rebuild the app.');
            }
            
            console.log('Sending OTP to:', formattedPhoneNumber);
            const confirmation = await authInstance.signInWithPhoneNumber(formattedPhoneNumber);
            
            if (!confirmation) {
                throw new Error('No confirmation object received from Firebase');
            }
            
            setConfirm(confirmation);
            setOtpDigits(['', '', '', '', '', '']);
            
            Alert.alert(
                "Code Sent", 
                "Verification code has been sent to your phone number.\n\nPlease check your SMS inbox."
            );
        } catch (error) {
            console.error('Firebase Auth Error:', error);
            
            let errorMessage = "Failed to send verification code. Please try again.";
            let errorTitle = "Error";
            
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
                        errorMessage = "Phone authentication is not enabled in Firebase Console.";
                        break;
                    default:
                        errorMessage = `Error: ${error.code}\n${error?.message || 'Please try again.'}`;
                        break;
                }
            }
            
            Alert.alert(errorTitle, errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const confirmCode = async () => {
        const fullCode = otpDigits.join('');
        
        if (fullCode.length !== 6) {
            Alert.alert("Incomplete Code", "Please enter all 6 digits of the verification code");
            return;
        }
        
        if (!/^\d{6}$/.test(fullCode)) {
            Alert.alert("Invalid Code", "Please enter only numbers");
            return;
        }
        
        setLoading(true);
        try {
            console.log('Verifying OTP:', fullCode);
            console.log('Confirmation object exists:', !!confirm);
            
            if (!confirm) {
                throw new Error('No confirmation object. Please request a new code.');
            }
            
            const userCredential = await confirm.confirm(fullCode);
            const user = userCredential.user;

            console.log('OTP verified successfully, user:', user.uid);

            // Check if user profile exists, if not navigate to Detail screen
            try {
                const userDoc = await firestoreInstance.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                
                // Small delay to ensure navigation is ready
                setTimeout(() => {
                    try {
                        // If user doesn't have name, navigate to Detail screen to complete profile
                        if (!userData || !userData.name) {
                            console.log('User profile incomplete, navigating to Detail screen');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Detail', params: { uid: user.uid } }],
                            });
                        } else {
                            // User profile complete, navigate to Dashboard (Home tab)
                            console.log('User profile complete, navigating to Dashboard');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Dashboard' }],
                            });
                        }
                    } catch (navError) {
                        console.error('Navigation error:', navError);
                        // Fallback: simple navigate
                        try {
                            navigation.navigate('Dashboard');
                        } catch (fallbackError) {
                            console.error('Fallback navigation also failed:', fallbackError);
                        }
                    }
                }, 100);
            } catch (error) {
                console.error('Error checking user profile:', error);
                // On error, still navigate to Dashboard with delay
                setTimeout(() => {
                    try {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Dashboard' }],
                        });
                    } catch (navError) {
                        console.error('Navigation error after profile check failed:', navError);
                        try {
                            navigation.navigate('Dashboard');
                        } catch (fallbackError) {
                            console.error('Fallback navigation also failed:', fallbackError);
                        }
                    }
                }, 100);
            }
        } catch (error) {
            console.error('OTP Verification Error:', error);
            console.error('Error code:', error?.code);
            console.error('Error message:', error?.message);
            
            let errorMessage = "Invalid verification code. Please try again.";
            let errorTitle = "Verification Failed";
            
            if (error?.code === 'auth/invalid-verification-code') {
                errorMessage = "The verification code is incorrect. Please check and try again.";
            } else if (error?.code === 'auth/code-expired') {
                errorTitle = "Code Expired";
                errorMessage = "The verification code has expired. Please request a new code.";
                setConfirm(null);
                setOtpDigits(['', '', '', '', '', '']);
            } else if (error?.code === 'auth/session-expired') {
                errorTitle = "Session Expired";
                errorMessage = "Your verification session has expired. Please request a new code.";
                setConfirm(null);
                setOtpDigits(['', '', '', '', '', '']);
            } else if (error?.code === 'firestore/permission-denied') {
                errorTitle = "Permission Error";
                errorMessage = "Database permission error. Please update Firestore security rules.";
            } else if (error?.message && !error?.message.includes('No confirmation object')) {
                errorMessage = error.message;
            }
            
            Alert.alert(errorTitle, errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (text, index) => {
        const digit = text.slice(-1);
        
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = digit;
        setOtpDigits(newOtpDigits);
        
        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                otpRefs.current[index - 1]?.focus();
            }
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
                            {!confirm ? t('welcomeToKisanOne') : t('verifyYourNumber')}
                        </Text>
                        <Text style={styles.subtitleText}>
                            {!confirm 
                                ? t('enterPhoneNumber')
                                : t('enterVerificationCode')
                            }
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        {!confirm ? (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>{t('phoneNumber')}</Text>
                                    <View style={styles.phoneInputContainer}>
                                        <View style={styles.countryCode}>
                                            <Text style={styles.countryCodeText}>+91</Text>
                                        </View>
                                        <TextInput
                                            style={styles.phoneInput}
                                            value={phoneNumber}
                                            onChangeText={(text) => {
                                                const digits = text.replace(/\D/g, '').slice(0, 10);
                                                setPhoneNumber(digits);
                                            }}
                                            keyboardType="phone-pad"
                                            autoFocus
                                            placeholder={t('enter10DigitNumber')}
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
                                        {loading ? t('sending') : t('sendVerificationCode')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => navigation.navigate('LanguageSelection')}
                                    style={styles.backButton}
                                >
                                    <Text style={styles.backButtonText}>{t('backToLanguageSelection')}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>{t('verificationCode')}</Text>
                                    <View style={styles.otpContainer}>
                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => (otpRefs.current[index] = ref)}
                                                style={[
                                                    styles.otpBox,
                                                    otpDigits[index] && styles.otpBoxFilled
                                                ]}
                                                value={otpDigits[index]}
                                                onChangeText={(text) => handleOtpChange(text, index)}
                                                onKeyPress={(e) => handleKeyPress(e, index)}
                                                keyboardType="numeric"
                                                maxLength={1}
                                                autoFocus={index === 0}
                                                selectTextOnFocus
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
                                        {loading ? t('verifying') : t('verifyCode')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => {
                                        setConfirm(null);
                                        setOtpDigits(['', '', '', '', '', '']);
                                    }}
                                    style={styles.resendButton}
                                >
                                    <Text style={styles.resendButtonText}>{t('resendCode')}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {t('termsAndPrivacy')}
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
        backgroundColor: '#0e7c36',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(12),
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
        color: '#0e7c36',
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
    otpBoxFilled: {
        borderColor: '#0e7c36',
        backgroundColor: '#E8F5E8',
    },
    button: {
        backgroundColor: '#0e7c36',
        height: Math.max(verticalScale(50), 50),
        borderRadius: moderateScale(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: verticalScale(12),
        paddingHorizontal: scale(16),
        shadowColor: '#0e7c36',
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
        color: '#0e7c36',
        fontSize: moderateScale(15),
        fontWeight: '500',
    },
    backButton: {
        marginTop: verticalScale(12),
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    backButtonText: {
        color: '#0e7c36',
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