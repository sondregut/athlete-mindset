import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Brain, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { router } from 'expo-router';
import Card from '@/components/Card';
import { useVisualizationStore } from '@/store/visualization-store';

export default function VisualizationCard() {
  const colors = useThemeColors();
  const { completedSessions } = useVisualizationStore();

  const todayCount = completedSessions.filter(s => {
    const today = new Date();
    const sessionDate = new Date(s.completedAt!);
    return sessionDate.toDateString() === today.toDateString();
  }).length;

  const handlePress = () => {
    router.push('/(tabs)/mental-training');
  };

  const styles = StyleSheet.create({
    card: {
      marginTop: 12,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 16,
    },
    ctaButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    ctaText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: `${colors.primary}10`,
      borderRadius: 8,
    },
    statsText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
  });

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconWrapper}>
                <Brain size={20} color={colors.primary} />
              </View>
              <Text style={styles.title}>Mental Training</Text>
            </View>
            <ChevronRight size={20} color={colors.darkGray} />
          </View>

          <Text style={styles.subtitle}>
            Strengthen your mind with guided visualizations
          </Text>

          {todayCount > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                ✨ {todayCount} visualization{todayCount > 1 ? 's' : ''} completed today
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.ctaButton} onPress={handlePress}>
            <Text style={styles.ctaText}>Start Visualization</Text>
            <ChevronRight size={18} color={colors.background} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Card>
  );
}