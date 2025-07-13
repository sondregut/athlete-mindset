import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Rocket, Calendar, Brain, CheckCircle, Timer } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import { router } from 'expo-router';

interface OnboardingTutorialProps {
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

export default function OnboardingTutorial({ step, onNext, onBack }: OnboardingTutorialProps) {
  const { setCompletedTutorial } = useOnboardingStore();
  const [selectedTutorial, setSelectedTutorial] = useState<'training' | 'visualization' | null>(null);

  const handleTryTraining = () => {
    setSelectedTutorial('training');
    setCompletedTutorial(true);
    // Navigate to log session with tutorial mode
    router.push({
      pathname: '/log-session',
      params: { tutorialMode: 'true' }
    });
  };

  const handleTryVisualization = () => {
    setSelectedTutorial('visualization');
    setCompletedTutorial(true);
    // Navigate to mental training
    router.push('/(tabs)/mental-training');
  };

  const handleSkip = () => {
    setCompletedTutorial(false);
    onNext();
  };

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

        {/* Tutorial Options */}
        <View style={styles.tutorialContainer}>
          {/* Training Tutorial Card */}
          <TouchableOpacity 
            style={[styles.tutorialCard, selectedTutorial === 'training' && styles.selectedCard]}
            onPress={handleTryTraining}
          >
            <View style={styles.cardIcon}>
              <Calendar size={32} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Quick Training Log</Text>
            <Text style={styles.cardDescription}>
              Log a 2-minute mini session to see how the 4-step process works
            </Text>
            <View style={styles.stepsPreview}>
              <View style={styles.stepItem}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>Setup session type</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>Set intention</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>Quick timer</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepDot} />
                <Text style={styles.stepText}>Reflect & save</Text>
              </View>
            </View>
            <View style={styles.tryButton}>
              <Text style={styles.tryButtonText}>Try It Now</Text>
              <Timer size={16} color={colors.background} />
            </View>
          </TouchableOpacity>

          {/* Visualization Tutorial Card */}
          <TouchableOpacity 
            style={[styles.tutorialCard, selectedTutorial === 'visualization' && styles.selectedCard]}
            onPress={handleTryVisualization}
          >
            <View style={styles.cardIcon}>
              <Brain size={32} color={colors.secondary} />
            </View>
            <Text style={styles.cardTitle}>1-Minute Visualization</Text>
            <Text style={styles.cardDescription}>
              Experience a quick confidence-building visualization with AI narration
            </Text>
            <View style={styles.benefitsPreview}>
              <Text style={styles.benefitItem}>✓ Hear your selected voice</Text>
              <Text style={styles.benefitItem}>✓ Feel the calming effects</Text>
              <Text style={styles.benefitItem}>✓ Build mental strength</Text>
            </View>
            <View style={[styles.tryButton, { backgroundColor: colors.secondary }]}>
              <Text style={styles.tryButtonText}>Try It Now</Text>
              <Rocket size={16} color={colors.background} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Skip Option */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>I'll explore on my own</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
          onPress={handleSkip}
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
  tutorialContainer: {
    gap: 16,
    marginBottom: 24,
  },
  tutorialCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  stepsPreview: {
    gap: 8,
    marginBottom: 20,
    paddingLeft: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  stepText: {
    fontSize: 14,
    color: colors.text,
  },
  benefitsPreview: {
    gap: 8,
    marginBottom: 20,
    paddingLeft: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  tryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
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