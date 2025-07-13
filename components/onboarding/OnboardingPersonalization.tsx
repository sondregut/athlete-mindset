import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';
import { Volume2, Play, Check, Settings } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/onboarding-store';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';

interface OnboardingPersonalizationProps {
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

const voices = [
  { id: 'nova', name: 'Nova', description: 'Warm and friendly' },
  { id: 'alloy', name: 'Alloy', description: 'Clear and neutral' },
  { id: 'echo', name: 'Echo', description: 'British accent' },
  { id: 'fable', name: 'Fable', description: 'Expressive and dynamic' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'shimmer', name: 'Shimmer', description: 'Soft and soothing' },
];

export default function OnboardingPersonalization({ step, onNext, onBack }: OnboardingPersonalizationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const { selectedVoice, setSelectedVoice } = useOnboardingStore();
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [selectedVoiceLocal, setSelectedVoiceLocal] = useState(selectedVoice || 'nova');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    // Animate content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleVoicePreview = async (voiceId: string) => {
    try {
      // Stop any currently playing audio
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setPlayingVoice(voiceId);
      
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });
      
      // Sample text for each voice
      const sampleText = "Hello! Welcome to your mindset journey. This is how I'll guide your visualization exercises to help you build confidence and focus.";
      
      // Use actual TTS service
      const ttsService = TTSFirebaseCache.getInstance();
      
      // Generate and play audio with the selected voice
      const audioUrl = await ttsService.synthesizeSpeech(sampleText, {
        voice: voiceId as any, // Cast to satisfy type checking
        speed: 1.0,
        model: 'tts-1'
      });
      
      if (audioUrl) {
        // Create and play the sound
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 }
        );
        
        setSound(newSound);
        
        // Set up playback status update to know when it finishes
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingVoice(null);
            newSound.unloadAsync();
            setSound(null);
          }
        });
      } else {
        // Fallback to timer if TTS fails
        setTimeout(() => {
          setPlayingVoice(null);
        }, 5000);
      }
      
    } catch (error) {
      console.error('Error playing voice preview:', error);
      setPlayingVoice(null);
      // Fallback to timer
      setTimeout(() => {
        setPlayingVoice(null);
      }, 5000);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 20,
    },
    content: {
      alignItems: 'center',
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    icon: {
      fontSize: 50,
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
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
      alignSelf: 'flex-start',
      width: '100%',
    },
    voicesContainer: {
      gap: 12,
      marginBottom: 24,
      width: '100%',
    },
    voiceCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    voiceCardSelected: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}05`,
    },
    voiceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    voiceInfo: {
      flex: 1,
    },
    voiceName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    voiceNameSelected: {
      color: colors.primary,
    },
    voiceDescription: {
      fontSize: 14,
      color: colors.darkGray,
    },
    playButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.primary}10`,
      borderRadius: 12,
      padding: 16,
      gap: 12,
      marginBottom: 20,
      width: '100%',
    },
    settingsText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
    },
    actions: {
      gap: 12,
      paddingHorizontal: 24,
      paddingBottom: 40,
      paddingTop: 20,
    },
    primaryButton: {
      marginBottom: 0,
    },
    secondaryButton: {
      marginBottom: 0,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{step.title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{step.subtitle}</Text>

          {/* Description */}
          <Text style={styles.description}>{step.description}</Text>

          {/* Voice Selection */}
          <Text style={styles.sectionTitle}>Choose Your AI Narrator</Text>
          <View style={styles.voicesContainer}>
            {voices.map((voice) => (
              <TouchableOpacity
                key={voice.id}
                style={[
                  styles.voiceCard,
                  selectedVoiceLocal === voice.id && styles.voiceCardSelected,
                ]}
                onPress={() => {
                  setSelectedVoiceLocal(voice.id);
                  setSelectedVoice(voice.id);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <View style={styles.voiceHeader}>
                  <View style={styles.voiceInfo}>
                    <Text style={[
                      styles.voiceName,
                      selectedVoiceLocal === voice.id && styles.voiceNameSelected
                    ]}>{voice.name}</Text>
                    <Text style={styles.voiceDescription}>{voice.description}</Text>
                  </View>
                  {selectedVoiceLocal === voice.id ? (
                    <View style={styles.checkCircle}>
                      <Check size={16} color={colors.background} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleVoicePreview(voice.id);
                      }}
                    >
                      {playingVoice === voice.id ? (
                        <Volume2 size={16} color={colors.primary} />
                      ) : (
                        <Play size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Settings */}
          <View style={styles.settingsCard}>
            <Settings size={20} color={colors.primary} />
            <Text style={styles.settingsText}>
              You can adjust narration speed and other preferences later
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Actions - Fixed at bottom */}
      <View style={styles.actions}>
        <OnboardingButton
          title="Continue"
          onPress={onNext}
          style={styles.primaryButton}
        />
      </View>
    </View>
  );
}