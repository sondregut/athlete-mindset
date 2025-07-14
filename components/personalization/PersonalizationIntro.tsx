import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Sparkles, Brain, Target, Zap } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from '../onboarding/OnboardingButton';

interface PersonalizationIntroProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function PersonalizationIntro({ onNext, onSkip }: PersonalizationIntroProps) {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Sparkles size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Make It Personal</Text>
          <Text style={styles.subtitle}>
            Get AI-powered visualizations tailored specifically to your sport and goals
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Brain size={24} color={colors.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Sport-Specific Content</Text>
              <Text style={styles.benefitDescription}>
                Visualizations that speak your sport's language
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Target size={24} color={colors.secondary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Goal-Focused Training</Text>
              <Text style={styles.benefitDescription}>
                Mental exercises aligned with what matters to you
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <View style={styles.benefitIcon}>
              <Zap size={24} color={colors.success} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Your Energy Style</Text>
              <Text style={styles.benefitDescription}>
                Match the vibe that gets you in the zone
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Your information is stored locally and used only to personalize your experience
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Set It Up"
          onPress={onNext}
          style={styles.primaryButton}
        />
        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Set up later in settings</Text>
        </TouchableOpacity>
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 20,
  },
  privacyNote: {
    backgroundColor: `${colors.info}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
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
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.darkGray,
    textDecorationLine: 'underline',
  },
});