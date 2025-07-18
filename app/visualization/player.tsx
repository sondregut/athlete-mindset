import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useUserStore } from '@/store/user-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { visualizationCacheService } from '@/services/visualization-cache-service';
import { BACKEND_URL, checkBackendConnection } from '@/constants/backend-config';
import templates from '@/constants/visualization-templates.json';

export default function VisualizationPlayerScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useUserStore();
  const { selectedVoice } = useOnboardingStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [personalizedSteps, setPersonalizedSteps] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState('');
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const template = templates.templates[0];
  
  const userSport = profile.sport === 'track-and-field' && profile.trackFieldEvent
    ? `Track & Field - ${profile.trackFieldEvent}`
    : profile.sport || '';

  useEffect(() => {
    loadPersonalizedContent();
    
    return () => {
      // Cleanup audio on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadPersonalizedContent = async () => {
    try {
      // First check local cache
      const cacheKey = await visualizationCacheService.generateCacheKey(
        template.id,
        { sport: userSport },
        selectedVoice || 'rachel'
      );
      
      const cachedEntry = await visualizationCacheService.getCacheEntry(cacheKey);
      
      if (cachedEntry && cachedEntry.status === 'COMPLETED' && cachedEntry.scriptText) {
        // Parse the script into steps
        const steps = parseScriptIntoSteps(cachedEntry.scriptText);
        setPersonalizedSteps(steps);
        setAudioUrl(cachedEntry.audioUrl || '');
        setLoading(false);
        
        // Load audio if available
        if (cachedEntry.audioUrl) {
          await loadAudio(cachedEntry.audioUrl);
        }
        return;
      }

      // Check backend connection
      const isBackendReachable = await checkBackendConnection();
      if (!isBackendReachable) {
        // Use mock data for development
        if (__DEV__) {
          const mockSteps = [
            "Find a comfortable space and close your eyes. Move your body to release tension, take deep breaths, and relax your mind.",
            `Create the setting: Place yourself in the environment where you'll be performing ${userSport}. See the venue, feel the atmosphere.`,
            `Mentally practice yourself performing the task in ${userSport} in the exact way you want to. For example, see yourself executing perfect form.`,
            "Notice how your body feels as you perform. What sensations do you experience? How does success feel?",
            "See yourself overcoming any challenges that arise. You handle them with confidence and skill.",
            "Feel the satisfaction of achieving your goal. Experience the emotions of success and accomplishment.",
            "What does performing 1 percent better look like? What changes? How do you carry out the action now? Push yourself.",
            "Take a deep breath and slowly open your eyes. You are ready to perform at your best."
          ];
          setPersonalizedSteps(mockSteps);
          setLoading(false);
          return;
        }
        
        throw new Error('Cannot connect to backend server');
      }

      // Fetch from backend
      const response = await fetch(`${BACKEND_URL}/personalize-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          inputs: { sport: userSport },
          voice_id: selectedVoice || 'rachel',
        }),
      });

      const data = await response.json();
      
      if (data.status === 'ready' && data.scriptText) {
        const steps = parseScriptIntoSteps(data.scriptText);
        setPersonalizedSteps(steps);
        setAudioUrl(data.audioUrl || '');
        
        // Cache the result
        await visualizationCacheService.setCacheEntry(cacheKey, {
          sport: userSport,
          templateId: template.id,
          voiceId: selectedVoice || 'rachel',
          scriptText: data.scriptText,
          audioUrl: data.audioUrl,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
        });
        
        // Load audio if available
        if (data.audioUrl) {
          await loadAudio(data.audioUrl);
        }
      }
    } catch (error) {
      console.error('Error loading personalized content:', error);
      Alert.alert('Error', 'Failed to load visualization. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const parseScriptIntoSteps = (script: string): string[] => {
    // Split by numbered steps or double line breaks
    const steps = script
      .split(/\n\n|\d+\.\s+/)
      .filter(step => step.trim().length > 0)
      .map(step => step.trim());
    
    // If we don't have enough steps, split by sentences
    if (steps.length < 5) {
      return script
        .split(/[.!?]\s+/)
        .filter(s => s.trim().length > 20)
        .map(s => s.trim() + '.');
    }
    
    return steps;
  };

  const loadAudio = async (url: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      
      // Set up audio status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          // Move to next step when audio finishes
          handleNext();
        }
      });
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < personalizedSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Visualization complete
      Alert.alert(
        'Visualization Complete',
        'Great job! You have completed the visualization.',
        [
          {
            text: 'Done',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlayPause = async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Visualization settings would be shown here');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading personalized visualization...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <Text style={styles.stepIndicator}>
            Step {currentStep + 1} of {personalizedSteps.length}
          </Text>
          
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handlePlayPause} style={styles.headerButton}>
              <Ionicons 
                name={isPlaying ? "volume-high" : "volume-mute"} 
                size={24} 
                color="#6B7280" 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
              <Ionicons name="settings-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / personalizedSteps.length) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.stepText}>
            {personalizedSteps[currentStep]}
          </Text>
          
          {audioUrl && (
            <View style={styles.audioIndicator}>
              <Ionicons name="volume-medium" size={20} color="#3B82F6" />
              <Text style={styles.audioText}>Playing narration</Text>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, currentStep === 0 && styles.disabledButton]}
            onPress={handlePrevious}
            disabled={currentStep === 0}
          >
            <Ionicons name="chevron-back" size={24} color={currentStep === 0 ? '#D1D5DB' : '#6B7280'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
          >
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="white" 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3E7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3E7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 40,
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  audioText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3B82F6',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});