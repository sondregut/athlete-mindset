import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Brain, Info, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';
import Card from './Card';

export default function BrainHealthIndicator() {
  const colors = useThemeColors();
  const { getBrainHealth, getStreak, getWeeklyLogs } = useSessionStore();
  const [showInfo, setShowInfo] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [previousHealth, setPreviousHealth] = useState<number | null>(null);
  
  // Get brain health score
  const brainHealth = getBrainHealth();
  const currentStreak = getStreak();
  const weeklyLogs = getWeeklyLogs();
  
  // Brain health messages
  const getHealthMessage = () => {
    switch (brainHealth) {
      case 5:
        return "Peak mental fitness! 💪";
      case 4:
        return "Strong and getting stronger!";
      case 3:
        return "Building mental muscle";
      case 2:
        return "Let's work out that brain!";
      case 1:
        return "Time to start training!";
      default:
        return "Keep logging to stay sharp";
    }
  };

  const getHealthDescription = () => {
    switch (brainHealth) {
      case 5:
        return "Maximum mental fitness achieved through consistent daily practice";
      case 4:
        return "Strong mental fitness with good consistency";
      case 3:
        return "Average mental fitness - room for improvement";
      case 2:
        return "Mental fitness declining - log more sessions";
      case 1:
        return "Mental fitness at risk - start logging today!";
      default:
        return "Log sessions regularly to maintain mental fitness";
    }
  };

  // Animate on health change
  useEffect(() => {
    if (previousHealth !== null && previousHealth !== brainHealth) {
      // Different animations based on improvement or decline
      if (brainHealth > previousHealth) {
        // Level up animation
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            useNativeDriver: true,
            tension: 50,
            friction: 3,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 3,
          }),
        ]).start();
      } else {
        // Level down animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
    setPreviousHealth(brainHealth);
  }, [brainHealth]);

  // Continuous bounce animation for level 5
  useEffect(() => {
    if (brainHealth === 5) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      bounceAnim.setValue(0);
    }
  }, [brainHealth]);

  // Get brain image based on health level
  const getBrainImage = () => {
    try {
      // We have brain images for all levels 1-5
      switch (brainHealth) {
        case 1:
          return require('@/assets/images/brain-health/brain-1.png');
        case 2:
          return require('@/assets/images/brain-health/brain-2.png');
        case 3:
          return require('@/assets/images/brain-health/brain-3.png');
        case 4:
          return require('@/assets/images/brain-health/brain-4.png');
        case 5:
          return require('@/assets/images/brain-health/brain-5.png');
        default:
          return require('@/assets/images/brain-health/brain-1.png');
      }
    } catch (error) {
      console.log('Brain image not found:', error);
      return null;
    }
  };

  // Get brain color for icon placeholder
  const getBrainColor = () => {
    const brainColors: Record<number, string> = {
      1: '#FFB3B3', // Light red
      2: '#FFD4A3', // Light orange
      3: '#FFE5B4', // Peach
      4: '#FFB347', // Orange
      5: '#FF8C42', // Strong orange (matching your image)
    };
    
    return brainColors[brainHealth] || colors.darkGray;
  };

  // Calculate progress to next level
  const getProgressToNextLevel = () => {
    if (brainHealth === 5) return 1; // Max level
    
    // Simple progress calculation based on weekly logs
    const progressMap: Record<number, number> = {
      1: weeklyLogs / 2, // Need 2 logs to reach level 2
      2: (weeklyLogs - 2) / 2, // Need 4 logs to reach level 3
      3: (weeklyLogs - 4) / 2, // Need 6 logs to reach level 4
      4: currentStreak / 7, // Need 7 day streak to reach level 5
    };
    
    return Math.min(1, Math.max(0, progressMap[brainHealth] || 0));
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: 8,
      marginBottom: 0,
    },
    content: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 0,
    },
    brainWrapper: {
      width: 160,
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    brainImage: {
      width: 140,
      height: 140,
      resizeMode: 'contain',
    },
    brainPlaceholder: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: `${getBrainColor()}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sparkle: {
      position: 'absolute',
      top: 0,
      right: 10,
      fontSize: 24,
    },
    textContent: {
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 15,
      color: colors.darkGray,
      marginBottom: 12,
      textAlign: 'center',
    },
    progressWrapper: {
      alignItems: 'center',
      marginTop: 8,
    },
    progressContainer: {
      width: 120,
      height: 6,
      backgroundColor: colors.lightGray,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      color: colors.darkGray,
      marginTop: 4,
    },
    infoButton: {
      padding: 8,
    },
    infoCard: {
      marginTop: 8,
      backgroundColor: `${colors.primary}10`,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    infoContent: {
      padding: 12,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.darkGray,
      lineHeight: 20,
      marginBottom: 8,
    },
    streakInfo: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setShowInfo(!showInfo)}>
        <View style={styles.content}>
          {/* Brain Image - Centered */}
          <Animated.View 
            style={[
              styles.brainWrapper,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: bounceAnim }
                ]
              }
            ]}
          >
            {getBrainImage() ? (
              <Image 
                source={getBrainImage()!} 
                style={styles.brainImage} 
              />
            ) : (
              <View style={styles.brainPlaceholder}>
                <Brain size={70} color={getBrainColor()} />
              </View>
            )}
            {brainHealth >= 4 && (
              <Text style={styles.sparkle}>✨</Text>
            )}
          </Animated.View>

          {/* Text Content Below Brain */}
          <View style={styles.textContent}>
            <Text style={styles.title}>Brain Health</Text>
            <Text style={styles.subtitle}>{getHealthMessage()}</Text>
            
            {/* Progress for non-max levels */}
            {brainHealth < 5 && (
              <View style={styles.progressWrapper}>
                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${getProgressToNextLevel() * 100}%`,
                        backgroundColor: getBrainColor(),
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(getProgressToNextLevel() * 100)}% to next level
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {showInfo && (
        <Card style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How Brain Health Works</Text>
            <Text style={styles.infoText}>
              Your brain health score reflects your consistency in mental training. 
              Regular logging keeps your brain "healthy" while missing sessions causes it to "decline."
            </Text>
            <Text style={styles.infoText}>
              {getHealthDescription()}
            </Text>
            {currentStreak > 0 && (
              <Text style={styles.streakInfo}>
                Current streak: {currentStreak} day{currentStreak !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </Card>
      )}
    </View>
  );
}