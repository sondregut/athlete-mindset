import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

interface SimpleSportSelectProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  selectedSport: string;
  onSelectSport: (sport: string) => void;
}

const SPORTS = [
  'Soccer',
  'Basketball',
  'Tennis',
  'Swimming',
  'Running',
  'Cycling',
  'Golf',
  'Baseball',
  'Football',
  'Volleyball',
  'Track & Field',
  'Martial Arts',
  'Hockey',
  'Gymnastics',
  'Other',
];

export default function SimpleSportSelect({
  onNext,
  onBack,
  onSkip,
  selectedSport,
  onSelectSport,
}: SimpleSportSelectProps) {
  const handleNext = () => {
    if (selectedSport) {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>What's your sport?</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your mental training
        </Text>

        <ScrollView 
          style={styles.sportsContainer}
          showsVerticalScrollIndicator={false}
        >
          {SPORTS.map((sport) => (
            <TouchableOpacity
              key={sport}
              style={[
                styles.sportOption,
                selectedSport === sport && styles.sportOptionSelected,
              ]}
              onPress={() => onSelectSport(sport)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sportText,
                  selectedSport === sport && styles.sportTextSelected,
                ]}
              >
                {sport}
              </Text>
              {selectedSport === sport && (
                <Check size={20} color={colors.background} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <OnboardingButton
          title="Continue"
          onPress={handleNext}
          disabled={!selectedSport}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
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
    marginBottom: 32,
  },
  sportsContainer: {
    flex: 1,
  },
  sportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    marginBottom: 12,
  },
  sportOptionSelected: {
    backgroundColor: colors.primary,
  },
  sportText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  sportTextSelected: {
    color: colors.background,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
});