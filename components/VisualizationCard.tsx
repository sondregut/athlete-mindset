import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Trophy, Star, Target, User, Heart } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Visualization } from '@/types/visualization';
import { CATEGORY_INFO } from '@/types/visualization';
import Card from '@/components/Card';
import { useVisualizationStore } from '@/store/visualization-store';

interface VisualizationCardProps {
  visualization: Visualization;
  onPress: () => void;
  completionCount?: number;
}

export default function VisualizationCard({ 
  visualization, 
  onPress,
  completionCount = 0
}: VisualizationCardProps) {
  const colors = useThemeColors();
  const { isFavorite, toggleFavorite } = useVisualizationStore();
  const categoryInfo = CATEGORY_INFO[visualization.category];
  const isStarred = isFavorite(visualization.id);

  const getCategoryIcon = () => {
    switch (categoryInfo.icon) {
      case 'target':
        return <Target size={20} color={categoryInfo.color} />;
      case 'user':
        return <User size={20} color={categoryInfo.color} />;
      case 'heart':
        return <Heart size={20} color={categoryInfo.color} />;
      case 'trophy':
        return <Trophy size={20} color={categoryInfo.color} />;
      default:
        return <Target size={20} color={categoryInfo.color} />;
    }
  };

  const handleFavoriteToggle = () => {
    toggleFavorite(visualization.id);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${categoryInfo.color}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    titleSection: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: colors.darkGray,
      lineHeight: 20,
    },
    favoriteButton: {
      padding: 8,
      marginLeft: 8,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 13,
      color: colors.darkGray,
    },
    categoryTag: {
      backgroundColor: `${categoryInfo.color}15`,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryText: {
      fontSize: 12,
      color: categoryInfo.color,
      fontWeight: '500',
    },
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {getCategoryIcon()}
            </View>
            <View style={styles.titleSection}>
              <Text style={styles.title}>{visualization.title}</Text>
              <Text style={styles.description} numberOfLines={2}>
                {visualization.description}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleFavoriteToggle}
              style={styles.favoriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Star 
                size={22} 
                color={isStarred ? colors.primary : colors.darkGray}
                fill={isStarred ? colors.primary : 'none'}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.darkGray} />
                <Text style={styles.metaText}>{visualization.duration} min</Text>
              </View>
              {completionCount > 0 && (
                <View style={styles.metaItem}>
                  <Trophy size={14} color={colors.darkGray} />
                  <Text style={styles.metaText}>{completionCount}x</Text>
                </View>
              )}
            </View>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {categoryInfo.title}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}