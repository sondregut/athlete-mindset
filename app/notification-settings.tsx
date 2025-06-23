import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import NotificationSettings from '@/components/NotificationSettings';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function NotificationSettingsScreen() {
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Notifications',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: false,
          }} 
        />
        <View style={styles.content}>
          <NotificationSettings />
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});