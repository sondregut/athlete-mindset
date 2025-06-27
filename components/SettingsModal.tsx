import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import SettingsSection from './SettingsSection';
import ProfilePreferences from './ProfilePreferences';
import ThemeSettings from './ThemeSettings';
import FirebaseDebugPanel from './FirebaseDebugPanel';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.mediumGray,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.darkGray} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Profile Preferences */}
          <ProfilePreferences />
          
          {/* Theme Settings */}
          <ThemeSettings />

          {/* App Settings */}
          <SettingsSection />

          {/* Firebase Debug Panel (Dev Only) */}
          <FirebaseDebugPanel />
        </ScrollView>
      </View>
    </Modal>
  );
}