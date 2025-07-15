import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronRight, ArrowLeft } from 'lucide-react-native';
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

type Step = 'sport-selection' | 'track-field-events';

export default function PersonalizationSport({ 
  onNext, 
  onBack, 
  onSkip,
  profile,
  updateProfile 
}: PersonalizationSportProps) {
  const [currentStep, setCurrentStep] = useState<Step>('sport-selection');
  const [selectedSport, setSelectedSport] = useState(profile.sport_activity || '');
  const [selectedTrackEvent, setSelectedTrackEvent] = useState<TrackFieldEvent | undefined>(
    profile.specific_role as TrackFieldEvent
  );

  const handleSportSelection = (sport: string) => {
    setSelectedSport(sport);
    
    if (sport === 'Track & Field') {
      // Move to track field events step
      setCurrentStep('track-field-events');
    } else {
      // For "Other", complete the selection immediately
      updateProfile({
        sport_activity: sport,
        specific_role: undefined,
      });
      onNext();
    }
  };

  const handleTrackEventSelection = (event: TrackFieldEvent) => {
    setSelectedTrackEvent(event);
    
    // Complete the selection
    updateProfile({
      sport_activity: 'Track & Field',
      specific_role: event,
    });
    onNext();
  };

  const handleBackToSportSelection = () => {
    setCurrentStep('sport-selection');
    setSelectedTrackEvent(undefined);
  };

  // Group events by category
  const eventsByCategory = trackFieldEventOptions.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof trackFieldEventOptions>);

  if (currentStep === 'sport-selection') {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>What's Your Sport?</Text>
            <Text style={styles.subtitle}>
              Choose your primary athletic focus
            </Text>
          </View>

          {/* Sport Selection Buttons */}
          <View style={styles.sportOptionsContainer}>
            <TouchableOpacity
              style={styles.sportOptionCard}
              onPress={() => handleSportSelection('Track & Field')}
              activeOpacity={0.7}
            >
              <View style={styles.sportOptionContent}>
                <Text style={styles.sportOptionIcon}>🏃</Text>
                <Text style={styles.sportOptionTitle}>Track & Field</Text>
                <Text style={styles.sportOptionSubtitle}>
                  Running, jumping, throwing events
                </Text>
              </View>
              <ChevronRight size={24} color={colors.darkGray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sportOptionCard}
              onPress={() => handleSportSelection('Other')}
              activeOpacity={0.7}
            >
              <View style={styles.sportOptionContent}>
                <Text style={styles.sportOptionIcon}>🏋️</Text>
                <Text style={styles.sportOptionTitle}>Other Sport</Text>
                <Text style={styles.sportOptionSubtitle}>
                  All other athletic activities
                </Text>
              </View>
              <ChevronRight size={24} color={colors.darkGray} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Track Field Events Step
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToSportSelection}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Select Your Event</Text>
          <Text style={styles.subtitle}>
            Choose your primary track and field discipline
          </Text>
        </View>

        {/* Events by Category */}
        {Object.entries(eventsByCategory).map(([category, events]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.eventsGrid}>
              {events.map((event) => (
                <TouchableOpacity
                  key={event.value}
                  style={styles.eventCard}
                  onPress={() => handleTrackEventSelection(event.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.eventIcon}>{event.icon}</Text>
                  <Text style={styles.eventLabel}>{event.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  sportOptionsContainer: {
    gap: 16,
  },
  sportOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sportOptionContent: {
    flex: 1,
  },
  sportOptionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sportOptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sportOptionSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  eventIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  eventLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
});