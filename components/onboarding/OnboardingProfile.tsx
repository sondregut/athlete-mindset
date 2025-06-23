import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useUserStore, sportOptions, experienceLevelOptions, SportType, ExperienceLevel, TrackFieldEvent } from '@/store/user-store';
import Button from '@/components/Button';
import OnboardingTrackField from './OnboardingTrackField';

interface OnboardingProfileProps {
  step: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
  };
  onNext: () => void;
  onBack: () => void;
}

export default function OnboardingProfile({ step, onNext, onBack }: OnboardingProfileProps) {
  const { profile } = useUserStore();
  
  // Local state for form data
  const [formData, setFormData] = useState({
    name: profile.name || '',
    age: profile.age?.toString() || '',
    sport: profile.sport || 'other' as SportType,
    trackFieldEvent: profile.trackFieldEvent,
    experienceLevel: profile.experienceLevel || 'beginner' as ExperienceLevel,
    preferredUnits: profile.preferredUnits || 'metric' as 'metric' | 'imperial',
  });

  const [errors, setErrors] = useState({
    name: '',
    age: '',
  });

  const [showTrackField, setShowTrackField] = useState(false);
  const [sportSearchQuery, setSportSearchQuery] = useState('');

  const validateForm = () => {
    const newErrors = { name: '', age: '' };
    let isValid = true;

    // Validate name (required)
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
      isValid = false;
    }

    // Validate age (optional, but if provided must be valid)
    if (formData.age && formData.age.trim()) {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 99) {
        newErrors.age = 'Age must be between 13 and 99';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateForm()) {
      // Check if track & field is selected but no event is chosen
      if (formData.sport === 'track-and-field' && !formData.trackFieldEvent) {
        setShowTrackField(true);
        return;
      }

      // Save form data to user store
      const profileUpdate: any = {
        name: formData.name.trim(),
        sport: formData.sport,
        experienceLevel: formData.experienceLevel,
        preferredUnits: formData.preferredUnits,
      };

      if (formData.age && formData.age.trim()) {
        profileUpdate.age = parseInt(formData.age);
      }

      if (formData.trackFieldEvent) {
        profileUpdate.trackFieldEvent = formData.trackFieldEvent;
      }

      // Update the profile in the store
      useUserStore.getState().updateProfile(profileUpdate);
      
      onNext();
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    // Clear errors when user starts typing
    if (updates.name !== undefined) setErrors(prev => ({ ...prev, name: '' }));
    if (updates.age !== undefined) setErrors(prev => ({ ...prev, age: '' }));
  };

  const handleSportSelect = (sport: SportType) => {
    if (sport === 'track-and-field') {
      setShowTrackField(true);
    }
    updateFormData({ sport, trackFieldEvent: undefined });
  };

  const handleTrackFieldEventSelect = (event: TrackFieldEvent) => {
    updateFormData({ trackFieldEvent: event });
    setShowTrackField(false);
  };

  const handleTrackFieldBack = () => {
    setShowTrackField(false);
    updateFormData({ sport: 'other' });
  };

  // Filter sports based on search query
  const filteredSports = sportOptions.filter(sport =>
    sport.label.toLowerCase().includes(sportSearchQuery.toLowerCase())
  );

  // Show track & field event selection screen
  if (showTrackField) {
    return (
      <OnboardingTrackField
        onSelectEvent={handleTrackFieldEventSelect}
        onBack={handleTrackFieldBack}
        selectedEvent={formData.trackFieldEvent}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your name? *</Text>
          <TextInput
            style={[styles.textInput, errors.name ? styles.inputError : null]}
            value={formData.name}
            onChangeText={(text) => updateFormData({ name: text })}
            placeholder="Enter your name"
            placeholderTextColor={colors.darkGray}
            maxLength={50}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        {/* Age Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age (optional)</Text>
          <TextInput
            style={[styles.textInput, errors.age ? styles.inputError : null]}
            value={formData.age}
            onChangeText={(text) => updateFormData({ age: text })}
            placeholder="Enter your age"
            placeholderTextColor={colors.darkGray}
            keyboardType="numeric"
            maxLength={2}
          />
          {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
        </View>

        {/* Sport Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Sport/Activity *</Text>
          <Text style={styles.sectionDescription}>
            What's your main training focus? Track & Field athletes will select their specific event next.
          </Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color={colors.darkGray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sports..."
              placeholderTextColor={colors.darkGray}
              value={sportSearchQuery}
              onChangeText={setSportSearchQuery}
            />
          </View>

          <ScrollView style={styles.sportScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.sportGrid}>
              {filteredSports.map((sport) => (
                <TouchableOpacity
                  key={sport.value}
                  style={[
                    styles.sportOption,
                    formData.sport === sport.value && styles.selectedSportOption
                  ]}
                  onPress={() => handleSportSelect(sport.value)}
                >
                  <Text style={styles.sportIcon}>{sport.icon}</Text>
                  <Text style={[
                    styles.sportLabel,
                    formData.sport === sport.value && styles.selectedSportLabel
                  ]}>
                    {sport.label}
                  </Text>
                  {sport.value === 'track-and-field' && formData.trackFieldEvent && (
                    <Text style={styles.selectedEventText}>
                      {formData.trackFieldEvent.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          <Text style={styles.sectionDescription}>
            How would you describe your training experience?
          </Text>
          <View style={styles.experienceOptions}>
            {experienceLevelOptions.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.experienceOption,
                  formData.experienceLevel === level.value && styles.selectedExperienceOption
                ]}
                onPress={() => updateFormData({ experienceLevel: level.value })}
              >
                <Text style={styles.experienceIcon}>{level.icon}</Text>
                <View style={styles.experienceContent}>
                  <Text style={[
                    styles.experienceTitle,
                    formData.experienceLevel === level.value && styles.selectedExperienceTitle
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={styles.experienceDescription}>{level.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferred Units */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Units</Text>
          <View style={styles.unitsContainer}>
            <TouchableOpacity
              style={[
                styles.unitOption,
                formData.preferredUnits === 'metric' && styles.selectedUnitOption
              ]}
              onPress={() => updateFormData({ preferredUnits: 'metric' })}
            >
              <Text style={[
                styles.unitText,
                formData.preferredUnits === 'metric' && styles.selectedUnitText
              ]}>
                Metric (kg, km)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitOption,
                formData.preferredUnits === 'imperial' && styles.selectedUnitOption
              ]}
              onPress={() => updateFormData({ preferredUnits: 'imperial' })}
            >
              <Text style={[
                styles.unitText,
                formData.preferredUnits === 'imperial' && styles.selectedUnitText
              ]}>
                Imperial (lbs, miles)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Continue"
          onPress={handleNext}
          style={styles.primaryButton}
        />
        <Button
          title="Back"
          onPress={onBack}
          variant="outline"
          style={styles.secondaryButton}
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
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 21,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 4,
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
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  sportScrollView: {
    maxHeight: 300,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedSportOption: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.selectedBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sportIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedSportLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  selectedEventText: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 4,
    fontStyle: 'italic',
  },
  experienceOptions: {
    gap: 12,
  },
  experienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedExperienceOption: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.selectedBackground,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  experienceIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  experienceContent: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  selectedExperienceTitle: {
    color: colors.primary,
  },
  experienceDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  unitsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  selectedUnitOption: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedUnitText: {
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