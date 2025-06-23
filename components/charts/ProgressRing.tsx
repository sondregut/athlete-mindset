import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  centerContent?: React.ReactNode;
  animated?: boolean;
}

export default function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
  color = colors.primary,
  backgroundColor = colors.lightGray,
  showPercentage = true,
  centerContent,
  animated = false,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);
  const percentage = Math.round(progress * 100);

  // Create simplified progress ring using multiple Views
  const numSegments = 20;
  const segmentAngle = 360 / numSegments;
  const progressSegments = Math.floor(progress * numSegments);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]}
      />
      
      {/* Progress segments */}
      {Array.from({ length: progressSegments }, (_, index) => {
        const angle = (index * segmentAngle - 90) * (Math.PI / 180); // Start from top
        const innerRadius = (size - strokeWidth * 2) / 2;
        const outerRadius = size / 2;
        
        return (
          <View
            key={index}
            style={[
              styles.progressSegment,
              {
                position: 'absolute',
                left: size / 2 - strokeWidth / 2,
                top: strokeWidth / 2,
                width: strokeWidth,
                height: innerRadius,
                backgroundColor: color,
                transformOrigin: `50% ${innerRadius}px`,
                transform: [{ rotate: `${index * segmentAngle}deg` }],
              }
            ]}
          />
        );
      })}
      
      <View style={styles.centerContent}>
        {centerContent || (showPercentage && (
          <Text style={[styles.percentageText, { fontSize: size * 0.2 }]}>
            {percentage}%
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  ring: {
    position: 'absolute',
  },
  progressSegment: {
    borderRadius: 1,
  },
});