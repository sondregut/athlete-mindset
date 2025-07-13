import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';
import { PersonalizationProfile } from '@/types/personalization-profile';

interface PersonalizationSportProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  profile: Partial<PersonalizationProfile>;
  updateProfile: (updates: Partial<PersonalizationProfile>) => void;
}

const popularSports = [
  'Running', 'Basketball', 'Soccer', 'Tennis', 'Swimming',
  'Weightlifting', 'CrossFit', 'Yoga', 'Golf', 'Cycling',
  'Track & Field', 'Baseball', 'Football', 'Volleyball',
  'Boxing', 'MMA', 'Dance', 'Gymnastics', 'Hockey', 'Skiing'
];

export default function PersonalizationSport({ 
  onNext, 
  onBack, 
  onSkip,
  profile,
  updateProfile 
}: PersonalizationSportProps) {
  const [sport, setSport] = useState(profile.sport_activity || '');
  const [role, setRole] = useState(profile.specific_role || '');
  const [showRole, setShowRole] = useState(false);

  const handleContinue = () => {
    updateProfile({
      sport_activity: sport.trim(),
      specific_role: role.trim() || undefined,
    });
    onNext();
  };

  const selectSport = (selectedSport: string) => {
    setSport(selectedSport);
    updateProfile({ sport_activity: selectedSport });
    
    // Show role input for team sports
    const teamSports = ['Basketball', 'Soccer', 'Football', 'Baseball', 'Volleyball', 'Hockey'];
    setShowRole(teamSports.includes(selectedSport));
  };

  const isValid = sport.trim().length > 0;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>What's Your Sport?</Text>
          <Text style={styles.subtitle}>
            Tell us what you train for
          </Text>
        </View>

        {/* Text Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your sport or activity..."
            placeholderTextColor={colors.mediumGray}
            value={sport}
            onChangeText={setSport}
            autoFocus
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => {
              if (showRole) {
                // Focus on role input
              } else if (isValid) {
                handleContinue();
              }
            }}
          />
        </View>

        {/* Popular Sports */}
        <View style={styles.popularContainer}>
          <Text style={styles.popularTitle}>Popular choices:</Text>
          <View style={styles.sportsGrid}>
            {popularSports.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sportTag,
                  sport === s && styles.sportTagSelected,
                ]}
                onPress={() => selectSport(s)}
              >
                <Text style={[
                  styles.sportTagText,
                  sport === s && styles.sportTagTextSelected,
                ]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Role/Position Input (conditional) */}
        {showRole && (
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Position or role (optional):</Text>
            <TextInput
              style={styles.roleInput}
              placeholder="e.g., Point Guard, Midfielder, Pitcher..."
              placeholderTextColor={colors.mediumGray}
              value={role}
              onChangeText={setRole}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (isValid) handleContinue();
              }}
            />
          </View>
        )}

        {/* Examples */}
        <View style={styles.examplesContainer}>
          <Text style={styles.examplesText}>
            Examples: Marathon Running • Powerlifting • Triathlon • 
            Rock Climbing • Martial Arts • Pilates • Surfing
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          disabled={!isValid}
          style={styles.primaryButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    fontSize: 18,
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  popularContainer: {
    marginBottom: 32,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sportTag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportTagSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  sportTagText: {
    fontSize: 14,
    color: colors.text,
  },
  sportTagTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  roleContainer: {
    marginBottom: 32,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  roleInput: {
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBackground,
  },
  examplesContainer: {
    marginBottom: 20,
  },
  examplesText: {
    fontSize: 14,
    color: colors.mediumGray,
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
});