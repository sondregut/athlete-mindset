import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PlayCircle, Target, Clock, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

interface OnboardingFeaturesProps {
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

const features = [
  {
    icon: <Target size={20} color={colors.background} />,
    title: 'Pre-Training Setup',
    description: 'Set intentions, choose mindset cues, and rate your readiness',
    color: colors.primary,
    number: '1',
  },
  {
    icon: <PlayCircle size={20} color={colors.background} />,
    title: 'Post-Training Reflection',
    description: 'Record what went well, rate your session, and set stretch goals',
    color: colors.secondary,
    number: '2',
  },
  {
    icon: <TrendingUp size={20} color={colors.background} />,
    title: 'Progress Analytics',
    description: 'Track streaks, analyze trends, and celebrate achievements',
    color: colors.success,
    number: '3',
  },
];

export default function OnboardingFeatures({ step, onNext, onBack }: OnboardingFeaturesProps) {
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

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.feature}>
              <View style={styles.featureLeft}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                  {feature.icon}
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
              <View style={[styles.featureNumber, { backgroundColor: `${feature.color}20` }]}>
                <Text style={[styles.featureNumberText, { color: feature.color }]}>
                  {feature.number}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Call to Action */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>
            Ready to start your mindful training journey?
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Set My Goals"
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
  featuresContainer: {
    gap: 20,
    paddingBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  featureNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  ctaContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 22,
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