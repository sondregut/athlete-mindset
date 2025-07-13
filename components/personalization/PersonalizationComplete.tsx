import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CheckCircle, Sparkles } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';
import { PersonalizationProfile } from '@/types/personalization-profile';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface PersonalizationCompleteProps {
  onNext: () => void;
  profile: Partial<PersonalizationProfile>;
}

export default function PersonalizationComplete({ onNext, profile }: PersonalizationCompleteProps) {
  useEffect(() => {
    // Celebrate completion
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const getGoalSummary = () => {
    if (!profile.primary_goals || profile.primary_goals.length === 0) return '';
    
    const goalLabels: Record<string, string> = {
      'build-confidence': 'confidence',
      'improve-performance': 'performance',
      'reduce-anxiety': 'calm',
      'enhance-focus': 'focus',
      'increase-motivation': 'motivation',
      'handle-pressure': 'pressure handling',
      'prepare-competition': 'competition prep',
      'improve-technique': 'technique',
      'build-mental-toughness': 'mental toughness',
    };
    
    const goals = profile.primary_goals.map(g => goalLabels[g] || g);
    if (goals.length === 1) return goals[0];
    if (goals.length === 2) return `${goals[0]} and ${goals[1]}`;
    return `${goals.slice(0, -1).join(', ')}, and ${goals[goals.length - 1]}`;
  };

  const getStyleLabel = () => {
    const styleLabels: Record<string, string> = {
      'calm-peaceful': 'calm & peaceful',
      'high-energy': 'high energy',
      'laser-focused': 'laser focused',
      'strong-powerful': 'strong & powerful',
    };
    return styleLabels[profile.preferred_style || ''] || '';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.iconWrapper}>
            <CheckCircle size={64} color={colors.success} />
          </View>
          <View style={styles.sparklesWrapper}>
            <Sparkles size={32} color={colors.primary} />
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Perfect! You're All Set</Text>
          <Text style={styles.subtitle}>
            Your visualizations will now be personalized for:
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Sport:</Text>
            <Text style={styles.summaryValue}>{profile.sport_activity}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Level:</Text>
            <Text style={styles.summaryValue}>
              {profile.experience_level ? 
                profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1) : 
                'Not specified'}
            </Text>
          </View>
          
          {profile.specific_role && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Position:</Text>
              <Text style={styles.summaryValue}>{profile.specific_role}</Text>
            </View>
          )}
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Focus on:</Text>
            <Text style={styles.summaryValue}>{getGoalSummary()}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Energy:</Text>
            <Text style={styles.summaryValue}>{getStyleLabel()}</Text>
          </View>
        </View>

        {/* What's Next */}
        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>What happens now?</Text>
          <View style={styles.nextStep}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.nextStepText}>
              Every visualization will be tailored to your sport and goals
            </Text>
          </View>
          <View style={styles.nextStep}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.nextStepText}>
              AI will use your preferences to create powerful mental training
            </Text>
          </View>
          <View style={styles.nextStep}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.nextStepText}>
              You can update these settings anytime in your profile
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Start Training"
          onPress={onNext}
          style={styles.primaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
    position: 'relative',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparklesWrapper: {
    position: 'absolute',
    top: 40,
    right: '30%',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 15,
    color: colors.darkGray,
    width: 80,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
    fontWeight: '600',
  },
  nextStepsContainer: {
    marginBottom: 20,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 12,
    marginTop: 2,
  },
  nextStepText: {
    fontSize: 15,
    color: colors.darkGray,
    flex: 1,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
});