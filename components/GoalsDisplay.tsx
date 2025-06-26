import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useSessionStore } from '@/store/session-store';
import Card from './Card';
import { Calendar, Target, TrendingUp, Award } from 'lucide-react-native';

export default function GoalsDisplay() {
  const colors = useThemeColors();
  const { goals } = useOnboardingStore();
  const { logs, getStreak, getTotalSessions, getWeeklyLogs } = useSessionStore();
  
  const weeklyProgress = getWeeklyLogs();
  const streak = getStreak();
  const weeklyGoal = goals.weeklySessionTarget || 3;
  const progressPercentage = Math.min((weeklyProgress / weeklyGoal) * 100, 100);
  
  const hasConsistentProgress = logs.length >= 10;
  const hasAdvancedProgress = logs.length >= 20;
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
    },
    goalCard: {
      marginBottom: 16,
      padding: 16,
    },
    goalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    goalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    progressContainer: {
      marginTop: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.lightGray,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 8,
    },
    streakNumber: {
      fontSize: 48,
      fontWeight: 'bold',
      color: colors.success,
      marginTop: 8,
    },
    streakLabel: {
      fontSize: 16,
      color: colors.darkGray,
      marginTop: 4,
    },
    goalDescription: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
    },
    statusBadge: {
      backgroundColor: colors.lightGray,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    achievedBadge: {
      backgroundColor: colors.success + '20',
    },
    statusText: {
      fontSize: 14,
      color: colors.darkGray,
      fontWeight: '500',
    },
    achievedText: {
      color: colors.success,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    totalNumber: {
      fontSize: 64,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 8,
      textAlign: 'center',
    },
  });
  
  return (
    <View style={styles.container}>
      {/* Weekly Session Goal */}
      <Card style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Calendar size={24} color={colors.primary} />
          <Text style={styles.goalTitle}>Weekly Sessions</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {weeklyProgress} / {weeklyGoal} sessions
          </Text>
        </View>
      </Card>

      {/* Current Streak */}
      <Card style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <TrendingUp size={24} color={colors.success} />
          <Text style={styles.goalTitle}>Current Streak</Text>
        </View>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>
          {streak === 1 ? 'day' : 'days'} in a row
        </Text>
      </Card>

      {/* Primary Focus */}
      {goals.primaryFocus && (
        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Target size={24} color={hasConsistentProgress ? colors.success : colors.primary} />
            <Text style={styles.goalTitle}>Primary Focus</Text>
          </View>
          <Text style={styles.goalDescription}>
            {goals.primaryFocus.charAt(0).toUpperCase() + goals.primaryFocus.slice(1)}
          </Text>
          <View style={[styles.statusBadge, hasConsistentProgress && styles.achievedBadge]}>
            <Text style={[styles.statusText, hasConsistentProgress && styles.achievedText]}>
              {hasConsistentProgress ? 'In Progress' : 'Getting Started'}
            </Text>
          </View>
        </Card>
      )}

      {/* Streak Goal */}
      {goals.streakGoal && (
        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Award size={24} color={streak >= goals.streakGoal ? colors.success : colors.warning} />
            <Text style={styles.goalTitle}>Streak Goal</Text>
          </View>
          <Text style={styles.goalDescription}>
            Target: {goals.streakGoal} days
          </Text>
          <View style={[styles.statusBadge, streak >= goals.streakGoal && styles.achievedBadge]}>
            <Text style={[styles.statusText, streak >= goals.streakGoal && styles.achievedText]}>
              {streak >= goals.streakGoal ? 'Achieved!' : `${goals.streakGoal - streak} days to go`}
            </Text>
          </View>
        </Card>
      )}

      {/* Total Sessions */}
      <Card style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.totalLabel}>Total Sessions Logged</Text>
        </View>
        <Text style={styles.totalNumber}>{getTotalSessions()}</Text>
      </Card>
    </View>
  );
}