import { useTheme } from '@/contexts/ThemeContext';

export const useThemeColors = () => {
  const { colors } = useTheme();
  return colors;
};