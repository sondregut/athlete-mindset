import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SportType = 
  | 'track-and-field'
  | 'other';

export type TrackFieldEvent = 
  | 'sprints-100m'
  | 'sprints-200m'
  | 'running-all-distances'
  | 'high-jump'
  | 'pole-vault'
  | 'long-triple-jump'
  | 'throws-all';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type AgeRange = 
  | 'under-18'
  | '18-24'
  | '25-34'
  | '35-44'
  | '45-54'
  | '55-64'
  | '65-plus'
  | 'prefer-not-to-say';

interface UserProfile {
  name: string;
  age?: number;
  ageRange?: AgeRange;
  sport?: SportType;
  trackFieldEvent?: TrackFieldEvent; // Only used when sport is 'track-and-field'
  experienceLevel?: ExperienceLevel;
  joinDate: string;
  notificationsEnabled: boolean;
  reminderTime?: string; // HH:MM format
  // Goals from onboarding
  weeklySessionTarget?: number;
  streakGoal?: number;
  primaryFocus?: 'consistency' | 'performance' | 'mindset' | 'recovery';
  motivationType?: 'achievement' | 'progress' | 'community' | 'personal';
  goals?: string; // User's athletic goals
}

interface UserPreferences {
  pushNotifications?: boolean;
  darkMode?: boolean;
  publicProfile?: boolean;
  shareData?: boolean;
}

interface UserState {
  profile: UserProfile;
  preferences: UserPreferences;
  
  // Loading states
  isUpdatingProfile: boolean;
  isResettingProfile: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (data: Partial<UserPreferences>) => void;
  resetProfile: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const defaultProfile: UserProfile = {
  name: '',
  joinDate: new Date().toISOString(),
  notificationsEnabled: true,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      preferences: {},
      
      // Loading states
      isUpdatingProfile: false,
      isResettingProfile: false,
      
      // Error state
      error: null,
      
      updateProfile: async (data) => {
        set({ isUpdatingProfile: true, error: null });
        
        try {
          // Validate data
          if (data.name !== undefined && data.name.length > 50) {
            throw new Error('Name must be 50 characters or less');
          }
          
          if (data.age !== undefined && (data.age < 13 || data.age > 99)) {
            throw new Error('Age must be between 13 and 99');
          }
          
          // Simulate processing time for profile validation/updates
          await new Promise(resolve => setTimeout(resolve, 300));
          
          set((state) => ({
            profile: { ...state.profile, ...data }
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isUpdatingProfile: false });
        }
      },
      
      updatePreferences: (data) => {
        set((state) => ({
          preferences: { ...state.preferences, ...data }
        }));
      },
      
      resetProfile: async () => {
        set({ isResettingProfile: true, error: null });
        
        try {
          // Simulate processing time for profile reset
          await new Promise(resolve => setTimeout(resolve, 400));
          
          set({ profile: defaultProfile });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to reset profile';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isResettingProfile: false });
        }
      },
      
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'user-profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const sportOptions: { value: SportType; label: string; icon: string }[] = [
  { value: 'track-and-field', label: 'Track & Field', icon: '🏃' },
  { value: 'other', label: 'Other', icon: '🏃' },
];

export const ageRangeOptions: { value: AgeRange; label: string; icon: string }[] = [
  { value: 'under-18', label: 'Under 18', icon: '👶' },
  { value: '18-24', label: '18-24', icon: '🧑' },
  { value: '25-34', label: '25-34', icon: '👤' },
  { value: '35-44', label: '35-44', icon: '🧑‍💼' },
  { value: '45-54', label: '45-54', icon: '👨‍💼' },
  { value: '55-64', label: '55-64', icon: '🧓' },
  { value: '65-plus', label: '65+', icon: '👴' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: '🤐' },
];

export const experienceLevelOptions: { value: ExperienceLevel; label: string; description: string; icon: string }[] = [
  { 
    value: 'beginner', 
    label: 'Beginner', 
    description: 'New to training or returning after a break',
    icon: '🌱'
  },
  { 
    value: 'intermediate', 
    label: 'Intermediate', 
    description: 'Regular training with some experience',
    icon: '💪'
  },
  { 
    value: 'advanced', 
    label: 'Advanced', 
    description: 'Extensive training experience and knowledge',
    icon: '🏆'
  },
];

export const trackFieldEventOptions: { value: TrackFieldEvent; label: string; category: string; icon: string }[] = [
  // Sprints
  { value: 'sprints-100m', label: '100m', category: 'Sprints', icon: '💨' },
  { value: 'sprints-200m', label: '200m', category: 'Sprints', icon: '💨' },
  
  // Running (all distances)
  { value: 'running-all-distances', label: 'Running (All Distances)', category: 'Running', icon: '🏃' },
  
  // Jumps
  { value: 'high-jump', label: 'High Jump', category: 'Jumps', icon: '⬆️' },
  { value: 'pole-vault', label: 'Pole Vault', category: 'Jumps', icon: '🏃' },
  { value: 'long-triple-jump', label: 'Long/Triple Jump', category: 'Jumps', icon: '➡️' },
  
  // Throws
  { value: 'throws-all', label: 'All Throws', category: 'Throws', icon: '🥏' },
];