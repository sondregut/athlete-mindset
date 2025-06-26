import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Mail, Lock, User, Globe } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import OnboardingButton from './OnboardingButton';
import { useOnboardingStore, OnboardingGoals } from '@/store/onboarding-store';
import { useGoogleAuth, getGoogleIdToken } from '@/config/google-oauth';
import { useUserStore } from '@/store/user-store';
import { router } from 'expo-router';
import { checkNetworkConnection } from '@/utils/network';

interface OnboardingAuthProps {
  step?: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
  };
}

export default function OnboardingAuth({ step }: OnboardingAuthProps) {
  const [mode, setMode] = useState<'choice' | 'signin' | 'signup'>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const { signIn, createAccount, signInWithGoogle, isLoading } = useAuthStore();
  const { completeOnboarding } = useOnboardingStore();
  const { updateProfile } = useUserStore();
  const { request, response, promptAsync } = useGoogleAuth();

  const handleComplete = async () => {
    console.log('✅ Onboarding complete, syncing data and navigating to main app...');
    
    try {
      // Get the onboarding goals to sync them to the user profile
      const { goals } = useOnboardingStore.getState();
      
      // Sync goals data to user profile for easy access
      const profileUpdate: any = {
        joinDate: new Date().toISOString(),
      };
      
      // Add goals data to profile if they exist
      if (goals.weeklySessionTarget !== undefined) {
        profileUpdate.weeklySessionTarget = goals.weeklySessionTarget;
      }
      if (goals.streakGoal !== undefined) {
        profileUpdate.streakGoal = goals.streakGoal;
      }
      if (goals.primaryFocus !== undefined) {
        profileUpdate.primaryFocus = goals.primaryFocus;
      }
      if (goals.motivationType !== undefined) {
        profileUpdate.motivationType = goals.motivationType;
      }
      
      // Update profile with all collected data
      await updateProfile(profileUpdate);
      
      // Mark onboarding as complete
      completeOnboarding();
      
      // Navigate to main app
      router.replace('/(tabs)');
      console.log('🏠 Navigation to main app initiated with synced data');
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
    }
  };

  const handleEmailSignIn = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await signIn(email, password);
      handleComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    }
  };

  const handleEmailSignUp = async () => {
    setError('');
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await createAccount(email, password, displayName || undefined);
      handleComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = getGoogleIdToken(response);
      if (idToken) {
        handleGoogleAuthSuccess(idToken);
      } else {
        setError('Failed to get authentication token from Google');
        setIsGoogleLoading(false);
      }
    } else if (response?.type === 'error') {
      setError('Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    
    // Check if we're in Expo Go
    if (__DEV__ && Platform.OS === 'ios') {
      Alert.alert(
        'Google Sign-In Limitation',
        'Google Sign-In is not available in Expo Go on iOS. Please use email sign-in or test on Android/Web.',
        [{ text: 'OK' }]
      );
      setIsGoogleLoading(false);
      return;
    }
    
    if (!request) {
      setError('Configuring Google Sign-In...');
      setIsGoogleLoading(false);
      return;
    }

    try {
      const result = await promptAsync();
      // Response will be handled by the useEffect hook
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError('Failed to open Google sign-in');
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleAuthSuccess = async (idToken: string) => {
    try {
      await signInWithGoogle(idToken);
      setIsGoogleLoading(false);
      handleComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };



  const stepData = step || {
    icon: '🔐',
    title: 'Create Your\nAccount',
    subtitle: '',
    description: ''
  };

  if (mode === 'choice') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header with icon */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{stepData.icon}</Text>
            </View>
            <Text style={styles.title}>{stepData.title}</Text>
            {stepData.subtitle ? <Text style={styles.subtitle}>{stepData.subtitle}</Text> : null}
            {stepData.description ? <Text style={styles.description}>{stepData.description}</Text> : null}
          </View>

          <View style={styles.authButtons}>
          <TouchableOpacity 
            style={[styles.googleButton, isGoogleLoading && styles.disabledButton]} 
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
          >
            {isGoogleLoading ? (
              <Text style={styles.googleButtonText}>Connecting...</Text>
            ) : (
              <>
                <Globe size={24} color={colors.text} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.emailButton} onPress={() => setMode('signup')}>
            <Mail size={24} color={colors.background} />
            <Text style={styles.emailButtonText}>Sign up with Email</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Already have an account?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.signInButton} onPress={() => setMode('signin')}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          {/* Development only - Skip Login */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleComplete}
            >
              <Text style={styles.skipButtonText}>Skip Login (Dev Only)</Text>
            </TouchableOpacity>
          )}
        </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'signin' ? 'Welcome Back!' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'signin' 
              ? 'Sign in to access your data' 
              : 'Sign up to start tracking your mindset'}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {mode === 'signup' && (
            <View style={styles.inputContainer}>
              <User size={20} color={colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display Name (optional)"
                placeholderTextColor={colors.darkGray}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color={colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={colors.darkGray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color={colors.darkGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.darkGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {mode === 'signup' && (
            <View style={styles.inputContainer}>
              <Lock size={20} color={colors.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={colors.darkGray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          <OnboardingButton
            title={mode === 'signin' ? 'Sign In' : 'Create Account'}
            onPress={mode === 'signin' ? handleEmailSignIn : handleEmailSignUp}
            loading={isLoading}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  description: {
    fontSize: 15,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  authButtons: {
    gap: 16,
    paddingHorizontal: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.mediumGray,
  },
  dividerText: {
    fontSize: 14,
    color: colors.darkGray,
  },
  signInButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.darkGray,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.background,
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 16,
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  skipLink: {
    fontSize: 16,
    color: colors.darkGray,
    textDecorationLine: 'underline',
  },
  disabledButton: {
    opacity: 0.6,
  },
});