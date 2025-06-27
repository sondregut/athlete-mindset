import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SportType = 
  | 'track-and-field'
  | 'archery'
  | 'badminton'
  | 'baseball'
  | 'basketball'
  | 'boxing'
  | 'canoeing'
  | 'climbing'
  | 'cricket'
  | 'cycling'
  | 'dancing'
  | 'diving'
  | 'equestrian'
  | 'fencing'
  | 'football-american'
  | 'football-soccer'
  | 'golf'
  | 'gymnastics'
  | 'handball'
  | 'hockey-field'
  | 'hockey-ice'
  | 'judo'
  | 'karate'
  | 'lacrosse'
  | 'martial-arts'
  | 'netball'
  | 'paddling'
  | 'polo'
  | 'powerlifting'
  | 'rowing'
  | 'rugby'
  | 'sailing'
  | 'skateboarding'
  | 'skiing'
  | 'snowboarding'
  | 'softball'
  | 'squash'
  | 'surfing'
  | 'swimming'
  | 'table-tennis'
  | 'taekwondo'
  | 'tennis'
  | 'triathlon'
  | 'volleyball'
  | 'water-polo'
  | 'weightlifting'
  | 'wrestling'
  | 'yoga'
  | 'other';

export type TrackFieldEvent = 
  | 'sprints-100m'
  | 'sprints-200m'
  | 'sprints-400m'
  | 'middle-distance-800m'
  | 'middle-distance-1500m'
  | 'middle-distance-mile'
  | 'long-distance-3000m'
  | 'long-distance-5000m'
  | 'long-distance-10000m'
  | 'marathon'
  | 'hurdles-100m'
  | 'hurdles-110m'
  | 'hurdles-400m'
  | 'steeplechase'
  | 'relay-4x100m'
  | 'relay-4x400m'
  | 'high-jump'
  | 'pole-vault'
  | 'long-jump'
  | 'triple-jump'
  | 'shot-put'
  | 'discus'
  | 'hammer'
  | 'javelin'
  | 'heptathlon'
  | 'decathlon'
  | 'race-walk';
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
  preferredUnits?: 'metric' | 'imperial';
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
  // Track and Field at the top
  { value: 'track-and-field', label: 'Track & Field', icon: '🏃' },
  
  // Alphabetical order
  { value: 'archery', label: 'Archery', icon: '🏹' },
  { value: 'badminton', label: 'Badminton', icon: '🏸' },
  { value: 'baseball', label: 'Baseball', icon: '⚾' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'boxing', label: 'Boxing', icon: '🥊' },
  { value: 'canoeing', label: 'Canoeing', icon: '🛶' },
  { value: 'climbing', label: 'Climbing', icon: '🧗' },
  { value: 'cricket', label: 'Cricket', icon: '🏏' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'dancing', label: 'Dancing', icon: '💃' },
  { value: 'diving', label: 'Diving', icon: '🏊' },
  { value: 'equestrian', label: 'Equestrian', icon: '🏇' },
  { value: 'fencing', label: 'Fencing', icon: '🤺' },
  { value: 'football-american', label: 'Football (American)', icon: '🏈' },
  { value: 'football-soccer', label: 'Football (Soccer)', icon: '⚽' },
  { value: 'golf', label: 'Golf', icon: '⛳' },
  { value: 'gymnastics', label: 'Gymnastics', icon: '🤸' },
  { value: 'handball', label: 'Handball', icon: '🤾' },
  { value: 'hockey-field', label: 'Hockey (Field)', icon: '🏑' },
  { value: 'hockey-ice', label: 'Hockey (Ice)', icon: '🏒' },
  { value: 'judo', label: 'Judo', icon: '🥋' },
  { value: 'karate', label: 'Karate', icon: '🥋' },
  { value: 'lacrosse', label: 'Lacrosse', icon: '🥍' },
  { value: 'martial-arts', label: 'Martial Arts', icon: '🥋' },
  { value: 'netball', label: 'Netball', icon: '🏐' },
  { value: 'paddling', label: 'Paddling', icon: '🛶' },
  { value: 'polo', label: 'Polo', icon: '🏇' },
  { value: 'powerlifting', label: 'Powerlifting', icon: '🏋️' },
  { value: 'rowing', label: 'Rowing', icon: '🚣' },
  { value: 'rugby', label: 'Rugby', icon: '🏉' },
  { value: 'sailing', label: 'Sailing', icon: '⛵' },
  { value: 'skateboarding', label: 'Skateboarding', icon: '🛹' },
  { value: 'skiing', label: 'Skiing', icon: '⛷️' },
  { value: 'snowboarding', label: 'Snowboarding', icon: '🏂' },
  { value: 'softball', label: 'Softball', icon: '🥎' },
  { value: 'squash', label: 'Squash', icon: '🎾' },
  { value: 'surfing', label: 'Surfing', icon: '🏄' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'table-tennis', label: 'Table Tennis', icon: '🏓' },
  { value: 'taekwondo', label: 'Taekwondo', icon: '🥋' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'triathlon', label: 'Triathlon', icon: '🏊' },
  { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { value: 'water-polo', label: 'Water Polo', icon: '🤽' },
  { value: 'weightlifting', label: 'Weightlifting', icon: '🏋️' },
  { value: 'wrestling', label: 'Wrestling', icon: '🤼' },
  { value: 'yoga', label: 'Yoga & Mindfulness', icon: '🧘' },
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
  { value: 'sprints-400m', label: '400m', category: 'Sprints', icon: '💨' },
  
  // Middle Distance
  { value: 'middle-distance-800m', label: '800m', category: 'Middle Distance', icon: '🏃' },
  { value: 'middle-distance-1500m', label: '1500m', category: 'Middle Distance', icon: '🏃' },
  { value: 'middle-distance-mile', label: 'Mile', category: 'Middle Distance', icon: '🏃' },
  
  // Long Distance
  { value: 'long-distance-3000m', label: '3000m', category: 'Long Distance', icon: '🏃' },
  { value: 'long-distance-5000m', label: '5000m', category: 'Long Distance', icon: '🏃' },
  { value: 'long-distance-10000m', label: '10000m', category: 'Long Distance', icon: '🏃' },
  { value: 'marathon', label: 'Marathon', category: 'Long Distance', icon: '🏃' },
  
  // Hurdles
  { value: 'hurdles-100m', label: '100m Hurdles', category: 'Hurdles', icon: '🚧' },
  { value: 'hurdles-110m', label: '110m Hurdles', category: 'Hurdles', icon: '🚧' },
  { value: 'hurdles-400m', label: '400m Hurdles', category: 'Hurdles', icon: '🚧' },
  { value: 'steeplechase', label: 'Steeplechase', category: 'Hurdles', icon: '🚧' },
  
  // Relays
  { value: 'relay-4x100m', label: '4x100m Relay', category: 'Relays', icon: '🤝' },
  { value: 'relay-4x400m', label: '4x400m Relay', category: 'Relays', icon: '🤝' },
  
  // Jumps
  { value: 'high-jump', label: 'High Jump', category: 'Jumps', icon: '⬆️' },
  { value: 'pole-vault', label: 'Pole Vault', category: 'Jumps', icon: '🏃' },
  { value: 'long-jump', label: 'Long Jump', category: 'Jumps', icon: '➡️' },
  { value: 'triple-jump', label: 'Triple Jump', category: 'Jumps', icon: '➡️' },
  
  // Throws
  { value: 'shot-put', label: 'Shot Put', category: 'Throws', icon: '⚪' },
  { value: 'discus', label: 'Discus', category: 'Throws', icon: '🥏' },
  { value: 'hammer', label: 'Hammer Throw', category: 'Throws', icon: '🔨' },
  { value: 'javelin', label: 'Javelin', category: 'Throws', icon: '🏹' },
  
  // Combined Events
  { value: 'heptathlon', label: 'Heptathlon', category: 'Combined Events', icon: '🏆' },
  { value: 'decathlon', label: 'Decathlon', category: 'Combined Events', icon: '🏆' },
  
  // Race Walk
  { value: 'race-walk', label: 'Race Walk', category: 'Race Walk', icon: '🚶' },
];