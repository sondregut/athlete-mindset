import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/user-store';
import OnboardingButton from './OnboardingButton';

interface OnboardingNameProps {
  step: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
  };
  onNext: () => void;
  onBack: () => void;
}

export default function OnboardingName({ step, onNext, onBack }: OnboardingNameProps) {
  const { profile } = useUserStore();
  const [name, setName] = useState(profile.name || '');
  const [error, setError] = useState('');

  const validateAndContinue = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (name.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }
    
    // Save name to user store
    useUserStore.getState().updateProfile({ name: name.trim() });
    onNext();
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>
          <Text style={styles.title}>What's your name?</Text>
          <Text style={styles.description}>
            Help us personalize your experience
          </Text>
        </View>

        {/* Name Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, error ? styles.inputError : null]}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Enter your name"
            placeholderTextColor={colors.darkGray}
            maxLength={50}
            autoFocus
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
          onPress={validateAndContinue}
          disabled={!name.trim()}
          style={styles.primaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    paddingVertical: 16,
  },
  primaryButton: {
    marginBottom: 0,
  },
});