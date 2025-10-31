import "react-native-gesture-handler";
import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';

// Import screens
import SplashScreen from "./src/SplashScreen";
import LanguageSelection from "./src/LanguageSelection";
import Login from "./src/Login";
import Detail from "./src/Detail";
import HomeScreen from "./src/HomeScreen";
import AIToolsScreen from "./src/AIToolsScreen";
import GrowBioScreen from "./src/GrowBioScreen";
import MyOrdersScreen from "./src/MyOrdersScreen";
import InfoScreen from "./src/InfoScreen";
import MyProfileScreen from "./src/MyProfileScreen";
import HelpScreen from "./src/HelpScreen";
import LanguageSelectScreen from "./src/LanguageSelectScreen";
import CartScreen from "./src/CartScreen";
import { CartProvider } from "./src/CartContext";
import { OrdersProvider } from "./src/OrdersContext";
import CropDoctorScreen from "./src/CropDoctorScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AI Tools"
        component={AIToolsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GrowBio"
        component={GrowBioScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="My Orders"
        component={MyOrdersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Info"
        component={InfoScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <OrdersProvider>
      <CartProvider>
      <Stack.Navigator initialRouteName="SplashScreen">
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelection}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Detail"
          component={Detail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Dashboard"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyProfile"
          component={MyProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LanguageSelect"
          component={LanguageSelectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CropDoctor"
          component={CropDoctorScreen}
          options={{ headerShown: false }}
        />
        
      </Stack.Navigator>
      </CartProvider>
      </OrdersProvider>
    </NavigationContainer>
  );
}




