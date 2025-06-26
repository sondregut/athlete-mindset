import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Milestone } from '@/constants/milestones';

interface AchievementBadgeProps {
  milestone: Milestone;
  isUnlocked: boolean;
  unlockedDate?: string;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
}

export default function AchievementBadge({ 
  milestone, 
  isUnlocked, 
  unlockedDate,
  size = 'medium',
  showAnimation = true 
}: AchievementBadgeProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(isUnlocked ? 1 : 0.9)).current;
  const opacityAnim = useRef(new Animated.Value(isUnlocked ? 1 : 0.6)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isUnlocked && showAnimation) {
      // Entrance animation
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            useNativeDriver: true,
            tension: 50,
            friction: 3,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 3,
        }),
      ]).start();

      // Glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isUnlocked]);

  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { container: 60, icon: 28, streak: 10 };
      case 'large':
        return { container: 120, icon: 56, streak: 20 };
      default:
        return { container: 80, icon: 40, streak: 14 };
    }
  };

  const dimensions = getDimensions();

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    badgeContainer: {
      width: dimensions.container,
      height: dimensions.container,
      borderRadius: dimensions.container / 2,
      backgroundColor: isUnlocked ? milestone.backgroundColor : colors.lightGray,
      borderWidth: 3,
      borderColor: isUnlocked ? milestone.badgeColor : colors.mediumGray,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      width: dimensions.container * 1.5,
      height: dimensions.container * 1.5,
      borderRadius: dimensions.container * 0.75,
      backgroundColor: milestone.badgeColor,
    },
    icon: {
      fontSize: dimensions.icon,
    },
    lockIcon: {
      opacity: 0.5,
    },
    streakText: {
      fontSize: dimensions.streak,
      fontWeight: '700',
      color: isUnlocked ? milestone.badgeColor : colors.darkGray,
      marginTop: 2,
    },
    title: {
      fontSize: size === 'small' ? 10 : size === 'large' ? 16 : 12,
      fontWeight: '600',
      color: isUnlocked ? colors.text : colors.darkGray,
      marginTop: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: size === 'small' ? 8 : size === 'large' ? 12 : 10,
      color: colors.darkGray,
      marginTop: 2,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.badgeContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {isUnlocked && showAnimation && (
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
              },
            ]}
          />
        )}
        
        {isUnlocked ? (
          <>
            <Text style={styles.icon}>{milestone.icon}</Text>
            <Text style={styles.streakText}>{milestone.threshold}</Text>
          </>
        ) : (
          <Lock 
            size={dimensions.icon * 0.7} 
            color={colors.darkGray} 
            style={styles.lockIcon}
          />
        )}
      </Animated.View>
      
      {size !== 'small' && (
        <>
          <Text style={styles.title}>{milestone.title}</Text>
          {isUnlocked && unlockedDate && size === 'large' && (
            <Text style={styles.subtitle}>
              Unlocked {new Date(unlockedDate).toLocaleDateString()}
            </Text>
          )}
        </>
      )}
    </View>
  );
}