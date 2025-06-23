import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dumbbell, Trophy, Heart, Lightbulb, HelpCircle } from 'lucide-react-native';
import { SessionType } from '@/types/session';
import { colors } from '@/constants/colors';

interface SessionTypeIconProps {
  type: SessionType;
  size?: number;
  color?: string;
}

export default function SessionTypeIcon({ type, size = 24, color }: SessionTypeIconProps) {
  const getIcon = () => {
    const iconColor = color || colors.sessionTypes[type];
    
    switch (type) {
      case 'training':
        return <Dumbbell size={size} color={iconColor} />;
      case 'competition':
        return <Trophy size={size} color={iconColor} />;
      case 'recovery':
        return <Heart size={size} color={iconColor} />;
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