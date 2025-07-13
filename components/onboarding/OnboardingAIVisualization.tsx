import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Brain, Volume2, Sparkles, Headphones } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

interface OnboardingAIVisualizationProps {
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

export default function OnboardingAIVisualization({ step, onNext, onBack }: OnboardingAIVisualizationProps) {
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
            <Brain size={32} color={colors.secondary} />
          </View>
          <Text style={styles.featureTitle}>Guided Visualizations</Text>
          <Text style={styles.featureDescription}>
            Professional mental training exercises with AI narration
          </Text>
          
          {/* Key Features */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Sparkles size={20} color={colors.secondary} />
              <View style={styles.featureContent}>
                <Text style={styles.featureItemTitle}>AI-Powered Narration</Text>
                <Text style={styles.featureItemText}>6 natural voices to guide your practice</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Headphones size={20} color={colors.info} />
              <View style={styles.featureContent}>
                <Text style={styles.featureItemTitle}>5-8 Minute Sessions</Text>
                <Text style={styles.featureItemText}>Perfect length for daily mental training</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <Volume2 size={20} color={colors.success} />
              <View style={styles.featureContent}>
                <Text style={styles.featureItemTitle}>Personalized Experience</Text>
                <Text style={styles.featureItemText}>Choose your preferred voice and pace</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Visualization Types Preview */}
        <View style={styles.typesSection}>
          <Text style={styles.typesTitle}>Mental Training Library</Text>
          <View style={styles.typesList}>
            <View style={styles.typeItem}>
              <Text style={styles.typeEmoji}>💪</Text>
              <Text style={styles.typeText}>Confidence Building</Text>
            </View>
            <View style={styles.typeItem}>
              <Text style={styles.typeEmoji}>🎯</Text>
              <Text style={styles.typeText}>Performance Excellence</Text>
            </View>
            <View style={styles.typeItem}>
              <Text style={styles.typeEmoji}>🧘</Text>
              <Text style={styles.typeText}>Recovery & Letting Go</Text>
            </View>
            <View style={styles.typeItem}>
              <Text style={styles.typeEmoji}>🏆</Text>
              <Text style={styles.typeText}>Goal Visualization</Text>
            </View>
          </View>
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
    paddingBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.secondary}15`,
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
    color: colors.secondary,
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
    backgroundColor: `${colors.secondary}10`,
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
  typesSection: {
    marginBottom: 20,
  },
  typesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  typesList: {
    gap: 12,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
});