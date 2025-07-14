import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { router } from 'expo-router';
import { ChevronRight, ChevronDown, Star } from 'lucide-react-native';
import Card from '@/components/Card';
import SearchBar from '@/components/SearchBar';
import VisualizationCard from '@/components/VisualizationCard';
import { useVisualizationStore } from '@/store/visualization-store';
import { visualizations, getVisualizationsByCategory } from '@/constants/visualizations';
import { CATEGORY_INFO, VisualizationCategory } from '@/types/visualization';
import { useSessionStore } from '@/store/session-store';
import SessionLogItem from '@/components/SessionLogItem';

export default function MentalTrainingScreen() {
  const colors = useThemeColors();
  const { completedSessions, getVisualizationStats, favorites } = useVisualizationStore();
  const { logs } = useSessionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['performance-process', 'identity-shifting', 'emotional-healing', 'goal-achievement'])
  );
  
  // Get recent mental training sessions
  const recentMentalTrainingSessions = logs
    .filter(log => log.sessionType === 'visualization' && log.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Filter visualizations based on search
  const filteredVisualizations = useMemo(() => {
    if (!searchQuery.trim()) return visualizations;
    
    const query = searchQuery.toLowerCase();
    return visualizations.filter(viz => 
      viz.title.toLowerCase().includes(query) ||
      viz.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group visualizations by category
  const visualizationsByCategory = useMemo(() => {
    const grouped: Record<VisualizationCategory, typeof visualizations> = {
      'performance-process': [],
      'identity-shifting': [],
      'emotional-healing': [],
      'goal-achievement': [],
    };
    
    filteredVisualizations.forEach(viz => {
      grouped[viz.category].push(viz);
    });
    
    return grouped;
  }, [filteredVisualizations]);

  // Get favorite visualizations
  const favoriteVisualizations = useMemo(() => {
    return visualizations.filter(viz => favorites.includes(viz.id));
  }, [favorites]);

  const handleVisualizationPress = (visualizationId: string) => {
    router.push({
      pathname: '/visualization-detail',
      params: { id: visualizationId }
    });
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
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
    categorySection: {
      marginBottom: 24,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    categoryDescription: {
      fontSize: 14,
      color: colors.darkGray,
    },
    categoryChevron: {
      marginLeft: 12,
    },
    categoryContent: {
      marginTop: 8,
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

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search visualizations..."
        />

        {/* Favorites Section */}
        {favoriteVisualizations.length > 0 && !searchQuery && (
          <View style={styles.favoritesSection}>
            <View style={styles.favoritesHeader}>
              <Star size={20} color={colors.primary} fill={colors.primary} />
              <Text style={styles.sectionTitle}>Favorites</Text>
            </View>
            {favoriteVisualizations.map(visualization => {
              const stats = getVisualizationStats(visualization.id);
              return (
                <VisualizationCard
                  key={visualization.id}
                  visualization={visualization}
                  onPress={() => handleVisualizationPress(visualization.id)}
                  completionCount={stats.completionCount}
                />
              );
            })}
          </View>
        )}

        {/* No results message */}
        {searchQuery && filteredVisualizations.length === 0 && (
          <Text style={styles.noResultsText}>
            No visualizations found matching "{searchQuery}"
          </Text>
        )}

        {/* Categories */}
        {!searchQuery && (
          <Text style={styles.sectionTitle}>All Visualizations</Text>
        )}
        
        {Object.entries(visualizationsByCategory).map(([category, vizs]) => {
          if (vizs.length === 0) return null;
          
          const categoryInfo = CATEGORY_INFO[category as VisualizationCategory];
          const isExpanded = expandedCategories.has(category);
          
          return (
            <View key={category} style={styles.categorySection}>
              <TouchableOpacity 
                onPress={() => toggleCategory(category)}
                style={styles.categoryHeader}
              >
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{categoryInfo.title}</Text>
                  <Text style={styles.categoryDescription}>
                    {categoryInfo.description}
                  </Text>
                </View>
                <View style={styles.categoryChevron}>
                  {isExpanded ? (
                    <ChevronDown size={20} color={colors.darkGray} />
                  ) : (
                    <ChevronRight size={20} color={colors.darkGray} />
                  )}
                </View>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.categoryContent}>
                  {vizs.map(visualization => {
                    const stats = getVisualizationStats(visualization.id);
                    return (
                      <VisualizationCard
                        key={visualization.id}
                        visualization={visualization}
                        onPress={() => handleVisualizationPress(visualization.id)}
                        completionCount={stats.completionCount}
                      />
                    );
                  })}
                </View>
              )}
            </View>
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