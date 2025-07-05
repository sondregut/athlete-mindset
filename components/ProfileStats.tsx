import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, CheckCircle, Calendar } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';
import Card from './Card';

export default function ProfileStats() {
  const colors = useThemeColors();
  const { getStreak, getTotalSessions, getWeeklyLogs } = useSessionStore();
  
  const currentStreak = getStreak();
  const totalSessions = getTotalSessions();
  const weeklyLogs = getWeeklyLogs();
  
  const getStreakColor = () => {
    if (currentStreak >= 7) return colors.success; // Green for week+
    if (currentStreak >= 3) return colors.orange; // Orange for 3+ days
    return colors.primary; // Blue for starting out
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    compactCard: {
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    iconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      gap: 6,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: colors.darkGray,
      fontWeight: '500',
      textAlign: 'center',
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
  });

  return (
    <View style={styles.container}>
      <Card style={styles.compactCard}>
        <View style={styles.statsRow}>
          {/* Current Streak */}
          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: `${getStreakColor()}15` }]}>
              <Flame size={16} color={getStreakColor()} />
            </View>
            <Text style={[styles.statValue, { color: getStreakColor() }]}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.divider} />
          
          {/* Weekly Sessions */}
          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.secondary}15` }]}>
              <Calendar size={16} color={colors.secondary} />
            </View>
            <Text style={[styles.statValue, { color: colors.secondary }]}>{weeklyLogs}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          
          <View style={styles.divider} />
          
          {/* Total Sessions */}
          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
              <CheckCircle size={16} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}