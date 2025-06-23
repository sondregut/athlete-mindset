import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import { Download, Settings, Bell, HelpCircle, Trash2, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/session-store';
import { useUserStore } from '@/store/user-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import Card from './Card';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, destructive = false, loading = false }: SettingsItemProps) {
  return (
    <TouchableOpacity 
      style={[styles.settingsItem, loading && styles.settingsItemLoading]} 
      onPress={loading ? undefined : onPress}
      disabled={loading}
    >
      <View style={styles.settingsItemContent}>
        <View style={[
          styles.settingsIcon, 
          { backgroundColor: destructive ? `${colors.error}15` : `${colors.primary}15` }
        ]}>
          {icon}
        </View>
        <View style={styles.settingsText}>
          <Text style={[
            styles.settingsTitle,
            destructive && { color: colors.error },
            loading && styles.loadingText
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingsSubtitle, loading && styles.loadingText]}>
              {subtitle}
            </Text>
          )}
        </View>
        {loading ? (
          <ActivityIndicator size={16} color={colors.primary} />
        ) : (
          <ExternalLink size={16} color={colors.darkGray} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsSection() {
  const { logs, clearAllSessions, exportSessionData, isClearingData, isExportingData, error: sessionError } = useSessionStore();
  const { resetProfile, isResettingProfile, error: userError } = useUserStore();
  const { executeWithErrorHandling } = useErrorHandler();

  const handleExportData = async () => {
    await executeWithErrorHandling(async () => {
      const csvContent = await exportSessionData();
      
      await Share.share({
        message: csvContent,
        title: 'Athlete Mindset Session Data'
      });
    }, {
      fallbackMessage: 'Failed to export your data. Please try again.'
    });
  };


  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your session logs and profile data. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            const result = await executeWithErrorHandling(async () => {
              await Promise.all([
                clearAllSessions(),
                resetProfile()
              ]);
            }, {
              fallbackMessage: 'Failed to clear all data. Please try again.',
              showAlert: false
            });

            if (result !== null) {
              Alert.alert('Data Cleared', 'All your data has been deleted.');
            }
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Athlete Mindset',
      'Version 1.0\n\nA mindful approach to athletic training, helping you track not just what you do, but how you think and feel during your training journey.\n\nDeveloped with 🤍 for athletes who value mental performance.',
      [{ text: 'OK' }]
    );
  };

  const handleNotifications = () => {
    // Navigate to notification settings screen
    router.push('/notification-settings');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Settings & Data</Text>
      
      <Card style={styles.settingsCard}>
        <SettingsItem
          icon={<Download size={20} color={colors.primary} />}
          title="Export Session Data"
          subtitle={`Export ${logs.length} sessions as CSV`}
          onPress={handleExportData}
          loading={isExportingData}
        />
        
        <SettingsItem
          icon={<Bell size={20} color={colors.primary} />}
          title="Notifications"
          subtitle="Training reminders and motivational messages"
          onPress={handleNotifications}
        />
        
        <SettingsItem
          icon={<HelpCircle size={20} color={colors.primary} />}
          title="About"
          subtitle="App version and info"
          onPress={handleAbout}
        />
        
        <SettingsItem
          icon={<Trash2 size={20} color={colors.error} />}
          title="Clear All Data"
          subtitle="Permanently delete all sessions and profile"
          onPress={handleClearAllData}
          destructive
          loading={isClearingData || isResettingProfile}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.text,
    paddingHorizontal: 4,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
  },
  settingsItemLoading: {
    opacity: 0.6,
  },
  loadingText: {
    opacity: 0.7,
  },
});