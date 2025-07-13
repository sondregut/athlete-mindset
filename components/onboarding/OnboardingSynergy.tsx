import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ArrowRight, Plus, Equal } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';

interface OnboardingSynergyProps {
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

export default function OnboardingSynergy({ step, onNext, onBack }: OnboardingSynergyProps) {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>Complete mental training system</Text>
          <Text style={styles.description}>Combine training intentions with guided visualizations to develop mental excellence alongside your physical training.</Text>
        </View>

        {/* Formula Display */}
        <View style={styles.formulaContainer}>
          <View style={styles.formulaItem}>
            <Text style={styles.formulaEmoji}>📝</Text>
            <Text style={styles.formulaLabel}>Training Intentions</Text>
          </View>
          
          <View style={styles.plusContainer}>
            <View style={styles.plusCircle}>
              <Plus size={20} color={colors.primary} />
            </View>
          </View>
          
          <View style={styles.formulaItem}>
            <Text style={styles.formulaEmoji}>🧠</Text>
            <Text style={styles.formulaLabel}>Mental Visualizations</Text>
          </View>
          
          <View style={styles.equalsContainer}>
            <Equal size={24} color={colors.primary} />
          </View>
          
          <View style={[styles.formulaItem, styles.resultItem]}>
            <Text style={styles.formulaEmoji}>🏆</Text>
            <Text style={styles.formulaLabel}>Mental Excellence</Text>
          </View>
        </View>


        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why This Works</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <ArrowRight size={16} color={colors.primary} />
              <Text style={styles.benefitText}>
                Pre-training intentions prime your mind for success
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <ArrowRight size={16} color={colors.primary} />
              <Text style={styles.benefitText}>
                Post-training reflections build self-awareness
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <ArrowRight size={16} color={colors.primary} />
              <Text style={styles.benefitText}>
                Visualizations strengthen mental pathways
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <ArrowRight size={16} color={colors.primary} />
              <Text style={styles.benefitText}>
                Track your complete mental training journey
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Personalize Your Experience"
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
  formulaContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  formulaItem: {
    alignItems: 'center',
    marginVertical: 8,
  },
  resultItem: {
    backgroundColor: `${colors.success}10`,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${colors.success}30`,
  },
  formulaEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  formulaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  plusContainer: {
    marginVertical: 8,
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equalsContainer: {
    marginVertical: 12,
  },
  routineCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  dayContainer: {
    marginBottom: 20,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dayActivities: {
    gap: 8,
    paddingLeft: 8,
  },
  activity: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  activityText: {
    fontSize: 14,
    color: colors.darkGray,
    flex: 1,
    lineHeight: 20,
  },
  benefitsCard: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
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