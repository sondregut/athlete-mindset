import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import { Download, Settings, Bell, HelpCircle, Trash2, ExternalLink, User, Mail, LogOut, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';
import { useUserStore } from '@/store/user-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useAuthStore } from '@/store/auth-store';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import Card from './Card';
import AuthModal from './AuthModal';
import PasswordResetModal from './PasswordResetModal';

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
  loading?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, destructive = false, loading = false }: SettingsItemProps) {
  const colors = useThemeColors();
  
  const styles = StyleSheet.create({
    settingsItem: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
  const colors = useThemeColors();
  const { logs, clearAllSessions, exportSessionData, isClearingData, isExportingData, error: sessionError } = useSessionStore();
  const { resetProfile, isResettingProfile, error: userError } = useUserStore();
  const { user, signOut, isLoading: isAuthLoading } = useAuthStore();
  const { executeWithErrorHandling } = useErrorHandler();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'link'>('signin');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

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

  const handleAccountAction = () => {
    if (user?.isAnonymous) {
      setAuthModalMode('link');
      setAuthModalVisible(true);
    } else if (!user) {
      setAuthModalMode('signin');
      setAuthModalVisible(true);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will remain on this device.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await executeWithErrorHandling(async () => {
              await signOut();
            }, {
              fallbackMessage: 'Failed to sign out. Please try again.'
            });
          }
        }
      ]
    );
  };

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
    accountCard: {
      padding: 20,
    },
    accountInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    accountIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    accountDetails: {
      flex: 1,
    },
    accountStatus: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    accountSubtext: {
      fontSize: 14,
      color: colors.darkGray,
      lineHeight: 18,
    },
    accountButton: {
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
    },
    accountButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    signOutButton: {
      backgroundColor: `${colors.error}15`,
    },
    signOutText: {
      color: colors.error,
    },
  });

  return (
    <View style={styles.container}>
      {/* Account Section */}
      <Text style={styles.sectionTitle}>Account</Text>
      <Card style={[styles.settingsCard, styles.accountCard]}>
        <View style={styles.accountInfo}>
          <View style={styles.accountIcon}>
            <User size={28} color={colors.primary} />
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountStatus}>
              {user?.isAnonymous ? 'Guest Account' : user?.email || 'Not Signed In'}
            </Text>
            <Text style={styles.accountSubtext}>
              {user?.isAnonymous 
                ? 'Create an account to sync across devices' 
                : user?.email 
                  ? 'Your data syncs automatically' 
                  : 'Sign in to access your data'}
            </Text>
          </View>
        </View>
        
        {user?.isAnonymous && (
          <TouchableOpacity style={styles.accountButton} onPress={handleAccountAction}>
            <Shield size={20} color={colors.background} />
            <Text style={styles.accountButtonText}>Secure Your Data</Text>
          </TouchableOpacity>
        )}
        
        {!user && (
          <TouchableOpacity style={styles.accountButton} onPress={handleAccountAction}>
            <Mail size={20} color={colors.background} />
            <Text style={styles.accountButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
        
        {user && !user.isAnonymous && (
          <TouchableOpacity 
            style={[styles.accountButton, styles.signOutButton]} 
            onPress={handleSignOut}
            disabled={isAuthLoading}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.accountButtonText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </Card>
      
      {/* Settings Section */}
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
        
        {!user?.isAnonymous && user?.email && (
          <SettingsItem
            icon={<Shield size={20} color={colors.primary} />}
            title="Reset Password"
            subtitle="Change your account password"
            onPress={() => setShowPasswordReset(true)}
          />
        )}
        
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
      
      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        mode={authModalMode}
      />
      
      {/* Password Reset Modal */}
      <PasswordResetModal
        isVisible={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
      />
    </View>
  );
}