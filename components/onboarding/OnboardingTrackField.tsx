import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { trackFieldEventOptions, TrackFieldEvent } from '@/store/user-store';
import OnboardingButton from './OnboardingButton';

interface OnboardingTrackFieldProps {
  onSelectEvent: (event: TrackFieldEvent) => void;
  onBack: () => void;
  selectedEvent?: TrackFieldEvent;
}

export default function OnboardingTrackField({ onSelectEvent, onBack, selectedEvent }: OnboardingTrackFieldProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter events based on search query
  const filteredEvents = trackFieldEventOptions.filter(event =>
    event.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group events by category
  const eventsByCategory = filteredEvents.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof trackFieldEventOptions>);

  const categories = Object.keys(eventsByCategory);

  const handleContinue = () => {
    if (selectedEvent) {
      onSelectEvent(selectedEvent);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🏃</Text>
        </View>
        <Text style={styles.title}>Track & Field{'\n'}Events</Text>
        <Text style={styles.subtitle}>Select your primary event</Text>
        <Text style={styles.description}>
          Choose the track and field event you compete in or train for most often.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.darkGray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor={colors.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Events List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.eventsGrid}>
              {eventsByCategory[category].map((event) => (
                <TouchableOpacity
                  key={event.value}
                  style={[
                    styles.eventOption,
                    selectedEvent === event.value && styles.selectedEventOption
                  ]}
                  onPress={() => onSelectEvent(event.value)}
                >
                  <Text style={styles.eventIcon}>{event.icon}</Text>
                  <Text style={[
                    styles.eventLabel,
                    selectedEvent === event.value && styles.selectedEventLabel
                  ]}>
                    {event.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
          onPress={handleContinue}
          style={styles.primaryButton}
          disabled={!selectedEvent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  description: {
    fontSize: 15,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.mediumGray,
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
  content: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    backgroundColor: colors.background,
    minWidth: '45%',
    maxWidth: '48%',
  },
  selectedEventOption: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  eventIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  eventLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  selectedEventLabel: {
    color: colors.primary,
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    marginBottom: 0,
  },
});