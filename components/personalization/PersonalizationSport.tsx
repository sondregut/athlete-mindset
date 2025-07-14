import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronRight, Search } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { TrackFieldEvent, trackFieldEventOptions } from '@/store/user-store';

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
  const [showTrackFieldEvents, setShowTrackFieldEvents] = useState(sport === 'Track & Field');
  const [selectedTrackEvent, setSelectedTrackEvent] = useState<TrackFieldEvent | undefined>();
  const [trackEventSearch, setTrackEventSearch] = useState('');

  const handleContinue = () => {
    updateProfile({
      sport_activity: sport.trim(),
      specific_role: showTrackFieldEvents && selectedTrackEvent ? selectedTrackEvent : (role.trim() || undefined),
    });
    onNext();
  };

  const selectSport = (selectedSport: string) => {
    setSport(selectedSport);
    updateProfile({ sport_activity: selectedSport });
    
    // Show track field events for Track & Field
    setShowTrackFieldEvents(selectedSport === 'Track & Field');
    
    // Show role input for team sports
    const teamSports = ['Basketball', 'Soccer', 'Football', 'Baseball', 'Volleyball', 'Hockey'];
    setShowRole(teamSports.includes(selectedSport) && selectedSport !== 'Track & Field');
    
    // Reset selections when changing sport
    if (selectedSport !== 'Track & Field') {
      setSelectedTrackEvent(undefined);
      setTrackEventSearch('');
    }
  };

  const isValid = sport.trim().length > 0 && (!showTrackFieldEvents || selectedTrackEvent);
  
  // Filter track events based on search
  const filteredTrackEvents = showTrackFieldEvents ? trackFieldEventOptions.filter(event =>
    event.label.toLowerCase().includes(trackEventSearch.toLowerCase()) ||
    event.category.toLowerCase().includes(trackEventSearch.toLowerCase())
  ) : [];
  
  // Group events by category
  const eventsByCategory = filteredTrackEvents.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof trackFieldEventOptions>);

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

        {/* Track & Field Event Selection */}
        {showTrackFieldEvents && (
          <View style={styles.trackFieldContainer}>
            <Text style={styles.trackFieldTitle}>Select Your Event</Text>
            <Text style={styles.trackFieldSubtitle}>Choose your primary track and field discipline</Text>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={20} color={colors.darkGray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                placeholderTextColor={colors.darkGray}
                value={trackEventSearch}
                onChangeText={setTrackEventSearch}
              />
            </View>
            
            {/* Events by Category */}
            {Object.entries(eventsByCategory).map(([category, events]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.eventsGrid}>
                  {events.map((event) => (
                    <TouchableOpacity
                      key={event.value}
                      style={[
                        styles.eventOption,
                        selectedTrackEvent === event.value && styles.eventOptionSelected
                      ]}
                      onPress={() => setSelectedTrackEvent(event.value)}
                    >
                      <Text style={styles.eventIcon}>{event.icon}</Text>
                      <Text style={[
                        styles.eventLabel,
                        selectedTrackEvent === event.value && styles.eventLabelSelected
                      ]}>
                        {event.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
        
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
  trackFieldContainer: {
    marginBottom: 32,
  },
  trackFieldTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  trackFieldSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  eventOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightGray,
  },
  eventOptionSelected: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  eventIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  eventLabel: {
    fontSize: 14,
    color: colors.text,
  },
  eventLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});