import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/theme-store';
import { lightColors, darkColors, ThemeColors } from '@/constants/theme';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const { mode, isDark, updateSystemTheme } = useThemeStore();

  useEffect(() => {
    // Update theme when system color scheme changes
    updateSystemTheme();
  }, [systemColorScheme, updateSystemTheme]);

  const value: ThemeContextValue = {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}