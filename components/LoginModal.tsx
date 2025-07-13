import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';
import { useGoogleAuth, getGoogleIdToken } from '@/config/google-oauth';
import { useAppleAuth } from '@/config/apple-auth';
import { router } from 'expo-router';
import AppleLogo from '@/components/icons/AppleLogo';
import GoogleLogo from '@/components/icons/GoogleLogo';

const { height } = Dimensions.get('window');

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoginModal({ visible, onClose }: LoginModalProps) {
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const { signInWithGoogle, signInWithApple } = useAuthStore();
  const { completeOnboarding, setLoginIntent } = useOnboardingStore();
  const { updateProfile } = useUserStore();
  const { request, response, promptAsync } = useGoogleAuth();
  const { signInWithApple: appleSignIn, isAvailable: isAppleAvailable } = useAppleAuth();

  // Handle animations
  useEffect(() => {
    if (visible) {
      // Fade in background immediately
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Slide up modal
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide down modal
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
      
      // Fade out background
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = getGoogleIdToken(response);
      if (idToken) {
        handleGoogleAuthSuccess(idToken);
      } else {
        setIsGoogleLoading(false);
      }
    } else if (response?.type === 'error' || response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleComplete = async () => {
    try {
      // Update profile with join date
      await updateProfile({
        joinDate: new Date().toISOString(),
      });
      
      // Mark onboarding as complete
      completeOnboarding();
      
      // Close modal first
      onClose();
      
      // Navigate to main app
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (error) {
      console.error('Error completing login:', error);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    
    if (!isAppleAvailable) {
      Alert.alert('Not Available', 'Apple Sign-In is not available on this device');
      setIsAppleLoading(false);
      return;
    }

    try {
      const result = await appleSignIn();
      
      if (!result.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      await signInWithApple(result.identityToken);
      await handleComplete();
    } catch (err: any) {
      if (err.message !== 'Apple Sign-In was canceled') {
        Alert.alert('Error', err.message || 'Failed to sign in with Apple');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
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
      Alert.alert('Error', 'Google Sign-In is not configured');
      setIsGoogleLoading(false);
      return;
    }

    try {
      await promptAsync();
      // Response will be handled by the useEffect hook
    } catch (err: any) {
      Alert.alert('Error', 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleAuthSuccess = async (idToken: string) => {
    try {
      await signInWithGoogle(idToken);
      await handleComplete();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = () => {
    // Set login intent and navigate to auth screen
    setLoginIntent(true);
    const { setOnboardingStep } = useOnboardingStore.getState();
    setOnboardingStep(6); // Navigate to auth step (updated after adding visualization step)
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      maxHeight: height * 0.5,
    },
    closeButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      padding: 8,
      zIndex: 1,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
      marginTop: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.darkGray,
      marginTop: 8,
    },
    authButtons: {
      gap: 16,
    },
    authButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 12,
    },
    appleButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.text,
    },
    googleButton: {
      backgroundColor: colors.lightGray,
      borderWidth: 1,
      borderColor: colors.mediumGray,
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '600',
    },
    appleButtonText: {
      color: colors.text,
    },
    googleButtonText: {
      color: colors.text,
    },
    emailOption: {
      alignItems: 'center',
      marginTop: 24,
      paddingVertical: 12,
    },
    emailOptionText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.darkGray} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Use the same account you did on web</Text>
          </View>

          <View style={styles.authButtons}>
            {Platform.OS === 'ios' && isAppleAvailable && (
              <TouchableOpacity 
                style={[styles.authButton, styles.appleButton]}
                onPress={handleAppleSignIn}
                disabled={isAppleLoading}
              >
                <AppleLogo size={20} color={colors.text} />
                <Text style={[styles.buttonText, styles.appleButtonText]}>
                  {isAppleLoading ? 'Signing in...' : 'Continue with Apple'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.authButton, styles.googleButton]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              <GoogleLogo size={20} />
              <Text style={[styles.buttonText, styles.googleButtonText]}>
                {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.emailOption} onPress={handleEmailLogin}>
            <Text style={styles.emailOptionText}>Continue with Email</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}