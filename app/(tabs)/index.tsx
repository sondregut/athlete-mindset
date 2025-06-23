import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Flame, Calendar, ArrowRight, Play, Clock } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { getRandomQuote } from '@/constants/quotes';
import { useSessionStore } from '@/store/session-store';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import SessionLogItem from '@/components/SessionLogItem';
import DailyMindsetCheckin from '@/components/DailyMindsetCheckin';
import SessionLogger from '@/components/SessionLogger';

export default function HomeScreen() {
  const [quote, setQuote] = useState('');
  const { getStreak, getWeeklyLogs, getRecentLogs, clearDuplicateSessions, currentSession, initializeTimer, elapsedTime } = useSessionStore();
  
  console.log('🏠 HomeScreen render');
  
  useEffect(() => {
    setQuote(getRandomQuote());
    // Clear any duplicate sessions on app start
    clearDuplicateSessions();
    // Initialize timer for any active sessions
    initializeTimer();
  }, [clearDuplicateSessions, initializeTimer]);

  const handleContinueSession = () => {
    router.push('/log-session');
  };
  
  const recentLogs = getRecentLogs(3);
  
  const handleViewAllActivity = () => {
    router.push('/activity');
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

      {/* Quote Card */}
      <Card style={styles.quoteCard}>
        <Text style={styles.quoteText}>"{quote}"</Text>
      </Card>
      
      {/* Stats Section */}
      <Text style={styles.sectionTitle}>Your Progress</Text>
      <View style={styles.statsContainer}>
        <StatCard 
          title="Day Streak" 
          value={getStreak()} 
          icon={<Flame size={24} color={colors.primary} />} 
        />
        <StatCard 
          title="Weekly Logs" 
          value={getWeeklyLogs()} 
          icon={<Calendar size={24} color={colors.primary} />} 
        />
      </View>
      
      {/* Mindset Tracking Section */}
      <View style={styles.mindsetSection}>
        <View style={styles.activityHeaderContainer}>
          <Text style={styles.sectionTitle}>Mindset Tracking</Text>
          <TouchableOpacity onPress={() => router.push('/mindset-history')} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>History</Text>
            <ArrowRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Session Logger */}
        <SessionLogger compact={true} />
        
        {/* Daily Mindset Check-in */}
        <DailyMindsetCheckin compact={true} />
      </View>
      
      {/* Recent Activity */}
      <View style={styles.activityHeaderContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={handleViewAllActivity} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {recentLogs.length > 0 ? (
        recentLogs.map((log) => (
          <SessionLogItem key={log.id} log={log} />
        ))
      ) : (
        <Card>
          <Text style={styles.emptyStateText}>
            No sessions logged yet. Start by logging your first training intention!
          </Text>
        </Card>
      )}
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
  activityHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
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
    lineHeight: 20,
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
  mindsetSection: {
    marginTop: 8,
  },
});