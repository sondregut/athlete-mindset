import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { PersonalizationPreloader } from '@/services/personalization-preloader';
import PersonalizationIntro from '@/components/personalization/PersonalizationIntro';
import PersonalizationSport from '@/components/personalization/PersonalizationSport';
import PersonalizationExperience from '@/components/personalization/PersonalizationExperience';
import PersonalizationGoals from '@/components/personalization/PersonalizationGoals';
import PersonalizationEnergyStyle from '@/components/personalization/PersonalizationEnergyStyle';
import PersonalizationComplete from '@/components/personalization/PersonalizationComplete';
import { useUserStore } from '@/store/user-store';

interface OnboardingPersonalizationWrapperProps {
  onComplete: () => void;
  onSkip: () => void;
}

const personalizationSteps = [
  { id: 'intro', title: 'Personalized Visualizations' },
  { id: 'sport', title: 'Your Sport' },
  { id: 'experience', title: 'Experience Level' },
  { id: 'goals', title: 'Your Goals' },
  { id: 'energy', title: 'Energy Style' },
  { id: 'complete', title: 'All Set!' },
];

export default function OnboardingPersonalizationWrapper({ 
  onComplete, 
  onSkip 
}: OnboardingPersonalizationWrapperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { profile: userProfile } = useUserStore();
  const [profile, setProfile] = useState<Partial<PersonalizationProfile>>({
    name: userProfile.name || '',
    sport_activity: '',
    experience_level: undefined,
    specific_role: '',
    primary_goals: [],
    preferred_style: undefined,
    is_personalization_enabled: true,
  });

  const handleNext = () => {
    if (currentStep < personalizationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipPersonalization = async () => {
    // Save skip choice
    await AsyncStorage.setItem('personalizationSkipped', 'true');
    onSkip();
  };

  const handleComplete = async () => {
    try {
      // Create complete profile
      const completeProfile: PersonalizationProfile = {
        id: Date.now().toString(),
        name: profile.name || '',
        sport_activity: profile.sport_activity || '',
        experience_level: profile.experience_level || 'intermediate',
        specific_role: profile.specific_role,
        primary_goals: profile.primary_goals || [],
        preferred_style: profile.preferred_style || 'calm-peaceful',
        completed_at: new Date().toISOString(),
        is_personalization_enabled: true,
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userPersonalizationProfile', JSON.stringify(completeProfile));
      
      console.log('✅ Personalization profile saved:', completeProfile);
      
      // Start background preloading of personalized content
      const preloader = PersonalizationPreloader.getInstance();
      preloader.preloadAllContent(completeProfile, (progress, message) => {
        console.log(`[Preloader] ${progress}%: ${message}`);
      }).catch(error => {
        console.error('Background preload error:', error);
        // Don't block onboarding if preload fails
      });
      
      // Call parent onComplete
      onComplete();
    } catch (error) {
      console.error('❌ Error saving personalization profile:', error);
    }
  };

  const updateProfile = (updates: Partial<PersonalizationProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    const props = {
      onNext: handleNext,
      onBack: handleBack,
      onSkip: handleSkipPersonalization,
      profile,
      updateProfile,
    };

    switch (currentStep) {
      case 0:
        return <PersonalizationIntro {...props} />;
      case 1:
        return <PersonalizationSport {...props} />;
      case 2:
        return <PersonalizationExperience {...props} />;
      case 3:
        return <PersonalizationGoals {...props} />;
      case 4:
        return <PersonalizationEnergyStyle {...props} />;
      case 5:
        return <PersonalizationComplete {...props} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});