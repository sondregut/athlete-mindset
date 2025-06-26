import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, X, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  variant?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
}

export default function ErrorMessage({ 
  message, 
  onDismiss, 
  onRetry, 
  variant = 'error',
  showIcon = true 
}: ErrorMessageProps) {
  const colors = useThemeColors();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          backgroundColor: `${colors.warning || '#FF9800'}15`,
          borderColor: colors.warning || '#FF9800',
          iconColor: colors.warning || '#FF9800',
        };
      case 'info':
        return {
          backgroundColor: `${colors.info || '#2196F3'}15`,
          borderColor: colors.info || '#2196F3',
          iconColor: colors.info || '#2196F3',
        };
      default:
        return {
          backgroundColor: `${colors.error}15`,
          borderColor: colors.error,
          iconColor: colors.error,
        };
    }
  };

  const variantStyles = getVariantStyles();
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginVertical: 4,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      marginRight: 8,
    },
    message: {
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 4,
    },
  });

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: variantStyles.backgroundColor,
        borderColor: variantStyles.borderColor 
      }
    ]}>
      <View style={styles.content}>
        {showIcon && (
          <AlertTriangle 
            size={20} 
            color={variantStyles.iconColor} 
            style={styles.icon} 
          />
        )}
        <Text style={[styles.message, { color: variantStyles.iconColor }]}>
          {message}
        </Text>
      </View>
      
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onRetry}
          >
            <RefreshCw size={16} color={variantStyles.iconColor} />
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onDismiss}
          >
            <X size={16} color={variantStyles.iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}