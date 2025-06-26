import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAchievementStore } from '@/store/achievement-store';
import { STREAK_MILESTONES } from '@/constants/milestones';
import AchievementBadge from './AchievementBadge';
import Card from './Card';

export default function AchievementsSection() {
  const colors = useThemeColors();
  const { getUnlockedAchievements, hasUnlockedMilestone, getAchievementByMilestoneId } = useAchievementStore();
  
  const unlockedAchievements = getUnlockedAchievements();
  const totalPossible = STREAK_MILESTONES.length;
  const totalUnlocked = unlockedAchievements.length;
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    progress: {
      fontSize: 14,
      color: colors.darkGray,
    },
    badgesScrollView: {
      flexGrow: 0,
    },
    badgesContainer: {
      flexDirection: 'row',
      gap: 16,
    },
    emptyState: {
      padding: 24,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.darkGray,
      textAlign: 'center',
      marginTop: 12,
    },
    lockedBadge: {
      opacity: 0.6,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.progress}>
          {totalUnlocked} of {totalPossible} unlocked
        </Text>
      </View>
      
      <Card>
        {totalUnlocked > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.badgesScrollView}
            contentContainerStyle={styles.badgesContainer}
          >
            {STREAK_MILESTONES.map((milestone) => {
              const isUnlocked = hasUnlockedMilestone(milestone.id);
              const achievement = isUnlocked ? getAchievementByMilestoneId(milestone.id) : undefined;
              
              return (
                <View
                  key={milestone.id}
                  style={!isUnlocked ? styles.lockedBadge : undefined}
                >
                  <AchievementBadge
                    milestone={milestone}
                    isUnlocked={isUnlocked}
                    unlockedDate={achievement?.unlockedAt}
                    size="medium"
                    showAnimation={false}
                  />
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <AchievementBadge
              milestone={STREAK_MILESTONES[0]}
              isUnlocked={false}
              size="medium"
              showAnimation={false}
            />
            <Text style={styles.emptyStateText}>
              Complete a 7-day streak to unlock your first achievement!
            </Text>
          </View>
        )}
      </Card>
    </View>
  );
}