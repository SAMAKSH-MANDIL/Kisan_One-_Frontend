import React, { useState, useRef } from "react";
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
    Image
} from "react-native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function Login() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [code, setCode] = useState("");
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const otpRefs = useRef([]);

    const signInWithPhoneNumber = async () => {
        if (!phoneNumber.trim()) {
            Alert.alert("Error", "Please enter your phone number");
            return;
        }
        
        setLoading(true);
        try {
            // Format phone number with +91 prefix
            const formattedPhoneNumber = `+91${phoneNumber}`;
            const confirmation = await auth().signInWithPhoneNumber(formattedPhoneNumber);
            setConfirm(confirmation);
        } catch (error) {
            console.log("Error sending code: ", error);
            Alert.alert("Error", "Failed to send verification code. Please try again.");
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
            const userDocument = await firestore()
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
            >
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
                                        onChangeText={setPhoneNumber}
                                        keyboardType="phone-pad"
                                        autoFocus
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
    header: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2E7D32',
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop:15,
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 5,
    },
    textInput: {
        height: 56,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
        color: '#333333',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        height: 56,
    },
    countryCode: {
        backgroundColor: '#E8F5E8',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E7D32',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#333333',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    otpBox: {
        width: 45,
        height: 56,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        backgroundColor: '#F8F9FA',
        color: '#333333',
        marginHorizontal: 2,
    },
    button: {
        backgroundColor: '#2E7D32',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
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
        fontSize: 18,
        fontWeight: '600',
    },
    resendButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    resendButtonText: {
        color: '#2E7D32',
        fontSize: 16,
        fontWeight: '500',
    },
    backButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#2E7D32',
        fontSize: 16,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    footerText: {
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 18,
    },
});