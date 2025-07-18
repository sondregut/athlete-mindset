import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';
import { Play, Pause, Trophy, Target, Zap } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';
import { ELEVENLABS_VOICES } from '@/config/elevenlabs-config';

const { width, height } = Dimensions.get('window');

interface OnboardingVisualizationDemoProps {
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

export default function OnboardingVisualizationDemo({ step, onNext, onBack }: OnboardingVisualizationDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [intervalRef, setIntervalRef] = useState<ReturnType<typeof setInterval> | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  const ttsService = useRef(TTSFirebaseCache.getInstance());

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
      if (intervalRef) {
        clearInterval(intervalRef);
      }
    };
  }, [sound, intervalRef]);

  const handlePlayDemo = async () => {
    if (isPlaying) {
      // Stop demo
      if (sound) {
        await sound.stopAsync();
      }
      if (intervalRef) {
        clearInterval(intervalRef);
        setIntervalRef(null);
      }
      setIsPlaying(false);
      setProgress(0);
    } else {
      // Start demo with real audio
      await playDemoAudio();
    }
  };

  const playDemoAudio = async () => {
    try {
      setIsLoadingAudio(true);
      setIsPlaying(true);
      setProgress(0);
      
      // Demo script text
      const demoText = "Take a deep breath and close your eyes. Visualize yourself performing at your absolute best. Feel the confidence flowing through your body as you prepare for peak performance. This is just a taste of what our AI-powered visualizations can do for you.";
      
      // Generate audio
      const audioUrl = await ttsService.current.synthesizeSpeech(demoText, {
        voice: ELEVENLABS_VOICES.christina,
        model: 'eleven_multilingual_v2',
        speed: 1.0
      });
      
      if (audioUrl) {
        // Configure audio session
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
        });
        
        // Create and play audio
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 }
        );
        
        setSound(newSound);
        setIsLoadingAudio(false);
        
        // Simulate progress during audio playback
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 1.5;
          setProgress(currentProgress);
          
          if (currentProgress >= 100) {
            clearInterval(interval);
            setIntervalRef(null);
            setIsPlaying(false);
            setTimeout(() => {
              setProgress(0);
              newSound.unloadAsync();
              setSound(null);
              Alert.alert(
                'Demo Complete!',
                'This is just a preview. Experience the full power of personalized visualizations in the app.',
                [{ text: 'Got it!', style: 'default' }]
              );
            }, 500);
          }
        }, 100);
        
        setIntervalRef(interval);
        
        // Set up playback status listener
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            // Audio finished
            if (intervalRef) {
              clearInterval(intervalRef);
              setIntervalRef(null);
            }
            setProgress(100);
            setIsPlaying(false);
            setTimeout(() => {
              setProgress(0);
              newSound.unloadAsync();
              setSound(null);
              Alert.alert(
                'Demo Complete!',
                'Experience the full power of personalized visualizations in the app.',
                [{ text: 'Got it!', style: 'default' }]
              );
            }, 500);
          }
        });
      } else {
        throw new Error('Failed to generate demo audio');
      }
    } catch (error) {
      console.error('Demo audio error:', error);
      setIsLoadingAudio(false);
      setIsPlaying(false);
      setProgress(0);
      Alert.alert(
        'Demo Unavailable',
        'Audio demo is not available right now. You can still experience the full visualizations in the app!',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Trophy size={50} color={colors.primary} />
          <Target size={20} color={colors.secondary} style={styles.sparkle1} />
          <Zap size={16} color={colors.orange} style={styles.sparkle2} />
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>
        <Text style={styles.description}>{step.description}</Text>

        <View style={styles.demoContainer}>
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Peak Performance Visualization</Text>
            <Text style={styles.demoSubtitle}>Build confidence for your next competition</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {isLoadingAudio ? 'Loading audio...' : isPlaying ? `${Math.round(progress)}%` : 'Ready to play'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.playButton, { 
                backgroundColor: colors.primary,
                opacity: isLoadingAudio ? 0.7 : 1
              }]}
              onPress={handlePlayDemo}
              disabled={isLoadingAudio}
            >
              {isLoadingAudio ? (
                <Text style={{ color: colors.background, fontSize: 16 }}>...</Text>
              ) : isPlaying ? (
                <Pause size={24} color={colors.background} />
              ) : (
                <Play size={24} color={colors.background} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>What you'll experience:</Text>
            <View style={styles.benefitsList}>
              <Text style={styles.benefitItem}>• Sport-specific imagery and techniques</Text>
              <Text style={styles.benefitItem}>• Professional voice narration</Text>
              <Text style={styles.benefitItem}>• Personalized to your goals</Text>
              <Text style={styles.benefitItem}>• Science-backed methods</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Continue"
          onPress={onNext}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 100,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: -5,
    right: -15,
  },
  sparkle2: {
    position: 'absolute',
    bottom: -5,
    left: -15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  demoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  demoCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  demoSubtitle: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.mediumGray,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.darkGray,
    fontWeight: '500',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  benefitsContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  nextButton: {
    marginTop: 20,
  },
});