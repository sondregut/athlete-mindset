import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getVisualizationById } from '@/constants/visualizations';
import { useVisualizationStore } from '@/store/visualization-store';
import { Clock, Play, Trophy, Brain, ChevronLeft } from 'lucide-react-native';
import Card from '@/components/Card';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import PreloadingModal from '@/components/PreloadingModal';
import { SimpleTTSService } from '@/services/simple-tts-service';

export default function VisualizationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const { getVisualizationStats, startSession, preferences } = useVisualizationStore();
  
  const visualization = getVisualizationById(id);
  const stats = getVisualizationStats(id);
  
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const ttsService = useRef(SimpleTTSService.getInstance()).current;
  const abortControllerRef = useRef<AbortController | null>(null);

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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Check if TTS is enabled
    if (!(preferences.ttsEnabled ?? true)) {
      // If TTS is disabled, start directly without preloading
      startSession(visualization.id);
      router.push({
        pathname: '/visualization-player',
        params: { id: visualization.id }
      });
      return;
    }
    
    // Start preloading
    setIsPreloading(true);
    setPreloadProgress(0);
    abortControllerRef.current = new AbortController();
    
    try {
      const preloadedAudio = await ttsService.preloadVisualization(
        visualization.steps,
        {
          voice: preferences.ttsVoice ?? 'nova',
          model: preferences.ttsModel ?? 'tts-1',
          speed: preferences.ttsSpeed ?? 1.0,
        },
        (progress) => {
          setPreloadProgress(progress);
        }
      );
      
      // Convert Map to object for passing via route params
      const preloadedData: Record<string, string> = {};
      preloadedAudio.forEach((uri, stepId) => {
        preloadedData[stepId.toString()] = uri;
      });
      
      // Start session and navigate with preloaded data
      startSession(visualization.id);
      router.push({
        pathname: '/visualization-player',
        params: { 
          id: visualization.id,
          preloadedAudio: JSON.stringify(preloadedData)
        }
      });
    } catch (error: any) {
      console.error('Preloading failed:', error);
      
      // Show error alert
      Alert.alert(
        'Loading Failed',
        'Unable to prepare the visualization audio. Would you like to continue without narration?',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              setIsPreloading(false);
            }
          },
          { 
            text: 'Continue Without Audio', 
            onPress: () => {
              startSession(visualization.id);
              router.push({
                pathname: '/visualization-player',
                params: { 
                  id: visualization.id,
                  disableAudio: 'true'
                }
              });
            }
          },
        ]
      );
    } finally {
      setIsPreloading(false);
      abortControllerRef.current = null;
    }
  };
  
  const handleCancelPreload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsPreloading(false);
    setPreloadProgress(0);
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
          title: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ padding: 8 }}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
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
          style={styles.startButton}
          onPress={handleStartVisualization}
        >
          <Play size={24} color={colors.background} />
          <Text style={styles.startButtonText}>Start Visualization</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Preloading Modal */}
      <PreloadingModal
        visible={isPreloading}
        progress={preloadProgress}
        onCancel={handleCancelPreload}
      />
    </View>
  );
}