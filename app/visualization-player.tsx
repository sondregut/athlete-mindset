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
import * as FileSystem from 'expo-file-system';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';
import VisualizationSettings from '@/components/VisualizationSettings';
import { usePersonalizedVisualization } from '@/hooks/usePersonalizedVisualization';
import { useDebugPersonalization } from '@/hooks/useDebugPersonalization';

const { height, width } = Dimensions.get('window');

export default function VisualizationPlayerScreen() {
  // 1. Route params and hooks FIRST
  const { id, preloadedAudio: preloadedAudioParam, disableAudio, skipPreload } = useLocalSearchParams<{ 
    id: string; 
    preloadedAudio?: string;
    disableAudio?: string;
    skipPreload?: string;
  }>();
  const colors = useThemeColors();
  const { log: debugLog } = useDebugPersonalization('VisualizationPlayer');
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
  
  // 2. State hooks
  const [ttsSound, setTtsSound] = useState<Audio.Sound | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // 3. Refs
  const isMounted = useRef(true);
  const isNavigating = useRef(false);
  const preloadedAudioMap = useRef<Map<number, string>>(new Map());
  const ttsService = useRef(TTSFirebaseCache.getInstance()).current;
  const isLoadingAudioRef = useRef(false);
  const loadAudioTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioGenerationRef = useRef(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // 4. Get visualization data
  const visualization = getVisualizationById(id);
  
  // 4.5. Get personalized content
  const { 
    personalizedSteps, 
    isGenerating: isGeneratingPersonalization,
    error: personalizationError 
  } = usePersonalizedVisualization(visualization || {} as any, {
    forceRegenerate: false,
  });
  
  // 5. Prevent screen from sleeping
  useKeepAwake();
  
  // 5.5. Clear preloaded audio when personalized content arrives
  useEffect(() => {
    if (personalizedSteps && !isGeneratingPersonalization) {
      debugLog('Personalized content ready', {
        stepsCount: personalizedSteps.length,
        firstStepPreview: personalizedSteps[0]?.content.substring(0, 50) + '...'
      });
      
      // Clear the preloaded audio map since it contains non-personalized content
      preloadedAudioMap.current.clear();
      debugLog('Cleared preloaded audio map');
      
      // Force reload current step with personalized content
      if (isMounted.current && currentSession && (preferences.ttsEnabled ?? true)) {
        debugLog('Reloading current step with personalized content');
        loadTTSAudio().then(() => {
          debugLog('Current step reloaded successfully');
          // Start preloading remaining steps with personalized content
          setTimeout(() => {
            if (isMounted.current) {
              preloadRemainingSteps();
            }
          }, 1000);
        });
      }
    }
  }, [personalizedSteps, isGeneratingPersonalization, currentSession, preferences.ttsEnabled, loadTTSAudio, preloadRemainingSteps]);
  
  // 6. Safe step tracking
  const currentStep = currentSession?.currentStep ?? 0;
  
  // 7. Component lifecycle management
  useEffect(() => {
    isMounted.current = true;
    return () => {
      console.log('=== Component unmounting, cleaning up audio ===');
      isMounted.current = false;
      isNavigating.current = false;
      
      // Clear any pending audio loads
      if (loadAudioTimeoutRef.current) {
        clearTimeout(loadAudioTimeoutRef.current);
        loadAudioTimeoutRef.current = null;
      }
      
      // Immediate audio cleanup on unmount
      if (ttsSound) {
        console.log('Stopping ttsSound on unmount');
        ttsSound.stopAsync().catch(() => {});
        ttsSound.unloadAsync().catch(() => {});
      }
      ttsService.stopCurrentAudio().catch(() => {});
    };
  }, []);
  
  // 8. Parse preloaded audio
  useEffect(() => {
    if (!isMounted.current) return;
    
    console.log('=== Visualization Player Params ===');
    console.log('skipPreload:', skipPreload);
    console.log('disableAudio:', disableAudio);
    console.log('preloadedAudioParam exists:', !!preloadedAudioParam);
    
    if (skipPreload === 'true') {
      console.log('⚠️ Skipping preload - will generate audio on demand');
      return;
    }
    
    if (preloadedAudioParam) {
      try {
        console.log('Parsing preloaded audio param:', preloadedAudioParam);
        const parsed = JSON.parse(preloadedAudioParam);
        console.log('Parsed preloaded audio:', parsed);
        
        Object.entries(parsed).forEach(([stepId, uri]) => {
          const stepIdNum = parseInt(stepId);
          preloadedAudioMap.current.set(stepIdNum, uri as string);
          console.log(`Added preloaded audio for step ${stepIdNum}: ${uri}`);
        });
        
        console.log(`Received ${preloadedAudioMap.current.size} preloaded audio files`);
        console.log('Preloaded audio map contents:', Array.from(preloadedAudioMap.current.entries()));
      } catch (error) {
        console.error('Failed to parse preloaded audio:', error);
      }
    } else {
      console.log('No preloaded audio param provided');
    }
  }, [preloadedAudioParam, skipPreload]);
  
  // 9. Configure audio session
  useEffect(() => {
    const configureAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        console.log('Audio session configured successfully');
      } catch (error) {
        console.error('Failed to configure audio session:', error);
      }
    };
    
    configureAudioSession();
  }, []);
  
  // 10. Progress animation
  useEffect(() => {
    if (!isMounted.current) return;
    
    if (currentSession && visualization) {
      const stepsLength = personalizedSteps?.length || visualization.steps.length;
      const progress = (currentSession.currentStep + 1) / stepsLength;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [currentStep, currentSession, visualization, personalizedSteps]);
  
  // 11. Fade animation - trigger on step change OR when personalized content loads
  useEffect(() => {
    if (!isMounted.current) return;
    
    // Trigger fade animation when:
    // 1. Step changes (currentStep)
    // 2. Personalized content loads (!isGeneratingPersonalization && personalizedSteps)
    if (currentSession) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentStep, isGeneratingPersonalization, personalizedSteps]);
  
  // 12. Create cleanup function
  const cleanupAudio = useCallback(async () => {
    console.log('Cleaning up audio...');
    // Clear any pending audio load
    if (loadAudioTimeoutRef.current) {
      clearTimeout(loadAudioTimeoutRef.current);
      loadAudioTimeoutRef.current = null;
    }
    
    // Stop and unload current sound
    if (ttsSound) {
      try {
        const status = await ttsSound.getStatusAsync();
        if (status.isLoaded) {
          await ttsSound.stopAsync();
          await ttsSound.unloadAsync();
        }
      } catch (error) {
        console.error('Error cleaning up ttsSound:', error);
      }
      setTtsSound(null);
      setIsPlaying(false);
    }
    
    // Stop service audio
    try {
      await ttsService.stopCurrentAudio();
    } catch (error) {
      console.error('Error stopping service audio:', error);
    }
  }, [ttsSound, ttsService]);
  
  // 13. Background preloading function
  const preloadRemainingSteps = useCallback(async () => {
    if (!visualization || !currentSession) return;
    
    console.log('Starting background preload for remaining steps...');
    const startFrom = currentStep + 1;
    const steps = personalizedSteps || visualization.steps;
    
    for (let i = startFrom; i < steps.length; i++) {
      if (!isMounted.current) break;
      
      // Skip if already preloaded
      if (preloadedAudioMap.current.has(i)) {
        console.log(`Step ${i} already preloaded, skipping`);
        continue;
      }
      
      try {
        const stepData = steps[i];
        console.log(`Background preloading step ${i + 1}...`);
        
        const audioUri = await ttsService.synthesizeSpeech(stepData.content, {
          voice: preferences.ttsVoice ?? 'nova',
          model: preferences.ttsModel ?? 'tts-1',
          speed: preferences.ttsSpeed ?? 1.0,
        });
        
        if (isMounted.current) {
          preloadedAudioMap.current.set(i, audioUri);
          console.log(`✅ Background preloaded step ${i + 1}`);
        }
        
        // Add delay between preloads to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to preload step ${i}:`, error);
      }
    }
    
    console.log('Background preloading complete');
  }, [currentStep, visualization, currentSession, preferences, ttsService, personalizedSteps]);

  // 14. Handle voice change
  const handleVoiceChange = useCallback(() => {
    console.log('Voice changed, clearing preloaded audio...');
    
    // Stop any currently playing audio
    if (ttsSound) {
      console.log('Stopping current TTS audio due to voice change');
      ttsSound.stopAsync().catch(() => {});
      ttsSound.unloadAsync().catch(() => {});
      setTtsSound(null);
    }
    
    // Clear preloaded audio map since voice has changed
    preloadedAudioMap.current.clear();
    console.log('Cleared preloaded audio map');
    
    // Reload current step with new voice
    if (isMounted.current) {
      console.log('Reloading current step with new voice...');
      loadTTSAudio().then(() => {
        console.log('Current step reloaded, starting background preload...');
        // Start preloading remaining steps with new voice
        setTimeout(() => {
          if (isMounted.current) {
            preloadRemainingSteps();
          }
        }, 1000);
      });
    }
  }, [ttsSound, preloadRemainingSteps]);

  // 15. Load TTS Audio function
  const loadTTSAudio = useCallback(async () => {
    if (!isMounted.current || !visualization || !currentSession) return;
    
    // Prevent concurrent audio loads
    if (isLoadingAudioRef.current) {
      console.log('Audio already loading, skipping...');
      return;
    }
    
    // Track this audio generation
    const thisGeneration = ++audioGenerationRef.current;
    isLoadingAudioRef.current = true;
    console.log(`=== Loading TTS Audio for step ${currentStep} (generation ${thisGeneration}) ===`);
    console.log('currentSession.currentStep:', currentSession.currentStep);
    console.log('visualization.steps.length:', visualization.steps.length);
    
    // Use personalized steps if available, otherwise use original
    const steps = personalizedSteps || visualization.steps;
    const currentStepData = steps[currentStep];
    
    debugLog('Loading TTS audio', {
      stepIndex: currentStep,
      isPersonalized: !!personalizedSteps,
      contentPreview: currentStepData?.content.substring(0, 50) + '...',
      preloadedMapSize: preloadedAudioMap.current.size
    });
    
    if (!isMounted.current) {
      isLoadingAudioRef.current = false;
      return;
    }
    
    setIsLoadingAudio(true);
    setAudioError(null);

    try {
      // Always cleanup before loading new audio
      await cleanupAudio();

      let audioUri: string;
      
      // Check if audio is already preloaded
      console.log(`Checking for preloaded audio for step ${currentStep}`);
      console.log('Available keys in preloaded map:', Array.from(preloadedAudioMap.current.keys()));
      
      if (preloadedAudioMap.current.has(currentStep)) {
        audioUri = preloadedAudioMap.current.get(currentStep)!;
        console.log(`✅ Found preloaded audio for step ${currentStep}, URI: ${audioUri}`);
        
        // Verify the preloaded file exists
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        console.log(`Preloaded file exists: ${fileInfo.exists}, size: ${(fileInfo as any).size || 'unknown'}`);
        
        if (!fileInfo.exists) {
          console.error('Preloaded audio file not found, falling back to on-demand generation');
          const stepData = steps[currentStep];
          if (!stepData) {
            throw new Error(`No step data found for step ${currentStep}`);
          }
          audioUri = await ttsService.synthesizeSpeech(stepData.content, {
            voice: preferences.ttsVoice ?? 'nova',
            model: preferences.ttsModel ?? 'tts-1',
            speed: preferences.ttsSpeed ?? 1.0,
          });
        }
      } else {
        // Synthesize speech for current step (fallback)
        console.log(`Loading audio on-demand for step ${currentStep + 1} (fallback)`);
        const stepData = steps[currentStep];
        console.log('Step data for synthesis:', stepData);
        
        if (!stepData) {
          throw new Error(`No step data found for step ${currentStep}`);
        }
        
        audioUri = await ttsService.synthesizeSpeech(stepData.content, {
          voice: preferences.ttsVoice ?? 'nova',
          model: preferences.ttsModel ?? 'tts-1',
          speed: preferences.ttsSpeed ?? 1.0,
        });
      }

      // Check if we're still the current generation before playing
      if (thisGeneration !== audioGenerationRef.current) {
        console.log(`Audio generation ${thisGeneration} cancelled, current is ${audioGenerationRef.current}`);
        return;
      }
      
      // Play the audio if auto-play is enabled and not paused
      if ((preferences.autoPlayTTS ?? true) && !isPaused && isMounted.current) {
        console.log('Attempting to play audio from URI:', audioUri);
        console.log('Audio preferences:', {
          autoPlayTTS: preferences.autoPlayTTS ?? true,
          volume: preferences.volume ?? 0.8,
          ttsEnabled: preferences.ttsEnabled ?? true,
          isPaused: isPaused
        });
        
        const sound = await ttsService.playAudio(audioUri, {
          volume: preferences.volume ?? 0.8,
        });
        
        if (isMounted.current && thisGeneration === audioGenerationRef.current) {
          setTtsSound(sound);
          setIsPlaying(true);
          console.log('Audio playback started successfully');

          // Set up playback status update
          sound.setOnPlaybackStatusUpdate((status) => {
            if (!isMounted.current) return;
            
            if (status.isLoaded) {
              if (status.isPlaying) {
                console.log('Audio is playing');
              } else if (status.didJustFinish) {
                console.log('Audio finished playing');
                if (isMounted.current) {
                  setIsPlaying(false);
                }
                
                // Auto-advance to next step if enabled
                const isLast = currentStep === steps.length - 1;
                if ((preferences.autoProgress ?? false) && !isLast && isMounted.current) {
                  setTimeout(() => {
                    if (isMounted.current && !isLoadingAudioRef.current) {
                      handleNextStep();
                    }
                  }, 1000);
                }
              }
            }
          });
        } else {
          // Another audio load has started, stop this one
          console.log(`Stopping audio from generation ${thisGeneration} as current is ${audioGenerationRef.current}`);
          sound.stopAsync().catch(() => {});
          sound.unloadAsync().catch(() => {});
          return;
        }
      }
    } catch (error: any) {
      if (!isMounted.current) return;
      
      console.error('TTS audio failed:', error);
      console.error('Full error:', JSON.stringify(error, null, 2));
      setAudioError(error.message || 'Failed to load audio');
      
      // Show user-friendly error message
      if (error.message?.includes('429')) {
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
          `Unable to generate speech: ${error.message}`,
          [
            { text: 'OK' },
            { 
              text: 'Clear Cache', 
              onPress: async () => {
                await ttsService.clearLocalCache();
                Alert.alert('Cache Cleared', 'Audio cache has been cleared. Please try again.');
              }
            }
          ]
        );
      }
    } finally {
      isLoadingAudioRef.current = false;
      if (isMounted.current) {
        setIsLoadingAudio(false);
      }
    }
  }, [currentStep, visualization, currentSession, preferences, isPaused, ttsService, cleanupAudio]);
  
  // 16. Handle TTS audio when step changes
  useEffect(() => {
    if (!isMounted.current) return;
    
    console.log('=== Audio loading effect triggered ===');
    console.log('currentSession exists:', !!currentSession);
    console.log('visualization exists:', !!visualization);
    console.log('preferences.ttsEnabled:', preferences.ttsEnabled);
    console.log('disableAudio:', disableAudio);
    console.log('isGeneratingPersonalization:', isGeneratingPersonalization);
    console.log('personalizedSteps available:', !!personalizedSteps);
    
    // Clear any pending audio load
    if (loadAudioTimeoutRef.current) {
      clearTimeout(loadAudioTimeoutRef.current);
    }
    
    if (currentSession && visualization && (preferences.ttsEnabled ?? true) && disableAudio !== 'true') {
      console.log('Conditions met, scheduling loadTTSAudio()');
      // Add small delay to debounce rapid step changes
      loadAudioTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          loadTTSAudio().then(() => {
            // Start background preloading for remaining steps
            if (currentStep === 0 && isMounted.current) {
              console.log('Starting background preload after first step loads...');
              setTimeout(() => {
                if (isMounted.current) {
                  preloadRemainingSteps();
                }
              }, 1000);
            }
          });
        }
      }, 100);
    } else {
      console.log('Conditions not met, skipping audio load');
    }
    
    return () => {
      if (loadAudioTimeoutRef.current) {
        clearTimeout(loadAudioTimeoutRef.current);
      }
    };
  }, [currentStep, currentSession, visualization, preferences.ttsEnabled, disableAudio]);
  
  // === EARLY RETURN AFTER ALL HOOKS ===
  if (!visualization || !currentSession) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: 16, marginTop: 16 }}>
            Loading visualization...
          </Text>
        </View>
      </View>
    );
  }
  
  // Show personalization loading state
  if (isGeneratingPersonalization && !personalizedSteps) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: 18, marginTop: 24, fontWeight: '600', textAlign: 'center' }}>
            Personalizing Your Visualization
          </Text>
          <Text style={{ color: colors.darkGray, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            Creating content specifically for your sport and goals...
          </Text>
        </View>
      </View>
    );
  }
  
  // === COMPONENT LOGIC (after early return) ===
  // Use personalized steps if available, otherwise use original
  const steps = personalizedSteps || visualization.steps;
  const currentStepData = steps[currentSession.currentStep];
  const originalStepData = visualization.steps[currentSession.currentStep];
  const isLastStep = currentSession.currentStep === steps.length - 1;
  const progress = (currentSession.currentStep + 1) / steps.length;
  
  // Navigation handlers with guard
  const handleExit = () => {
    if (isNavigating.current) return;
    
    Alert.alert(
      'Stop Visualization?',
      'Are you sure you want to stop? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop', 
          style: 'destructive',
          onPress: async () => {
            if (isNavigating.current) return;
            isNavigating.current = true;
            
            // Immediate cleanup before navigation
            await cleanupAudio();
            
            // Abandon session
            try {
              abandonSession();
            } catch (error) {
              console.error('Error abandoning session:', error);
            }
            
            // Navigate back
            router.back();
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
    if (isNavigating.current) return;
    isNavigating.current = true;
    
    // Immediate cleanup before navigation
    await cleanupAudio();
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Complete the session
    try {
      completeSession();
    } catch (error) {
      console.error('Error completing session:', error);
    }
    
    // Navigate back
    router.back();
    
    // Show success message after navigation
    setTimeout(() => {
      if (visualization) {
        Alert.alert(
          'Visualization Complete! 🎉',
          `Great job completing "${visualization.title}". Keep up the great work!`,
          [{ text: 'OK' }]
        );
      }
    }, 300);
  };

  const toggleAudio = async () => {
    const currentValue = preferences.ttsEnabled ?? true;
    const newValue = !currentValue;
    updatePreferences({ ttsEnabled: newValue });
    
    if (!newValue && ttsSound) {
      try {
        const status = await ttsSound.getStatusAsync();
        if (status.isLoaded) {
          await ttsSound.stopAsync();
        }
      } catch (error) {
        console.error('Error stopping audio on toggle:', error);
      }
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
      position: 'relative', // Ensure stable positioning
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
    loadingContainer: {
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: colors.primary,
      marginTop: 8,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <X size={24} color={colors.darkGray} />
        </TouchableOpacity>
        
        <Text style={styles.stepNumber}>
          Step {currentSession.currentStep + 1} of {steps.length}
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
          style={{ opacity: isGeneratingPersonalization ? 1 : fadeAnim }}
        >
          {isGeneratingPersonalization && !personalizedSteps ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Personalizing content...</Text>
              <Text style={[styles.stepContent, { opacity: 0.7, marginTop: 16 }]}>
                {originalStepData?.content}
              </Text>
            </View>
          ) : (
            <Text style={styles.stepContent}>
              {currentStepData?.content}
            </Text>
          )}
          
          {/* Audio Status */}
          {(preferences.ttsEnabled ?? true) && disableAudio !== 'true' && (
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
        onVoiceChange={handleVoiceChange}
      />
    </View>
  );
}