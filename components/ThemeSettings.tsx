import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Moon, Sun, Smartphone } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStore, ThemeMode } from '@/store/theme-store';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from './Card';

export default function ThemeSettings() {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const { mode, setThemeMode } = useThemeStore();

  const themeModes: Array<{ mode: ThemeMode; label: string; icon: React.ReactNode }> = [
    {
      mode: 'light',
      label: 'Light',
      icon: <Sun size={20} color={mode === 'light' ? colors.primary : colors.darkGray} />,
    },
    {
      mode: 'dark',
      label: 'Dark',
      icon: <Moon size={20} color={mode === 'dark' ? colors.primary : colors.darkGray} />,
    },
    {
      mode: 'system',
      label: 'System',
      icon: <Smartphone size={20} color={mode === 'system' ? colors.primary : colors.darkGray} />,
    },
  ];

  const dynamicStyles = StyleSheet.create({
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    modeButton: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.cardBackground,
      gap: 8,
    },
    selectedModeButton: {
      borderColor: colors.primary,
      backgroundColor: colors.selectedBackground,
    },
    modeLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    selectedModeLabel: {
      color: colors.primary,
      fontWeight: '600',
    },
    currentThemeText: {
      fontSize: 14,
      color: colors.darkGray,
      textAlign: 'center',
      marginTop: 12,
    },
  });

  return (
    <Card style={styles.container}>
      <Text style={dynamicStyles.title}>Theme</Text>
      
      <View style={styles.modeButtons}>
        {themeModes.map(({ mode: themeMode, label, icon }) => (
          <TouchableOpacity
            key={themeMode}
            style={[
              dynamicStyles.modeButton,
              mode === themeMode && dynamicStyles.selectedModeButton,
            ]}
            onPress={() => setThemeMode(themeMode)}
            activeOpacity={0.7}
          >
            {icon}
            <Text
              style={[
                dynamicStyles.modeLabel,
                mode === themeMode && dynamicStyles.selectedModeLabel,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={dynamicStyles.currentThemeText}>
        Currently using {isDark ? 'dark' : 'light'} theme
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});