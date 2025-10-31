import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import auth from "@react-native-firebase/auth";
import { useNavigation } from "@react-navigation/native";

export default function Dashboard() {
    const navigation = useNavigation();

    const handleLogout = async () => {
        try {
            await auth().signOut();

            //Reset the navigation stack to Login and remove the OTP-related screens
            navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
            });
        } catch (error) {
            console.log("Error during logout: ", error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
            
            <Text style={styles.title}>
                Welcome to KisanOne Dashboard
            </Text>
            
            <Text style={styles.subtitle}>
                You are successfully logged in!
            </Text>

            <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutButton}
            >
                <Text style={styles.logoutButtonText}>
                    Logout
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
    },
    logoutButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#FF6B6B',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});