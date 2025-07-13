import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity, PanResponder, Animated } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useOnboardingStore, onboardingSteps } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingButton from '@/components/onboarding/OnboardingButton';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingMentalTracking from '@/components/onboarding/OnboardingMentalTracking';
import OnboardingAIVisualization from '@/components/onboarding/OnboardingAIVisualization';
import OnboardingVisualizationDemo from '@/components/onboarding/OnboardingVisualizationDemo';
import OnboardingSynergy from '@/components/onboarding/OnboardingSynergy';
import OnboardingPersonalization from '@/components/onboarding/OnboardingPersonalization';
import OnboardingGoals from '@/components/onboarding/OnboardingGoals';
import OnboardingAuth from '@/components/onboarding/OnboardingAuth';
import OnboardingPersonalizationSetup from '@/components/onboarding/OnboardingPersonalizationSetup';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { currentStep, setOnboardingStep, completeOnboarding, setLoginIntent } = useOnboardingStore();
  const { updateProfile } = useUserStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

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
      // Special case: if we're on auth screen (step 7) and came from login intent
      // return to welcome screen (step 0) instead of goals screen (step 6)
      const { loginIntent } = useOnboardingStore.getState();
      if (currentStep === 7 && loginIntent) {
        setOnboardingStep(0);
        setLoginIntent(false); // Clear the login intent
      } else {
        setOnboardingStep(currentStep - 1);
      }
      setIsTransitioning(false);
    }, 150);
  };

  const handleComplete = async () => {
    console.log('✅ Onboarding complete');
    
    try {
      // Mark onboarding as complete
      completeOnboarding();
      
      // Set user join date
      updateProfile({ 
        joinDate: new Date().toISOString(),
      });
      
      // Navigate to main app
      router.replace('/(tabs)');
      console.log('🎯 Navigation to main app');
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
    }
  };

  const handleLogin = () => {
    // Set login intent and navigate to the authentication screen
    setLoginIntent(true);
    setOnboardingStep(7); // Auth is now step 7
  };

  // Create PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate pan responder on horizontal swipes, not vertical
        // This allows vertical scrolling to work properly
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 && Math.abs(gestureState.dx) > 30;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow right swipe (positive dx) for going back
        if (gestureState.dx > 0 && currentStep > 0) {
          pan.x.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = width * 0.25; // 25% of screen width
        
        // Check if swipe right is sufficient and we're not on first step
        if (gestureState.dx > swipeThreshold && currentStep > 0 && !isTransitioning) {
          // Animate out and go back
          Animated.timing(pan.x, {
            toValue: width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleBack();
            // Reset position for next screen
            pan.x.setValue(0);
          });
        } else {
          // Snap back to original position
          Animated.spring(pan.x, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 9,
          }).start();
        }
      },
    })
  ).current;

  const renderStep = () => {
    console.log('🎬 Rendering step:', currentStep);
    
    try {
      switch (currentStep) {
        case 0:
          return (
            <OnboardingWelcome
              step={onboardingSteps[0]}
              onNext={handleNext}
              onLogin={handleLogin}
            />
          );
        case 1:
          return (
            <OnboardingMentalTracking
              step={onboardingSteps[1]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 2:
          return (
            <OnboardingAIVisualization
              step={onboardingSteps[2]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 3:
          return (
            <OnboardingVisualizationDemo
              step={onboardingSteps[3]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 4:
          return (
            <OnboardingSynergy
              step={onboardingSteps[4]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 5:
          return (
            <OnboardingPersonalization
              step={onboardingSteps[5]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 6:
          return (
            <OnboardingGoals
              step={onboardingSteps[6]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        case 7:
          return (
            <OnboardingAuth 
              step={onboardingSteps[7]}
            />
          );
        case 8:
          return (
            <OnboardingPersonalizationSetup
              step={onboardingSteps[8]}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        default:
          console.warn('⚠️ Unknown onboarding step:', currentStep);
          return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ fontSize: 18, color: colors.text, textAlign: 'center' }}>
                Something went wrong. Let's start over.
              </Text>
              <OnboardingButton 
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
          <OnboardingButton 
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
      
      {/* Progress Indicator with Back Button */}
      <View style={styles.progressContainer}>
        {/* Back Button */}
        {currentStep > 0 && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={20} color={colors.darkGray} />
          </TouchableOpacity>
        )}
        
        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
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
      </View>

      {/* Step Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            transform: [{ translateX: pan.x }]
          }
        ]}
        {...panResponder.panHandlers}
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
    zIndex: 5,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 40,
    height: 40,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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