import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}

export default function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 32,
  onRatingChange,
  readonly = false
}: StarRatingProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }).map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => !readonly && onRatingChange?.(index + 1)}
          style={styles.starContainer}
          disabled={readonly}
        >
          <Star
            size={size}
            color={index < rating ? colors.warning : colors.mediumGray}
            fill={index < rating ? colors.warning : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starContainer: {
    padding: 4,
  },
});