import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingGoals {
  weeklySessionTarget?: number;
  weeklyVisualizationTarget?: number;
  streakGoal?: number;
  primaryFocus?: 'consistency' | 'performance' | 'mindset' | 'recovery';
  motivationType?: 'achievement' | 'progress' | 'community' | 'personal';
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  goals: OnboardingGoals;
  loginIntent: boolean; // Track if user wants to login vs signup
  completedTutorial: boolean; // Track if user completed the tutorial
  selectedVoice?: string; // Store selected TTS voice early
  
  // Hydration state
  isHydrated: boolean;
  
  // Actions
  setOnboardingStep: (step: number) => void;
  nextStep: () => void;
  completeOnboarding: () => void;
  updateGoals: (goals: Partial<OnboardingGoals>) => void;
  resetOnboarding: () => void; // For development/testing
  setHydrated: (hydrated: boolean) => void;
  setLoginIntent: (intent: boolean) => void;
  setCompletedTutorial: (completed: boolean) => void;
  setSelectedVoice: (voice: string) => void;
}

const defaultGoals: OnboardingGoals = {};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      currentStep: 0,
      goals: defaultGoals,
      loginIntent: false,
      completedTutorial: false,
      selectedVoice: undefined,
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
          goals: defaultGoals,
          loginIntent: false,
          completedTutorial: false,
          selectedVoice: undefined
        });
      },
      
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      setLoginIntent: (intent) => set({ loginIntent: intent }),
      setCompletedTutorial: (completed) => set({ completedTutorial: completed }),
      setSelectedVoice: (voice) => set({ selectedVoice: voice }),
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
    title: 'Welcome to Athlete Mindset',
    subtitle: 'Build mental excellence for peak performance',
    description: 'Track your mental game with session intentions and reflections, plus guided AI-powered visualizations. Everything you need to train your mind like a pro.',
    icon: '🧠',
  },
  {
    id: 'name',
    title: 'What\'s your name?',
    subtitle: 'Personalize your experience',
    description: 'Help us personalize your experience',
    icon: '👤',
  },
  {
    id: 'sport',
    title: 'What\'s Your Sport?',
    subtitle: 'Choose your primary athletic focus',
    description: 'This helps us tailor your mental training content',
    icon: '🏃‍♂️',
  },
  {
    id: 'experience',
    title: 'Experience Level',
    subtitle: 'In your sport',
    description: 'This helps us tailor the complexity and focus of your visualizations',
    icon: '⭐',
  },
  {
    id: 'ai-visualization',
    title: 'AI-Powered\nMental Training',
    subtitle: 'Guided visualization exercises',
    description: 'Professional mental training exercises with AI narration. Build confidence, improve focus, and visualize success with 3 natural voice options.',
    icon: '🎯',
  },
  {
    id: 'visualization-demo',
    title: 'Train Your Mind\nLike a Pro',
    subtitle: 'Science-backed mental training',
    description: 'Professional athletes use visualization to enhance performance. Experience AI-guided sessions that build confidence and focus.',
    icon: '🎯',
  },
  {
    id: 'personalization',
    title: 'Choose Your\nAI Narrator',
    subtitle: 'Select your voice preference',
    description: 'Choose from 3 natural AI voices to guide your visualization exercises. Pick the voice that resonates with your training style.',
    icon: '🎤',
  },
  {
    id: 'auth',
    title: 'Create Your\nAccount',
    subtitle: 'Join thousands of athletes training their minds',
    description: 'Create your account to save progress, sync across devices, and access personalized mental training content.',
    icon: '🚀',
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