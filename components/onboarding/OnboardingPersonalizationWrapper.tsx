import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { PersonalizationPreloader } from '@/services/personalization-preloader';
import PersonalizationIntro from '@/components/personalization/PersonalizationIntro';
import PersonalizationSport from '@/components/personalization/PersonalizationSport';
import PersonalizationExperience from '@/components/personalization/PersonalizationExperience';
import PersonalizationGoals from '@/components/personalization/PersonalizationGoals';
import PersonalizationEnergyStyle from '@/components/personalization/PersonalizationEnergyStyle';
import PersonalizationTrainingGoals from '@/components/personalization/PersonalizationTrainingGoals';
import PersonalizationComplete from '@/components/personalization/PersonalizationComplete';
import { useUserStore } from '@/store/user-store';

interface OnboardingPersonalizationWrapperProps {
  onComplete: () => void;
  onSkip: () => void;
  onBackToMain?: () => void;
}

const personalizationSteps = [
  { id: 'intro', title: 'Personalized Visualizations' },
  { id: 'sport', title: 'Your Sport' },
  { id: 'experience', title: 'Experience Level' },
  { id: 'goals', title: 'Your Goals' },
  { id: 'energy', title: 'Energy Style' },
  { id: 'training-goals', title: 'Training Goals' },
  { id: 'complete', title: 'All Set!' },
];

export default function OnboardingPersonalizationWrapper({ 
  onComplete, 
  onSkip,
  onBackToMain 
}: OnboardingPersonalizationWrapperProps) {
  // Calculate initial step based on what's already been collected
  const getInitialStep = () => {
    const userProfile = useUserStore.getState().profile;
    
    // If we already have sport and experience, skip those steps
    if (userProfile.sport && userProfile.experienceLevel) {
      return 3; // Start at goals step
    } else if (userProfile.sport) {
      return 2; // Start at experience step
    }
    return 0; // Start at intro
  };
  
  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const { profile: userProfile } = useUserStore();
  const [profile, setProfile] = useState<Partial<PersonalizationProfile>>({
    name: userProfile.name || '',
    sport_activity: userProfile.sport === 'track-and-field' ? 'Track & Field' : userProfile.sport || '',
    experience_level: userProfile.experienceLevel || undefined,
    specific_role: userProfile.trackFieldEvent || '',
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
    } else if (onBackToMain) {
      // If we're on the first step and have a back to main handler, use it
      onBackToMain();
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
        weekly_session_target: profile.weekly_session_target,
        weekly_visualization_target: profile.weekly_visualization_target,
        completed_at: new Date().toISOString(),
        is_personalization_enabled: true,
      };
      
      console.log('🎯 Completing personalization setup with profile:', {
        sport: completeProfile.sport_activity,
        experience: completeProfile.experience_level,
        goals: completeProfile.primary_goals
      });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userPersonalizationProfile', JSON.stringify(completeProfile));
      console.log('✅ Personalization profile saved to AsyncStorage');
      
      // Also update the user store with the collected data
      const userStore = useUserStore.getState();
      userStore.updateProfile({
        name: profile.name || '',
        sport: profile.sport_activity as any,
        experienceLevel: profile.experience_level as any,
        weeklySessionTarget: profile.weekly_session_target,
        primaryFocus: profile.primary_goals?.[0] as any,
      });
      console.log('✅ User store updated with profile data');
      
      // Get preloader instance
      const preloader = PersonalizationPreloader.getInstance();
      
      // Force clear any existing cached content to ensure fresh start
      console.log('🧹 Clearing any existing cached content before generating new personalized content');
      await preloader.clearAllContent();
      
      // Start background preloading of personalized content
      console.log(`🚀 Starting personalized content generation for sport: ${completeProfile.sport_activity}`);
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
        return <PersonalizationTrainingGoals {...props} />;
      case 6:
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