import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  updateSystemTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isDark: false,
      
      setThemeMode: (mode) => {
        set({ mode });
        // Update isDark based on the new mode
        const systemIsDark = Appearance.getColorScheme() === 'dark';
        const isDark = mode === 'system' ? systemIsDark : mode === 'dark';
        set({ isDark });
      },
      
      updateSystemTheme: () => {
        const { mode } = get();
        if (mode === 'system') {
          const systemIsDark = Appearance.getColorScheme() === 'dark';
          set({ isDark: systemIsDark });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        console.log('🎨 Starting theme store hydration...');
        return (state, error) => {
          if (error) {
            console.error('❌ Theme store hydration failed:', error);
          } else {
            console.log('✅ Theme store hydrated successfully:', {
              mode: state?.mode,
              isDark: state?.isDark
            });
            // Update theme based on current system setting
            state?.updateSystemTheme();
          }
        };
      },
    }
  )
);

// Initialize theme on app start
Appearance.addChangeListener(() => {
  useThemeStore.getState().updateSystemTheme();
});