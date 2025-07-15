import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { router } from 'expo-router';
import { Star, ArrowLeft } from 'lucide-react-native';
import Card from '@/components/Card';
import SearchBar from '@/components/SearchBar';
import VisualizationGridCard from '@/components/VisualizationGridCard';
import CategoryCard from '@/components/CategoryCard';
import { useVisualizationStore } from '@/store/visualization-store';
import { visualizations } from '@/constants/visualizations';
import { CATEGORY_INFO, VisualizationCategory } from '@/types/visualization';
import { useSessionStore } from '@/store/session-store';
import SessionLogItem from '@/components/SessionLogItem';

export default function MentalTrainingScreen() {
  const colors = useThemeColors();
  const { completedSessions, getVisualizationStats, favorites } = useVisualizationStore();
  const { logs } = useSessionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VisualizationCategory | null>(null);
  const [showAllVisualizations, setShowAllVisualizations] = useState(false);
  
  // Get recent mental training sessions
  const recentMentalTrainingSessions = logs
    .filter(log => log.sessionType === 'visualization' && log.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Filter visualizations based on search and category
  const filteredVisualizations = useMemo(() => {
    let filtered = visualizations;
    
    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(viz => viz.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(viz => 
        viz.title.toLowerCase().includes(query) ||
        viz.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [searchQuery, selectedCategory]);
  
  // Get visualization count by category
  const getCategoryCount = (category: VisualizationCategory) => {
    return visualizations.filter(viz => viz.category === category).length;
  };


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
  
  const handleCategoryPress = (category: VisualizationCategory) => {
    setSelectedCategory(category);
    setShowAllVisualizations(true);
  };
  
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setShowAllVisualizations(false);
    setSearchQuery('');
  };
  
  const handleShowAllVisualizations = () => {
    setSelectedCategory(null);
    setShowAllVisualizations(true);
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

        {/* Search Bar - Show only when viewing visualizations */}
        {(showAllVisualizations || selectedCategory) && (
          <>
            <View style={styles.navigationHeader}>
              <TouchableOpacity 
                onPress={handleBackToCategories}
                style={styles.backButton}
              >
                <ArrowLeft size={20} color={colors.primary} />
                <Text style={styles.backText}>Back to Categories</Text>
              </TouchableOpacity>
              {selectedCategory && (
                <Text style={styles.categoryTitle}>
                  {CATEGORY_INFO[selectedCategory].title}
                </Text>
              )}
            </View>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search visualizations..."
            />
          </>
        )}

        {/* Categories View */}
        {!showAllVisualizations && !selectedCategory && (
          <>
            {/* Favorites Section */}
            {favoriteVisualizations.length > 0 && (
              <View style={styles.favoritesSection}>
                <View style={styles.favoritesHeader}>
                  <Star size={20} color={colors.primary} fill={colors.primary} />
                  <Text style={styles.sectionTitle}>Favorites</Text>
                </View>
                <View style={styles.gridContainer}>
                  {favoriteVisualizations.slice(0, 4).map(visualization => {
                    const stats = getVisualizationStats(visualization.id);
                    return (
                      <VisualizationGridCard
                        key={visualization.id}
                        visualization={visualization}
                        onPress={() => handleVisualizationPress(visualization.id)}
                        completionCount={stats.completionCount}
                      />
                    );
                  })}
                </View>
                {favoriteVisualizations.length > 4 && (
                  <TouchableOpacity 
                    onPress={handleShowAllVisualizations}
                    style={styles.showAllButton}
                  >
                    <Text style={styles.showAllText}>View All Favorites</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Categories Section */}
            <Text style={styles.sectionTitle}>Explore Categories</Text>
            <View style={styles.categoriesContainer}>
              {Object.entries(CATEGORY_INFO).map(([key, categoryInfo]) => (
                <CategoryCard
                  key={key}
                  category={key as VisualizationCategory}
                  onPress={() => handleCategoryPress(key as VisualizationCategory)}
                  visualizationCount={getCategoryCount(key as VisualizationCategory)}
                />
              ))}
            </View>
            
            {/* Show All Button */}
            <TouchableOpacity 
              onPress={handleShowAllVisualizations}
              style={styles.showAllVisualizationsButton}
            >
              <Text style={styles.showAllVisualizationsText}>View All Visualizations</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Visualizations Grid View */}
        {(showAllVisualizations || selectedCategory) && (
          <>
            {/* No results message */}
            {searchQuery && filteredVisualizations.length === 0 && (
              <Text style={styles.noResultsText}>
                No visualizations found matching "{searchQuery}"
              </Text>
            )}
            
            {/* Grid of visualizations */}
            <View style={styles.gridContainer}>
              {filteredVisualizations.map(visualization => {
                const stats = getVisualizationStats(visualization.id);
                return (
                  <VisualizationGridCard
                    key={visualization.id}
                    visualization={visualization}
                    onPress={() => handleVisualizationPress(visualization.id)}
                    completionCount={stats.completionCount}
                  />
                );
              })}
            </View>
          </>
        )}

        {/* Recent Sessions - Show only on main category view */}
        {!showAllVisualizations && !selectedCategory && (
          <>
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
          </>
        )}
      </ScrollView>
    </View>
  );
}