import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { Calendar, Target, Timer, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

interface OnboardingTrainingDemoProps {
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

const demoSteps = [
  {
    icon: <Calendar size={24} color={colors.primary} />,
    title: 'Step 1: Setup',
    content: [
      'Choose session type (Training, Competition)',
      'Select activity (e.g., "Weightlifting - Upper Body")',
      'Set your training date',
    ],
  },
  {
    icon: <Target size={24} color={colors.primary} />,
    title: 'Step 2: Pre-Training',
    content: [
      'Set your intention for the session',
      'Choose mindset cues (focused, confident, etc.)',
      'Rate your readiness level (1-10)',
    ],
  },
  {
    icon: <Timer size={24} color={colors.primary} />,
    title: 'Step 3: Active Session',
    content: [
      'Start the built-in timer',
      'Focus on your training',
      'Timer runs in background if needed',
    ],
  },
  {
    icon: <CheckCircle2 size={24} color={colors.primary} />,
    title: 'Step 4: Post-Training',
    content: [
      'List 3 things that went well',
      'Rate your session (1-5 stars)',
      'Set a stretch goal for next time',
      'Record RPE (Rate of Perceived Exertion)',
    ],
  },
];

export default function OnboardingTrainingDemo({ step, onNext, onBack }: OnboardingTrainingDemoProps) {
  const [activeStep, setActiveStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Change step
        setActiveStep((prev) => (prev + 1) % demoSteps.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

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

        {/* Interactive Demo */}
        <View style={styles.demoContainer}>
          <Text style={styles.demoTitle}>How It Works:</Text>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {demoSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === activeStep && styles.activeDot,
                  index < activeStep && styles.completedDot,
                ]}
              />
            ))}
          </View>

          {/* Animated Step Display */}
          <Animated.View style={[styles.stepDisplay, { opacity: fadeAnim }]}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIconWrapper}>
                {demoSteps[activeStep].icon}
              </View>
              <Text style={styles.stepTitle}>{demoSteps[activeStep].title}</Text>
            </View>
            
            <View style={styles.stepContent}>
              {demoSteps[activeStep].content.map((item, index) => (
                <View key={index} style={styles.contentItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.contentText}>{item}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Key Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Why This Matters:</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>📊</Text>
              <Text style={styles.benefitText}>Track both physical and mental aspects</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>🎯</Text>
              <Text style={styles.benefitText}>Build self-awareness through reflection</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitEmoji}>📈</Text>
              <Text style={styles.benefitText}>See patterns and improve over time</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Next: Mental Training"
          onPress={onNext}
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
  demoContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mediumGray,
  },
  activeDot: {
    backgroundColor: colors.primary,
    width: 24,
  },
  completedDot: {
    backgroundColor: colors.success,
  },
  stepDisplay: {
    minHeight: 160,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  stepContent: {
    gap: 10,
    paddingLeft: 8,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
    marginRight: 12,
  },
  contentText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    flex: 1,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitEmoji: {
    fontSize: 24,
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
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
});