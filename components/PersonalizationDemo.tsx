import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePersonalizedVisualization } from '@/hooks/usePersonalizedVisualization';
import { Visualization } from '@/types/visualization';
import Card from './Card';

interface PersonalizationDemoProps {
  visualization: Visualization;
}

export default function PersonalizationDemo({ visualization }: PersonalizationDemoProps) {
  const colors = useThemeColors();
  const {
    personalizedSteps,
    isGenerating,
    error,
    regenerate,
    stats,
  } = usePersonalizedVisualization(visualization, {
    contextualFactors: {
      timeOfDay: 'morning',
      location: 'home',
      currentMood: 'motivated',
    },
  });

  const styles = StyleSheet.create({
    container: {
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    regenerateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: `${colors.primary}15`,
      borderRadius: 20,
    },
    regenerateText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
    contentContainer: {
      gap: 12,
    },
    stepCard: {
      marginBottom: 12,
    },
    stepContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.background,
    },
    stepTextContainer: {
      flex: 1,
    },
    stepText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    originalText: {
      fontSize: 13,
      color: colors.darkGray,
      fontStyle: 'italic',
      marginTop: 8,
      lineHeight: 18,
    },
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.darkGray,
      marginTop: 12,
    },
    errorContainer: {
      padding: 20,
      backgroundColor: `${colors.error}10`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${colors.error}20`,
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
      textAlign: 'center',
    },
    statsContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    statLabel: {
      fontSize: 14,
      color: colors.darkGray,
    },
    statValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personalized for You</Text>
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={regenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <RefreshCw size={16} color={colors.primary} />
          )}
          <Text style={styles.regenerateText}>
            {isGenerating ? 'Generating...' : 'Regenerate'}
          </Text>
        </TouchableOpacity>
      </View>

      {isGenerating && !personalizedSteps && (
        <View style={styles.loadingContainer}>
          <Sparkles size={48} color={colors.primary} />
          <Text style={styles.loadingText}>
            Creating your personalized visualization...
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {personalizedSteps && (
        <View style={styles.contentContainer}>
          {personalizedSteps.map((step, index) => (
            <Card key={step.id} style={styles.stepCard}>
              <View style={styles.stepContent}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepText}>{step.content}</Text>
                  {visualization.steps[index] && (
                    <Text style={styles.originalText}>
                      Original: {visualization.steps[index].content}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Personalization Stats</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Requests:</Text>
            <Text style={styles.statValue}>{stats.totalRequests}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cache Hit Rate:</Text>
            <Text style={styles.statValue}>
              {stats.apiCalls > 0
                ? `${Math.round((stats.cacheHits / stats.totalRequests) * 100)}%`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>API Calls:</Text>
            <Text style={styles.statValue}>{stats.apiCalls}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tokens Used:</Text>
            <Text style={styles.statValue}>{stats.totalTokensUsed}</Text>
          </View>
        </View>
      )}
    </View>
  );
}