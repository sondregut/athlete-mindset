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
  const hasAttemptedSignIn = useRef(false);

  useEffect(() => {
    // Auto sign-in anonymously if no user and auth is initialized
    if (isInitialized && !user && !isLoading && !hasAttemptedSignIn.current) {
      hasAttemptedSignIn.current = true;
      
      // Add a small delay to ensure Firebase is fully ready
      const timeoutId = setTimeout(() => {
        console.log('🔐 Auto-signing in anonymously...');
        attemptAnonymousSignIn();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isInitialized, user, isLoading]);

  const attemptAnonymousSignIn = async () => {
    try {
      setIsRetrying(true);
      await signInAnonymously();
      setRetryCount(0);
      setIsRetrying(false);
    } catch (error) {
      console.error(`Failed to auto sign-in (attempt ${retryCount + 1}):`, error);
      setIsRetrying(false);
      
      // Retry with exponential backoff, max 3 attempts
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${delay/1000} seconds...`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          attemptAnonymousSignIn();
        }, delay);
      }
    }
  };

  const handleManualRetry = () => {
    clearError();
    hasAttemptedSignIn.current = false;
    setRetryCount(0);
    attemptAnonymousSignIn();
  };

  const handleSkipAuth = () => {
    // For now, just clear the error and continue
    // In a real app, you might want to set a flag to work offline
    console.log('⚠️ User chose to continue without account');
    clearError();
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

  // Show loading screen while auth is initializing
  if (!isInitialized || (isInitialized && !user && (isLoading || isRetrying))) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {!isInitialized ? 'Initializing...' : 
           isRetrying ? `Connecting... (Attempt ${retryCount + 1}/4)` : 
           'Setting up your account...'}
        </Text>
      </View>
    );
  }

  // Show error state if auth failed after all retries
  if (error && !user && retryCount >= 3) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>
          {error.includes('auth/network-request-failed') 
            ? 'Unable to connect. Please check your internet connection.'
            : error.includes('auth/too-many-requests')
            ? 'Too many attempts. Please wait a moment before trying again.'
            : 'Unable to set up your account. This might be a configuration issue.'}
        </Text>
        <Text style={styles.errorDetails}>
          Error: {error}
        </Text>
        <Button 
          title="Try Again" 
          onPress={handleManualRetry}
          style={styles.retryButton}
        />
        <TouchableOpacity onPress={handleSkipAuth} style={styles.skipButton}>
          <Text style={styles.skipText}>Continue without account</Text>
        </TouchableOpacity>
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