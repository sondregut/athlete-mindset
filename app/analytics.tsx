import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import EnhancedAnalytics from '@/components/EnhancedAnalytics';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AnalyticsScreen() {
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Analytics',
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerShadowVisible: false,
          }} 
        />
        <EnhancedAnalytics />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
});