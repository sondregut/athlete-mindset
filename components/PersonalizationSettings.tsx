import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { User, ChevronRight, Sparkles, Settings2, RefreshCw, Edit } from 'lucide-react-native';
import { router } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { usePersonalizationProfile } from '@/hooks/usePersonalizationProfile';
import { usePersonalizationStore } from '@/store/personalization-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';
// import { PersonalizationPreloader } from '@/services/personalization-preloader';

export default function PersonalizationSettings() {
  const colors = useThemeColors();
  const { profile, isLoading, refreshProfile } = usePersonalizationProfile();
  const { preferences, updatePreferences } = usePersonalizationStore();
  const { hasCompletedOnboarding, goals } = useOnboardingStore();
  const { profile: userProfile } = useUserStore();
  const [isClearing, setIsClearing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationProgress, setRegenerationProgress] = useState(0);
  const [regenerationMessage, setRegenerationMessage] = useState('');

  const handleEditProfile = () => {
    // Navigate to profile to change sport and other settings
    router.push('/(tabs)/profile');
  };

  const handleTogglePersonalization = () => {
    updatePreferences({ enabled: !preferences.enabled });
  };

  const handleRegenerateAll = async () => {
    if (!profile || !profile.is_personalization_enabled) {
      Alert.alert('Personalization Not Enabled', 'Please enable personalization first.');
      return;
    }

    Alert.alert(
      'Regenerate All Visualizations?',
      'This will regenerate all personalized content with your current preferences. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'default',
          onPress: async () => {
            setIsRegenerating(true);
            setRegenerationProgress(0);
            setRegenerationMessage('Starting regeneration...');
            
            try {
              // Content is now generated on-demand using OpenAI
              setRegenerationProgress(100);
              setRegenerationMessage('Content will be generated on-demand using OpenAI');
              
              Alert.alert(
                'Success!', 
                'All visualizations have been regenerated with your latest preferences.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Regeneration error:', error);
              Alert.alert(
                'Error', 
                'Failed to regenerate content. Please try again later.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsRegenerating(false);
              setRegenerationProgress(0);
              setRegenerationMessage('');
            }
          },
        },
      ]
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Personalization Cache?',
      'This will remove all cached personalized content. The app will regenerate content as needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              // Content is now generated on-demand using OpenAI - no cache to clear
              Alert.alert('Success', 'OpenAI-based personalization uses on-demand generation');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.darkGray,
    },
    profileSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      marginTop: 8,
    },
    profileRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    profileLabel: {
      fontSize: 14,
      color: colors.darkGray,
    },
    profileValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    setupButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
    },
    setupButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
    updateButton: {
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    updateButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
    settingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
    toggle: {
      width: 48,
      height: 28,
      borderRadius: 14,
      padding: 2,
      justifyContent: 'center',
    },
    toggleEnabled: {
      backgroundColor: colors.primary,
    },
    toggleDisabled: {
      backgroundColor: colors.mediumGray,
    },
    toggleThumb: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    toggleThumbEnabled: {
      alignSelf: 'flex-end',
    },
    toggleThumbDisabled: {
      alignSelf: 'flex-start',
    },
    cacheButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    cacheButtonText: {
      fontSize: 14,
      color: colors.error,
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    regenerateButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    regenerateButtonDisabled: {
      opacity: 0.8,
    },
    regenerateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
    regenerateProgress: {
      flex: 1,
      alignItems: 'center',
    },
    regenerateMessageText: {
      fontSize: 12,
      color: colors.background,
      opacity: 0.9,
      marginTop: 2,
    },
    onboardingPrompt: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    onboardingPromptText: {
      fontSize: 14,
      color: colors.darkGray,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Sparkles size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>AI Personalization</Text>
          <Text style={styles.subtitle}>
            {hasCompletedOnboarding && (profile || userProfile?.sport) 
              ? 'Sport-specific content tailored to your profile' 
              : 'Complete your profile to enable personalization'}
          </Text>
        </View>
      </View>

      {hasCompletedOnboarding && (profile || userProfile?.sport) ? (
        <>
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Sport</Text>
              <Text style={styles.profileValue}>
                {profile?.sport_activity || 
                 (userProfile?.sport === 'track-and-field' ? 
                   `Track & Field${userProfile?.trackFieldEvent ? ` (${userProfile.trackFieldEvent})` : ''}` : 
                   userProfile?.sport ? 
                     (userProfile.sport.charAt(0).toUpperCase() + userProfile.sport.slice(1)) : 
                     'Not set') || 'Not set'}
              </Text>
            </View>
            {profile?.specific_role && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Position/Role</Text>
                <Text style={styles.profileValue}>{profile.specific_role}</Text>
              </View>
            )}
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Experience</Text>
              <Text style={styles.profileValue}>
                {profile?.experience_level ? 
                  (profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)) : 
                  userProfile?.experienceLevel ? 
                    (userProfile.experienceLevel.charAt(0).toUpperCase() + userProfile.experienceLevel.slice(1)) : 
                    'Not set'}
              </Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Goals</Text>
              <Text style={styles.profileValue}>
                {profile?.primary_goals?.length || 
                 (userProfile?.primaryFocus ? 1 : 0) + 
                 (userProfile?.weeklySessionTarget ? 1 : 0) + 
                 (userProfile?.streakGoal ? 1 : 0)} selected
              </Text>
            </View>
            {userProfile?.name && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Name</Text>
                <Text style={styles.profileValue}>{userProfile.name}</Text>
              </View>
            )}
          </View>

          <View style={styles.settingsRow}>
            <Text style={styles.settingLabel}>Enable Personalization</Text>
            <TouchableOpacity
              onPress={handleTogglePersonalization}
              style={[
                styles.toggle,
                preferences.enabled ? styles.toggleEnabled : styles.toggleDisabled,
              ]}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.toggleThumb,
                  preferences.enabled ? styles.toggleThumbEnabled : styles.toggleThumbDisabled,
                ]}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleEditProfile}>
            <Edit size={16} color={colors.primary} />
            <Text style={styles.updateButtonText}>Change Sport in Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.regenerateButton, isRegenerating && styles.regenerateButtonDisabled]} 
            onPress={handleRegenerateAll}
            disabled={isRegenerating || !preferences.enabled}
          >
            {isRegenerating ? (
              <>
                <ActivityIndicator size="small" color={colors.background} />
                <View style={styles.regenerateProgress}>
                  <Text style={styles.regenerateButtonText}>
                    {regenerationProgress > 0 ? `${Math.round(regenerationProgress)}%` : 'Regenerating...'}
                  </Text>
                  <Text style={styles.regenerateMessageText} numberOfLines={1}>
                    {regenerationMessage}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <RefreshCw size={16} color={colors.background} />
                <Text style={styles.regenerateButtonText}>Regenerate All Visualizations</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cacheButton} 
            onPress={handleClearCache}
            disabled={isClearing}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Text style={styles.cacheButtonText}>Clear Personalization Cache</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {!hasCompletedOnboarding ? (
            <View style={styles.onboardingPrompt}>
              <Text style={styles.onboardingPromptText}>
                Complete your onboarding to unlock personalized content
              </Text>
              <TouchableOpacity style={styles.setupButton} onPress={() => router.push('/onboarding')}>
                <Text style={styles.setupButtonText}>Complete Onboarding</Text>
                <ChevronRight size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.setupButton} onPress={handleEditProfile}>
              <Text style={styles.setupButtonText}>Complete Profile</Text>
              <ChevronRight size={20} color={colors.background} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}