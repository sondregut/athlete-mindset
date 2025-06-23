import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Play, Clock, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/session-store';
import { useUserStore } from '@/store/user-store';
import ProfileHeader from '@/components/ProfileHeader';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import SessionTypeBreakdown from '@/components/SessionTypeBreakdown';
import MindsetSummary from '@/components/MindsetSummary';
import SettingsSection from '@/components/SettingsSection';
import ErrorMessage from '@/components/ErrorMessage';

export default function ProfileScreen() {
  const { currentSession, elapsedTime, error: sessionError, clearError: clearSessionError } = useSessionStore();
  const { error: userError, clearError: clearUserError } = useUserStore();

  const handleContinueSession = () => {
    router.push('/log-session');
  };

  const getSessionStatusText = () => {
    if (!currentSession) return '';
    
    switch (currentSession.status) {
      case 'intention':
        return 'Pre-Training Setup in Progress';
      case 'active':
        return 'Training Session Active';
      case 'completed':
        return 'Session Ready to Complete';
      default:
        return 'Session in Progress';
    }
  };

  const getSessionTitle = () => {
    if (!currentSession) return '';
    return currentSession.activity || 
           (currentSession.sessionType === 'other' ? currentSession.customSessionType : null) || 
           currentSession.sessionType.charAt(0).toUpperCase() + currentSession.sessionType.slice(1);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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

      {/* Session in Progress Banner */}
      {currentSession && (
        <TouchableOpacity 
          style={[
            styles.sessionBanner, 
            currentSession.status === 'active' && styles.activeBanner
          ]} 
          onPress={handleContinueSession}
          activeOpacity={0.8}
        >
          <View style={styles.sessionBannerContent}>
            <View style={styles.sessionBannerLeft}>
              <View style={styles.sessionBannerIcon}>
                {currentSession.status === 'active' ? (
                  <Clock size={20} color={colors.background} />
                ) : (
                  <Play size={20} color={colors.background} />
                )}
              </View>
              <View style={styles.sessionBannerText}>
                <Text style={styles.sessionBannerTitle}>{getSessionStatusText()}</Text>
                <Text style={styles.sessionBannerSubtitle}>
                  {getSessionTitle()}
                  {currentSession.status === 'active' ? ` • ${elapsedTime}` : ''}
                </Text>
              </View>
            </View>
            <ArrowRight size={20} color={colors.background} />
          </View>
        </TouchableOpacity>
      )}

      {/* Profile Header */}
      <ProfileHeader />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard />

      {/* Session Type Breakdown */}
      <SessionTypeBreakdown />

      {/* Mindset Summary */}
      <MindsetSummary />

      {/* Settings */}
      <SettingsSection />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sessionBanner: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sessionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionBannerText: {
    flex: 1,
  },
  sessionBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
    marginBottom: 2,
  },
  sessionBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeBanner: {
    backgroundColor: '#FF8C42', // Vibrant orange for active sessions
    shadowColor: '#FF8C42',
  },
});