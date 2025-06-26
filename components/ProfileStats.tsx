import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, CheckCircle } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSessionStore } from '@/store/session-store';
import Card from './Card';

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
    },
    statGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      flex: 1,
      padding: 12,
    },
    statContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    textContent: {
      flex: 1,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 2,
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.darkGray,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.statGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${getStreakColor()}15` }]}>
              <Flame size={18} color={getStreakColor()} />
            </View>
            <View style={styles.textContent}>
              <Text style={[styles.statValue, { color: getStreakColor() }]}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </Card>
        
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <CheckCircle size={18} color={colors.primary} />
            </View>
            <View style={styles.textContent}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}