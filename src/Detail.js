import React, { useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function Detail({ route }) {
    const navigation = useNavigation();
    const { uid } = route.params || {};
    
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [loading, setLoading] = useState(false);

    // Validate inputs
    const validateInputs = () => {
        if (!name.trim()) {
            Alert.alert("Missing Information", "Please enter your full name");
            return false;
        }
        
        if (!dob.trim()) {
            Alert.alert("Missing Information", "Please enter your date of birth");
            return false;
        }
        
        if (!gender.trim()) {
            Alert.alert("Missing Information", "Please select your gender");
            return false;
        }
        
        return true;
    };

    const saveDetails = async () => {
        // Validate inputs first
        if (!validateInputs()) {
            return;
        }

        // Check if uid exists
        if (!uid) {
            Alert.alert("Error", "User ID not found. Please try logging in again.");
            return;
        }

        setLoading(true);
        try {
            console.log('Saving user details for UID:', uid);
            
            // Save to Firestore
            await firestore()
                .collection("users")
                .doc(uid)
                .set({
                    name: name.trim(),
                    dob: dob.trim(),
                    gender: gender.trim(),
                    createdAt: firestore.FieldValue.serverTimestamp(),
                    updatedAt: firestore.FieldValue.serverTimestamp(),
                }, { merge: true }); // Use merge to avoid overwriting existing data

            console.log('User details saved successfully');

            // Show success message
            Alert.alert(
                "Profile Complete!",
                "Your profile has been set up successfully.",
                [
                    {
                        text: "Continue",
                        onPress: () => {
                            // Navigate to Home (not Dashboard)
                            // Use reset to prevent going back to this screen
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            });
                        }
                    }
                ]
            );

        } catch (error) {
            console.error("Error saving details:", error);
            console.error("Error code:", error?.code);
            console.error("Error message:", error?.message);
            
            let errorMessage = "Failed to save your profile. Please try again.";
            
            if (error?.code === 'firestore/permission-denied') {
                errorMessage = "Permission denied. Please check Firestore security rules.";
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
            
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>Complete Your Profile</Text>
                        <Text style={styles.subtitle}>
                            Please provide your basic information to get started
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Enter your full name"
                                placeholderTextColor="#999999"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Date of Birth *</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="DD/MM/YYYY"
                                placeholderTextColor="#999999"
                                value={dob}
                                onChangeText={setDob}
                                keyboardType="numeric"
                                maxLength={10}
                                editable={!loading}
                            />
                            <Text style={styles.helperText}>Example: 15/08/1990</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Gender *</Text>
                            <View style={styles.genderContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        gender === 'Male' && styles.genderButtonActive
                                    ]}
                                    onPress={() => setGender('Male')}
                                    disabled={loading}
                                >
                                    <Text style={[
                                        styles.genderButtonText,
                                        gender === 'Male' && styles.genderButtonTextActive
                                    ]}>Male</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        gender === 'Female' && styles.genderButtonActive
                                    ]}
                                    onPress={() => setGender('Female')}
                                    disabled={loading}
                                >
                                    <Text style={[
                                        styles.genderButtonText,
                                        gender === 'Female' && styles.genderButtonTextActive
                                    ]}>Female</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={[
                                        styles.genderButton,
                                        gender === 'Other' && styles.genderButtonActive
                                    ]}
                                    onPress={() => setGender('Other')}
                                    disabled={loading}
                                >
                                    <Text style={[
                                        styles.genderButtonText,
                                        gender === 'Other' && styles.genderButtonTextActive
                                    ]}>Other</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={saveDetails}
                            style={[styles.button, loading && styles.buttonDisabled]}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Complete Profile</Text>
                            )}
                        </TouchableOpacity>
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
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0e7c36',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 8,
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
    helperText: {
        fontSize: 12,
        color: '#999999',
        marginTop: 6,
        marginLeft: 4,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    genderButton: {
        flex: 1,
        height: 56,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    genderButtonActive: {
        borderColor: '#0e7c36',
        backgroundColor: '#E8F5E8',
    },
    genderButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666666',
    },
    genderButtonTextActive: {
        color: '#0e7c36',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#0e7c36',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
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
        fontSize: 18,
        fontWeight: '600',
    },
});