import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Slot, router } from 'expo-router';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useNotifications } from '@/hooks/useNotifications';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PersonalizationPreloader } from '@/services/personalization-preloader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalizationProfile } from '@/types/personalization-profile';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { hasCompletedOnboarding, isHydrated, resetOnboarding } = useOnboardingStore();
  const [isReady, setIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceNavigation, setForceNavigation] = useState(false);
  const colors = useThemeColors();
  
  // Initialize notifications with error handling
  try {
    useNotifications();
  } catch (notificationError) {
    console.error('❌ Notification initialization error:', notificationError);
  }

  console.log('🚀 AppWrapper render:', {
    isHydrated,
    hasCompletedOnboarding,
    isReady,
    hasNavigated,
    error
  });

  // Removed auto-reset for better performance
  
  // Check for personalization profile and start preloading if needed
  useEffect(() => {
    const checkAndPreload = async () => {
      try {
        const profileStr = await AsyncStorage.getItem('userPersonalizationProfile');
        if (profileStr) {
          const profile: PersonalizationProfile = JSON.parse(profileStr);
          if (profile.is_personalization_enabled) {
            const preloader = PersonalizationPreloader.getInstance();
            
            // Check if content needs regeneration (profile changed)
            const needsRegen = await preloader.needsRegeneration(profile);
            if (needsRegen) {
              console.log('📥 Starting background content preload for changed profile...');
              preloader.preloadAllContent(profile, (progress, message) => {
                console.log(`[Preloader] ${progress}%: ${message}`);
              }).catch(error => {
                console.error('Background preload error:', error);
              });
            } else {
              console.log('✅ Personalized content already up to date');
            }
          }
        }
      } catch (error) {
        console.error('Error checking personalization profile:', error);
      }
    };
    
    if (hasCompletedOnboarding && isHydrated) {
      checkAndPreload();
    }
  }, [hasCompletedOnboarding, isHydrated]);

  useEffect(() => {
    console.log('🔄 AppWrapper useEffect triggered:', {
      isHydrated,
      hasCompletedOnboarding,
      hasNavigated
    });

    // Only proceed when store is hydrated
    if (!isHydrated) {
      console.log('⏳ Waiting for store hydration...');
      return;
    }

    // Prevent multiple navigations
    if (hasNavigated) {
      console.log('🚫 Already navigated, skipping...');
      return;
    }

    console.log('📱 Store hydrated, determining navigation...');
    
    // Immediate navigation without delay
    try {
      console.log('🎯 Setting ready state and navigation...');
      setIsReady(true);
      setHasNavigated(true);
      
      // Hide splash screen when ready
      import('expo-splash-screen').then(SplashScreen => {
        SplashScreen.hideAsync();
      });
      
      // Use setTimeout to ensure state updates complete
      setTimeout(() => {
        if (!hasCompletedOnboarding) {
          console.log('👋 Navigating to onboarding...');
          router.replace('/onboarding');
        } else {
          console.log('🏠 User completed onboarding, staying on main app');
          // For completed users, we just render the children (main app)
        }
      }, 100);
    } catch (navError) {
      console.error('❌ Navigation error:', navError);
      setError(`Navigation failed: ${navError}`);
      // Fallback: try to reset and go to onboarding
      try {
        resetOnboarding();
        setTimeout(() => {
          router.replace('/onboarding');
        }, 100);
      } catch (fallbackError) {
        console.error('❌ Fallback navigation failed:', fallbackError);
        setError(`All navigation failed: ${fallbackError}`);
      }
    }
  }, [isHydrated, hasCompletedOnboarding, hasNavigated]);

  // Force navigation after 3 seconds if stuck
  useEffect(() => {
    if (isHydrated && !hasNavigated && !error) {
      const forceTimer = setTimeout(() => {
        console.log('⚠️ Force navigation timeout - proceeding anyway');
        setForceNavigation(true);
        setIsReady(true);
        setHasNavigated(true);
        
        if (!hasCompletedOnboarding) {
          console.log('🚨 Force navigating to onboarding...');
          router.replace('/onboarding');
        } else {
          console.log('🚨 Force staying on main app...');
        }
      }, 3000);

      return () => clearTimeout(forceTimer);
    }
  }, [isHydrated, hasNavigated, error, hasCompletedOnboarding]);

  // Create styles before using them
  const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
  });

  // Show error if something went wrong
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.error }]}>
          {error}
        </Text>
        <ActivityIndicator size="large" color={colors.error} style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>
          Attempting to recover...
        </Text>
      </View>
    );
  }

  // Show loading until hydrated and ready
  if (!isHydrated || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {!isHydrated ? 'Loading app...' : 'Preparing...'}
        </Text>
        <Text style={[styles.loadingText, { fontSize: 12, marginTop: 10, opacity: 0.7 }]}>
          Hydrated: {isHydrated ? '✅' : '⏳'} | Ready: {isReady ? '✅' : '⏳'} | Navigated: {hasNavigated ? '✅' : '⏳'}
        </Text>
        <Text style={[styles.loadingText, { fontSize: 10, marginTop: 5, opacity: 0.5 }]}>
          OnboardingComplete: {hasCompletedOnboarding ? '✅' : '❌'} | Force: {forceNavigation ? '✅' : '❌'}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}