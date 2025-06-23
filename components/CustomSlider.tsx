import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '@/constants/colors';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  style?: any;
}

export default function CustomSlider({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  minimumTrackTintColor = colors.primary,
  maximumTrackTintColor = colors.mediumGray,
  thumbTintColor = colors.primary,
  style
}: CustomSliderProps) {
  const range = maximumValue - minimumValue;
  const percentage = ((value - minimumValue) / range) * 100;
  
  const handlePress = (index: number) => {
    const newValue = minimumValue + (index * step);
    if (newValue >= minimumValue && newValue <= maximumValue) {
      onValueChange(newValue);
    }
  };

  // Create buttons for each step
  const steps = [];
  for (let i = minimumValue; i <= maximumValue; i += step) {
    steps.push(i);
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.trackContainer}>
        <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]} />
        <View 
          style={[
            styles.activeTrack, 
            { 
              backgroundColor: minimumTrackTintColor,
              width: `${percentage}%`
            }
          ]} 
        />
        <View 
          style={[
            styles.thumb, 
            { 
              backgroundColor: thumbTintColor,
              left: `${percentage}%`
            }
          ]} 
        />
      </View>
      
      <View style={styles.buttonsContainer}>
        {steps.map((stepValue) => (
          <TouchableOpacity
            key={stepValue}
            style={[
              styles.stepButton,
              stepValue === value && styles.activeStepButton
            ]}
            onPress={() => onValueChange(stepValue)}
          >
            <Text style={[
              styles.stepButtonText,
              stepValue === value && styles.activeStepButtonText
            ]}>
              {stepValue}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  trackContainer: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
  activeTrack: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: '50%',
    marginTop: -2,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    marginLeft: -10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  stepButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    marginHorizontal: 2,
    marginVertical: 2,
    minWidth: 40,
    alignItems: 'center',
  },
  activeStepButton: {
    backgroundColor: colors.primary,
  },
  stepButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  activeStepButtonText: {
    color: colors.background,
  },
});