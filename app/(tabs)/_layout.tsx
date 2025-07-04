import React, { useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Home, Clock, PlusCircle, User, FileText, ClipboardCheck } from 'lucide-react-native';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [showLogOptions, setShowLogOptions] = useState(false);

  const handleLogSessionPress = (e: any) => {
    e.preventDefault();
    setShowLogOptions(true);
  };

  const handlePreTraining = () => {
    setShowLogOptions(false);
    router.push('/log-session');
  };

  const handlePostTraining = () => {
    setShowLogOptions(false);
    router.push('/log-session?postOnly=true');
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: insets.bottom + 20,
      paddingTop: 20,
      paddingHorizontal: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    optionButton: {
      backgroundColor: colors.cardBackground,
      padding: 20,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionIcon: {
      marginRight: 16,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.darkGray,
    },
    cancelButton: {
      padding: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    cancelText: {
      fontSize: 16,
      color: colors.darkGray,
      fontWeight: '500',
    },
  });

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

    {/* Log Session Options Modal */}
    <Modal
      visible={showLogOptions}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLogOptions(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowLogOptions(false)}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Log Training Session</Text>
          <TouchableOpacity style={styles.optionButton} onPress={handlePreTraining}>
            <View style={styles.optionIcon}>
              <FileText size={24} color={colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Pre-Training Notes</Text>
              <Text style={styles.optionDescription}>
                Set intentions and mindset cues before starting your session
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handlePostTraining}>
            <View style={styles.optionIcon}>
              <ClipboardCheck size={24} color={colors.secondary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Post-Training Notes</Text>
              <Text style={styles.optionDescription}>
                Log reflection and feedback for a completed session
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLogOptions(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}