import React, { useEffect, ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { firebaseSync } from '@/services/firebase-sync';
import { colors } from '@/constants/colors';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { user, isLoading, isInitialized, signInAnonymously, error } = useAuthStore();

  useEffect(() => {
    // Auto sign-in anonymously if no user and auth is initialized
    if (isInitialized && !user && !isLoading) {
      console.log('🔐 Auto-signing in anonymously...');
      signInAnonymously().catch((error) => {
        console.error('Failed to auto sign-in:', error);
      });
    }
  }, [isInitialized, user, isLoading, signInAnonymously]);

  useEffect(() => {
    // Initialize sync when user is authenticated
    if (user) {
      console.log('🔄 User authenticated, initializing sync...');
      firebaseSync.initializeSync().catch((error) => {
        console.error('Failed to initialize sync:', error);
      });
    }
  }, [user]);

  // Show loading screen while auth is initializing
  if (!isInitialized || (isInitialized && !user && isLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {!isInitialized ? 'Initializing...' : 'Setting up your account...'}
        </Text>
      </View>
    );
  }

  // Show error state if auth failed
  if (error && !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>
          Unable to connect to our services. Please check your internet connection and try again.
        </Text>
      </View>
    );
  }

  // Render app when user is authenticated (including anonymous)
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
  },
});