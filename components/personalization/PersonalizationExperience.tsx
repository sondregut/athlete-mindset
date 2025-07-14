import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Award, TrendingUp, Star, Trophy } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';
import { PersonalizationProfile, ExperienceLevel, experienceLevelOptions } from '@/types/personalization-profile';

interface PersonalizationExperienceProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  profile: Partial<PersonalizationProfile>;
  updateProfile: (updates: Partial<PersonalizationProfile>) => void;
}

const experienceIcons = {
  beginner: <Star size={32} color={colors.primary} />,
  intermediate: <TrendingUp size={32} color={colors.secondary} />,
  advanced: <Award size={32} color={colors.success} />,
  professional: <Trophy size={32} color={colors.gold} />,
};


export default function PersonalizationExperience({ 
  onNext, 
  onBack, 
  onSkip,
  profile,
  updateProfile 
}: PersonalizationExperienceProps) {
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | undefined>(
    profile.experience_level
  );

  const handleSelect = (level: ExperienceLevel) => {
    setSelectedLevel(level);
    updateProfile({ experience_level: level });
  };

  const handleContinue = () => {
    if (selectedLevel) {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Experience Level</Text>
          <Text style={styles.subtitle}>
            in {profile.sport_activity || 'your sport'}
          </Text>
          <Text style={styles.description}>
            This helps us tailor the complexity and focus of your visualizations
          </Text>
        </View>

        {/* Experience Options */}
        <View style={styles.optionsContainer}>
          {experienceLevelOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                selectedLevel === option.value && styles.optionCardSelected,
              ]}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.8}
            >
              <View style={styles.optionHeader}>
                <View style={[
                  styles.iconWrapper,
                  selectedLevel === option.value && styles.iconWrapperSelected,
                ]}>
                  {experienceIcons[option.value]}
                </View>
                <View style={styles.optionTitleContainer}>
                  <Text style={[
                    styles.optionTitle,
                    selectedLevel === option.value && styles.optionTitleSelected,
                  ]}>
                    {option.label}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedLevel}
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
    fontSize: 18,
    color: colors.primary,
    marginBottom: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  optionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconWrapperSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: colors.primary,
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
});