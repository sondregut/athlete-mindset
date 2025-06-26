import React from 'react';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function ThemedStack() {
  const colors = useThemeColors();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.lightGray,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="onboarding" 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen 
        name="activity" 
        options={{ 
          title: "Activity History",
          animation: "slide_from_right",
        }} 
      />
      <Stack.Screen 
        name="session-detail" 
        options={{ 
          title: "Session Details",
          animation: "slide_from_right",
        }} 
      />
      <Stack.Screen 
        name="notification-settings" 
        options={{ 
          title: "Notifications",
          animation: "slide_from_right",
        }} 
      />
      <Stack.Screen 
        name="analytics" 
        options={{ 
          title: "Analytics",
          animation: "slide_from_right",
        }} 
      />
      <Stack.Screen 
        name="mindset-history" 
        options={{ 
          title: "History",
          animation: "slide_from_right",
        }} 
      />
      <Stack.Screen 
        name="checkin-detail" 
        options={{ 
          title: "Check-in Details",
          animation: "slide_from_right",
        }} 
      />
    </Stack>
  );
}