import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Brain, Heart, Target } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

interface OnboardingPhilosophyProps {
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

const philosophyPoints = [
  {
    icon: <Brain size={24} color={colors.primary} />,
    title: 'Mental Performance',
    description: 'Your mindset directly impacts your physical performance and results.',
  },
  {
    icon: <Heart size={24} color={colors.secondary} />,
    title: 'Self-Awareness',
    description: 'Understanding your mental patterns helps you train more effectively.',
  },
  {
    icon: <Target size={24} color={colors.success} />,
    title: 'Intentional Training',
    description: 'Setting clear intentions before training maximizes focus and outcomes.',
  },
];

export default function OnboardingPhilosophy({ step, onNext, onBack }: OnboardingPhilosophyProps) {
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

        {/* Philosophy Points */}
        <View style={styles.pointsContainer}>
          {philosophyPoints.map((point, index) => (
            <View key={index} style={styles.point}>
              <View style={styles.pointIcon}>
                {point.icon}
              </View>
              <View style={styles.pointContent}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointDescription}>{point.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
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
    paddingBottom: 40,
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
  pointsContainer: {
    gap: 24,
    paddingBottom: 20,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pointContent: {
    flex: 1,
    paddingTop: 4,
  },
  pointTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  pointDescription: {
    fontSize: 15,
    color: colors.darkGray,
    lineHeight: 21,
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