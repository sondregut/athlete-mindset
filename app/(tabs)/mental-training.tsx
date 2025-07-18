import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import Card from '@/components/Card';
import { useSessionStore } from '@/store/session-store';
import SessionLogItem from '@/components/SessionLogItem';

export default function MentalTrainingScreen() {
  const colors = useThemeColors();
  const { logs } = useSessionStore();
  
  // Get recent mental training sessions
  const recentMentalTrainingSessions = logs
    .filter(log => log.sessionType === 'visualization' && log.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const handleStartVisualization = () => {
    router.push('/visualization/detail');
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.darkGray,
      lineHeight: 22,
    },
    statsCard: {
      marginBottom: 20,
    },
    statsContent: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    categoriesContainer: {
      marginBottom: 32,
    },
    navigationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    showAllButton: {
      alignItems: 'center',
      marginTop: 16,
    },
    showAllText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    showAllVisualizationsButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 16,
      alignItems: 'center',
      marginBottom: 32,
    },
    showAllVisualizationsText: {
      fontSize: 16,
      color: 'white',
      fontWeight: '600',
    },
    favoritesSection: {
      marginBottom: 24,
    },
    favoritesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.darkGray,
      textAlign: 'center',
      fontStyle: 'italic',
      marginVertical: 20,
    },
    noResultsText: {
      fontSize: 16,
      color: colors.darkGray,
      textAlign: 'center',
      marginTop: 40,
    },
    recentSessionItem: {
      marginBottom: 12,
    },
    visualizationCard: {
      marginBottom: 20,
    },
    visualizationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    visualizationTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    visualizationDescription: {
      fontSize: 16,
      color: colors.darkGray,
      lineHeight: 22,
      marginBottom: 16,
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
    },
    startButtonText: {
      fontSize: 16,
      color: 'white',
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mental Training</Text>
          <Text style={styles.subtitle}>
            Strengthen your mind with personalized sports visualizations
          </Text>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{recentMentalTrainingSessions.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {recentMentalTrainingSessions.filter((s: any) => {
                  const today = new Date();
                  const sessionDate = new Date(s.createdAt || '');
                  return sessionDate.toDateString() === today.toDateString();
                }).length}
              </Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {recentMentalTrainingSessions.filter((s: any) => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(s.createdAt || '') > weekAgo;
                }).length}
              </Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
        </Card>

        {/* Personalized Visualization Card */}
        <Card style={styles.visualizationCard}>
          <View style={styles.visualizationHeader}>
            <Star size={24} color={colors.primary} fill={colors.primary} />
            <Text style={styles.visualizationTitle}>Goal Visualization</Text>
          </View>
          <Text style={styles.visualizationDescription}>
            Create a personalized visualization for your sport to enhance performance and mental preparation
          </Text>
          <TouchableOpacity 
            onPress={handleStartVisualization}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Start Personalized Visualization</Text>
          </TouchableOpacity>
        </Card>

        {/* Recent Sessions */}
        {recentMentalTrainingSessions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Sessions</Text>
            {recentMentalTrainingSessions.map((session) => (
              <View key={session.id} style={styles.recentSessionItem}>
                <SessionLogItem 
                  log={session} 
                  showEditButton={false}
                />
              </View>
            ))}
          </>
        )}
        
        {/* Empty state if no sessions yet */}
        {recentMentalTrainingSessions.length === 0 && (
          <Text style={styles.emptyStateText}>
            Complete your first visualization to see your history here
          </Text>
        )}
      </ScrollView>
    </View>
  );
}