import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import Card from '@/components/Card';
import templates from '@/constants/visualization-templates.json';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';
import { visualizationCacheService, PersonalizationResponse } from '@/services/visualization-cache-service';
import { PersonalizationRequest } from '@/types/visualization-template';
import { BACKEND_URL, checkBackendConnection } from '@/constants/backend-config';

export default function PersonalizationScreen() {
  const [loading, setLoading] = useState(false);
  const [personalizedScript, setPersonalizedScript] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Get selected voice from onboarding store
  const { selectedVoice } = useOnboardingStore();
  
  // Get user's sport from user store
  const { profile } = useUserStore();
  const userSport = profile.sport === 'track-and-field' && profile.trackFieldEvent
    ? `Track & Field - ${profile.trackFieldEvent}`
    : profile.sport || '';
  
  // Get the template (we only have one for now)
  const template = templates.templates[0];

  // Auto-trigger personalization when component mounts
  useEffect(() => {
    if (userSport && isInitializing) {
      setIsInitializing(false);
      handlePersonalize();
    } else if (!userSport && isInitializing) {
      setIsInitializing(false);
      Alert.alert(
        'No Sport Selected',
        'Please complete your profile to use personalized visualizations.',
        [
          {
            text: 'Go to Profile',
            onPress: () => router.push('/(tabs)/profile'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [userSport, isInitializing]);

  const handlePersonalize = async () => {
    if (!userSport) {
      Alert.alert('No Sport Selected', 'Please complete your profile first.');
      return;
    }

    setLoading(true);
    setShowResult(false);

    try {
      // First check local cache
      const cacheKey = await visualizationCacheService.generateCacheKey(
        template.id,
        { sport: userSport },
        selectedVoice || 'rachel'
      );
      
      const cachedEntry = await visualizationCacheService.getCacheEntry(cacheKey);
      
      if (cachedEntry && cachedEntry.status === 'COMPLETED' && cachedEntry.audioUrl) {
        // Use cached content
        console.log('Using cached visualization');
        setPersonalizedScript(cachedEntry.scriptText || '');
        setAudioUrl(cachedEntry.audioUrl);
        setShowResult(true);
        setLoading(false);
        return;
      }

      // Check backend connection first
      const isBackendReachable = await checkBackendConnection();
      if (!isBackendReachable) {
        // Provide a mock response for development
        if (__DEV__) {
          console.warn('⚠️ Backend unreachable - using mock response for development');
          
          // Simulate a delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Mock personalized script
          const mockScript = `Welcome to your personalized ${userSport} visualization.

1. Find a comfortable position and close your eyes. Take five deep breaths.

2. Bring your attention to your ${userSport} goals and aspirations.

3. Visualize yourself at your training venue for ${userSport}. See the environment clearly.

4. Hear the sounds of ${userSport} - the equipment, the atmosphere, the energy.

5. See yourself performing your key ${userSport} movements perfectly. Feel in complete control.

6. Connect with the pride and excitement of excelling in ${userSport}.

7. Mentally rehearse your next training session. See yourself taking action.

8. Take five more deep breaths and gently open your eyes.`;
          
          setPersonalizedScript(mockScript);
          setAudioUrl(''); // No audio in mock mode
          setShowResult(true);
          return;
        }
        
        throw new Error('Cannot connect to backend server. Please check your configuration.');
      }
      
      const response = await fetch(`${BACKEND_URL}/personalize-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          inputs: { sport: userSport },
          voice_id: selectedVoice || 'rachel', // Default to rachel if no voice selected
        } as PersonalizationRequest),
      });

      const data: PersonalizationResponse = await response.json();

      if (data.status === 'error') {
        throw new Error(data.error || 'Failed to personalize script');
      }

      if (data.status === 'generating') {
        // Show generating status
        Alert.alert(
          'Generating Your Visualization',
          `Your personalized visualization is being created. Estimated time: ${data.estimatedTime || 30} seconds`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Success - we have the personalized content
      if (data.scriptText) {
        setPersonalizedScript(data.scriptText);
      }
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
      }
      setShowResult(true);
      
      // Cache the successful result locally
      if (data.status === 'ready' && !data.cached) {
        await visualizationCacheService.setCacheEntry(cacheKey, {
          sport: userSport,
          templateId: template.id,
          voiceId: selectedVoice || 'rachel',
          scriptText: data.scriptText,
          audioUrl: data.audioUrl,
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Personalization error:', error);
      let errorMessage = 'Failed to personalize visualization';
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        errorMessage = 'Cannot connect to server. Please ensure:\n\n1. Backend server is running\n2. Backend URL is configured correctly\n3. Your device can reach the server';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Connection Error',
        errorMessage,
        [
          { text: 'Retry', onPress: handlePersonalize },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderTemplate = () => (
    <Card style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
        {template.name}
      </Text>
      <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
        {template.description}
      </Text>
      
      <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
        <Text style={{ fontSize: 14, color: '#374151', fontWeight: '500', marginBottom: 8 }}>Template Preview:</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={5}>
          {template.script.substring(0, 200)}...
        </Text>
      </View>
    </Card>
  );

  const renderSportInfo = () => (
    <Card style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
        Your Personalized Visualization
      </Text>
      
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
          Sport
        </Text>
        <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
          <Text style={{ fontSize: 16, color: '#111827' }}>
            {userSport || 'No sport selected'}
          </Text>
        </View>
      </View>

      {!showResult && (
        <Button
          title={loading ? "Generating..." : "Generate Visualization"}
          onPress={handlePersonalize}
          disabled={loading || !userSport}
          loading={loading}
          style={{ width: '100%' }}
        />
      )}
    </Card>
  );

  const renderResult = () => (
    <Card style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
          Your Personalized Visualization
        </Text>
        <TouchableOpacity
          onPress={() => {
            setShowResult(false);
            setPersonalizedScript('');
            setAudioUrl('');
            handlePersonalize(); // Re-generate
          }}
        >
          <Ionicons name="refresh-circle" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {audioUrl && (
        <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="volume-high" size={20} color="#10B981" />
            <Text style={{ marginLeft: 8, fontSize: 14, color: '#047857' }}>
              Audio visualization ready to play
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
            Audio URL: {audioUrl}
          </Text>
        </View>
      )}

      <ScrollView style={{ maxHeight: 384 }}>
        <Text style={{ fontSize: 14, color: '#374151', lineHeight: 24 }}>
          {personalizedScript || 'Loading personalized script...'}
        </Text>
      </ScrollView>

      {audioUrl && (
        <TouchableOpacity
          style={{ marginTop: 16, backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          onPress={() => {
            // Implement audio playback using expo-av or similar
            Alert.alert('Play Audio', 'Audio playback would be implemented here');
          }}
        >
          <Ionicons name="play-circle" size={24} color="white" />
          <Text style={{ marginLeft: 8, color: 'white', fontWeight: '600' }}>Play Visualization</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Personalized Visualization',
          headerBackTitle: 'Back',
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#F9FAFB' }}
      >
        <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 24 }}>
          {loading && !showResult && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 }}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
                Generating your personalized visualization...
              </Text>
            </View>
          )}
          
          {!loading && !showResult && (
            <>
              {renderTemplate()}
              {renderSportInfo()}
            </>
          )}
          
          {showResult && (
            <>
              {renderSportInfo()}
              {renderResult()}
            </>
          )}
          
          <View style={{ marginBottom: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}