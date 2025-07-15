import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Stack } from 'expo-router';

export default function TestTTSScreen() {
  const colors = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Ready to test');
  const ttsService = TTSFirebaseCache.getInstance();

  const testTexts = [
    "Welcome to the Athlete Mindset app. This is a test of the text-to-speech functionality.",
    "Take a deep breath and focus on your goals.",
    "You are stronger than you think.",
  ];

  const testTTS = async (text: string) => {
    setIsLoading(true);
    setStatus('Testing TTS...');

    try {
      // Firebase TTS cache doesn't have testConnection method
      setStatus('Checking TTS service...');

      // Generate speech
      setStatus('Generating speech...');
      const audioUri = await ttsService.synthesizeSpeech(text, {
        voice: '21m00Tcm4TlvDq8ikWAM',
        model: 'eleven_multilingual_v2',
        speed: 1.0
      });

      // Play audio
      setStatus('Playing audio...');
      await ttsService.playAudio(audioUri);
      
      setStatus('Success! Audio is playing.');
    } catch (error: any) {
      console.error('TTS test failed:', error);
      setStatus(`Error: ${error.message}`);
      Alert.alert('TTS Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      await ttsService.clearLocalCache();
      Alert.alert('Success', 'TTS cache cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    status: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
      padding: 10,
      backgroundColor: colors.lightGray,
      borderRadius: 8,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
      alignItems: 'center',
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    clearButton: {
      backgroundColor: colors.error,
      marginTop: 20,
    },
    loader: {
      marginVertical: 20,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Test TTS' }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>TTS Test Screen</Text>
        
        <Text style={styles.status}>{status}</Text>
        
        {isLoading && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}
        
        {!isLoading && (
          <>
            {testTexts.map((text, index) => (
              <TouchableOpacity
                key={index}
                style={styles.button}
                onPress={() => testTTS(text)}
              >
                <Text style={styles.buttonText}>Test: "{text.substring(0, 30)}..."</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearCache}
            >
              <Text style={styles.buttonText}>Clear TTS Cache</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}