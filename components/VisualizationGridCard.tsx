import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Star, Target, User, Heart, Trophy } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Visualization } from '@/types/visualization';
import { CATEGORY_INFO } from '@/types/visualization';
import { useVisualizationStore } from '@/store/visualization-store';

interface VisualizationGridCardProps {
  visualization: Visualization;
  onPress: () => void;
  completionCount?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // 20px padding on each side, 8px gap

export default function VisualizationGridCard({ 
  visualization, 
  onPress,
  completionCount = 0
}: VisualizationGridCardProps) {
  const colors = useThemeColors();
  const { isFavorite, toggleFavorite } = useVisualizationStore();
  const categoryInfo = CATEGORY_INFO[visualization.category];
  const isStarred = isFavorite(visualization.id);

  const handleFavoriteToggle = () => {
    toggleFavorite(visualization.id);
  };

  const getCategoryIcon = () => {
    switch (categoryInfo.icon) {
      case 'target':
        return <Target size={20} color="white" />;
      case 'user':
        return <User size={20} color="white" />;
      case 'heart':
        return <Heart size={20} color="white" />;
      case 'trophy':
        return <Trophy size={20} color="white" />;
      default:
        return <Target size={20} color="white" />;
    }
  };

  // Create gradient colors from the category color
  const baseColor = categoryInfo.color;
  const lightColor = `${baseColor}40`; // 25% opacity
  const darkColor = `${baseColor}80`; // 50% opacity

  const styles = StyleSheet.create({
    container: {
      width: cardWidth,
      marginBottom: 12,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    gradient: {
      height: 200,
      justifyContent: 'space-between',
      padding: 16,
    },
    topSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    favoriteButton: {
      padding: 4,
    },
    contentSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: 'white',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 8,
    },
    description: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      lineHeight: 16,
    },
    bottomSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    durationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    metaText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '600',
    },
    completionBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    completionText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '600',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.container}>
        <LinearGradient
          colors={[lightColor, darkColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.topSection}>
            <View style={styles.iconContainer}>
              {getCategoryIcon()}
            </View>
            <TouchableOpacity 
              onPress={handleFavoriteToggle}
              style={styles.favoriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Star 
                size={20} 
                color={isStarred ? '#FFD700' : 'rgba(255, 255, 255, 0.7)'}
                fill={isStarred ? '#FFD700' : 'none'}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.contentSection}>
            <Text style={styles.title} numberOfLines={2}>
              {visualization.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {visualization.description}
            </Text>
          </View>
          
          <View style={styles.bottomSection}>
            <View style={styles.metaContainer}>
              <View style={styles.durationContainer}>
                <Clock size={14} color="white" />
                <Text style={styles.metaText}>{visualization.duration}m</Text>
              </View>
              {completionCount > 0 && (
                <View style={styles.completionBadge}>
                  <Text style={styles.completionText}>{completionCount}x</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}