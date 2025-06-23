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

interface ButtonProps {
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

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  errorHandler
}: ButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading || internalLoading;
  const getButtonStyle = (): ViewStyle => {
    const baseStyle = { ...styles.button };
    
    // Add variant style
    if (variant === 'primary') {
      Object.assign(baseStyle, styles.primaryButton);
    } else if (variant === 'secondary') {
      Object.assign(baseStyle, styles.secondaryButton);
    } else if (variant === 'outline') {
      Object.assign(baseStyle, styles.outlineButton);
    }
    
    // Add size style
    if (size === 'small') {
      Object.assign(baseStyle, styles.smallButton);
    } else if (size === 'large') {
      Object.assign(baseStyle, styles.largeButton);
    }
    
    // Add disabled style
    if (disabled || isLoading) {
      Object.assign(baseStyle, styles.disabledButton);
    }
    
    // Add custom style
    if (style) {
      Object.assign(baseStyle, style);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = (): TextStyle => {
    const baseStyle = { ...styles.buttonText };
    
    // Add variant text style
    if (variant === 'primary') {
      Object.assign(baseStyle, styles.primaryButtonText);
    } else if (variant === 'secondary') {
      Object.assign(baseStyle, styles.secondaryButtonText);
    } else if (variant === 'outline') {
      Object.assign(baseStyle, styles.outlineButtonText);
    }
    
    // Add size text style
    if (size === 'small') {
      Object.assign(baseStyle, styles.smallButtonText);
    } else if (size === 'large') {
      Object.assign(baseStyle, styles.largeButtonText);
    }
    
    // Add disabled text style
    if (disabled || isLoading) {
      Object.assign(baseStyle, styles.disabledButtonText);
    }
    
    // Add custom text style
    if (textStyle) {
      Object.assign(baseStyle, textStyle);
    }
    
    return baseStyle;
  };

  const handlePress = async () => {
    if (disabled || isLoading) return;

    try {
      const result = onPress();
      
      // Handle async operations
      if (result && typeof result.then === 'function') {
        setInternalLoading(true);
        await result;
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('An unexpected error occurred');
      
      if (errorHandler) {
        errorHandler(errorObj);
      } else {
        // Default error handling
        Alert.alert('Error', errorObj.message);
      }
    } finally {
      setInternalLoading(false);
    }
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? colors.primary : colors.background} 
          size="small" 
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  largeButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  disabledButton: {
    backgroundColor: colors.mediumGray,
    borderColor: colors.mediumGray,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  primaryButtonText: {
    color: colors.background,
  },
  secondaryButtonText: {
    color: colors.background,
  },
  outlineButtonText: {
    color: colors.primary,
  },
  smallButtonText: {
    fontSize: 14,
  },
  largeButtonText: {
    fontSize: 18,
  },
  disabledButtonText: {
    color: colors.darkGray,
  },
});