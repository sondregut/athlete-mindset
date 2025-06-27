import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, Zap, Target, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useMindsetStore } from '@/store/mindset-store';
import Card from './Card';

export default function MindsetSummary() {
  const colors = useThemeColors();
  const { getCheckinStreak, getAverageScores, getRecentCheckins } = useMindsetStore();
  
  const streak = getCheckinStreak();
  const averages = getAverageScores(30);
  const recentCheckins = getRecentCheckins(7);
  
  const handleViewHistory = () => {
    router.navigate({
      pathname: '/(tabs)/history',
      params: { defaultView: 'checkins' }
    });
  };
  
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    viewButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
    card: {
      padding: 20,
    },
    streakSection: {
      alignItems: 'center',
      marginBottom: 20,
    },
    streakText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.darkGray,
      marginBottom: 12,
    },
    scoresSection: {
      marginBottom: 20,
    },
    scoresContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    scoreItem: {
      alignItems: 'center',
      flex: 1,
    },
    scoreValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    scoreLabel: {
      fontSize: 12,
      color: colors.darkGray,
    },
    scoreDivider: {
      width: 1,
      backgroundColor: colors.mediumGray,
      marginVertical: 8,
    },
    activitySection: {
      borderTopWidth: 1,
      borderTopColor: colors.mediumGray,
      paddingTop: 16,
    },
    activityText: {
      fontSize: 16,
      color: colors.text,
    },
  });
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mindset Overview</Text>
        <TouchableOpacity onPress={handleViewHistory} style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View History</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <Card style={styles.card}>
        {/* Streak Section */}
        <View style={styles.streakSection}>
          <Text style={styles.streakText}>
            {streak > 0 ? `${streak} day mindset check-in streak!` : 'Start your mindset streak today'}
          </Text>
        </View>
        
        {/* Average Scores */}
        <View style={styles.scoresSection}>
          <Text style={styles.sectionLabel}>30-Day Averages</Text>
          <View style={styles.scoresContainer}>
            <View style={styles.scoreItem}>
              <Heart size={20} color="#E91E63" />
              <Text style={styles.scoreValue}>{averages.mood.toFixed(1)}</Text>
              <Text style={styles.scoreLabel}>Mood</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Zap size={20} color="#3F51B5" />
              <Text style={styles.scoreValue}>{averages.energy.toFixed(1)}</Text>
              <Text style={styles.scoreLabel}>Energy</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Target size={20} color="#FF9800" />
              <Text style={styles.scoreValue}>{averages.motivation.toFixed(1)}</Text>
              <Text style={styles.scoreLabel}>Motivation</Text>
            </View>
          </View>
        </View>
        
        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionLabel}>This Week</Text>
          <Text style={styles.activityText}>
            {recentCheckins.length} check-in{recentCheckins.length !== 1 ? 's' : ''} completed
          </Text>
        </View>
      </Card>
    </View>
  );
}