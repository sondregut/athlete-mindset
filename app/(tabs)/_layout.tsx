import React, { useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Home, Clock, PlusCircle, User, Brain } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogSessionBottomSheet from '@/components/LogSessionBottomSheet';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [showLogSessionModal, setShowLogSessionModal] = useState(false);

  const handleLogSessionPress = (e: any) => {
    e.preventDefault();
    setShowLogSessionModal(true);
  };


  return (
    <>
    <Tabs screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.darkGray,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: colors.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mental-training"
        options={{
          title: "Mental",
          tabBarIcon: ({ color }) => <Brain size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log-session"
        options={{
          title: "Log Session",
          tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} />,
        }}
        listeners={{
          tabPress: handleLogSessionPress,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
    <LogSessionBottomSheet 
      isVisible={showLogSessionModal}
      onClose={() => setShowLogSessionModal(false)}
    />
    </>
  );
}