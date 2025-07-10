import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getVisualizationById } from '@/constants/visualizations';
import { useVisualizationStore } from '@/store/visualization-store';
import { Clock, Play, Trophy, Brain, ChevronLeft, Volume2, FastForward, Mic } from 'lucide-react-native';
import Card from '@/components/Card';
import VoiceSelectionModal from '@/components/VoiceSelectionModal';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { TTSVoice } from '@/services/tts-firebase-cache';

export default function VisualizationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { getVisualizationStats, startSession, preferences, updatePreferences } = useVisualizationStore();
  const [isStarting, setIsStarting] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  const visualization = getVisualizationById(id);
  const stats = getVisualizationStats(id);
  

  if (!visualization) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: 'Visualization Not Found' }} />
        <Text style={{ color: colors.text, textAlign: 'center', marginTop: 50, fontSize: 16 }}>
          Visualization not found
        </Text>
      </View>
    );
  }

  const handleStartVisualization = async () => {
    if (isStarting) return;
    
    setIsStarting(true);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Start session first
    startSession(visualization.id);
    
    // Small delay to ensure smooth transition
    setTimeout(() => {
      router.push({
        pathname: '/visualization-player',
        params: { id: visualization.id }
      });
    }, 100);
  };

  const handleVoiceSelect = (voice: TTSVoice) => {
    updatePreferences({ ttsVoice: voice });
    setShowVoiceModal(false);
  };

  const getVoiceLabel = (voice: TTSVoice) => {
    const voiceLabels = {
      'nova': 'Nova',
      'alloy': 'Alloy', 
      'echo': 'Echo',
      'fable': 'Fable',
      'onyx': 'Onyx',
      'shimmer': 'Shimmer'
    };
    return voiceLabels[voice] || 'Nova';
  };

  const getCategoryIcon = () => {
    switch (visualization.category) {
      case 'confidence':
        return <Trophy size={24} color={colors.primary} />;
      case 'focus':
        return <Brain size={24} color={colors.primary} />;
      default:
        return <Brain size={24} color={colors.primary} />;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: colors.darkGray,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    statsCard: {
      marginBottom: 20,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    statsContent: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 14,
      color: colors.darkGray,
      marginTop: 4,
    },
    overviewCard: {
      marginBottom: 20,
    },
    overviewTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    overviewItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    overviewIcon: {
      marginRight: 12,
    },
    overviewText: {
      fontSize: 16,
      color: colors.darkGray,
      flex: 1,
    },
    stepsCard: {
      marginBottom: 20,
    },
    stepsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    stepItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    stepNumberText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    stepContent: {
      flex: 1,
    },
    stepText: {
      fontSize: 14,
      color: colors.darkGray,
      lineHeight: 20,
    },
    voiceCard: {
      marginBottom: 20,
    },
    voiceTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    voiceSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    voiceSelectorLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    voiceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    voiceInfo: {
      flex: 1,
    },
    voiceLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 2,
    },
    voiceValue: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingVertical: 18,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
    },
    startButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.background,
      marginLeft: 8,
    },
    errorText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: visualization?.title || 'Visualization',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ padding: 8 }}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          animation: 'slide_from_right',
        }} 
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getCategoryIcon()}
          </View>
          <Text style={styles.title}>{visualization.title}</Text>
          <Text style={styles.description}>{visualization.description}</Text>
        </View>

        {stats.completionCount > 0 && (
          <Card style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.completionCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.floor(stats.averageDuration / 60)}m
                </Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.lastCompletedAt ? 
                    `${Math.floor((Date.now() - new Date(stats.lastCompletedAt).getTime()) / (1000 * 60 * 60 * 24))}d` 
                    : '-'
                  }
                </Text>
                <Text style={styles.statLabel}>Days Ago</Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Overview</Text>
          <View style={styles.overviewItem}>
            <Clock size={20} color={colors.darkGray} style={styles.overviewIcon} />
            <Text style={styles.overviewText}>
              Duration: {visualization.duration} minutes
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Brain size={20} color={colors.darkGray} style={styles.overviewIcon} />
            <Text style={styles.overviewText}>
              {visualization.steps.length} guided steps
            </Text>
          </View>
        </Card>

        {/* Voice Selection Card */}
        <Card style={styles.voiceCard}>
          <Text style={styles.voiceTitle}>Voice Settings</Text>
          <TouchableOpacity 
            style={styles.voiceSelector}
            onPress={() => setShowVoiceModal(true)}
          >
            <View style={styles.voiceSelectorLeft}>
              <View style={styles.voiceIcon}>
                <Mic size={20} color={colors.primary} />
              </View>
              <View style={styles.voiceInfo}>
                <Text style={styles.voiceLabel}>Narration Voice</Text>
                <Text style={styles.voiceValue}>
                  {getVoiceLabel(preferences.ttsVoice ?? 'nova')}
                </Text>
              </View>
            </View>
            <Volume2 size={20} color={colors.darkGray} />
          </TouchableOpacity>
        </Card>

        <Card style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What You'll Experience</Text>
          {visualization.steps.slice(0, 3).map((step) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.id + 1}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText} numberOfLines={2}>
                  {step.content}
                </Text>
              </View>
            </View>
          ))}
          {visualization.steps.length > 3 && (
            <Text style={[styles.stepText, { textAlign: 'center', marginTop: 8 }]}>
              ...and {visualization.steps.length - 3} more steps
            </Text>
          )}
        </Card>

        <TouchableOpacity 
          style={[styles.startButton, isStarting && { opacity: 0.7 }]}
          onPress={handleStartVisualization}
          disabled={isStarting}
        >
          {isStarting ? (
            <>
              <ActivityIndicator size="small" color={colors.background} />
              <Text style={styles.startButtonText}>Starting...</Text>
            </>
          ) : (
            <>
              <Play size={24} color={colors.background} />
              <Text style={styles.startButtonText}>Start Visualization</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Voice Selection Modal */}
      <VoiceSelectionModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        currentVoice={preferences.ttsVoice ?? 'nova'}
        onVoiceSelect={handleVoiceSelect}
      />
    </View>
  );
}