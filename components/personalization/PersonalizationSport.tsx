import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, FlatList, Keyboard, Pressable, TouchableWithoutFeedback } from 'react-native';
import { ChevronRight, Search } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';
import { PersonalizationProfile } from '@/types/personalization-profile';
import { TrackFieldEvent, trackFieldEventOptions } from '@/store/user-store';
import { SportItem, searchSports } from '@/constants/sportsList';

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
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownResults, setDropdownResults] = useState<SportItem[]>([]);
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState(-1);
  const inputRef = useRef<TextInput>(null);
  const dropdownRef = useRef<View>(null);

  // Handle search input changes
  useEffect(() => {
    if (sport.trim().length > 0) {
      const results = searchSports(sport);
      setDropdownResults(results);
      setShowDropdown(results.length > 0);
      setSelectedDropdownIndex(-1);
    } else {
      setShowDropdown(false);
      setDropdownResults([]);
    }
  }, [sport]);

  const handleContinue = () => {
    updateProfile({
      sport_activity: sport.trim(),
      specific_role: showTrackFieldEvents && selectedTrackEvent ? selectedTrackEvent : (role.trim() || undefined),
    });
    onNext();
  };

  const handleSelectFromDropdown = (item: SportItem) => {
    console.log('Selecting sport:', item.label);
    
    // If it's a track event, automatically set up the track field selection
    if (item.isTrackEvent && item.trackEventValue) {
      setSport('Track & Field');
      updateProfile({ sport_activity: 'Track & Field' });
      setShowTrackFieldEvents(true);
      setSelectedTrackEvent(item.trackEventValue as TrackFieldEvent);
      setTrackEventSearch('');
      // Don't show role input for track events
      setShowRole(false);
    } else {
      selectSport(item.value);
    }
    
    setShowDropdown(false);
    setDropdownResults([]);
    Keyboard.dismiss();
  };

  // Note: Keyboard navigation is not fully supported on React Native
  // This is primarily for web compatibility
  const handleInputKeyPress = (e: any) => {
    if (Platform.OS === 'web') {
      if (e.nativeEvent.key === 'ArrowDown') {
        setSelectedDropdownIndex(prev => 
          prev < dropdownResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.nativeEvent.key === 'ArrowUp') {
        setSelectedDropdownIndex(prev => prev > 0 ? prev - 1 : -1);
      } else if (e.nativeEvent.key === 'Enter' && selectedDropdownIndex >= 0) {
        handleSelectFromDropdown(dropdownResults[selectedDropdownIndex]);
      }
    }
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
    <TouchableWithoutFeedback onPress={() => {
      if (showDropdown) {
        setShowDropdown(false);
        Keyboard.dismiss();
      }
    }}>
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

        {/* Text Input with Dropdown */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type your sport or activity..."
            placeholderTextColor={colors.mediumGray}
            value={sport}
            onChangeText={setSport}
            autoCapitalize="words"
            returnKeyType="next"
            onFocus={() => {
              if (sport.trim().length > 0 && dropdownResults.length > 0) {
                setShowDropdown(true);
              }
            }}
            onKeyPress={handleInputKeyPress}
            onSubmitEditing={() => {
              if (showRole) {
                // Focus on role input
              } else if (isValid) {
                handleContinue();
              }
            }}
          />
          
          {/* Dropdown */}
          {showDropdown && dropdownResults.length > 0 && (
            <TouchableWithoutFeedback>
              <View style={styles.dropdown}>
                <ScrollView 
                  style={styles.dropdownScroll} 
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {dropdownResults.map((item, index) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dropdownItem,
                        selectedDropdownIndex === index && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        console.log('Dropdown item pressed:', item.label, 'isTrackEvent:', item.isTrackEvent);
                        handleSelectFromDropdown(item);
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 5, bottom: 5, left: 10, right: 10 }}
                    >
                      {item.icon && (
                        <Text style={styles.dropdownIcon}>{item.icon}</Text>
                      )}
                      <Text 
                        style={[
                          styles.dropdownText,
                          selectedDropdownIndex === index && styles.dropdownTextSelected
                        ]}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          )}
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
    </TouchableWithoutFeedback>
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
    position: 'relative',
    zIndex: 10,
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
    maxHeight: 300,
  },
  dropdownScroll: {
    borderRadius: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 48,
  },
  dropdownItemSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  dropdownIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dropdownTextSelected: {
    color: colors.primary,
    fontWeight: '600',
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