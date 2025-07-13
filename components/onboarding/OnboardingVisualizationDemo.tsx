import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Brain, Trophy, Target, Zap, Play, Volume2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import OnboardingButton from './OnboardingButton';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';

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

const visualizationCategories = [
  {
    icon: <Trophy size={20} color={colors.primary} />,
    title: 'Pre-Competition',
    description: 'Prepare mentally for your best performance',
    color: colors.primary,
  },
  {
    icon: <Target size={20} color={colors.secondary} />,
    title: 'Goal Achievement',
    description: 'Visualize success and build confidence',
    color: colors.secondary,
  },
  {
    icon: <Brain size={20} color={colors.info} />,
    title: 'Focus Training',
    description: 'Sharpen concentration and mental clarity',
    color: colors.info,
  },
  {
    icon: <Zap size={20} color={colors.success} />,
    title: 'Recovery',
    description: 'Mental restoration and stress relief',
    color: colors.success,
  },
];

export default function OnboardingVisualizationDemo({ step, onNext, onBack }: OnboardingVisualizationDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playDemoAudio = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setIsPlaying(true);
      
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });
      
      // Create demo audio content
      const demoText = "Take a deep breath and close your eyes. Feel your strength building from within. You are confident, capable, and ready for any challenge that comes your way.";
      
      // Use actual TTS service for demo
      const ttsService = TTSFirebaseCache.getInstance();
      
      // Generate and play audio
      const audioUrl = await ttsService.synthesizeSpeech(demoText, {
        voice: 'nova', // Use a pleasant default voice
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
            setIsPlaying(false);
            newSound.unloadAsync();
            setSound(null);
          }
        });
      } else {
        // Fallback to timer if TTS fails
        setTimeout(() => {
          setIsPlaying(false);
        }, 8000); // 8 seconds for longer demo text
      }
      
    } catch (error) {
      console.error('Error playing demo audio:', error);
      setIsPlaying(false);
      // Fallback to timer
      setTimeout(() => {
        setIsPlaying(false);
      }, 8000);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{step.icon}</Text>
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        {/* What is Visualization */}
        <View style={styles.explanationCard}>
          <Text style={styles.explanationTitle}>What is Visualization?</Text>
          <Text style={styles.explanationText}>
            Mental imagery training where you vividly imagine performing at your best. 
            Used by Olympic athletes and professionals to:
          </Text>
          <View style={styles.benefitsList}>
            <Text style={styles.benefitItem}>• Improve technique without physical practice</Text>
            <Text style={styles.benefitItem}>• Build confidence before competitions</Text>
            <Text style={styles.benefitItem}>• Manage pre-performance anxiety</Text>
            <Text style={styles.benefitItem}>• Accelerate skill development</Text>
          </View>
        </View>

        {/* Categories Preview */}
        <Text style={styles.sectionTitle}>Visualization Categories:</Text>
        <View style={styles.categoriesContainer}>
          {visualizationCategories.map((category, index) => (
            <View key={index} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
                {category.icon}
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Audio Demo */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Try a Sample</Text>
          <Text style={styles.demoDescription}>
            Experience a real AI-guided visualization with natural voice narration
          </Text>
          <TouchableOpacity 
            style={[styles.playButton, isPlaying && styles.playingButton]}
            onPress={playDemoAudio}
            disabled={isPlaying}
          >
            {isPlaying ? (
              <>
                <Volume2 size={20} color={colors.background} />
                <Text style={styles.playButtonText}>Playing Demo...</Text>
              </>
            ) : (
              <>
                <Play size={20} color={colors.background} />
                <Text style={styles.playButtonText}>Play Demo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Actions */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
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
  },
  explanationCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  categoriesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 18,
  },
  demoCard: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  demoDescription: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  playButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playingButton: {
    backgroundColor: colors.secondary,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  actions: {
    gap: 12,
    paddingVertical: 20,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    marginBottom: 0,
  },
});