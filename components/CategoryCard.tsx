import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, User, Heart, Trophy } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CATEGORY_INFO, VisualizationCategory } from '@/types/visualization';

interface CategoryCardProps {
  category: VisualizationCategory;
  onPress: () => void;
  visualizationCount?: number;
}

export default function CategoryCard({ 
  category, 
  onPress, 
  visualizationCount = 0 
}: CategoryCardProps) {
  const colors = useThemeColors();
  const categoryInfo = CATEGORY_INFO[category];

  const getCategoryIcon = () => {
    switch (categoryInfo.icon) {
      case 'target':
        return <Target size={32} color="white" />;
      case 'user':
        return <User size={32} color="white" />;
      case 'heart':
        return <Heart size={32} color="white" />;
      case 'trophy':
        return <Trophy size={32} color="white" />;
      default:
        return <Target size={32} color="white" />;
    }
  };

  // Create gradient colors from the category color
  const baseColor = categoryInfo.color;
  const lightColor = `${baseColor}80`; // 50% opacity
  const darkColor = `${baseColor}E6`; // 90% opacity

  const styles = StyleSheet.create({
    container: {
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    gradient: {
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    content: {
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: 'white',
      marginTop: 12,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 18,
    },
    countBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    countText: {
      fontSize: 12,
      color: 'white',
      fontWeight: '600',
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
          {visualizationCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{visualizationCount}</Text>
            </View>
          )}
          <View style={styles.content}>
            {getCategoryIcon()}
            <Text style={styles.title}>{categoryInfo.title}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {categoryInfo.description}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}