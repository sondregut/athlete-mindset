import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingGoals {
  weeklySessionTarget?: number;
  streakGoal?: number;
  primaryFocus?: 'consistency' | 'performance' | 'mindset' | 'recovery';
  motivationType?: 'achievement' | 'progress' | 'community' | 'personal';
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  goals: OnboardingGoals;
  
  // Hydration state
  isHydrated: boolean;
  
  // Actions
  setOnboardingStep: (step: number) => void;
  nextStep: () => void;
  completeOnboarding: () => void;
  updateGoals: (goals: Partial<OnboardingGoals>) => void;
  resetOnboarding: () => void; // For development/testing
  setHydrated: (hydrated: boolean) => void;
}

const defaultGoals: OnboardingGoals = {};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      goals: defaultGoals,
      isHydrated: false,
      
      setOnboardingStep: (step) => set({ currentStep: step }),
      
      nextStep: () => set((state) => ({ 
        currentStep: Math.min(state.currentStep + 1, onboardingSteps.length - 1)
      })),
      
      completeOnboarding: () => set({ 
        hasCompletedOnboarding: true,
        currentStep: 0
      }),
      
      updateGoals: (newGoals) => set((state) => ({
        goals: { ...state.goals, ...newGoals }
      })),
      
      resetOnboarding: () => {
        console.log('🔄 Resetting onboarding data...');
        set({
          hasCompletedOnboarding: false,
          currentStep: 0,
          goals: defaultGoals
        });
      },
      
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        console.log('🔄 Starting onboarding store hydration...');
        return (state, error) => {
          if (error) {
            console.error('❌ Onboarding store hydration failed:', error);
          } else {
            console.log('✅ Onboarding store hydrated successfully:', {
              hasCompletedOnboarding: state?.hasCompletedOnboarding,
              currentStep: state?.currentStep
            });
            state?.setHydrated(true);
          }
        };
      },
    }
  )
);

// Onboarding content configuration
export const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Your\nMindset Journey',
    subtitle: 'Track not just what you do,\nbut how you think and feel',
    description: 'This app helps athletes develop mental resilience through structured pre and post-training reflection.',
    icon: '🧠',
  },
  {
    id: 'philosophy',
    title: 'The Power of\nMindful Training',
    subtitle: 'Mental performance is as important\nas physical performance',
    description: 'By tracking your intentions, mindset, and reflections, you\'ll build self-awareness and mental toughness.',
    icon: '🎯',
  },
  {
    id: 'features',
    title: 'Your Training\nCompanion',
    subtitle: 'Log sessions, track progress,\nbuild streaks',
    description: 'Set intentions before training, track your session, and reflect afterward to maximize growth.',
    icon: '📈',
  },
  {
    id: 'profile',
    title: 'Tell Us About\nYourself',
    subtitle: 'Personalize your experience',
    description: 'Help us customize the app for your training style and preferences.',
    icon: '👤',
  },
  {
    id: 'goals',
    title: 'Set Your\nTargets',
    subtitle: 'What would you like to achieve?',
    description: 'Let\'s set some initial goals to keep you motivated and on track.',
    icon: '🏆',
  },
  {
    id: 'auth',
    title: 'Create Your\nAccount',
    subtitle: '',
    description: '',
    icon: '🔐',
  },
];

export const focusOptions = [
  { 
    value: 'consistency' as const,
    label: 'Building Consistency',
    description: 'Focus on developing regular training habits',
    icon: '🔄'
  },
  { 
    value: 'performance' as const,
    label: 'Peak Performance',
    description: 'Optimize training quality and outcomes',
    icon: '⚡'
  },
  { 
    value: 'mindset' as const,
    label: 'Mental Strength',
    description: 'Develop resilience and mental toughness',
    icon: '🧠'
  },
  { 
    value: 'recovery' as const,
    label: 'Smart Recovery',
    description: 'Balance training with proper rest',
    icon: '💤'
  },
];

export const motivationOptions = [
  { 
    value: 'achievement' as const,
    label: 'Achievements',
    description: 'Motivated by reaching milestones and goals',
    icon: '🏅'
  },
  { 
    value: 'progress' as const,
    label: 'Progress',
    description: 'Motivated by continuous improvement',
    icon: '📊'
  },
  { 
    value: 'community' as const,
    label: 'Community',
    description: 'Motivated by sharing and social connection',
    icon: '👥'
  },
  { 
    value: 'personal' as const,
    label: 'Personal Growth',
    description: 'Motivated by self-discovery and development',
    icon: '🌱'
  },
];