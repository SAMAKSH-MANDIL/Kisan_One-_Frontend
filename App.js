import "react-native-gesture-handler";
import React from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import { ms, responsiveFontSize, responsiveSpacing } from './src/utils/responsive';
import { useLanguage } from "./src/LanguageContext";

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
import { StockProvider } from "./src/StockContext";
import { LanguageProvider } from "./src/LanguageContext";
import CropDoctorScreen from "./src/CropDoctorScreen";
import CropRecommendationScreen from "./src/CropRecommendationScreen";
import CropAdvisoryScreen from "./src/CropAdvisoryScreen";
import BrandsViewAllScreen from "./src/BrandsViewAllScreen";
import BrandDetailScreen from "./src/BrandDetailScreen";
import ProductsViewAllScreen from "./src/ProductsViewAllScreen";
import ProductDetailScreen from "./src/ProductDetailScreen";
import PostDetailScreen from "./src/PostDetailScreen";
import SchemeDetailScreen from "./src/SchemeDetailScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app screens
function MainTabNavigator() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderTopColor: '#E0E0E0',
          paddingBottom: Math.max((insets?.bottom || 0), responsiveSpacing(8, 0.4)),
          // Provide internal spacing so items don't touch the divider
          paddingTop: responsiveSpacing(2, 0.4),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 6,
        },
        // Keep items compact and visually separated from the bar
        tabBarItemStyle: { paddingVertical: 0, marginTop: 0 },
        tabBarLabelStyle: {
          fontSize: responsiveFontSize(12, 0.4),
          fontWeight: '500',
          // Reduce gap between icon and label for a tighter stack
          marginTop: responsiveSpacing(-5, 0.4),
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={ms(20, 0.4)} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AI Tools"
        component={AIToolsScreen}
        options={{
          tabBarLabel: t('aiTools'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={ms(20, 0.4)} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GrowBio"
        component={GrowBioScreen}
        options={{
          tabBarLabel: t('growBio'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={ms(20, 0.4)} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="My Orders"
        component={MyOrdersScreen}
        options={{
          tabBarLabel: t('myOrders'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={ms(20, 0.4)} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Info"
        component={InfoScreen}
        options={{
          tabBarLabel: t('info'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={ms(20, 0.4)} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  // Cap global font scale to prevent extreme overlaps while keeping accessibility reasonable
  if (Text && Text.defaultProps == null) {
    Text.defaultProps = {};
  }
  if (Text) {
    Text.defaultProps.maxFontSizeMultiplier = 1.3;
  }
  return (
    <LanguageProvider>
    <SafeAreaProvider>
    <NavigationContainer>
      <StockProvider>
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
        <Stack.Screen
          name="CropRecommendation"
          component={CropRecommendationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CropAdvisory"
          component={CropAdvisoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BrandsViewAll"
          component={BrandsViewAllScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BrandDetail"
          component={BrandDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProductsViewAll"
          component={ProductsViewAllScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SchemeDetail"
          component={SchemeDetailScreen}
          options={{ headerShown: false }}
        />
        
      </Stack.Navigator>
      </CartProvider>
      </OrdersProvider>
      </StockProvider>
    </NavigationContainer>
    </SafeAreaProvider>
    </LanguageProvider>
  );
}




