import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Alert, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getVisualizationById } from '@/constants/visualizations';
import { useVisualizationStore } from '@/store/visualization-store';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Loader2, Settings } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
// Use simple TTS service
import { SimpleTTSService } from '@/services/simple-tts-service';
import VisualizationSettings from '@/components/VisualizationSettings';

const { height, width } = Dimensions.get('window');

export default function VisualizationPlayerScreen() {
  useKeepAwake(); // Prevent screen from sleeping during visualization
  
  const { id, preloadedAudio: preloadedAudioParam, disableAudio } = useLocalSearchParams<{ 
    id: string; 
    preloadedAudio?: string;
    disableAudio?: string;
  }>();
  const colors = useThemeColors();
  const { 
    currentSession, 
    isPaused,
    preferences,
    nextStep,
    previousStep,
    pauseSession,
    resumeSession,
    completeSession,
    abandonSession,
    updatePreferences,
  } = useVisualizationStore();
  
  const visualization = getVisualizationById(id);
  const [ttsSound, setTtsSound] = useState<Audio.Sound | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const ttsService = useRef(SimpleTTSService.getInstance()).current;
  
  // Parse preloaded audio from route params
  const preloadedAudioMap = useRef<Map<number, string>>(new Map());
  useEffect(() => {
    if (preloadedAudioParam) {
      try {
        const parsed = JSON.parse(preloadedAudioParam);
        Object.entries(parsed).forEach(([stepId, uri]) => {
          preloadedAudioMap.current.set(parseInt(stepId), uri as string);
        });
        console.log(`Received ${preloadedAudioMap.current.size} preloaded audio files`);
      } catch (error) {
        console.error('Failed to parse preloaded audio:', error);
      }
    }
  }, [preloadedAudioParam]);

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Early return after all hooks
  if (!visualization || !currentSession) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 16 }}>
          Visualization not found
        </Text>
      </View>
    );
  }

  // Move these calculations after the early return check
  const currentStepData = visualization.steps[currentSession.currentStep];
  const isLastStep = currentSession.currentStep === visualization.steps.length - 1;
  const progress = (currentSession.currentStep + 1) / visualization.steps.length;

  // Safe step tracking that won't break if currentSession becomes null
  const currentStep = currentSession?.currentStep ?? 0;

  useEffect(() => {
    if (currentSession && visualization) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentStep, progress]);

  useEffect(() => {
    if (currentSession) {
      // Fade in animation for step content
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (ttsSound) {
        ttsSound.unloadAsync();
      }
      ttsService.stopCurrentAudio();
    };
  }, []);

  // Configure audio session on mount
  useEffect(() => {
    configureAudioSession();
  }, []);

  const configureAudioSession = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Failed to configure audio session:', error);
    }
  };

  // Handle TTS audio when step changes
  useEffect(() => {
    if (currentSession && visualization && (preferences.ttsEnabled ?? true) && !disableAudio) {
      loadTTSAudio();
    }
  }, [currentStep, preferences.ttsEnabled]);

  const loadTTSAudio = async () => {
    setIsLoadingAudio(true);
    setAudioError(null);

    try {
      // Stop any existing audio
      if (ttsSound) {
        await ttsSound.unloadAsync();
        setTtsSound(null);
      }
      await ttsService.stopCurrentAudio();

      let audioUri: string;
      
      // Check if audio is already preloaded
      if (preloadedAudioMap.current.has(currentStep)) {
        audioUri = preloadedAudioMap.current.get(currentStep)!;
        console.log(`Using preloaded audio for step ${currentStep + 1}`);
      } else {
        // Synthesize speech for current step (fallback)
        console.log(`Loading audio on-demand for step ${currentStep + 1} (fallback)`);
        audioUri = await ttsService.synthesizeSpeech(currentStepData.content, {
          voice: preferences.ttsVoice ?? 'nova',
          model: preferences.ttsModel ?? 'tts-1',
          speed: preferences.ttsSpeed ?? 1.0,
        });
      }

      // Play the audio if auto-play is enabled and not paused
      if ((preferences.autoPlayTTS ?? true) && !isPaused) {
        const sound = await ttsService.playAudio(audioUri, {
          volume: preferences.volume ?? 0.8,
        });
        
        setTtsSound(sound);
        setIsPlaying(true);

        // Set up playback status update
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            
            // Auto-advance to next step if enabled
            if ((preferences.autoProgress ?? false) && !isLastStep) {
              setTimeout(() => {
                handleNextStep();
              }, 1000);
            }
          }
        });
      }
    } catch (error: any) {
      console.error('TTS audio failed:', error);
      setAudioError(error.message || 'Failed to load audio');
      
      // Show user-friendly error message
      if (error.message?.includes('429')) {
        // Don't show alert for rate limit errors, just log them
        console.log('Rate limited, will retry automatically');
      } else if (error.message?.includes('Invalid API key')) {
        Alert.alert(
          'Configuration Error',
          'Invalid OpenAI API key. Please check your configuration.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Audio Error',
          'Unable to generate speech. Please check your internet connection and try again.',
          [
            { text: 'OK' },
            { 
              text: 'Clear Cache', 
              onPress: async () => {
                await ttsService.clearCache();
                Alert.alert('Cache Cleared', 'Audio cache has been cleared. Please try again.');
              }
            }
          ]
        );
      }
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Visualization',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: async () => {
            if (ttsSound) {
              await ttsSound.unloadAsync();
            }
            await ttsService.stopCurrentAudio();
            abandonSession();
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/mental-training');
            }
          }
        },
      ]
    );
  };

  const handlePreviousStep = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    previousStep();
  };

  const handleNextStep = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (isLastStep) {
      handleComplete();
    } else {
      nextStep();
    }
  };

  const handleComplete = async () => {
    if (ttsSound) {
      await ttsSound.unloadAsync();
    }
    await ttsService.stopCurrentAudio();
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Navigate to home screen
    router.replace('/(tabs)');
    
    // Complete session after navigation
    setTimeout(() => {
      completeSession();
    }, 100);
    
    // Show success message after a short delay
    setTimeout(() => {
      Alert.alert(
        'Visualization Complete! 🎉',
        `Great job completing "${visualization.title}". Keep up the great work!`,
        [{ text: 'OK' }]
      );
    }, 500);
  };

  const toggleAudio = () => {
    const currentValue = preferences.ttsEnabled ?? true;
    const newValue = !currentValue;
    updatePreferences({ ttsEnabled: newValue });
    
    if (!newValue && ttsSound) {
      ttsSound.stopAsync();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = async () => {
    if (!(preferences.ttsEnabled ?? true)) {
      // If TTS is disabled, just toggle session pause state
      if (isPaused) {
        resumeSession();
      } else {
        pauseSession();
      }
      return;
    }

    if (isPaused) {
      resumeSession();
      
      // Resume or start TTS playback
      if (ttsSound && !isPlaying) {
        await ttsSound.playAsync();
        setIsPlaying(true);
      } else if (!ttsSound && !isLoadingAudio) {
        // Load and play TTS if not already loaded
        loadTTSAudio();
      }
    } else {
      pauseSession();
      
      // Pause TTS playback
      if (ttsSound && isPlaying) {
        await ttsSound.pauseAsync();
        setIsPlaying(false);
      }
    }
  };

  const replayAudio = async () => {
    if (!(preferences.ttsEnabled ?? true) || isLoadingAudio) return;
    
    try {
      if (ttsSound) {
        // Stop and restart the audio
        await ttsSound.stopAsync();
        await ttsSound.playAsync();
        setIsPlaying(true);
      } else {
        loadTTSAudio();
      }
    } catch (error) {
      console.error('Failed to replay audio:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 20,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    exitButton: {
      padding: 8,
    },
    audioButton: {
      padding: 8,
    },
    progressContainer: {
      height: 4,
      backgroundColor: colors.lightGray,
      marginHorizontal: 20,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    content: {
      flex: 1,
      paddingHorizontal: 30,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 40,
    },
    stepNumber: {
      fontSize: 14,
      color: colors.darkGray,
      textAlign: 'center',
      marginBottom: 8,
    },
    stepContent: {
      fontSize: 22,
      lineHeight: 34,
      color: colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 30,
      paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    },
    sideButton: {
      padding: 12,
      opacity: 0.6,
    },
    centerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    playPauseButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nextButton: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: colors.primary,
      borderRadius: 12,
      minWidth: 120,
      alignItems: 'center',
    },
    nextButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.background,
    },
    errorText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
    },
    audioNote: {
      fontSize: 12,
      color: colors.darkGray,
      textAlign: 'center',
      marginTop: 16,
      fontStyle: 'italic',
    },
    audioStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      gap: 8,
    },
    audioStatusText: {
      fontSize: 14,
      color: colors.darkGray,
    },
    replayButton: {
      marginTop: 12,
      padding: 8,
      alignSelf: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Prevent accidental swipe back
        }} 
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <X size={24} color={colors.darkGray} />
        </TouchableOpacity>
        
        <Text style={styles.stepNumber}>
          Step {currentSession.currentStep + 1} of {visualization.steps.length}
        </Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.audioButton} onPress={toggleAudio}>
            {(preferences.ttsEnabled ?? true) ? (
              <Volume2 size={24} color={colors.primary} />
            ) : (
              <VolumeX size={24} color={colors.darkGray} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.audioButton} onPress={() => setShowSettings(true)}>
            <Settings size={24} color={colors.darkGray} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBar, 
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }
          ]} 
        />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim }}
          key={currentSession.currentStep}
        >
          <Text style={styles.stepContent}>
            {currentStepData?.content}
          </Text>
          
          {/* Audio Status */}
          {(preferences.ttsEnabled ?? true) && !disableAudio && (
            <View>
              {isLoadingAudio ? (
                <View style={styles.audioStatus}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.audioStatusText}>Loading audio...</Text>
                </View>
              ) : audioError ? (
                <View>
                  <Text style={[styles.audioNote, { color: colors.error }]}>
                    Audio unavailable
                  </Text>
                  <TouchableOpacity style={styles.replayButton} onPress={loadTTSAudio}>
                    <Text style={{ color: colors.primary }}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.audioStatus}>
                    {isPlaying && <Loader2 size={16} color={colors.primary} />}
                    <Text style={styles.audioStatusText}>
                      {isPlaying ? 'Playing narration' : 'Narration ready'}
                    </Text>
                  </View>
                  {!isPlaying && (
                    <TouchableOpacity style={styles.replayButton} onPress={replayAudio}>
                      <Text style={{ color: colors.primary }}>Replay Audio</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.sideButton, { opacity: currentSession.currentStep === 0 ? 0.3 : 0.6 }]}
          onPress={handlePreviousStep}
          disabled={currentSession.currentStep === 0}
        >
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.centerControls}>
          <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
            {isPaused ? (
              <Play size={28} color={colors.background} />
            ) : (
              <Pause size={28} color={colors.background} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Complete' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ width: 52 }} />
      </View>

      {/* Settings Modal */}
      <VisualizationSettings
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </View>
  );
}