import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';
import { PersonalizationProfile } from '@/types/personalization-profile';

interface PersonalizationTrainingGoalsProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  profile: Partial<PersonalizationProfile>;
  updateProfile: (updates: Partial<PersonalizationProfile>) => void;
}

export default function PersonalizationTrainingGoals({ 
  onNext, 
  onBack, 
  onSkip,
  profile,
  updateProfile 
}: PersonalizationTrainingGoalsProps) {
  const [weeklySessionTarget, setWeeklySessionTarget] = useState<number | undefined>(
    profile.weekly_session_target
  );
  const [weeklyVisualizationTarget, setWeeklyVisualizationTarget] = useState<number | undefined>(
    profile.weekly_visualization_target
  );

  const weeklySessionTargets = [1, 2, 3, 4, 5, 6, 7];
  const weeklyVisualizationTargets = [1, 2, 3, 4, 5, 6, 7];

  const handleContinue = () => {
    if (weeklySessionTarget && weeklyVisualizationTarget) {
      updateProfile({
        weekly_session_target: weeklySessionTarget,
        weekly_visualization_target: weeklyVisualizationTarget,
      });
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Set Your Mental Training Goals</Text>
          <Text style={styles.subtitle}>
            Consistency drives excellence
          </Text>
          <Text style={styles.description}>
            Set weekly targets for mental journey sessions and visualization practice
          </Text>
        </View>

        {/* Goals Grid */}
        <View style={styles.goalsGrid}>
          {/* Mental Journey Sessions Goal */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalIcon}>📝</Text>
              <Text style={styles.goalTitle}>Mental Journey Sessions</Text>
            </View>
            <Text style={styles.goalDescription}>
              Sessions per week
            </Text>
            <View style={styles.miniOptionsGrid}>
              {weeklySessionTargets.map((target) => (
                <TouchableOpacity
                  key={target}
                  style={[
                    styles.miniNumberOption,
                    weeklySessionTarget === target && styles.selectedMiniNumberOption
                  ]}
                  onPress={() => setWeeklySessionTarget(target)}
                >
                  <Text style={[
                    styles.miniNumberOptionText,
                    weeklySessionTarget === target && styles.selectedMiniNumberOptionText
                  ]}>
                    {target}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Visualizations Goal */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalIcon}>🧠</Text>
              <Text style={styles.goalTitle}>Visualizations</Text>
            </View>
            <Text style={styles.goalDescription}>
              Visualizations per week
            </Text>
            <View style={styles.miniOptionsGrid}>
              {weeklyVisualizationTargets.map((target) => (
                <TouchableOpacity
                  key={target}
                  style={[
                    styles.miniNumberOption,
                    weeklyVisualizationTarget === target && styles.selectedMiniNumberOption
                  ]}
                  onPress={() => setWeeklyVisualizationTarget(target)}
                >
                  <Text style={[
                    styles.miniNumberOptionText,
                    weeklyVisualizationTarget === target && styles.selectedMiniNumberOptionText
                  ]}>
                    {target}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={!weeklySessionTarget || !weeklyVisualizationTarget}
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
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  description: {
    fontSize: 15,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  goalsGrid: {
    gap: 16,
    marginBottom: 32,
  },
  goalCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  goalDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 12,
  },
  miniOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniNumberOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  selectedMiniNumberOption: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  miniNumberOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  selectedMiniNumberOptionText: {
    color: colors.primary,
    fontWeight: '700',
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
});