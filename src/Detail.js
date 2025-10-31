import React, { useState } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    SafeAreaView, 
    StatusBar,
    StyleSheet 
} from "react-native";
import firestore from "@react-native-firebase/firestore";

export default function Detail({ route, navigation }) {
    const { uid } = route.params;
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");

    const saveDetails = async () => {
        try {
            await firestore().collection("users").doc(uid).set({
                name,
                dob,
                gender,
            });

            //after saving details, navigate to dashboard
            navigation.navigate("Dashboard");
        } catch (error) {
            console.log("Error saving details: ", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
            
            <Text style={styles.title}>
                Complete Your Profile
            </Text>
            
            <Text style={styles.subtitle}>
                Please provide your basic information to get started
            </Text>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your full name"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Date of Birth</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="DD/MM/YYYY"
                        value={dob}
                        onChangeText={setDob}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Gender</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Male/Female/Other"
                        value={gender}
                        onChangeText={setGender}
                    />
                </View>

                <TouchableOpacity
                    onPress={saveDetails}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>
                        Complete Profile
                    </Text>
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 40,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
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
    button: {
        backgroundColor: '#2E7D32',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#2E7D32',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});