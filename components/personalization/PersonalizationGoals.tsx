import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';
import { PersonalizationProfile, PrimaryGoal, goalOptions } from '@/types/personalization-profile';

interface PersonalizationGoalsProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  profile: Partial<PersonalizationProfile>;
  updateProfile: (updates: Partial<PersonalizationProfile>) => void;
}

export default function PersonalizationGoals({ 
  onNext, 
  onBack, 
  onSkip,
  profile,
  updateProfile 
}: PersonalizationGoalsProps) {
  const [selectedGoals, setSelectedGoals] = useState<PrimaryGoal[]>(
    profile.primary_goals || []
  );

  const toggleGoal = (goal: PrimaryGoal) => {
    const newGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter(g => g !== goal)
      : [...selectedGoals, goal];
    
    setSelectedGoals(newGoals);
    updateProfile({ primary_goals: newGoals });
  };

  const handleContinue = () => {
    if (selectedGoals.length > 0) {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What Are Your Goals?</Text>
          <Text style={styles.subtitle}>
            Select all that apply - we'll focus on what matters to you
          </Text>
        </View>

        {/* Goals Grid */}
        <View style={styles.goalsContainer}>
          {goalOptions.map((goal) => (
            <TouchableOpacity
              key={goal.value}
              style={[
                styles.goalCard,
                selectedGoals.includes(goal.value) && styles.goalCardSelected,
              ]}
              onPress={() => toggleGoal(goal.value)}
              activeOpacity={0.8}
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <View style={styles.checkboxContainer}>
                  <View style={[
                    styles.checkbox,
                    selectedGoals.includes(goal.value) && styles.checkboxSelected,
                  ]}>
                    {selectedGoals.includes(goal.value) && (
                      <Check size={16} color={colors.background} />
                    )}
                  </View>
                </View>
              </View>
              <Text style={[
                styles.goalTitle,
                selectedGoals.includes(goal.value) && styles.goalTitleSelected,
              ]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {selectedGoals.length > 0 
              ? `${selectedGoals.length} goal${selectedGoals.length > 1 ? 's' : ''} selected`
              : 'Select at least one goal'}
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={selectedGoals.length === 0}
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
    paddingTop: 40,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    lineHeight: 22,
  },
  goalsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  goalCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalIcon: {
    fontSize: 28,
  },
  checkboxContainer: {
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  goalTitleSelected: {
    color: colors.primary,
  },
  counterContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  counterText: {
    fontSize: 15,
    color: colors.mediumGray,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
});