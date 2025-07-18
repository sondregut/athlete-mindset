import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActionSheetIOS, Platform } from 'react-native';
import { router } from 'expo-router';
import { Flame, ArrowRight, Play, Clock, Trophy, MoreVertical } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getRandomQuote } from '@/constants/quotes';
import { useSessionStore } from '@/store/session-store';
import { useMindsetStore } from '@/store/mindset-store';
import { useAchievementStore } from '@/store/achievement-store';
import { ActivityItem, ActivityType } from '@/types/activity';
import { Milestone } from '@/constants/milestones';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import SmallStatCard from '@/components/SmallStatCard';
import SessionLogItem from '@/components/SessionLogItem';
import MindsetCheckinCard from '@/components/MindsetCheckinCard';
import DailyMindsetCheckin from '@/components/DailyMindsetCheckin';
import SessionLogger from '@/components/SessionLogger';
import StreakCelebration from '@/components/StreakCelebration';
import BrainHealthIndicator from '@/components/BrainHealthIndicator';
// import VisualizationCard from '@/components/visualization/VisualizationCard';

export default function HomeScreen() {
  const [quote, setQuote] = useState('');
  const [celebrationMilestone, setCelebrationMilestone] = useState<Milestone | null>(null);
  const { getStreak, getWeeklyLogs, getRecentLogs, clearDuplicateSessions, currentSession, initializeTimer, elapsedTime, getTotalSessions, resetCurrentSession, stopSessionTimer } = useSessionStore();
  const { getRecentCheckins } = useMindsetStore();
  const { markMilestoneCelebrated } = useAchievementStore();
  const colors = useThemeColors();
  
  console.log('🏠 HomeScreen render');
  
  useEffect(() => {
    setQuote(getRandomQuote());
    // Clear any duplicate sessions on app start
    clearDuplicateSessions();
    // Initialize timer for any active sessions
    initializeTimer();
    
    // Check for any uncelebrated milestones
    const checkUncelebratedMilestones = () => {
      const { achievements } = useAchievementStore.getState();
      const uncelebrated = achievements.find(a => !a.celebrated);
      
      if (uncelebrated) {
        const { getMilestoneById } = require('@/constants/milestones');
        const milestone = getMilestoneById(uncelebrated.milestoneId);
        if (milestone) {
          setCelebrationMilestone(milestone);
        }
      }
    };
    
    checkUncelebratedMilestones();
  }, [clearDuplicateSessions, initializeTimer]);

  const handleContinueSession = () => {
    router.push('/log-session');
  };

  const handleDeleteSession = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session in progress? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            stopSessionTimer();
            resetCurrentSession();
          },
        },
      ],
    );
  };

  const handleSessionOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Continue Session', 'Delete Session'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleContinueSession();
          } else if (buttonIndex === 2) {
            handleDeleteSession();
          }
        }
      );
    } else {
      // For Android, we'll use Alert with custom buttons
      Alert.alert(
        'Session Options',
        '',
        [
          {
            text: 'Continue Session',
            onPress: handleContinueSession,
          },
          {
            text: 'Delete Session',
            style: 'destructive',
            onPress: handleDeleteSession,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };
  
  // Get recent activities (both sessions and check-ins)
  const getRecentActivities = (): ActivityItem[] => {
    const recentSessions = getRecentLogs(5);
    const recentCheckins = getRecentCheckins(5);
    
    const activities: ActivityItem[] = [
      ...recentSessions.map(session => ({
        type: 'session' as ActivityType,
        data: session,
        timestamp: session.createdAt
      })),
      ...recentCheckins.map(checkin => ({
        type: 'checkin' as ActivityType,
        data: checkin,
        timestamp: checkin.createdAt
      }))
    ];
    
    // Sort by timestamp (most recent first) and take top 5
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  };
  
  const recentActivities = getRecentActivities();
  
  const handleViewAllActivity = () => {
    router.push('/(tabs)/history');
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

  const formatElapsedTime = (timeString: string) => {
    // elapsedTime is already formatted as "MM:SS" or "HH:MM:SS"
    return timeString;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    quoteCard: {
      marginBottom: 16,
      backgroundColor: colors.primary,
    },
    quoteText: {
      fontSize: 16,
      fontStyle: 'italic',
      color: colors.background,
      textAlign: 'center',
      lineHeight: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 12,
      color: colors.text,
    },
    statsContainer: {
      flexDirection: 'row',
      marginHorizontal: -6,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -4,
      marginBottom: 8,
    },
    smallStatCard: {
      width: '50%',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    activityHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      marginBottom: 12,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewAllText: {
      color: colors.primary,
      marginRight: 4,
      fontWeight: '500',
    },
    emptyStateText: {
      textAlign: 'center',
      color: colors.darkGray,
      fontSize: 14,
    },
    sessionProgressCard: {
      backgroundColor: colors.activeSession,
      marginBottom: 16,
      overflow: 'hidden',
    },
    sessionProgressContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    sessionProgressContent: {
      flex: 1,
      paddingRight: 8,
    },
    sessionProgressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    moreButton: {
      padding: 4,
      marginTop: -4,
      marginRight: -4,
    },
    sessionProgressTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
    sessionProgressTime: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.background,
    },
    sessionProgressActivity: {
      fontSize: 14,
      color: colors.background,
      opacity: 0.9,
      marginBottom: 8,
    },
    sessionProgressStatus: {
      fontSize: 12,
      color: colors.background,
      opacity: 0.8,
      marginBottom: 12,
    },
    continueButton: {
      backgroundColor: colors.background,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueButtonText: {
      color: colors.activeSession,
      fontWeight: '600',
      marginRight: 8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
      {/* Quote of the Day */}
      <Card style={styles.quoteCard}>
        <Text style={styles.quoteText}>"{quote}"</Text>
      </Card>
      
      {/* Session Progress Card */}
      {currentSession && (
        <Card style={styles.sessionProgressCard}>
          <View style={styles.sessionProgressContainer}>
            <TouchableOpacity 
              style={styles.sessionProgressContent} 
              onPress={handleContinueSession} 
              activeOpacity={0.8}
            >
              <View style={styles.sessionProgressHeader}>
                <Text style={styles.sessionProgressTitle}>Session in Progress</Text>
                {currentSession.status === 'active' && elapsedTime && elapsedTime !== '0:00' ? (
                  <Text style={styles.sessionProgressTime}>
                    {formatElapsedTime(elapsedTime)}
                  </Text>
                ) : null}
              </View>
              
              <Text style={styles.sessionProgressActivity}>
                {getSessionTitle()}
              </Text>
              
              <Text style={styles.sessionProgressStatus}>
                {getSessionStatusText()}
              </Text>
              
              <View style={styles.continueButton}>
                <Text style={styles.continueButtonText}>Continue Session</Text>
                {currentSession.status === 'active' ? (
                  <Clock size={16} color={colors.activeSession} />
                ) : (
                  <Play size={16} color={colors.activeSession} />
                )}
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.moreButton} 
              onPress={handleSessionOptions}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertical size={20} color={colors.background} />
            </TouchableOpacity>
          </View>
        </Card>
      )}
      
      {/* Stats Overview */}
      <Text style={styles.sectionTitle}>Your Progress</Text>
      <View style={styles.statsGrid}>
        <View style={styles.smallStatCard}>
          <SmallStatCard 
            title="Current Streak" 
            value={`${getStreak()} days`}
            icon={<Flame size={20} color={colors.primary} />}
          />
        </View>
        <View style={styles.smallStatCard}>
          <SmallStatCard 
            title="Total Sessions" 
            value={getTotalSessions().toString()}
            icon={<Trophy size={20} color={colors.primary} />}
          />
        </View>
      </View>
      
      {/* Quick Actions */}
      <View>
        <SessionLogger />
        
        {/* Daily Mindset Check-in */}
        <DailyMindsetCheckin compact={true} />
        
        {/* Brain Health Indicator */}
        <BrainHealthIndicator />
        
        {/* Mental Training - Temporarily disabled */}
        {/* <VisualizationCard /> */}
      </View>
      
      {/* Recent Activity */}
      <View style={styles.activityHeaderContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={handleViewAllActivity} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {recentActivities.length > 0 ? (
        recentActivities.map((activity) => {
          if (activity.type === 'session') {
            return <SessionLogItem key={`session-${activity.data.id}`} log={activity.data as any} />;
          } else {
            return <MindsetCheckinCard key={`checkin-${activity.data.id}`} checkin={activity.data as any} />;
          }
        })
      ) : (
        <Card>
          <Text style={styles.emptyStateText}>
            No activity yet. Start by logging a training session or daily check-in!
          </Text>
        </Card>
      )}
    </ScrollView>
    
    {/* Streak Celebration Modal */}
    {celebrationMilestone && (
      <StreakCelebration
        visible={!!celebrationMilestone}
        milestone={celebrationMilestone}
        currentStreak={getStreak()}
        onClose={() => {
          if (celebrationMilestone) {
            markMilestoneCelebrated(celebrationMilestone.id);
          }
          setCelebrationMilestone(null);
        }}
      />
    )}
  </View>
  );
}