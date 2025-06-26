import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Flame, Calendar, Trophy, TrendingUp, Target, Star, ArrowRight, Heart, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
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

function StatCard({ title, value, subtitle, icon, color, loading = false }: StatCardProps) {
  const colors = useThemeColors();
  const iconColor = color || colors.primary;
  
  const styles = StyleSheet.create({
    statCard: {
      flex: 1,
      padding: 16,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
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
      fontSize: 12,
      color: colors.darkGray,
      fontWeight: '500',
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    statSubtitle: {
      fontSize: 11,
      color: colors.darkGray,
    },
    loadingCard: {
      opacity: 0.6,
    },
    loadingContainer: {
      height: 40,
      justifyContent: 'center',
    },
  });
  
  return (
    <Card style={[styles.statCard, loading && styles.loadingCard] as any}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${iconColor}15` }]}>
          {icon}
        </View>
        <Text style={[styles.statTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={iconColor} />
        </View>
      ) : (
        <>
          <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
          {subtitle && <Text style={[styles.statSubtitle, { color: colors.darkGray }]}>{subtitle}</Text>}
        </>
      )}
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const colors = useThemeColors();
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
    if (currentStreak >= 7) return colors.success; // Green for week+
    if (currentStreak >= 3) return colors.orange; // Orange for 3+ days
    return colors.primary; // Blue for starting out
  };

  const formatAverage = (num: number, decimals = 1) => {
    return num > 0 ? num.toFixed(decimals) : '0';
  };

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
      color: colors.primary,
      fontWeight: '500',
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    statCard: {
      flex: 1,
      padding: 16,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
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
      fontSize: 12,
      color: colors.darkGray,
      fontWeight: '500',
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    statSubtitle: {
      fontSize: 11,
      color: colors.darkGray,
    },
    summaryCard: {
      padding: 16,
      marginBottom: 12,
    },
    summaryContent: {
      gap: 4,
    },
    summaryTitle: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    summarySubtitle: {
      fontSize: 14,
      color: colors.darkGray,
    },
    loadingCard: {
      opacity: 0.6,
    },
    loadingContainer: {
      height: 40,
      justifyContent: 'center',
    },
  });

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
      
      {/* Top Row - Weekly Performance */}
      <View style={styles.row}>
        <StatCard
          title="This Week"
          value={weeklyLogs}
          subtitle={weeklyLogs === 1 ? 'session' : 'sessions'}
          icon={<Calendar size={20} color={colors.primary} />}
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

      {/* Second Row - Monthly Performance */}
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
          title="Avg RPE"
          value={formatAverage(performanceTrends.avgRPE)}
          subtitle="last 30 days"
          icon={<Target size={20} color='#9C27B0' />}
          color='#9C27B0'
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

      {/* Mindset Insights Summary */}
      {mindsetInsights.topCues.length > 0 && (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>Your Top Mindset Focus</Text>
            <Text style={styles.summaryValue}>"{mindsetInsights.topCues[0]}"</Text>
            {mindsetInsights.topCues.length > 1 && (
              <Text style={styles.summarySubtitle}>
                Also focused on: "{mindsetInsights.topCues[1]}"
              </Text>
            )}
          </View>
        </Card>
      )}
    </View>
  );
}