import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Alert
} from 'react-native';
import { colors } from '@/constants/colors';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  errorHandler?: (error: Error) => void;
}

export default function OnboardingButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  errorHandler
}: OnboardingButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading || internalLoading;

  const styles = StyleSheet.create({
    button: {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: size === 'small' ? 16 : size === 'large' ? 32 : 24,
      paddingVertical: size === 'small' ? 10 : size === 'large' ? 18 : 14,
      opacity: disabled || isLoading ? 0.6 : 1,
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.secondary,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    text: {
      fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
      fontWeight: '600',
    },
    primaryText: {
      color: colors.background,
    },
    secondaryText: {
      color: colors.background,
    },
    outlineText: {
      color: colors.primary,
    },
  });

  const handlePress = async () => {
    if (disabled || isLoading) return;
    
    try {
      setInternalLoading(true);
      await onPress();
    } catch (error) {
      console.error('Button action error:', error);
      if (errorHandler) {
        errorHandler(error as Error);
      } else {
        Alert.alert(
          'Error',
          error instanceof Error ? error.message : 'An error occurred'
        );
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'outline' && styles.outlineText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.background} />
      ) : (
        <Text style={buttonTextStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}