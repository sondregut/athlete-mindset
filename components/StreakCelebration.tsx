import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  Share,
  Platform
} from 'react-native';
import { X, Share2 } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Milestone, getRandomMilestoneQuote } from '@/constants/milestones';
import AchievementBadge from './AchievementBadge';
import Button from './Button';
import * as Haptics from 'expo-haptics';

interface StreakCelebrationProps {
  visible: boolean;
  milestone: Milestone;
  currentStreak: number;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function StreakCelebration({ 
  visible, 
  milestone, 
  currentStreak,
  onClose 
}: StreakCelebrationProps) {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti animation
      confettiAnims.forEach((anim, index) => {
        const delay = index * 50;
        const duration = 2000 + Math.random() * 1000;
        const toX = (Math.random() - 0.5) * screenWidth;
        const toY = screenHeight / 2 + Math.random() * 200;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.x, {
              toValue: toX,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: toY,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: 360 * (Math.random() * 4),
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      confettiAnims.forEach(anim => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      const message = `🎉 I just hit a ${currentStreak}-day training streak! ${milestone.icon} ${milestone.title} unlocked! #AthleteMindset #TrainingStreak`;
      
      await Share.share({
        message,
        title: 'Achievement Unlocked!',
      });
    } catch (error) {
      console.error('Error sharing achievement:', error);
    }
  };

  const quote = getRandomMilestoneQuote(milestone);

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#F8B500'];

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 24,
      padding: 32,
      width: screenWidth * 0.9,
      maxWidth: 400,
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      padding: 8,
    },
    confettiContainer: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none',
    },
    confetti: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: milestone.badgeColor,
      marginTop: 24,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    badgeContainer: {
      marginVertical: 24,
    },
    quoteContainer: {
      backgroundColor: colors.lightGray,
      borderRadius: 12,
      padding: 20,
      marginVertical: 24,
    },
    quote: {
      fontSize: 16,
      fontStyle: 'italic',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 24,
    },
    streakText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 32,
    },
    actions: {
      width: '100%',
      gap: 12,
    },
    shareButton: {
      backgroundColor: milestone.badgeColor,
    },
    doneButton: {
      marginBottom: 0,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
      >
        {/* Confetti */}
        <View style={styles.confettiContainer}>
          {confettiAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  backgroundColor: confettiColors[index % confettiColors.length],
                  top: screenHeight * 0.3,
                  left: screenWidth * 0.5 - 5,
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    { rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    })},
                  ],
                  opacity: anim.opacity,
                },
              ]}
            />
          ))}
        </View>

        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color={colors.darkGray} />
          </TouchableOpacity>

          <Text style={styles.title}>Achievement Unlocked!</Text>
          <Text style={styles.subtitle}>{milestone.title}</Text>

          <View style={styles.badgeContainer}>
            <AchievementBadge
              milestone={milestone}
              isUnlocked={true}
              size="large"
              showAnimation={false}
            />
          </View>

          <Text style={styles.streakText}>
            {currentStreak} Day Streak! 🔥
          </Text>

          <View style={styles.quoteContainer}>
            <Text style={styles.quote}>"{quote}"</Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Share Achievement"
              onPress={handleShare}
              style={styles.shareButton}
            />
            <Button
              title="Awesome!"
              onPress={onClose}
              variant="outline"
              style={styles.doneButton}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}