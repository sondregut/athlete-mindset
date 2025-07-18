import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';
import { ExperienceLevel } from '@/store/user-store';

interface SimpleExperienceSelectProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  selectedLevel: ExperienceLevel | undefined;
  onSelectLevel: (level: ExperienceLevel) => void;
  sport?: string;
}

const LEVELS: { value: ExperienceLevel; title: string; description: string }[] = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'Just starting out or less than 1 year',
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    description: '1-3 years of regular training',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    description: '3+ years, competing regularly',
  },
  {
    value: 'professional',
    title: 'Professional',
    description: 'Elite level, this is my career',
  },
];

export default function SimpleExperienceSelect({
  onNext,
  onBack,
  onSkip,
  selectedLevel,
  onSelectLevel,
  sport,
}: SimpleExperienceSelectProps) {
  const handleNext = () => {
    if (selectedLevel) {
      onNext();
    } else {
      onSkip();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>What's your experience level?</Text>
        <Text style={styles.subtitle}>
          How long have you been training in {sport || 'your sport'}?
        </Text>

        <View style={styles.optionsContainer}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.option,
                selectedLevel === level.value && styles.optionSelected,
              ]}
              onPress={() => onSelectLevel(level.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    selectedLevel === level.value && styles.optionTitleSelected,
                  ]}
                >
                  {level.title}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    selectedLevel === level.value && styles.optionDescriptionSelected,
                  ]}
                >
                  {level.description}
                </Text>
              </View>
              {selectedLevel === level.value && (
                <Check size={24} color={colors.background} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <OnboardingButton
          title={selectedLevel ? "Continue" : "Skip"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: colors.background,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  optionDescriptionSelected: {
    color: colors.background,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
});