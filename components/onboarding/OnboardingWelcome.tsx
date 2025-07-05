import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

const { width, height } = Dimensions.get('window');

interface OnboardingWelcomeProps {
  step: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
  };
  onNext: () => void;
  onLogin: () => void;
}

export default function OnboardingWelcome({ step, onNext, onLogin }: OnboardingWelcomeProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animate content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    // Trigger haptic feedback on mobile platforms
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onNext();
  };

  const handleLogin = () => {
    // Light haptic feedback for login action
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onLogin();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 40,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    icon: {
      fontSize: 64,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 38,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    description: {
      fontSize: 16,
      color: colors.darkGray,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 8,
    },
    actions: {
      gap: 12,
    },
    primaryButton: {
      marginBottom: 0,
    },
    secondaryButton: {
      marginBottom: 0,
    },
    loginPrompt: {
      alignItems: 'center',
      marginTop: 16,
    },
    loginPromptText: {
      fontSize: 16,
      color: colors.text,
    },
    loginLink: {
      color: colors.primary,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{step.icon}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{step.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{step.subtitle}</Text>

        {/* Description */}
        <Text style={styles.description}>{step.description}</Text>
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Get Started"
          onPress={handleGetStarted}
          style={styles.primaryButton}
        />
        
        <TouchableOpacity style={styles.loginPrompt} onPress={handleLogin}>
          <Text style={styles.loginPromptText}>
            Have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}