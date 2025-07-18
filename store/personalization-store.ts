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
  selectedSport: 'generic' | 'pole-vault' | 'soccer' | 'distance-running';
  useAIPersonalization: boolean;
}

interface PersonalizationState {
  preferences: PersonalizationPreferences;
  lastPersonalizationDate?: string;
  personalizedContentCount: number;
  isHydrated: boolean;
  
  // Actions
  updatePreferences: (preferences: Partial<PersonalizationPreferences>) => void;
  togglePersonalization: () => void;
  recordPersonalization: () => void;
  resetPreferences: () => void;
  setHydrated: (hydrated: boolean) => void;
  enableAIPersonalization: () => void;
}

const defaultPreferences: PersonalizationPreferences = {
  enabled: true,
  autoPersonalize: true,
  preferredTone: 'motivational',
  contentLength: 'medium',
  includeContextualFactors: true,
  cachePersonalizedContent: true,
  selectedSport: 'generic',
  useAIPersonalization: true,
};

export const usePersonalizationStore = create<PersonalizationState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      personalizedContentCount: 0,
      isHydrated: false,
      
      updatePreferences: (newPreferences) => {
        console.log('🔄 Updating personalization preferences:', newPreferences);
        set((state) => {
          const updated = { ...state.preferences, ...newPreferences };
          console.log('📝 New preferences state:', updated);
          return {
            preferences: updated,
          };
        });
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
      
      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },
      
      enableAIPersonalization: () => {
        console.log('🔧 Manually enabling AI personalization');
        set((state) => ({
          preferences: {
            ...state.preferences,
            enabled: true,
            useAIPersonalization: true,
          }
        }));
      },
    }),
    {
      name: 'personalization-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (state) => {
        console.log('🔄 Starting personalization store hydration...');
        return (state, error) => {
          if (error) {
            console.error('❌ Personalization store hydration failed:', error);
          } else {
            console.log('✅ Personalization store hydrated successfully:', {
              enabled: state?.preferences?.enabled,
              useAIPersonalization: state?.preferences?.useAIPersonalization,
              preferredTone: state?.preferences?.preferredTone
            });
          }
        };
      },
    }
  )
);