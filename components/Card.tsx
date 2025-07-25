import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, style }: CardProps) {
  const colors = useThemeColors();
  
  const dynamicStyles = StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      padding: 12,
      marginVertical: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.02,
      shadowRadius: 3,
      elevation: 1,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
  });
  
  return (
    <View style={[dynamicStyles.card, style]}>
      {children}
    </View>
  );
}