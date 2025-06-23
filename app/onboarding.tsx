import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { useOnboardingStore, onboardingSteps } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';
import Button from '@/components/Button';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingPhilosophy from '@/components/onboarding/OnboardingPhilosophy';
import OnboardingFeatures from '@/components/onboarding/OnboardingFeatures';
import OnboardingAuth from '@/components/onboarding/OnboardingAuth';
import OnboardingProfile from '@/components/onboarding/OnboardingProfile';
import OnboardingGoals from '@/components/onboarding/OnboardingGoals';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { currentStep, setOnboardingStep, completeOnboarding } = useOnboardingStore();
  const { updateProfile } = useUserStore();
  const [isTransitioning, setIsTransitioning] = useState(false);

  console.log('📋 OnboardingScreen render:', {
    currentStep,
    isTransitioning,
    totalSteps: onboardingSteps.length
  });

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      if (currentStep < onboardingSteps.length - 1) {
        setOnboardingStep(currentStep + 1);
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
      setOnboardingStep(currentStep - 1);
      setIsTransitioning(false);
    }, 150);
  };

  const handleComplete = () => {
    console.log('✅ Onboarding complete, navigating to main app...');
    
    try {
      // Mark onboarding as complete
      completeOnboarding();
      
      // Set user join date
      updateProfile({ 
        joinDate: new Date().toISOString(),
      });
      
      // Navigate to main app
      router.replace('/(tabs)');
      console.log('🏠 Navigation to main app initiated');
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const renderStep = () => {
    console.log('🎬 Rendering step:', currentStep);
    
    try {
      switch (currentStep) {
        case 0:
          return (
            <OnboardingWelcome
              step={onboardingSteps[0]}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          );
        case 1:
          return (
            <OnboardingPhilosophy
              step={onboardingSteps[1]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 2:
          return (
            <OnboardingFeatures
              step={onboardingSteps[2]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 3:
          return (
            <OnboardingAuth />
          );
        case 4:
          return (
            <OnboardingProfile
              step={onboardingSteps[4]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 5:
          return (
            <OnboardingGoals
              step={onboardingSteps[5]}
              onNext={handleNext}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          );
        default:
          console.warn('⚠️ Unknown onboarding step:', currentStep);
          return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 18, color: colors.text, textAlign: 'center' }}>
                Something went wrong. Let's start over.
              </Text>
              <Button 
                title="Reset Onboarding" 
                onPress={() => {
                  setOnboardingStep(0);
                }} 
                style={{ marginTop: 20 }}
              />
            </View>
          );
      }
    } catch (error) {
      console.error('❌ Error rendering onboarding step:', error);
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: colors.error, textAlign: 'center', marginBottom: 20 }}>
            Error loading onboarding step
          </Text>
          <Button 
            title="Try Again" 
            onPress={() => {
              setOnboardingStep(0);
            }} 
          />
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {onboardingSteps.map((_, index) => (
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

      {/* Step Content */}
      <View style={styles.contentContainer}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
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
  contentContainer: {
    flex: 1,
  },
});