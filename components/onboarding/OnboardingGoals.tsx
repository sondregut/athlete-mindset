import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useOnboardingStore, focusOptions, motivationOptions } from '@/store/onboarding-store';
import OnboardingButton from './OnboardingButton';

interface OnboardingGoalsProps {
  step: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
  };
  onNext: () => void;
  onBack: () => void;
}

export default function OnboardingGoals({ step, onNext, onBack }: OnboardingGoalsProps) {
  const { goals, updateGoals } = useOnboardingStore();
  const [localGoals, setLocalGoals] = useState(goals);

  const handleSaveAndNext = () => {
    updateGoals(localGoals);
    onNext();
  };

  const updateLocalGoals = (updates: Partial<typeof localGoals>) => {
    setLocalGoals(prev => ({ ...prev, ...updates }));
  };

  const weeklySessionTargets = [1, 2, 3, 4, 5, 6, 7];
  const weeklyVisualizationTargets = [1, 2, 3, 4, 5, 6, 7];
  const streakGoals = [3, 5, 7, 10, 14, 21, 30];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <Text style={styles.description}>{step.description}</Text>
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
                    localGoals.weeklySessionTarget === target && styles.selectedMiniNumberOption
                  ]}
                  onPress={() => updateLocalGoals({ weeklySessionTarget: target })}
                >
                  <Text style={[
                    styles.miniNumberOptionText,
                    localGoals.weeklySessionTarget === target && styles.selectedMiniNumberOptionText
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
                    localGoals.weeklyVisualizationTarget === target && styles.selectedMiniNumberOption
                  ]}
                  onPress={() => updateLocalGoals({ weeklyVisualizationTarget: target })}
                >
                  <Text style={[
                    styles.miniNumberOptionText,
                    localGoals.weeklyVisualizationTarget === target && styles.selectedMiniNumberOptionText
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
          title="Next"
          onPress={handleSaveAndNext}
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
    paddingTop: 20,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
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
  section: {
    marginBottom: 32,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 21,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  numberOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedNumberOption: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.selectedBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  numberOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  selectedNumberOptionText: {
    color: colors.primary,
    fontWeight: '700',
  },
  focusOptions: {
    gap: 12,
  },
  focusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedFocusOption: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.selectedBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  focusIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  focusContent: {
    flex: 1,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  selectedFocusTitle: {
    color: colors.primary,
    fontWeight: '700',
  },
  focusDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    marginBottom: 0,
  },
});