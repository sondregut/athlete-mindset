import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, TrendingUp, Target, Clock, Award, Activity, Heart, Zap } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useSessionStore } from '@/store/session-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useMindsetStore } from '@/store/mindset-store';
import LineChart from './charts/LineChart';
import BarChart from './charts/BarChart';
import ProgressRing from './charts/ProgressRing';
import Card from './Card';

type TimeRange = '7d' | '30d' | '90d' | '1y';

interface ChartData {
  weeklyProgress: { x: number; y: number; label?: string }[];
  sessionTypeBreakdown: { label: string; value: number; color: string }[];
  performanceTrends: { x: number; y: number; label?: string }[];
  readinessTrends: { x: number; y: number; label?: string }[];
  monthlyGoalProgress: number;
  mindsetTrends: {
    mood: { x: number; y: number; label?: string }[];
    energy: { x: number; y: number; label?: string }[];
    motivation: { x: number; y: number; label?: string }[];
  };
  topMindsetTags: { tag: string; count: number }[];
}

export default function EnhancedAnalytics() {
  const { logs, getStreak, getWeeklyLogs } = useSessionStore();
  const { goals } = useOnboardingStore();
  const { checkins } = useMindsetStore();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('30d');
  const [chartData, setChartData] = useState<ChartData>({
    weeklyProgress: [],
    sessionTypeBreakdown: [],
    performanceTrends: [],
    readinessTrends: [],
    monthlyGoalProgress: 0,
    mindsetTrends: { mood: [], energy: [], motivation: [] },
    topMindsetTags: [],
  });

  const timeRanges = [
    { key: '7d' as const, label: '7D' },
    { key: '30d' as const, label: '30D' },
    { key: '90d' as const, label: '3M' },
    { key: '1y' as const, label: '1Y' },
  ];

  useEffect(() => {
    generateChartData();
  }, [logs, checkins, selectedRange]);

  const generateChartData = () => {
    const now = new Date();
    const daysMap: { [key in TimeRange]: number } = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    
    const days = daysMap[selectedRange];
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Filter logs within range
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= now;
    });

    // Generate weekly progress data
    const weeklyProgress = generateWeeklyProgress(filteredLogs, days);
    
    // Generate session type breakdown
    const sessionTypeBreakdown = generateSessionTypeBreakdown(filteredLogs);
    
    // Generate performance trends
    const performanceTrends = generatePerformanceTrends(filteredLogs, days);
    
    // Generate readiness trends
    const readinessTrends = generateReadinessTrends(filteredLogs, days);

    // Calculate monthly goal progress
    const monthlyGoalProgress = calculateMonthlyGoalProgress();
    
    // Generate mindset trends
    const mindsetTrends = generateMindsetTrends(days);
    
    // Get top mindset tags
    const topMindsetTags = getTopMindsetTags();

    setChartData({
      weeklyProgress,
      sessionTypeBreakdown,
      performanceTrends,
      readinessTrends,
      monthlyGoalProgress,
      mindsetTrends,
      topMindsetTags,
    });
  };

  const generateWeeklyProgress = (logs: any[], days: number) => {
    const data = [];
    const now = new Date();
    const interval = days <= 30 ? 1 : Math.floor(days / 30); // Daily for short ranges, weekly/monthly for longer

    for (let i = 0; i < days; i += interval) {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - i));
      
      const periodStart = new Date(date);
      const periodEnd = new Date(date);
      periodEnd.setDate(periodEnd.getDate() + interval - 1);
      
      const sessionsInPeriod = logs.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= periodStart && logDate <= periodEnd;
      }).length;

      data.push({
        x: i,
        y: sessionsInPeriod,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }

    return data;
  };

  const generateSessionTypeBreakdown = (logs: any[]) => {
    const typeColors: { [key: string]: string } = {
      training: colors.primary,
      competition: '#FF6B6B',
      recovery: '#4ECDC4',
      other: '#95E1D3',
    };

    const breakdown: { [key: string]: number } = {};
    logs.forEach(log => {
      const type = log.sessionType;
      breakdown[type] = (breakdown[type] || 0) + 1;
    });

    return Object.entries(breakdown)
      .map(([type, count]) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: count,
        color: typeColors[type] || colors.darkGray,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const generatePerformanceTrends = (logs: any[], days: number) => {
    const groupSize = Math.max(1, Math.floor(days / 10));
    const data = [];
    
    for (let i = 0; i < days; i += groupSize) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const periodLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        const periodStart = new Date(date);
        const periodEnd = new Date(date);
        periodEnd.setDate(periodEnd.getDate() + groupSize - 1);
        return logDate >= periodStart && logDate <= periodEnd;
      });

      if (periodLogs.length > 0) {
        const avgRating = periodLogs.reduce((sum, log) => sum + (log.sessionRating || 0), 0) / periodLogs.length;
        data.push({
          x: i,
          y: avgRating,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    }

    return data;
  };

  const generateReadinessTrends = (logs: any[], days: number) => {
    const groupSize = Math.max(1, Math.floor(days / 10));
    const data = [];
    
    for (let i = 0; i < days; i += groupSize) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const periodLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        const periodStart = new Date(date);
        const periodEnd = new Date(date);
        periodEnd.setDate(periodEnd.getDate() + groupSize - 1);
        return logDate >= periodStart && logDate <= periodEnd && log.readinessRating;
      });

      if (periodLogs.length > 0) {
        const avgReadiness = periodLogs.reduce((sum, log) => sum + (log.readinessRating || 0), 0) / periodLogs.length;
        data.push({
          x: i,
          y: avgReadiness,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    }

    return data;
  };

  const calculateMonthlyGoalProgress = () => {
    const weeklyLogs = getWeeklyLogs();
    const weeklyTarget = goals.weeklySessionTarget || 3;
    const weeksInMonth = 4.33; // Average weeks per month
    const monthlyTarget = weeklyTarget * weeksInMonth;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfMonth && logDate <= now;
    }).length;

    return Math.min(monthlyLogs / monthlyTarget, 1);
  };
  
  const generateMindsetTrends = (days: number) => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    const filteredCheckins = checkins.filter(checkin => {
      const checkinDate = new Date(checkin.date);
      return checkinDate >= startDate && checkinDate <= now;
    });
    
    const groupSize = Math.max(1, Math.floor(days / 10));
    const mood = [];
    const energy = [];
    const motivation = [];
    
    for (let i = 0; i < days; i += groupSize) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const periodCheckins = filteredCheckins.filter(checkin => {
        const checkinDate = new Date(checkin.date);
        const periodStart = new Date(date);
        const periodEnd = new Date(date);
        periodEnd.setDate(periodEnd.getDate() + groupSize - 1);
        return checkinDate >= periodStart && checkinDate <= periodEnd;
      });
      
      if (periodCheckins.length > 0) {
        const avgMood = periodCheckins.reduce((sum, c) => sum + c.mood, 0) / periodCheckins.length;
        const avgEnergy = periodCheckins.reduce((sum, c) => sum + c.energy, 0) / periodCheckins.length;
        const avgMotivation = periodCheckins.reduce((sum, c) => sum + c.motivation, 0) / periodCheckins.length;
        
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        mood.push({ x: i, y: avgMood, label });
        energy.push({ x: i, y: avgEnergy, label });
        motivation.push({ x: i, y: avgMotivation, label });
      }
    }
    
    return { mood, energy, motivation };
  };
  
  const getTopMindsetTags = () => {
    const tagCounts: { [key: string]: number } = {};
    
    checkins.forEach(checkin => {
      checkin.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const formatDate = (value: number) => {
    const now = new Date();
    const date = new Date(now);
    date.setDate(date.getDate() - value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentStreak = getStreak();
  const weeklyLogs = getWeeklyLogs();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Award size={20} color="#FFD700" />
          <Text style={styles.statValue}>{currentStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        
        <View style={styles.statCard}>
          <Calendar size={20} color={colors.primary} />
          <Text style={styles.statValue}>{weeklyLogs}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        
        <View style={styles.statCard}>
          <Target size={20} color={colors.secondary} />
          <Text style={styles.statValue}>{Math.round(chartData.monthlyGoalProgress * 100)}%</Text>
          <Text style={styles.statLabel}>Monthly Goal</Text>
        </View>
      </View>

      {/* Time Range Selector */}
      <Card style={styles.timeRangeCard}>
        <View style={styles.timeRangeSelector}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                selectedRange === range.key && styles.activeTimeRange
              ]}
              onPress={() => setSelectedRange(range.key)}
            >
              <Text style={[
                styles.timeRangeText,
                selectedRange === range.key && styles.activeTimeRangeText
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Monthly Goal Progress */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Monthly Goal Progress</Text>
          <Target size={16} color={colors.secondary} />
        </View>
        <View style={styles.goalProgressContainer}>
          <ProgressRing
            progress={chartData.monthlyGoalProgress}
            size={120}
            color={colors.secondary}
            showPercentage={true}
          />
          <View style={styles.goalDetails}>
            <Text style={styles.goalText}>
              Target: {(goals.weeklySessionTarget || 0) * 4} sessions/month
            </Text>
            <Text style={styles.goalSubtext}>
              {Math.round(chartData.monthlyGoalProgress * 100)}% complete
            </Text>
          </View>
        </View>
      </Card>

      {/* Session Activity */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Session Activity</Text>
          <Activity size={16} color={colors.primary} />
        </View>
        <LineChart
          data={chartData.weeklyProgress}
          height={180}
          strokeColor={colors.primary}
          showGrid={true}
          yAxisLabel="Sessions"
          formatXValue={formatDate}
        />
      </Card>

      {/* Session Types */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Session Types</Text>
          <TrendingUp size={16} color={colors.success} />
        </View>
        <BarChart
          data={chartData.sessionTypeBreakdown}
          height={160}
          showValues={true}
        />
      </Card>

      {/* Performance Trends */}
      {chartData.performanceTrends.length > 0 && (
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Session Ratings</Text>
            <TrendingUp size={16} color="#FF8C42" />
          </View>
          <LineChart
            data={chartData.performanceTrends}
            height={160}
            strokeColor="#FF8C42"
            showGrid={true}
            yAxisLabel="Rating"
            formatXValue={formatDate}
            formatYValue={(value) => `${value.toFixed(1)}/5`}
          />
        </Card>
      )}

      {/* Readiness Trends */}
      {chartData.readinessTrends.length > 0 && (
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Readiness Levels</Text>
            <Clock size={16} color="#9C27B0" />
          </View>
          <LineChart
            data={chartData.readinessTrends}
            height={160}
            strokeColor="#9C27B0"
            showGrid={true}
            yAxisLabel="Readiness"
            formatXValue={formatDate}
            formatYValue={(value) => `${value.toFixed(1)}/10`}
          />
        </Card>
      )}

      {/* Mindset Trends */}
      {(chartData.mindsetTrends.mood.length > 0 || 
        chartData.mindsetTrends.energy.length > 0 || 
        chartData.mindsetTrends.motivation.length > 0) && (
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Mindset Trends</Text>
            <Heart size={16} color="#E91E63" />
          </View>
          <View style={styles.mindsetLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E91E63' }]} />
              <Text style={styles.legendText}>Mood</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3F51B5' }]} />
              <Text style={styles.legendText}>Energy</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Motivation</Text>
            </View>
          </View>
          <View style={{ height: 180 }}>
            {chartData.mindsetTrends.mood.length > 0 && (
              <LineChart
                data={chartData.mindsetTrends.mood}
                height={180}
                strokeColor="#E91E63"
                showGrid={true}
                yAxisLabel="Score"
                formatXValue={formatDate}
                formatYValue={(value) => value.toFixed(1)}
              />
            )}
            {chartData.mindsetTrends.energy.length > 0 && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                <LineChart
                  data={chartData.mindsetTrends.energy}
                  height={180}
                  strokeColor="#3F51B5"
                  showGrid={false}
                  yAxisLabel=""
                  formatXValue={formatDate}
                  formatYValue={(value) => value.toFixed(1)}
                />
              </View>
            )}
            {chartData.mindsetTrends.motivation.length > 0 && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
                <LineChart
                  data={chartData.mindsetTrends.motivation}
                  height={180}
                  strokeColor="#FF9800"
                  showGrid={false}
                  yAxisLabel=""
                  formatXValue={formatDate}
                  formatYValue={(value) => value.toFixed(1)}
                />
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Top Mindset Tags */}
      {chartData.topMindsetTags.length > 0 && (
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Top Mindset Tags</Text>
            <Zap size={16} color={colors.primary} />
          </View>
          <View style={styles.tagsContainer}>
            {chartData.topMindsetTags.map((item, index) => (
              <View key={item.tag} style={styles.tagItem}>
                <View style={[styles.tagRank, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.lightGray }]}>
                  <Text style={styles.tagRankText}>#{index + 1}</Text>
                </View>
                <Text style={styles.tagName}>{item.tag}</Text>
                <Text style={styles.tagCount}>{item.count} times</Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStats: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
  },
  timeRangeCard: {
    padding: 8,
    marginBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTimeRange: {
    backgroundColor: colors.primary,
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkGray,
  },
  activeTimeRangeText: {
    color: colors.background,
  },
  chartCard: {
    padding: 20,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  goalDetails: {
    flex: 1,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  goalSubtext: {
    fontSize: 12,
    color: colors.darkGray,
  },
  mindsetLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.darkGray,
  },
  tagsContainer: {
    gap: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tagRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  tagName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  tagCount: {
    fontSize: 14,
    color: colors.darkGray,
  },
});