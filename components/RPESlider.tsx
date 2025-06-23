import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '@/constants/colors';

interface RPESliderProps {
  title?: string;
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
}

export default function RPESlider({
  title = "Rate of Perceived Exertion (1-10)",
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 10,
  step = 1,
}: RPESliderProps) {
  // Generate scale labels
  const generateLabels = () => {
    const labels = [];
    for (let i = minimumValue; i <= maximumValue; i += step) {
      labels.push(i);
    }
    return labels;
  };

  const labels = generateLabels();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.sliderContainer}>
        {/* React Native Slider */}
        <Slider
          style={styles.slider}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          value={value}
          onValueChange={onValueChange}
          step={step}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.mediumGray}
        />
        
        {/* Scale labels */}
        <View style={styles.labelsContainer}>
          {labels.map((label, index) => (
            <Text key={label} style={styles.label}>
              {label}
            </Text>
          ))}
        </View>
        
        {/* Current value display */}
        <View style={styles.valueContainer}>
          <Text style={styles.currentValue}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
    color: colors.text,
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  thumb: {
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  currentValue: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
});