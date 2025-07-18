import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useUserStore } from '@/store/user-store';
import SimpleSportSelect from './SimpleSportSelect';

interface OnboardingSportProps {
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

export default function OnboardingSport({ step, onNext, onBack }: OnboardingSportProps) {
  const { profile, updateProfile } = useUserStore();
  const [selectedSport, setSelectedSport] = React.useState(profile.sport || '');

  const handleNext = () => {
    // Save sport selection to user store
    const sportLower = selectedSport.toLowerCase();
    let sportValue = 'other';
    
    if (sportLower.includes('track') || sportLower.includes('field')) {
      sportValue = 'track-and-field';
    } else {
      sportValue = sportLower.replace(/\s+/g, '-');
    }
    
    updateProfile({ sport: sportValue as any });
    onNext();
  };

  return (
    <View style={styles.container}>
      <SimpleSportSelect
        onNext={handleNext}
        onBack={onBack}
        onSkip={handleNext}
        selectedSport={selectedSport}
        onSelectSport={setSelectedSport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});