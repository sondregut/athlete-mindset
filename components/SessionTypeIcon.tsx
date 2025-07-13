import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dumbbell, Trophy, HelpCircle, Brain } from 'lucide-react-native';
import { SessionType } from '@/types/session';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SessionTypeIconProps {
  type: SessionType;
  size?: number;
  color?: string;
}

export default function SessionTypeIcon({ type, size = 24, color }: SessionTypeIconProps) {
  const colors = useThemeColors();
  
  const getIcon = () => {
    const iconColor = color || colors.sessionTypes[type] || colors.primary;
    
    switch (type) {
      case 'training':
        return <Dumbbell size={size} color={iconColor} />;
      case 'competition':
        return <Trophy size={size} color={iconColor} />;
      case 'visualization':
        return <Brain size={size} color={iconColor} />;
      case 'other':
      default:
        return <HelpCircle size={size} color={iconColor} />;
    }
  };

  return (
    <View style={styles.container}>
      {getIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});