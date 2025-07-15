import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Alert, ScrollView, Animated, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getVisualizationById } from '@/constants/visualizations';
import { useVisualizationStore } from '@/store/visualization-store';
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Loader2, Settings } from 'lucide-react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import * as FileSystem from 'expo-file-system';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';
import { AudioManager } from '@/services/audio-manager';
import VisualizationSettings from '@/components/VisualizationSettings';
import { usePersonalizedVisualization } from '@/hooks/usePersonalizedVisualization';
import { useDebugPersonalization } from '@/hooks/useDebugPersonalization';
import { smartLogger } from '@/utils/smart-logger';

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
    startSession,
  } = useVisualizationStore();
  
  // 2. State hooks - simplified with AudioManager
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isChangingVoice, setIsChangingVoice] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPreparingVisualization, setIsPreparingVisualization] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [totalStepsToPreload, setTotalStepsToPreload] = useState(0);
  const [preparationMessage, setPreparationMessage] = useState('Find a comfortable space and take some deep breaths...');
  const [userState, setUserState] = useState<'loading' | 'preparing' | 'ready' | 'playing'>('loading');
  const [isReadyToStart, setIsReadyToStart] = useState(false);
  const [hasPlayedPreparationAudio, setHasPlayedPreparationAudio] = useState(false);
  
  // 3. Refs - simplified with AudioManager
  const isMounted = useRef(true);
  const isNavigating = useRef(false);
  const preloadedAudioMap = useRef<Map<number, string>>(new Map());
  const ttsService = useRef(TTSFirebaseCache.getInstance()).current;
  const audioManager = useRef(AudioManager.getInstance()).current;
  const loadAudioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasPersonalizationBeenApplied = useRef(false);
  const isPreloadingAllSteps = useRef(false);
  const hasStartedInitialPreload = useRef(false);
  
  // 4. Get visualization data
  const visualization = getVisualizationById(id);
  
  // Debug session state changes
  useEffect(() => {
    smartLogger.log('session-state-change', `Session state changed: ${currentSession ? 'EXISTS' : 'NULL'}`);
    if (currentSession) {
      smartLogger.log('session-details', `Session ID: ${currentSession.id}, Step: ${currentSession.currentStep}`);
    }
  }, [currentSession]);
  
  // Debug TTS preferences
  useEffect(() => {
    smartLogger.log('tts-preferences', `TTS Enabled: ${preferences.ttsEnabled}, Voice: ${preferences.ttsVoice}, AutoPlay: ${preferences.autoPlayTTS}`);
  }, [preferences.ttsEnabled, preferences.ttsVoice, preferences.autoPlayTTS]);
  
  // 4.5. Get personalized content
  const { 
    personalizedSteps, 
    isGenerating: isGeneratingPersonalization,
    error: personalizationError 
  } = usePersonalizedVisualization(visualization || {} as any, {
    forceRegenerate: false,
  });
  
  // 4.6. AudioManager subscription and cleanup
  useEffect(() => {
    const unsubscribe = audioManager.subscribe((status) => {
      if (!isMounted.current) return;
      
      // Don't update loading state if we're changing voice (prevents flicker)
      if (!isChangingVoice) {
        setIsLoadingAudio(status.isLoading);
      }
      setIsPlaying(status.isPlaying);
      setAudioError(status.error || null);
      
      if (status.didJustFinish) {
        smartLogger.log('audio-finished', 'Audio finished playing');
        
        // Auto-advance to next step if enabled (but not during voice change)
        if (preferences.autoProgress && visualization && currentSession && !isChangingVoice) {
          const steps = personalizedSteps || visualization.steps;
          const isLast = currentSession.currentStep === steps.length - 1;
          if (!isLast) {
            setTimeout(() => {
              if (isMounted.current && !isChangingVoice) {
                nextStep();
              }
            }, 1000);
          }
        }
      }
    });
    
    return unsubscribe;
  }, [audioManager, preferences.autoProgress, visualization, currentSession, personalizedSteps, nextStep, isChangingVoice]);
  
  // 4.7. Play preparation audio once during loading
  useEffect(() => {
    if (isPreparingVisualization && !hasPlayedPreparationAudio && (preferences.ttsEnabled ?? true) && disableAudio !== 'true') {
      setHasPlayedPreparationAudio(true);
      
      const playPreparationAudio = async () => {
        try {
          const preparationText = "Find a comfortable space and take some deep breaths. Your visualization will start automatically when ready.";
          
          const audioUri = await ttsService.synthesizeSpeech(preparationText, {
            voice: preferences.ttsVoice ?? '21m00Tcm4TlvDq8ikWAM',
            model: preferences.ttsModel ?? 'eleven_multilingual_v2',
            speed: preferences.ttsSpeed ?? 1.0,
          });
          
          if (isMounted.current && isPreparingVisualization) {
            await audioManager.playAudioFromUri(audioUri, {
              volume: preferences.volume ?? 0.8,
            });
          }
        } catch (error) {
          smartLogger.log('preparation-audio-error', `Failed to play preparation audio: ${error}`);
        }
      };
      
      // Add small delay before playing preparation audio
      setTimeout(playPreparationAudio, 500);
    }
  }, [isPreparingVisualization, hasPlayedPreparationAudio, preferences.ttsEnabled, disableAudio, preferences.ttsVoice, preferences.ttsModel, preferences.ttsSpeed, preferences.volume, ttsService, audioManager]);
  
  // 4.8. Simple cleanup function
  const cleanupAudio = useCallback(async () => {
    smartLogger.log('audio-cleanup', 'Cleaning up audio...');
    
    // Clear any pending audio load timeout
    if (loadAudioTimeoutRef.current) {
      clearTimeout(loadAudioTimeoutRef.current);
      loadAudioTimeoutRef.current = null;
    }
    
    // Stop audio using AudioManager
    try {
      await audioManager.stop();
      smartLogger.log('audio-cleanup-success', 'Audio cleanup completed successfully');
    } catch (error) {
      smartLogger.log('audio-cleanup-error', `Audio cleanup failed: ${error}`);
      throw error; // Re-throw so callers can handle it
    }
  }, [audioManager]);
  
  // 5. Prevent screen from sleeping
  useKeepAwake();
  
  // 5.5. Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      smartLogger.log('app-state-change', `App state changed to: ${nextAppState}`);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        smartLogger.log('app-background', 'App went to background/inactive, stopping audio');
        cleanupAudio().catch(error => {
          console.error('Error during app background cleanup:', error);
          // Force stop as fallback
          audioManager.forceStop();
        });
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [cleanupAudio, audioManager]);
  
  // 5.6. Handle screen focus/blur events
  useFocusEffect(
    useCallback(() => {
      smartLogger.log('screen-focus', 'Visualization player screen focused');
      
      // Cleanup function runs when screen loses focus
      return () => {
        smartLogger.log('screen-blur', 'Visualization player screen lost focus, cleaning up audio');
        // Ensure audio stops immediately when leaving the screen
        cleanupAudio().catch(error => {
          console.error('Error during screen blur cleanup:', error);
        });
      };
    }, [cleanupAudio])
  );
  
  // 6. Safe step tracking
  const currentStep = currentSession?.currentStep ?? 0;
  
  // Verify step alignment
  useEffect(() => {
    if (currentSession && currentStep !== currentSession.currentStep) {
      console.warn(`Step mismatch detected! currentStep: ${currentStep}, currentSession.currentStep: ${currentSession.currentStep}`);
    }
  }, [currentStep, currentSession]);
  
  // 7. Component lifecycle management with AudioManager
  useEffect(() => {
    isMounted.current = true;
    return () => {
      smartLogger.log('component-unmount', '=== Component unmounting, cleaning up audio ===');
      isMounted.current = false;
      isNavigating.current = false;
      
      // Clear any pending audio loads
      if (loadAudioTimeoutRef.current) {
        clearTimeout(loadAudioTimeoutRef.current);
        loadAudioTimeoutRef.current = null;
      }
      
      // Immediately stop audio using AudioManager
      audioManager.stop().catch(error => {
        console.error('Error stopping audio during unmount:', error);
      });
    };
  }, [audioManager]);
  
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
            voice: preferences.ttsVoice ?? '21m00Tcm4TlvDq8ikWAM',
            model: preferences.ttsModel ?? 'eleven_multilingual_v2',
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
    smartLogger.log('preload-start', 'Starting full preload of all visualization steps...');
    
    const steps = personalizedSteps || visualization.steps;
    setTotalStepsToPreload(steps.length);
    setPreloadProgress(0);
    
    // Set a single, calming preparation message
    setPreparationMessage('Find a comfortable space and take some deep breaths. Your visualization will start automatically when ready.');
    
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
            voice: preferences.ttsVoice ?? '21m00Tcm4TlvDq8ikWAM',
            model: preferences.ttsModel ?? 'eleven_multilingual_v2',
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
      
      smartLogger.log('preload-complete', 'All steps preloaded successfully!');
      
      // Handle preload completion with proper state transitions
      await handlePreloadComplete();
      
    } catch (error) {
      console.error('Error during full preload:', error);
      // Start anyway even if some preloading failed
      await handlePreloadComplete();
    } finally {
      isPreloadingAllSteps.current = false;
    }
  }, [visualization, currentSession, preferences, ttsService, personalizedSteps]);

  // Handle preload completion with proper state transitions
  const handlePreloadComplete = useCallback(async () => {
    if (!isMounted.current) return;
    
    setUserState('preparing');
    setPreparationMessage('Take a deep breath and relax...');
    
    // Wait for user to settle (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (isMounted.current) {
      setUserState('ready');
      setPreparationMessage('Ready to begin - starting now...');
      
      // Wait 1 more second before starting audio
      setTimeout(() => {
        if (isMounted.current) {
          setUserState('playing');
          setIsReadyToStart(true);
          setIsPreparingVisualization(false);
          
          // Audio will be loaded by the effect that depends on userState
        }
      }, 1000);
    }
  }, []);

  // 14. Handle voice change with immediate audio stop and reload
  const handleVoiceChange = useCallback(async () => {
    if (isChangingVoice) {
      smartLogger.log('voice-change-skip', 'Voice change already in progress, skipping...');
      return;
    }
    
    try {
      setIsChangingVoice(true);
      smartLogger.log('voice-change', 'Voice changed - stopping audio immediately and reloading...');
      
      // IMMEDIATELY stop any currently playing audio
      await audioManager.stop();
      
      // Clear preloaded audio map since voice has changed
      preloadedAudioMap.current.clear();
      smartLogger.log('voice-change-clear', 'Cleared preloaded audio map');
      
      // Immediately reload current step with new voice (no delay)
      if (isMounted.current && currentSession && (preferences.ttsEnabled ?? true)) {
        smartLogger.log('voice-change-reload', 'Immediately reloading current step with new voice...');
        
        // Load new audio immediately with the new voice
        await loadTTSAudio();
      }
    } catch (error) {
      smartLogger.log('voice-change-error', `Voice change failed: ${error}`);
    } finally {
      if (isMounted.current) {
        setIsChangingVoice(false);
      }
    }
  }, [audioManager, currentSession, preferences.ttsEnabled, isChangingVoice]);

  // 15. Simplified audio loading function using AudioManager
  const loadAudioForCurrentStep = useCallback(async () => {
    if (!isMounted.current || !visualization || !currentSession) return;
    
    // DON'T play audio if still loading or user not ready
    if (userState !== 'playing' || !isReadyToStart) {
      smartLogger.log('audio-blocked', '⏸️ Audio load blocked - user not ready');
      return;
    }
    
    // Prevent concurrent audio loads
    if (audioManager.isCurrentlyLoading()) {
      smartLogger.log('audio-loading-skip', 'Audio already loading, skipping...');
      return;
    }
    
    const steps = personalizedSteps || visualization.steps;
    const currentStepData = steps[currentSession.currentStep];
    
    if (!currentStepData) {
      smartLogger.log('audio-error', `No step data for step ${currentSession.currentStep}`);
      return;
    }
    
    smartLogger.log('audio-loading', `=== Loading TTS Audio for step ${currentSession.currentStep} ===`);
    smartLogger.log('audio-content', `Content preview: ${currentStepData.content.substring(0, 100)}...`);
    
    try {
      // Get audio URI from cache-first TTS service
      const audioUri = await ttsService.synthesizeSpeech(currentStepData.content, {
        voice: preferences.ttsVoice ?? '21m00Tcm4TlvDq8ikWAM',
        model: preferences.ttsModel ?? 'eleven_multilingual_v2',
        speed: preferences.ttsSpeed ?? 1.0,
        isPersonalized: !!personalizedSteps,
      });
      
      smartLogger.log('cache-result', `Audio URI obtained: ${audioUri.substring(0, 50)}...`);
      
      // Play audio if auto-play is enabled and not paused
      if ((preferences.autoPlayTTS ?? true) && !isPaused && isMounted.current) {
        await audioManager.playAudioFromUri(audioUri, {
          volume: preferences.volume ?? 0.8,
        });
      }
      
    } catch (error: any) {
      smartLogger.log('audio-error', `TTS failed: ${error}`);
      
      // Show user-friendly error messages
      if (error.message?.includes('quota_exceeded')) {
        Alert.alert(
          'API Quota Exceeded',
          'Your ElevenLabs account has run out of credits. Please add more credits to continue using text-to-speech.',
          [{ text: 'OK' }]
        );
      } else if (error.message?.includes('Invalid API key')) {
        Alert.alert(
          'Configuration Error',
          'Invalid ElevenLabs API key. Please check your configuration.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Audio Error',
          `Unable to generate speech: ${error.message}`,
          [{ text: 'OK' }]
        );
      }
    }
  }, [
    visualization,
    currentSession,
    userState,
    isReadyToStart,
    isPaused,
    preferences,
    personalizedSteps,
    ttsService,
    audioManager
  ]);

  // 16. Main TTS Audio loading function (now just calls the simplified function)
  const loadTTSAudio = useCallback(async () => {
    await loadAudioForCurrentStep();
  }, [loadAudioForCurrentStep]);
  
  // 17. Cache-aware preloading for upcoming steps
  const preloadUpcomingSteps = useCallback(async () => {
    if (!visualization || !currentSession || !isMounted.current) return;
    
    const steps = personalizedSteps || visualization.steps;
    const upcomingIndices: number[] = [];
    
    // Add next 2-3 steps for smoother experience
    for (let i = 1; i <= 3; i++) {
      if (currentStep + i < steps.length) {
        upcomingIndices.push(currentStep + i);
      }
    }
    
    if (upcomingIndices.length === 0) return;
    
    smartLogger.log('preload-start', `Cache-aware preloading for steps: ${upcomingIndices.join(', ')}`);
    
    for (const stepIndex of upcomingIndices) {
      if (!isMounted.current) break;
      
      try {
        const stepData = steps[stepIndex];
        smartLogger.log('preload-step', `Preloading step ${stepIndex} (cache-aware)`);
        
        // Use cache-first strategy - this will check cache before generating
        const audioUri = await ttsService.synthesizeSpeech(stepData.content, {
          voice: preferences.ttsVoice ?? '21m00Tcm4TlvDq8ikWAM',
          model: preferences.ttsModel ?? 'eleven_multilingual_v2',
          speed: preferences.ttsSpeed ?? 1.0,
          isPersonalized: !!personalizedSteps,
        });
        
        if (isMounted.current) {
          preloadedAudioMap.current.set(stepIndex, audioUri);
          smartLogger.log('preload-success', `✅ Preloaded step ${stepIndex}`);
        }
      } catch (error) {
        smartLogger.log('preload-error', `Failed to preload step ${stepIndex}: ${error}`);
      }
      
      // Add small delay between preloads to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }, [currentStep, visualization, currentSession, preferences, ttsService, personalizedSteps]);
  
  // 18. Trigger upcoming steps preloading after audio loads
  useEffect(() => {
    if (!isLoadingAudio && isPlaying && currentSession && visualization) {
      // Preload upcoming steps after a short delay
      const preloadTimer = setTimeout(() => {
        if (isMounted.current) {
          preloadUpcomingSteps();
        }
      }, 1500); // Wait 1.5 seconds after audio starts playing
      
      return () => clearTimeout(preloadTimer);
    }
  }, [isLoadingAudio, isPlaying, currentSession, visualization, preloadUpcomingSteps]);
  
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
      smartLogger.log('personalized-content-ready', '✅ Cleared preloaded audio map for personalized content');
      
      // Debug session state at this point
      smartLogger.log('personalized-content-session', `Session state after personalization: ${currentSession ? 'EXISTS' : 'NULL'}`);
      
      // Force reload audio for current step with personalized content
      if (currentSession && (preferences.ttsEnabled ?? true)) {
        setTimeout(() => {
          if (isMounted.current && !audioManager.isCurrentlyLoading()) {
            loadTTSAudio();
          }
        }, 100);
      }
    }
  }, [personalizedSteps, isGeneratingPersonalization, currentSession, preferences.ttsEnabled]);
  
  // 16. Handle TTS audio when step changes with proper debouncing
  useEffect(() => {
    if (!isMounted.current) return;
    
    smartLogger.log('audio-effect-trigger', '=== Audio loading effect triggered ===');
    smartLogger.log('audio-effect-state', `currentSession: ${!!currentSession}, visualization: ${!!visualization}, ttsEnabled: ${preferences.ttsEnabled}, disableAudio: ${disableAudio}, isGeneratingPersonalization: ${isGeneratingPersonalization}, personalizedSteps: ${!!personalizedSteps}, currentStep: ${currentStep}`);
    
    // Debug session state
    if (!currentSession) {
      smartLogger.log('session-debug', 'No current session found - this may be the issue');
    }
    
    // Clear any pending audio load
    if (loadAudioTimeoutRef.current) {
      clearTimeout(loadAudioTimeoutRef.current);
      loadAudioTimeoutRef.current = null;
    }
    
    // Don't cancel audio generation here - only cancel when necessary
    // Commenting out: audioGenerationRef.current = audioGenerationRef.current + 1;
    
    if (currentSession && visualization && (preferences.ttsEnabled ?? true) && disableAudio !== 'true' && !isPreparingVisualization && userState === 'playing') {
      // Wait for personalization to complete before loading audio
      if (isGeneratingPersonalization) {
        smartLogger.log('audio-wait-personalization', 'Waiting for personalization to complete before loading audio');
        return;
      }
      
      smartLogger.log('audio-conditions-met', 'Conditions met, scheduling loadTTSAudio()');
      // Add longer delay to debounce rapid step changes and wait for personalized content
      loadAudioTimeoutRef.current = setTimeout(() => {
        if (isMounted.current && !isPreparingVisualization && !audioManager.isCurrentlyLoading() && userState === 'playing') {
          console.log('🎵 Audio load timer fired - calling loadTTSAudio');
          loadTTSAudio();
        } else {
          console.log('⚠️ Audio load timer fired but conditions no longer met:', {
            isMounted: isMounted.current,
            isPreparingVisualization,
            isLoadingAudio: audioManager.isCurrentlyLoading(),
            userState
          });
        }
      }, 800) as ReturnType<typeof setTimeout>; // Increased delay to 800ms to prevent audio cuts during rapid navigation
    } else {
      smartLogger.log('audio-conditions-not-met', 'Conditions not met, skipping audio load');
    }
    
    return () => {
      if (loadAudioTimeoutRef.current) {
        clearTimeout(loadAudioTimeoutRef.current);
        loadAudioTimeoutRef.current = null;
      }
    };
  }, [currentStep, currentSession, visualization, preferences.ttsEnabled, disableAudio, isPreparingVisualization, isGeneratingPersonalization, userState]);
  
  // 16.5. Stop audio when session is completed or abandoned
  useEffect(() => {
    // Stop audio immediately if session is no longer active
    if (!currentSession && audioManager.isCurrentlyPlaying()) {
      smartLogger.log('session-cleanup', 'No active session, stopping audio');
      audioManager.stop().catch(error => {
        console.error('Error stopping audio for inactive session:', error);
      });
    }
  }, [currentSession, audioManager]);
  
  // 17. Trigger initial preload when ready
  useEffect(() => {
    smartLogger.log('preload-trigger', '[Preload Trigger] Checking conditions:', {
      hasVisualization: !!visualization,
      hasSession: !!currentSession,
      isGeneratingPersonalization,
      isPreparingVisualization,
      ttsEnabled: preferences.ttsEnabled ?? true,
      disableAudio,
      hasStartedInitialPreload: hasStartedInitialPreload.current,
      hasPersonalizedSteps: !!personalizedSteps
    });
    
    // Start visualization flow if we have the basic requirements
    // Wait for personalized content to be ready if it's being generated
    if (visualization && currentSession && !isGeneratingPersonalization && isPreparingVisualization && !hasStartedInitialPreload.current) {
      hasStartedInitialPreload.current = true;
      smartLogger.log('preload-trigger-start', '[Preload Trigger] Starting visualization flow');
      smartLogger.log('preload-trigger-steps', '[Preload Trigger] Using steps:', personalizedSteps ? 'PERSONALIZED' : 'ORIGINAL');
      
      // If TTS is enabled and audio is not disabled, preload audio
      if ((preferences.ttsEnabled ?? true) && disableAudio !== 'true') {
        smartLogger.log('preload-trigger-audio', '[Preload Trigger] Preloading audio');
        preloadAllSteps();
      } else {
        smartLogger.log('preload-trigger-no-audio', '[Preload Trigger] Skipping audio preload, starting directly');
        // Skip audio preload and start directly
        handlePreloadComplete();
      }
    }
  }, [visualization, currentSession, isGeneratingPersonalization, preferences.ttsEnabled, disableAudio, preloadAllSteps, personalizedSteps, handlePreloadComplete]);
  
  // === EARLY RETURN AFTER ALL HOOKS ===
  if (!visualization) {
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
  
  // If no session exists but we have a visualization, try to start a session
  useEffect(() => {
    if (!currentSession && visualization) {
      smartLogger.log('session-recovery', 'No session found, attempting to start one');
      startSession(visualization.id);
    }
  }, [currentSession, visualization, startSession]);
  
  if (!currentSession) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: 16, marginTop: 16 }}>
            Starting visualization...
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
  const currentStepData = steps[currentSession?.currentStep ?? 0];
  const originalStepData = visualization.steps[currentSession?.currentStep ?? 0];
  const isLastStep = (currentSession?.currentStep ?? 0) === steps.length - 1;
  const progress = ((currentSession?.currentStep ?? 0) + 1) / steps.length;
  
  // Log current content to verify alignment
  if (currentStepData) {
    smartLogger.log('ui-render', `[UI Render] Step ${currentSession?.currentStep ?? 0}: ${currentStepData.content.substring(0, 80)}...`);
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
            try {
              await cleanupAudio();
            } catch (error) {
              console.error('Error during cleanup:', error);
            }
            
            // Failsafe: Force stop audio using AudioManager directly
            try {
              await audioManager.stop();
            } catch (error) {
              console.error('Error in failsafe audio stop:', error);
              // Emergency force stop
              audioManager.forceStop();
            }
            
            // Abandon session
            try {
              abandonSession();
            } catch (error) {
              console.error('Error abandoning session:', error);
            }
            
            // Navigate back to mental training
            router.push('/(tabs)/mental-training');
          }
        },
      ]
    );
  };

  const handlePreviousStep = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Don't cleanup audio immediately - let it fade naturally
    // The new audio will replace it when loaded
    previousStep();
  };

  const handleNextStep = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (isLastStep) {
      handleComplete();
    } else {
      // Don't cleanup audio immediately - let it fade naturally
      // The new audio will replace it when loaded
      nextStep();
    }
  };

  const handleComplete = async () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    
    // Immediate cleanup before navigation
    try {
      await cleanupAudio();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
    
    // Failsafe: Force stop audio using AudioManager directly
    try {
      await audioManager.stop();
    } catch (error) {
      console.error('Error in failsafe audio stop:', error);
      // Emergency force stop
      audioManager.forceStop();
    }
    
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
    
    // Navigate back to mental training
    router.push('/(tabs)/mental-training');
    
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
    
    if (!newValue && audioManager.isCurrentlyPlaying()) {
      await audioManager.stop();
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
      
      // Resume or start TTS playback using AudioManager
      if (audioManager.isCurrentlyPlaying()) {
        await audioManager.resume();
      } else if (!audioManager.isCurrentlyLoading()) {
        // Load and play TTS if not already loaded
        loadTTSAudio();
      }
    } else {
      pauseSession();
      
      // Pause TTS playback using AudioManager
      if (audioManager.isCurrentlyPlaying()) {
        await audioManager.pause();
      }
    }
  };

  const replayAudio = async () => {
    if (!(preferences.ttsEnabled ?? true) || isLoadingAudio) return;
    
    try {
      // Always reload the audio for current step
      loadTTSAudio();
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
            fontSize: 20, 
            marginBottom: 60, 
            fontWeight: '500', 
            textAlign: 'center',
            lineHeight: 28
          }}>
            {preparationMessage}
          </Text>
          
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 30 }} />
          
          <Text style={{ 
            color: colors.darkGray, 
            fontSize: 14, 
            textAlign: 'center',
            marginBottom: 40
          }}>
            Preparing your personalized visualization...
          </Text>
          
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
          Step {(currentSession?.currentStep ?? 0) + 1} of {steps.length}
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
              {isChangingVoice ? (
                <View style={styles.audioStatus}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.audioStatusText}>Changing voice...</Text>
                </View>
              ) : isLoadingAudio ? (
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
          style={[styles.sideButton, { opacity: (currentSession?.currentStep ?? 0) === 0 ? 0.3 : 0.6 }]}
          onPress={handlePreviousStep}
          disabled={(currentSession?.currentStep ?? 0) === 0}
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