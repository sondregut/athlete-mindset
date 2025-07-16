import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import AppWrapper from "@/components/AppWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthProvider from "@/components/AuthProvider";
import { useAuthStore } from "@/store/auth-store";
import { firebaseNotifications } from '@/services/firebase-notifications';
import { useSessionStore } from '@/store/session-store';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import NetworkStatusBanner from "@/components/NetworkStatusBanner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemedStatusBar from "@/components/ThemedStatusBar";
import ThemedStack from "@/components/ThemedStack";
import { logger } from "@/utils/logger";
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

  logger.debug('📱 RootLayout render:', { loaded, error });

  useEffect(() => {
    if (error) {
      logger.critical('❌ Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      logger.debug('✅ Fonts loaded, waiting for auth initialization before hiding splash screen');
      // Don't hide splash screen yet - wait for auth initialization
    }
  }, [loaded]);

  useEffect(() => {
    // Initialize Firebase auth state listener
    logger.debug('🔥 Initializing Firebase auth...');
    const unsubscribe = initializeAuth();
    
    // Setup notification listeners
    firebaseNotifications.setupListeners(
      // Handler for notifications received while app is foregrounded
      (notification) => {
        logger.debug('📬 Notification received:', notification);
      },
      // Handler for when user interacts with a notification
      async (response) => {
        logger.debug('👆 Notification tapped:', response);
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        switch (data.type) {
          case 'daily_reminder':
            router.push('/log-session');
            break;
          case 'weekly_goal':
            router.push('/goals');
            break;
          case 'streak_motivation':
            router.push('/(tabs)/profile');
            break;
          case 'missed_session':
            router.push('/log-session');
            break;
          default:
            router.push('/(tabs)');
        }
      }
    );
    
    return () => {
      if (unsubscribe) unsubscribe();
      firebaseNotifications.removeListeners();
    };
  }, []);

  if (!loaded) {
    logger.debug('⏳ Fonts not loaded yet, showing null');
    return null;
  }

  logger.debug('🚀 Fonts loaded, rendering RootLayoutNav');
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  logger.debug('🎯 RootLayoutNav render');
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppWrapper>
            <ThemedStatusBar />
            <NetworkStatusBanner />
            <ThemedStack />
          </AppWrapper>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}