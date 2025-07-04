import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import PersonalInfoSettings from '@/components/PersonalInfoSettings';
import ProfilePreferences from '@/components/ProfilePreferences';
import ThemeSettings from '@/components/ThemeSettings';
import SettingsSection from '@/components/SettingsSection';
import FirebaseDebugPanel from '@/components/FirebaseDebugPanel';
import ErrorMessage from '@/components/ErrorMessage';
import { useSessionStore } from '@/store/session-store';
import { useUserStore } from '@/store/user-store';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { error: sessionError, clearError: clearSessionError } = useSessionStore();
  const { error: userError, clearError: clearUserError } = useUserStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }} 
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Error Messages */}
        {sessionError && (
          <ErrorMessage 
            message={sessionError}
            onDismiss={clearSessionError}
            variant="error"
          />
        )}
        {userError && (
          <ErrorMessage 
            message={userError}
            onDismiss={clearUserError}
            variant="error"
          />
        )}

        {/* Personal Information */}
        <PersonalInfoSettings />

        {/* Theme Settings */}
        <ThemeSettings />

        {/* Profile Preferences */}
        <ProfilePreferences />

        {/* Settings & Account */}
        <SettingsSection />

        {/* Firebase Debug Panel (Dev Only) */}
        <FirebaseDebugPanel />
      </ScrollView>
    </SafeAreaView>
  );
}