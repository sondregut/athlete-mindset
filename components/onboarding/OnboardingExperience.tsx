import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useUserStore, ExperienceLevel } from '@/store/user-store';
import SimpleExperienceSelect from './SimpleExperienceSelect';

interface OnboardingExperienceProps {
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

export default function OnboardingExperience({ step, onNext, onBack }: OnboardingExperienceProps) {
  const { profile, updateProfile } = useUserStore();
  const [selectedLevel, setSelectedLevel] = React.useState<ExperienceLevel | undefined>(
    profile.experienceLevel
  );

  const getSportDisplayName = () => {
    if (profile.sport === 'track-and-field') {
      if (profile.trackFieldEvent === 'pole-vault') {
        return 'Pole Vault';
      }
      return 'Track & Field';
    }
    return profile.sport?.replace(/-/g, ' ') || 'your sport';
  };

  const handleNext = () => {
    if (selectedLevel) {
      updateProfile({ experienceLevel: selectedLevel });
    }
    onNext();
  };

  return (
    <View style={styles.container}>
      <SimpleExperienceSelect
        onNext={handleNext}
        onBack={onBack}
        onSkip={handleNext}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        sport={getSportDisplayName()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});