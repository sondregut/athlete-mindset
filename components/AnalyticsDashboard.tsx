import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Flame, Calendar, Trophy, TrendingUp, Target, Star, ArrowRight, Heart, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/session-store';
import { useMindsetStore } from '@/store/mindset-store';
import Card from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon, color = colors.primary, loading = false }: StatCardProps) {
  return (
    <Card style={[styles.statCard, loading && styles.loadingCard] as any}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={color} />
        </View>
      ) : (
        <>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </>
      )}
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const { 
    getStreak, 
    getWeeklyLogs, 
    getMonthlyStats, 
    getLongestStreak, 
    getTotalSessions,
    getMindsetInsights,
    getPerformanceTrends,
    isCalculatingAnalytics
  } = useSessionStore();
  
  const {
    getCheckinStreak,
    getAverageScores,
    getRecentCheckins
  } = useMindsetStore();

  const [analytics, setAnalytics] = useState({
    currentStreak: 0,
    weeklyLogs: 0,
    monthlyStats: { thisMonth: 0, lastMonth: 0 },
    longestStreak: 0,
    totalSessions: 0,
    mindsetInsights: { topCues: [] as string[], avgReadiness: 0 },
    performanceTrends: { avgRPE: 0, avgRating: 0 },
    mindsetStreak: 0,
    mindsetAverages: { mood: 0, energy: 0, motivation: 0 }
  });

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [
          monthlyStats,
          longestStreak,
          mindsetInsights,
          performanceTrends
        ] = await Promise.all([
          getMonthlyStats(),
          getLongestStreak(),
          getMindsetInsights(),
          getPerformanceTrends()
        ]);

        setAnalytics({
          currentStreak: getStreak(),
          weeklyLogs: getWeeklyLogs(),
          monthlyStats,
          longestStreak,
          totalSessions: getTotalSessions(),
          mindsetInsights,
          performanceTrends,
          mindsetStreak: getCheckinStreak(),
          mindsetAverages: getAverageScores(30)
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    };

    loadAnalytics();
  }, []);

  const { currentStreak, weeklyLogs, monthlyStats, longestStreak, totalSessions, mindsetInsights, performanceTrends, mindsetStreak, mindsetAverages } = analytics;

  const getStreakColor = () => {
    if (currentStreak >= 7) return '#4CAF50'; // Green for week+
    if (currentStreak >= 3) return '#FF8C42'; // Orange for 3+ days
    return colors.primary; // Blue for starting out
  };

  const formatAverage = (num: number, decimals = 1) => {
    return num > 0 ? num.toFixed(decimals) : '0';
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Analytics</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/analytics')}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Top Row - Current Performance */}
      <View style={styles.row}>
        <StatCard
          title="Current Streak"
          value={currentStreak}
          subtitle={currentStreak === 1 ? 'day' : 'days'}
          icon={<Flame size={20} color={getStreakColor()} />}
          color={getStreakColor()}
          loading={isCalculatingAnalytics}
        />
        <StatCard
          title="This Week"
          value={weeklyLogs}
          subtitle={weeklyLogs === 1 ? 'session' : 'sessions'}
          icon={<Calendar size={20} color={colors.primary} />}
          loading={isCalculatingAnalytics}
        />
      </View>

      {/* Second Row - Monthly & Records */}
      <View style={styles.row}>
        <StatCard
          title="This Month"
          value={monthlyStats.thisMonth}
          subtitle={monthlyStats.lastMonth > 0 
            ? `${monthlyStats.thisMonth > monthlyStats.lastMonth ? '+' : ''}${monthlyStats.thisMonth - monthlyStats.lastMonth} vs last month`
            : 'sessions logged'
          }
          icon={<TrendingUp size={20} color={colors.secondary} />}
          color={colors.secondary}
          loading={isCalculatingAnalytics}
        />
        <StatCard
          title="Best Streak"
          value={longestStreak}
          subtitle={longestStreak === 1 ? 'day' : 'days'}
          icon={<Trophy size={20} color='#FFD700' />}
          color='#FFD700'
          loading={isCalculatingAnalytics}
        />
      </View>

      {/* Third Row - Performance Insights */}
      <View style={styles.row}>
        <StatCard
          title="Avg Readiness"
          value={formatAverage(mindsetInsights.avgReadiness)}
          subtitle="out of 10"
          icon={<Target size={20} color='#9C27B0' />}
          color='#9C27B0'
          loading={isCalculatingAnalytics}
        />
        <StatCard
          title="Avg Rating"
          value={formatAverage(performanceTrends.avgRating)}
          subtitle="out of 5 stars"
          icon={<Star size={20} color='#FF9800' />}
          color='#FF9800'
          loading={isCalculatingAnalytics}
        />
      </View>

      {/* Fourth Row - Mindset Insights */}
      <View style={styles.row}>
        <StatCard
          title="Mindset Streak"
          value={mindsetStreak}
          subtitle={mindsetStreak === 1 ? 'day' : 'days'}
          icon={<Heart size={20} color='#E91E63' />}
          color='#E91E63'
          loading={isCalculatingAnalytics}
        />
        <StatCard
          title="Avg Energy"
          value={formatAverage(mindsetAverages.energy)}
          subtitle="last 30 days"
          icon={<Zap size={20} color='#3F51B5' />}
          color='#3F51B5'
          loading={isCalculatingAnalytics}
        />
      </View>

      {/* Total Sessions Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Total Sessions Logged</Text>
          <Text style={styles.summaryValue}>{totalSessions}</Text>
          {mindsetInsights.topCues.length > 0 && (
            <Text style={styles.summarySubtitle}>
              Top mindset cue: "{mindsetInsights.topCues[0]}"
            </Text>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: -6,
  },
  statCard: {
    flex: 1,
    padding: 16,
    marginHorizontal: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkGray,
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: colors.darkGray,
  },
  summaryCard: {
    padding: 20,
    alignItems: 'center',
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkGray,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: colors.darkGray,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingCard: {
    opacity: 0.6,
  },
  loadingContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});