import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PersonalizationPreferences {
  enabled: boolean;
  autoPersonalize: boolean;
  preferredTone: 'motivational' | 'calming' | 'focused' | 'energizing';
  contentLength: 'short' | 'medium' | 'long';
  includeContextualFactors: boolean;
  cachePersonalizedContent: boolean;
}

interface PersonalizationState {
  preferences: PersonalizationPreferences;
  lastPersonalizationDate?: string;
  personalizedContentCount: number;
  
  // Actions
  updatePreferences: (preferences: Partial<PersonalizationPreferences>) => void;
  togglePersonalization: () => void;
  recordPersonalization: () => void;
  resetPreferences: () => void;
}

const defaultPreferences: PersonalizationPreferences = {
  enabled: true,
  autoPersonalize: true,
  preferredTone: 'motivational',
  contentLength: 'medium',
  includeContextualFactors: true,
  cachePersonalizedContent: true,
};

export const usePersonalizationStore = create<PersonalizationState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      personalizedContentCount: 0,
      
      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        }));
      },
      
      togglePersonalization: () => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            enabled: !state.preferences.enabled,
          },
        }));
      },
      
      recordPersonalization: () => {
        set((state) => ({
          personalizedContentCount: state.personalizedContentCount + 1,
          lastPersonalizationDate: new Date().toISOString(),
        }));
      },
      
      resetPreferences: () => {
        set({
          preferences: defaultPreferences,
          personalizedContentCount: 0,
          lastPersonalizationDate: undefined,
        });
      },
    }),
    {
      name: 'personalization-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);