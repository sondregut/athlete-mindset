import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useOnboardingStore, focusOptions, motivationOptions } from '@/store/onboarding-store';
import Button from '@/components/Button';

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
  onComplete: () => void;
}

export default function OnboardingGoals({ step, onNext, onBack, onComplete }: OnboardingGoalsProps) {
  const { goals, updateGoals } = useOnboardingStore();
  const [localGoals, setLocalGoals] = useState(goals);

  const handleSaveAndComplete = () => {
    updateGoals(localGoals);
    onComplete();
  };

  const updateLocalGoals = (updates: Partial<typeof localGoals>) => {
    setLocalGoals(prev => ({ ...prev, ...updates }));
  };

  const weeklyTargets = [1, 2, 3, 4, 5, 6, 7];
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

        {/* Weekly Session Target */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Session Goal</Text>
          <Text style={styles.sectionDescription}>
            How many training sessions would you like to log per week?
          </Text>
          <View style={styles.optionsGrid}>
            {weeklyTargets.map((target) => (
              <TouchableOpacity
                key={target}
                style={[
                  styles.numberOption,
                  localGoals.weeklySessionTarget === target && styles.selectedNumberOption
                ]}
                onPress={() => updateLocalGoals({ weeklySessionTarget: target })}
              >
                <Text style={[
                  styles.numberOptionText,
                  localGoals.weeklySessionTarget === target && styles.selectedNumberOptionText
                ]}>
                  {target}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Streak Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streak Challenge</Text>
          <Text style={styles.sectionDescription}>
            What's a realistic consecutive day streak to aim for?
          </Text>
          <View style={styles.optionsGrid}>
            {streakGoals.map((streak) => (
              <TouchableOpacity
                key={streak}
                style={[
                  styles.numberOption,
                  localGoals.streakGoal === streak && styles.selectedNumberOption
                ]}
                onPress={() => updateLocalGoals({ streakGoal: streak })}
              >
                <Text style={[
                  styles.numberOptionText,
                  localGoals.streakGoal === streak && styles.selectedNumberOptionText
                ]}>
                  {streak}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Primary Focus */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Focus</Text>
          <Text style={styles.sectionDescription}>
            What's your main training focus right now?
          </Text>
          <View style={styles.focusOptions}>
            {focusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.focusOption,
                  localGoals.primaryFocus === option.value && styles.selectedFocusOption
                ]}
                onPress={() => updateLocalGoals({ primaryFocus: option.value })}
              >
                <Text style={styles.focusIcon}>{option.icon}</Text>
                <View style={styles.focusContent}>
                  <Text style={[
                    styles.focusTitle,
                    localGoals.primaryFocus === option.value && styles.selectedFocusTitle
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.focusDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Motivation Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Motivates You?</Text>
          <Text style={styles.sectionDescription}>
            Understanding your motivation helps us customize your experience.
          </Text>
          <View style={styles.focusOptions}>
            {motivationOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.focusOption,
                  localGoals.motivationType === option.value && styles.selectedFocusOption
                ]}
                onPress={() => updateLocalGoals({ motivationType: option.value })}
              >
                <Text style={styles.focusIcon}>{option.icon}</Text>
                <View style={styles.focusContent}>
                  <Text style={[
                    styles.focusTitle,
                    localGoals.motivationType === option.value && styles.selectedFocusTitle
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.focusDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Complete Setup"
          onPress={handleSaveAndComplete}
          style={styles.primaryButton}
        />
        <Button
          title="Back"
          onPress={onBack}
          variant="outline"
          style={styles.secondaryButton}
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