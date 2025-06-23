import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Slot, router } from 'expo-router';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useNotifications } from '@/hooks/useNotifications';
import { colors } from '@/constants/colors';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const { hasCompletedOnboarding, isHydrated, resetOnboarding } = useOnboardingStore();
  const [isReady, setIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceNavigation, setForceNavigation] = useState(false);
  
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

  // DEV: Auto-reset onboarding for testing (remove in production)
  useEffect(() => {
    if (isHydrated) {
      console.log('🧪 DEV: Auto-resetting onboarding for testing');
      resetOnboarding();
    }
  }, [isHydrated, resetOnboarding]);

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