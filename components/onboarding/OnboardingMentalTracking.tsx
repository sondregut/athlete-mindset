import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, Target, CheckCircle, TrendingUp } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

interface OnboardingMentalTrackingProps {
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

export default function OnboardingMentalTracking({ step, onNext, onBack }: OnboardingMentalTrackingProps) {
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

        {/* Main Feature Card */}
        <View style={styles.featureCard}>
          <View style={styles.featureIconWrapper}>
            <Calendar size={32} color={colors.primary} />
          </View>
          <Text style={styles.featureTitle}>Mental Game Sessions</Text>
          <Text style={styles.featureDescription}>
            Track the mental aspects of every training session
          </Text>
          
          {/* Key Features */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Target size={20} color={colors.primary} />
              <View style={styles.featureContent}>
                <Text style={styles.featureItemTitle}>Pre-Training Intentions</Text>
                <Text style={styles.featureItemText}>Set your mindset and focus areas</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <CheckCircle size={20} color={colors.success} />
              <View style={styles.featureContent}>
                <Text style={styles.featureItemTitle}>Post-Training Reflection</Text>
                <Text style={styles.featureItemText}>Note what went well and what to improve</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <TrendingUp size={20} color={colors.secondary} />
              <View style={styles.featureContent}>
                <Text style={styles.featureItemTitle}>Mental Progress Tracking</Text>
                <Text style={styles.featureItemText}>See patterns in your mental game</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Track Your Mental Game?</Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>• Build self-awareness of mental patterns</Text>
            <Text style={styles.benefitItem}>• Identify what mindsets lead to peak performance</Text>
            <Text style={styles.benefitItem}>• Develop mental resilience over time</Text>
            <Text style={styles.benefitItem}>• Create a complete picture of your training</Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Next"
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
  featureCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
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
  featureIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresGrid: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureItemText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  benefitsSection: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 15,
    color: colors.text,
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