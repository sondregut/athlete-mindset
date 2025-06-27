import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, CheckCircle } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';

export default function ProfileStats() {
  const colors = useThemeColors();
  const { getStreak, getTotalSessions } = useSessionStore();
  
  const currentStreak = getStreak();
  const totalSessions = getTotalSessions();
  
  const getStreakColor = () => {
    if (currentStreak >= 7) return colors.success; // Green for week+
    if (currentStreak >= 3) return colors.orange; // Orange for 3+ days
    return colors.primary; // Blue for starting out
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.darkGray,
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <View style={styles.statRow}>
          <Flame size={16} color={getStreakColor()} />
          <Text style={[styles.statValue, { color: getStreakColor() }]}>{currentStreak}</Text>
        </View>
        <Text style={styles.statLabel}>Day Streak</Text>
      </View>
      
      <View style={styles.statItem}>
        <View style={styles.statRow}>
          <CheckCircle size={16} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.primary }]}>{totalSessions}</Text>
        </View>
        <Text style={styles.statLabel}>Total Sessions</Text>
      </View>
    </View>
  );
}