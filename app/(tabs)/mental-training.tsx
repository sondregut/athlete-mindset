import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { router } from 'expo-router';
import { ChevronRight, Clock, Trophy, Brain } from 'lucide-react-native';
import Card from '@/components/Card';
import { useVisualizationStore } from '@/store/visualization-store';
import { visualizations } from '@/constants/visualizations';
import { useSessionStore } from '@/store/session-store';
import SessionLogItem from '@/components/SessionLogItem';

export default function MentalTrainingScreen() {
  const colors = useThemeColors();
  const { completedSessions, getVisualizationStats } = useVisualizationStore();
  const { logs } = useSessionStore();
  
  // Get recent mental training sessions
  const recentMentalTrainingSessions = logs
    .filter(log => log.sessionType === 'visualization' && log.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const handleVisualizationPress = (visualizationId: string) => {
    router.push({
      pathname: '/visualization-detail',
      params: { id: visualizationId }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'confidence':
        return <Trophy size={20} color={colors.primary} />;
      case 'focus':
        return <Brain size={20} color={colors.primary} />;
      default:
        return <Brain size={20} color={colors.primary} />;
    }
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
    visualizationCard: {
      marginBottom: 12,
    },
    visualizationContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    visualizationInfo: {
      flex: 1,
    },
    visualizationTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    visualizationDescription: {
      fontSize: 14,
      color: colors.darkGray,
      marginBottom: 4,
    },
    visualizationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: colors.darkGray,
    },
    chevron: {
      marginLeft: 8,
    },
    recentSessionItem: {
      marginBottom: 12,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.darkGray,
      textAlign: 'center',
      fontStyle: 'italic',
      marginVertical: 20,
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
            Strengthen your mind with guided visualizations and mental exercises
          </Text>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedSessions.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {completedSessions.filter(s => {
                  const today = new Date();
                  const sessionDate = new Date(s.completedAt || '');
                  return sessionDate.toDateString() === today.toDateString();
                }).length}
              </Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {completedSessions.filter(s => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(s.completedAt || '') > weekAgo;
                }).length}
              </Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Available Visualizations</Text>

        {visualizations.map((visualization) => {
          const stats = getVisualizationStats(visualization.id);
          
          return (
            <TouchableOpacity
              key={visualization.id}
              onPress={() => handleVisualizationPress(visualization.id)}
            >
              <Card style={styles.visualizationCard}>
                <View style={styles.visualizationContent}>
                  <View style={styles.iconContainer}>
                    {getCategoryIcon(visualization.category)}
                  </View>
                  <View style={styles.visualizationInfo}>
                    <Text style={styles.visualizationTitle}>
                      {visualization.title}
                    </Text>
                    <Text style={styles.visualizationDescription}>
                      {visualization.description}
                    </Text>
                    <View style={styles.visualizationMeta}>
                      <View style={styles.metaItem}>
                        <Clock size={12} color={colors.darkGray} />
                        <Text style={styles.metaText}>
                          {visualization.duration} min
                        </Text>
                      </View>
                      {stats.completionCount > 0 && (
                        <View style={styles.metaItem}>
                          <Trophy size={12} color={colors.darkGray} />
                          <Text style={styles.metaText}>
                            {stats.completionCount}x completed
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight 
                    size={20} 
                    color={colors.darkGray} 
                    style={styles.chevron}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

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