import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { X, Mail, Lock, User } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import OnboardingButton from './onboarding/OnboardingButton';
import Card from './Card';
import PasswordResetModal from './PasswordResetModal';
import { checkNetworkConnection } from '@/utils/network';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup' | 'link';
}

export default function AuthModal({ visible, onClose, mode }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const { signIn, createAccount, linkAccount, resetPassword, isLoading, error, clearError } = useAuthStore();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setConfirmPassword('');
    clearError();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }

    if (mode === 'signup' || mode === 'link') {
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check network connectivity first
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      switch (mode) {
        case 'signin':
          await signIn(email, password);
          break;
        case 'signup':
          await createAccount(email, password, displayName.trim() || undefined);
          break;
        case 'link':
          await linkAccount(email, password, displayName.trim() || undefined);
          break;
      }
      handleClose();
    } catch (error: any) {
      // Show more detailed error for network issues
      if (error.message?.includes('Network')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to our servers. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
      // Other errors are handled by the store
    }
  };

  const handleForgotPassword = () => {
    setShowPasswordReset(true);
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Sign In';
      case 'signup':
        return 'Create Account';
      case 'link':
        return 'Secure Your Data';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signin':
        return 'Welcome back! Sign in to access your data across devices.';
      case 'signup':
        return 'Create an account to sync your data across devices.';
      case 'link':
        return 'Create an account to secure your data and access it from any device.';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{getTitle()}</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color={colors.darkGray} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.formCard}>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {(mode === 'signup' || mode === 'link') && (
              <View style={styles.inputContainer}>
                <User size={20} color={colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
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
                style={styles.textInput}
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
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor={colors.darkGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {(mode === 'signup' || mode === 'link') && (
              <View style={styles.inputContainer}>
                <Lock size={20} color={colors.darkGray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
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
              title={mode === 'link' ? 'Secure My Data' : getTitle()}
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitButton}
            />

            {mode === 'signin' && (
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Development only - Skip Login */}
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.skipButton} 
                onPress={handleClose}
              >
                <Text style={styles.skipText}>Skip Login (Dev Only)</Text>
              </TouchableOpacity>
            )}
          </Card>

          {mode === 'link' && (
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>Why create an account?</Text>
              <Text style={styles.infoText}>
                • Access your data from any device{'\n'}
                • Automatic cloud backup{'\n'}
                • Never lose your progress{'\n'}
                • Future team features
              </Text>
            </Card>
          )}
        </ScrollView>
      </View>
      
      <PasswordResetModal
        isVisible={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGray,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  formCard: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 24,
    lineHeight: 22,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: colors.darkGray,
    textDecorationLine: 'underline',
  },
});