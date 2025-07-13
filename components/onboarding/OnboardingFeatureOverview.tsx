import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Calendar, Brain, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

const { width } = Dimensions.get('window');

interface OnboardingFeatureOverviewProps {
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

export default function OnboardingFeatureOverview({ step, onNext, onBack }: OnboardingFeatureOverviewProps) {
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
        </View>

        {/* Split Features Display */}
        <View style={styles.featuresContainer}>
          {/* Training Logger Feature */}
          <View style={[styles.featureCard, styles.trainingCard]}>
            <View style={styles.featureIconWrapper}>
              <Calendar size={32} color={colors.primary} />
            </View>
            <Text style={styles.featureTitle}>Track Your Training</Text>
            <Text style={styles.featureDescription}>
              Log every workout with our unique 4-step process
            </Text>
            <View style={styles.featurePoints}>
              <Text style={styles.featurePoint}>• Pre-training intentions</Text>
              <Text style={styles.featurePoint}>• Session timer</Text>
              <Text style={styles.featurePoint}>• Post-training reflection</Text>
              <Text style={styles.featurePoint}>• Progress analytics</Text>
            </View>
          </View>

          {/* Visualization Feature */}
          <View style={[styles.featureCard, styles.visualizationCard]}>
            <View style={styles.featureIconWrapper}>
              <Brain size={32} color={colors.secondary} />
            </View>
            <Text style={styles.featureTitle}>Train Your Mind</Text>
            <Text style={styles.featureDescription}>
              AI-powered visualization exercises for athletes
            </Text>
            <View style={styles.featurePoints}>
              <Text style={styles.featurePoint}>• Guided visualizations</Text>
              <Text style={styles.featurePoint}>• 6 natural AI voices</Text>
              <Text style={styles.featurePoint}>• Build confidence</Text>
              <Text style={styles.featurePoint}>• Enhance focus</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Learn More"
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
    lineHeight: 22,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
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
    borderWidth: 1,
  },
  trainingCard: {
    borderColor: `${colors.primary}30`,
    backgroundColor: `${colors.primary}05`,
  },
  visualizationCard: {
    borderColor: `${colors.secondary}30`,
    backgroundColor: `${colors.secondary}05`,
  },
  featureIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  featurePoints: {
    gap: 6,
  },
  featurePoint: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
});