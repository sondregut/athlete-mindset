import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/constants/colors";
import AppWrapper from "@/components/AppWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthProvider from "@/components/AuthProvider";
import { useAuthStore } from "@/store/auth-store";
// Firebase will be initialized when first used

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const { initialize: initializeAuth } = useAuthStore();

  console.log('📱 RootLayout render:', { loaded, error });

  useEffect(() => {
    if (error) {
      console.error('❌ Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('✅ Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // Initialize Firebase auth state listener
    console.log('🔥 Initializing Firebase auth...');
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (!loaded) {
    console.log('⏳ Fonts not loaded yet, showing null');
    return null;
  }

  console.log('🚀 Fonts loaded, rendering RootLayoutNav');
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  console.log('🎯 RootLayoutNav render');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppWrapper>
          <StatusBar style="dark" />
          <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: colors.lightGray,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="onboarding" 
            options={{ 
              headerShown: false,
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen 
            name="activity" 
            options={{ 
              title: "Activity History",
              animation: "slide_from_right",
            }} 
          />
          <Stack.Screen 
            name="session-detail" 
            options={{ 
              title: "Session Details",
              animation: "slide_from_right",
            }} 
          />
          <Stack.Screen 
            name="notification-settings" 
            options={{ 
              title: "Notifications",
              animation: "slide_from_right",
            }} 
          />
          <Stack.Screen 
            name="analytics" 
            options={{ 
              title: "Analytics",
              animation: "slide_from_right",
            }} 
          />
          <Stack.Screen 
            name="mindset-history" 
            options={{ 
              title: "History",
              animation: "slide_from_right",
            }} 
          />
        </Stack>
        </AppWrapper>
      </AuthProvider>
    </ErrorBoundary>
  );
}