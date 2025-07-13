import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { useUserStore } from '@/store/user-store';
import OnboardingButton from '@/components/onboarding/OnboardingButton';
import PersonalizationIntro from '@/components/personalization/PersonalizationIntro';
import PersonalizationSport from '@/components/personalization/PersonalizationSport';
import PersonalizationExperience from '@/components/personalization/PersonalizationExperience';
import PersonalizationGoals from '@/components/personalization/PersonalizationGoals';
import PersonalizationEnergyStyle from '@/components/personalization/PersonalizationEnergyStyle';
import PersonalizationComplete from '@/components/personalization/PersonalizationComplete';

const { width, height } = Dimensions.get('window');

const steps = [
  { id: 'intro', title: 'Personalized Visualizations' },
  { id: 'sport', title: 'Your Sport' },
  { id: 'experience', title: 'Experience Level' },
  { id: 'goals', title: 'Your Goals' },
  { id: 'energy', title: 'Energy Style' },
  { id: 'complete', title: 'All Set!' },
];

export default function PersonalizationSetupScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
  const pan = useRef(new Animated.ValueXY()).current;

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
      setIsTransitioning(false);
    }, 150);
  };

  const handleBack = () => {
    if (isTransitioning || currentStep === 0) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      setIsTransitioning(false);
    }, 150);
  };

  const handleSkip = async () => {
    // Save profile with personalization disabled
    const skipProfile: PersonalizationProfile = {
      id: Date.now().toString(),
      name: profile.name || '',
      sport_activity: '',
      experience_level: 'intermediate',
      primary_goals: [],
      preferred_style: 'calm-peaceful',
      completed_at: new Date().toISOString(),
      is_personalization_enabled: false,
    };
    
    await AsyncStorage.setItem('userPersonalizationProfile', JSON.stringify(skipProfile));
    router.replace('/(tabs)');
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
      
      // Navigate to main app
      router.replace('/(tabs)');
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
      onSkip: handleSkip,
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {currentStep > 0 && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={20} color={colors.darkGray} />
          </TouchableOpacity>
        )}
        
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.activeDot,
                index < currentStep && styles.completedDot,
              ]}
            />
          ))}
        </View>
        
        {currentStep > 0 && currentStep < steps.length - 1 && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Step Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            transform: [{ translateX: pan.x }]
          }
        ]}
      >
        {renderStep()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    position: 'relative',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mediumGray,
  },
  activeDot: {
    backgroundColor: colors.primary,
    width: 24,
  },
  completedDot: {
    backgroundColor: colors.success,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
});