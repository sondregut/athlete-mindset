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
  const [isPreparingVisualization, setIsPreparingVisualization] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [totalStepsToPreload, setTotalStepsToPreload] = useState(0);
  const [preparationMessage, setPreparationMessage] = useState('Finding a quiet space...');
  
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
  const hasPersonalizationBeenApplied = useRef(false);
  const isPreloadingAllSteps = useRef(false);
  const hasStartedInitialPreload = useRef(false);
  
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
  
  // 6. Safe step tracking
  const currentStep = currentSession?.currentStep ?? 0;
  
  // Verify step alignment
  useEffect(() => {
    if (currentSession && currentStep !== currentSession.currentStep) {
      console.warn(`Step mismatch detected! currentStep: ${currentStep}, currentSession.currentStep: ${currentSession.currentStep}`);
    }
  }, [currentStep, currentSession]);
  
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
    if (!visualization || !currentSession || isPreloadingAllSteps.current) return;
    
    console.log('Starting background preload for remaining steps...');
    const startFrom = currentStep + 1;
    const steps = personalizedSteps || visualization.steps;
    
    // Mark as preloading to prevent concurrent executions
    isPreloadingAllSteps.current = true;
    
    try {
      for (let i = startFrom; i < steps.length; i++) {
        if (!isMounted.current) break;
        
        // Skip if already preloaded
        if (preloadedAudioMap.current.has(i)) {
          console.log(`Step ${i} already preloaded, skipping`);
          continue;
        }
        
        try {
          const stepData = steps[i];
          console.log(`Background preloading step index ${i} (display: Step ${i + 1})`);
          console.log(`Content preview: ${stepData.content.substring(0, 50)}...`);
          
          const audioUri = await ttsService.synthesizeSpeech(stepData.content, {
            voice: preferences.ttsVoice ?? 'nova',
            model: preferences.ttsModel ?? 'tts-1',
            speed: preferences.ttsSpeed ?? 1.0,
            isPersonalized: !!personalizedSteps,
          });
          
          if (isMounted.current) {
            preloadedAudioMap.current.set(i, audioUri);
            console.log(`✅ Background preloaded step index ${i}`);
          }
          
          // Add delay between preloads to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to preload step ${i}:`, error);
        }
      }
      
      if (isMounted.current) {
        console.log('Background preloading complete');
      }
    } finally {
      isPreloadingAllSteps.current = false;
    }
  }, [currentStep, visualization, currentSession, preferences, ttsService, personalizedSteps]);

  // 13.5. Preload ALL steps before starting visualization
  const preloadAllSteps = useCallback(async () => {
    if (!visualization || !currentSession || isPreloadingAllSteps.current) return;
    
    isPreloadingAllSteps.current = true;
    console.log('Starting full preload of all visualization steps...');
    
    const steps = personalizedSteps || visualization.steps;
    setTotalStepsToPreload(steps.length);
    setPreloadProgress(0);
    
    // Update preparation messages
    const messages = [
      'Finding a quiet space...',
      'Take a deep breath in...',
      'And slowly breathe out...',
      'Preparing your visualization...',
      'Almost ready...'
    ];
    let messageIndex = 0;
    
    const messageInterval = setInterval(() => {
      if (!isMounted.current || !isPreparingVisualization) {
        clearInterval(messageInterval);
        return;
      }
      messageIndex = (messageIndex + 1) % messages.length;
      setPreparationMessage(messages[messageIndex]);
    }, 3000);
    
    try {
      for (let i = 0; i < steps.length; i++) {
        if (!isMounted.current) break;
        
        // Skip if already preloaded
        if (preloadedAudioMap.current.has(i)) {
          console.log(`Step ${i} already preloaded`);
          setPreloadProgress(i + 1);
          continue;
        }
        
        try {
          const stepData = steps[i];
          console.log(`Preloading step index ${i} (display: Step ${i + 1}/${steps.length})`);
          console.log(`Content preview: ${stepData.content.substring(0, 50)}...`);
          
          const audioUri = await ttsService.synthesizeSpeech(stepData.content, {
            voice: preferences.ttsVoice ?? 'nova',
            model: preferences.ttsModel ?? 'tts-1',
            speed: preferences.ttsSpeed ?? 1.0,
            isPersonalized: !!personalizedSteps,
          });
          
          if (isMounted.current) {
            preloadedAudioMap.current.set(i, audioUri);
            setPreloadProgress(i + 1);
            console.log(`✅ Preloaded step index ${i} (${i + 1}/${steps.length})`);
          }
          
          // Add delay between preloads to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Failed to preload step ${i}:`, error);
          // Continue with other steps even if one fails
        }
      }
      
      console.log('All steps preloaded successfully!');
      clearInterval(messageInterval);
      
      // Small delay before starting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isMounted.current) {
        setIsPreparingVisualization(false);
      }
    } catch (error) {
      console.error('Error during full preload:', error);
      clearInterval(messageInterval);
      // Start anyway even if some preloading failed
      if (isMounted.current) {
        setIsPreparingVisualization(false);
      }
    } finally {
      isPreloadingAllSteps.current = false;
    }
  }, [visualization, currentSession, preferences, ttsService, personalizedSteps, isPreparingVisualization]);

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
    
    // Reload current step with new voice (don't trigger background preload)
    if (isMounted.current && currentSession && (preferences.ttsEnabled ?? true)) {
      console.log('Reloading current step with new voice...');
      // Use timeout to ensure clean state
      setTimeout(() => {
        if (isMounted.current && !isLoadingAudioRef.current) {
          loadTTSAudio();
        }
      }, 100);
    }
  }, [ttsSound, currentSession, preferences.ttsEnabled]);

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
    console.log(`=== Loading TTS Audio for step index ${currentStep} (display: Step ${currentStep + 1}) ===`);
    console.log('currentSession.currentStep:', currentSession.currentStep);
    console.log('currentStep variable:', currentStep);
    console.log('visualization.steps.length:', visualization.steps.length);
    
    // Use personalized steps if available, otherwise use original
    const steps = personalizedSteps || visualization.steps;
    
    // Validate step index
    if (currentStep >= steps.length) {
      console.error(`Step index ${currentStep} is out of bounds (max: ${steps.length - 1})`);
      isLoadingAudioRef.current = false;
      return;
    }
    
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
      console.log(`Checking for preloaded audio for step index ${currentStep}`);
      console.log('Available keys in preloaded map:', Array.from(preloadedAudioMap.current.keys()));
      console.log('Current step content preview:', currentStepData?.content.substring(0, 100) + '...');
      
      if (preloadedAudioMap.current.has(currentStep)) {
        audioUri = preloadedAudioMap.current.get(currentStep)!;
        console.log(`✅ Found preloaded audio for step index ${currentStep}, URI: ${audioUri}`);
        
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
            isPersonalized: !!personalizedSteps,
          });
        }
      } else {
        // Synthesize speech for current step (fallback)
        console.log(`Loading audio on-demand for step index ${currentStep} (display: Step ${currentStep + 1})`);
        const stepData = steps[currentStep];
        
        if (!stepData) {
          throw new Error(`No step data found for step index ${currentStep}`);
        }
        
        console.log('Step data for synthesis:', {
          stepIndex: currentStep,
          contentPreview: stepData.content.substring(0, 100) + '...',
          contentLength: stepData.content.length,
          duration: stepData.duration
        });
        
        audioUri = await ttsService.synthesizeSpeech(stepData.content, {
          voice: preferences.ttsVoice ?? 'nova',
          model: preferences.ttsModel ?? 'tts-1',
          speed: preferences.ttsSpeed ?? 1.0,
          isPersonalized: !!personalizedSteps,
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
  }, [currentStep, visualization, currentSession, preferences, isPaused, ttsService, cleanupAudio, personalizedSteps]);
  
  // 15.5. Handle when personalized content arrives
  useEffect(() => {
    if (personalizedSteps && !isGeneratingPersonalization && !hasPersonalizationBeenApplied.current) {
      hasPersonalizationBeenApplied.current = true;
      
      debugLog('Personalized content ready, clearing preloaded audio', {
        stepsCount: personalizedSteps.length,
        firstStepPreview: personalizedSteps[0]?.content.substring(0, 50) + '...',
        preloadedAudioCount: preloadedAudioMap.current.size
      });
      
      // Clear preloaded audio since it's for the original content
      preloadedAudioMap.current.clear();
      console.log('✅ Cleared preloaded audio map for personalized content');
      
      // Force reload audio for current step with personalized content
      if (currentSession && (preferences.ttsEnabled ?? true)) {
        setTimeout(() => {
          if (isMounted.current && !isLoadingAudioRef.current) {
            loadTTSAudio();
          }
        }, 100);
      }
    }
  }, [personalizedSteps, isGeneratingPersonalization, currentSession, preferences.ttsEnabled]);
  
  // 16. Handle TTS audio when step changes with proper debouncing
  useEffect(() => {
    if (!isMounted.current) return;
    
    console.log('=== Audio loading effect triggered ===');
    console.log('currentSession exists:', !!currentSession);
    console.log('visualization exists:', !!visualization);
    console.log('preferences.ttsEnabled:', preferences.ttsEnabled);
    console.log('disableAudio:', disableAudio);
    console.log('isGeneratingPersonalization:', isGeneratingPersonalization);
    console.log('personalizedSteps available:', !!personalizedSteps);
    console.log('currentStep:', currentStep);
    
    // Clear any pending audio load
    if (loadAudioTimeoutRef.current) {
      clearTimeout(loadAudioTimeoutRef.current);
      loadAudioTimeoutRef.current = null;
    }
    
    if (currentSession && visualization && (preferences.ttsEnabled ?? true) && disableAudio !== 'true' && !isPreparingVisualization) {
      // Wait for personalization to complete before loading audio
      if (isGeneratingPersonalization) {
        console.log('Waiting for personalization to complete before loading audio');
        return;
      }
      
      console.log('Conditions met, scheduling loadTTSAudio()');
      // Add longer delay to debounce rapid step changes and wait for personalized content
      loadAudioTimeoutRef.current = setTimeout(() => {
        if (isMounted.current && !isPreparingVisualization && !isLoadingAudioRef.current) {
          loadTTSAudio();
        }
      }, 300); // Increased delay for better debouncing
    } else {
      console.log('Conditions not met, skipping audio load');
    }
    
    return () => {
      if (loadAudioTimeoutRef.current) {
        clearTimeout(loadAudioTimeoutRef.current);
        loadAudioTimeoutRef.current = null;
      }
    };
  }, [currentStep, currentSession, visualization, preferences.ttsEnabled, disableAudio, isPreparingVisualization, isGeneratingPersonalization]);
  
  // 17. Trigger initial preload when ready
  useEffect(() => {
    console.log('[Preload Trigger] Checking conditions:', {
      hasVisualization: !!visualization,
      hasSession: !!currentSession,
      isGeneratingPersonalization,
      isPreparingVisualization,
      ttsEnabled: preferences.ttsEnabled ?? true,
      disableAudio,
      hasStartedInitialPreload: hasStartedInitialPreload.current,
      hasPersonalizedSteps: !!personalizedSteps
    });
    
    if (visualization && currentSession && !isGeneratingPersonalization && isPreparingVisualization && 
        (preferences.ttsEnabled ?? true) && disableAudio !== 'true' && !hasStartedInitialPreload.current) {
      hasStartedInitialPreload.current = true;
      console.log('[Preload Trigger] All conditions met - starting initial preload');
      console.log('[Preload Trigger] Using steps:', personalizedSteps ? 'PERSONALIZED' : 'ORIGINAL');
      preloadAllSteps();
    }
  }, [visualization, currentSession, isGeneratingPersonalization, preferences.ttsEnabled, disableAudio, preloadAllSteps, personalizedSteps]);
  
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
  
  // Log current content to verify alignment
  if (currentStepData) {
    console.log(`[UI Render] Step index: ${currentSession.currentStep}, Content preview: ${currentStepData.content.substring(0, 80)}...`);
  }
  
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

  // Show preparation screen while preloading
  if (isPreparingVisualization) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <TouchableOpacity 
          style={{ position: 'absolute', top: 60, left: 20, zIndex: 1, padding: 10 }}
          onPress={handleExit}
        >
          <X size={28} color={colors.text} />
        </TouchableOpacity>
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Text style={{ 
            color: colors.text, 
            fontSize: 24, 
            marginBottom: 40, 
            fontWeight: '600', 
            textAlign: 'center' 
          }}>
            {preparationMessage}
          </Text>
          
          <View style={{ width: '100%', maxWidth: 300, marginBottom: 40 }}>
            <View style={{ 
              height: 8, 
              backgroundColor: colors.border, 
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <View style={{ 
                height: '100%', 
                width: `${(preloadProgress / totalStepsToPreload) * 100}%`,
                backgroundColor: colors.primary,
                borderRadius: 4
              }} />
            </View>
            <Text style={{ 
              color: colors.darkGray, 
              fontSize: 14, 
              marginTop: 12, 
              textAlign: 'center' 
            }}>
              Loading audio... {preloadProgress}/{totalStepsToPreload} steps
            </Text>
          </View>
          
          <View style={{ 
            backgroundColor: colors.cardBackground, 
            padding: 24, 
            borderRadius: 16,
            marginTop: 20
          }}>
            <Text style={{ 
              color: colors.text, 
              fontSize: 16, 
              textAlign: 'center',
              lineHeight: 24
            }}>
              While we prepare your visualization:{'\n\n'}
              • Find a comfortable position{'\n'}
              • Close your eyes if you'd like{'\n'}
              • Take a few deep breaths{'\n'}
              • Allow your body to relax
            </Text>
          </View>
        </View>
      </View>
    );
  }

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