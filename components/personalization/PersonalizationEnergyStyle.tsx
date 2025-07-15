import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';
import { PersonalizationProfile, PreferredEnergyStyle, energyStyleOptions } from '@/types/personalization-profile';

interface PersonalizationEnergyStyleProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  profile: Partial<PersonalizationProfile>;
  updateProfile: (updates: Partial<PersonalizationProfile>) => void;
}

export default function PersonalizationEnergyStyle({ 
  onNext, 
  onBack, 
  onSkip,
  profile,
  updateProfile 
}: PersonalizationEnergyStyleProps) {
  const [selectedStyle, setSelectedStyle] = useState<PreferredEnergyStyle | undefined>(
    profile.preferred_style
  );

  const handleSelect = (style: PreferredEnergyStyle) => {
    setSelectedStyle(style);
    updateProfile({ preferred_style: style });
  };

  const handleContinue = () => {
    if (selectedStyle) {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Energy Style</Text>
          <Text style={styles.subtitle}>
            How do you like to get in the zone?
          </Text>
          <Text style={styles.description}>
            We'll match our visualizations to your preferred mental state
          </Text>
        </View>

        {/* Energy Style Options */}
        <View style={styles.optionsContainer}>
          {energyStyleOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.styleCard,
                selectedStyle === option.value && styles.styleCardSelected,
              ]}
              onPress={() => handleSelect(option.value)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: `${option.color}20` },
                selectedStyle === option.value && styles.iconContainerSelected,
              ]}>
                <Text style={styles.icon}>{option.icon}</Text>
              </View>
              
              <View style={styles.contentContainer}>
                <Text style={[
                  styles.styleTitle,
                  selectedStyle === option.value && styles.styleTitleSelected,
                ]}>
                  {option.label}
                </Text>
              </View>

              {/* Visual indicator */}
              <View style={styles.visualIndicator}>
                <View style={[
                  styles.energyBar,
                  { backgroundColor: option.color },
                  option.value === 'calm-peaceful' && styles.energyBarCalm,
                  option.value === 'high-energy' && styles.energyBarHigh,
                  option.value === 'laser-focused' && styles.energyBarFocused,
                  option.value === 'strong-powerful' && styles.energyBarPowerful,
                ]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview Text */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Example voice style:</Text>
          <Text style={[styles.previewText, { fontStyle: 'italic' }]}>
            {selectedStyle === 'calm-peaceful' && 
              '"Take a deep breath... Feel yourself becoming centered and peaceful..."'}
            {selectedStyle === 'high-energy' && 
              '"Let\'s GO! Feel that energy building! You\'re ready to CRUSH this!"'}
            {selectedStyle === 'laser-focused' && 
              '"Lock in. Zero distractions. Complete focus on your target..."'}
            {selectedStyle === 'strong-powerful' && 
              '"Feel your strength. You are powerful. Unstoppable. Dominant."'}
            {!selectedStyle && 
              'Select a style to see an example'}
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Complete Setup"
          onPress={handleContinue}
          disabled={!selectedStyle}
          style={styles.primaryButton}
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
    fontSize: 18,
    color: colors.primary,
    marginBottom: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
    paddingBottom: 24,
  },
  styleCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border,
  },
  styleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
  },
  iconContainerSelected: {
    transform: [{ scale: 1.1 }],
  },
  icon: {
    fontSize: 28,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  styleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  styleTitleSelected: {
    color: colors.primary,
  },
  visualIndicator: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  energyBar: {
    height: '100%',
    borderRadius: 4,
  },
  energyBarCalm: {
    width: '25%',
  },
  energyBarHigh: {
    width: '100%',
  },
  energyBarFocused: {
    width: '75%',
  },
  energyBarPowerful: {
    width: '90%',
  },
  previewContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 22,
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
});