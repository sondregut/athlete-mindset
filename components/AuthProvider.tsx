import React, { useEffect, ReactNode, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/auth-store';
import { firebaseSync } from '@/services/firebase-sync';
import { colors } from '@/constants/colors';
import Button from './Button';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { user, isLoading, isInitialized, signInAnonymously, error, clearError } = useAuthStore();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  // Start with auth enabled now that we have proper authentication
  const [skipAuth, setSkipAuth] = useState(false);
  const hasAttemptedSignIn = useRef(false);
  const isCurrentlyAttempting = useRef(false);

  useEffect(() => {
    // Skip auth if user chose to continue offline
    if (skipAuth && !user) {
      // Set a local user to continue without Firebase
      useAuthStore.setState({ 
        user: { 
          uid: 'local-user', 
          email: null, 
          displayName: 'Local User', 
          isAnonymous: true, 
          emailVerified: false 
        },
        isInitialized: true,
        isLoading: false
      });
      return;
    }
    
    // DO NOT auto sign-in - let user choose authentication method
    // This prevents network errors from blocking app startup
  }, [isInitialized, user, isLoading, skipAuth]);

  const attemptAnonymousSignIn = async (currentRetryCount: number) => {
    // Prevent multiple simultaneous attempts
    if (isCurrentlyAttempting.current) {
      console.log('Already attempting sign-in, skipping...');
      return;
    }
    
    isCurrentlyAttempting.current = true;
    
    try {
      setIsRetrying(true);
      setRetryCount(currentRetryCount);
      await signInAnonymously();
      setRetryCount(0);
      setIsRetrying(false);
      isCurrentlyAttempting.current = false;
    } catch (error) {
      console.error(`Failed to auto sign-in (attempt ${currentRetryCount + 1}):`, error);
      setIsRetrying(false);
      isCurrentlyAttempting.current = false;
      
      // Retry with exponential backoff, max 3 attempts
      if (currentRetryCount < 2) {
        const nextRetryCount = currentRetryCount + 1;
        const delay = Math.pow(2, nextRetryCount) * 1000; // 2s, 4s
        console.log(`Will retry in ${delay/1000} seconds...`);
        
        setTimeout(() => {
          setRetryCount(nextRetryCount);
          attemptAnonymousSignIn(nextRetryCount);
        }, delay);
      } else {
        console.log('Max retry attempts reached. Stopping.');
        setRetryCount(currentRetryCount);
      }
    }
  };

  const handleManualRetry = () => {
    clearError();
    hasAttemptedSignIn.current = false;
    isCurrentlyAttempting.current = false;
    setRetryCount(0);
    setSkipAuth(false);
    attemptAnonymousSignIn(0);
  };

  const handleSkipAuth = () => {
    // For now, just clear the error and continue
    // In a real app, you might want to set a flag to work offline
    console.log('⚠️ User chose to continue without account');
    clearError();
    setSkipAuth(true);
    // Set a dummy user to bypass auth requirement
    // Note: This is temporary - data won't sync to Firebase
    useAuthStore.setState({ 
      user: { 
        uid: 'local-user', 
        email: null, 
        displayName: 'Local User', 
        isAnonymous: true, 
        emailVerified: false 
      },
      isInitialized: true,
      isLoading: false
    });
  };

  useEffect(() => {
    // Initialize sync when user is authenticated
    if (user) {
      console.log('🔄 User authenticated, initializing sync...');
      firebaseSync.initializeSync().catch((error) => {
        console.error('Failed to initialize sync:', error);
      });
    }
  }, [user]);

  // Skip auth screens if user chose offline mode
  if (skipAuth) {
    return <>{children}</>;
  }

  // Show loading screen ONLY while auth is actually initializing
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  // If initialized but no user, render children (will show onboarding)
  // This prevents the auth provider from blocking the app
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
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  retryButton: {
    marginBottom: 16,
    minWidth: 200,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    color: colors.darkGray,
    textDecorationLine: 'underline',
  },
});