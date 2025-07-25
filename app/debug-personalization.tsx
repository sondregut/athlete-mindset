import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePersonalizationProfile } from '@/hooks/usePersonalizationProfile';
import { usePersonalizationStore } from '@/store/personalization-store';
import { PersonalizationService } from '@/services/personalization-service';
import { PersonalizationRequest } from '@/types/personalization';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DebugPersonalizationScreen() {
  const colors = useThemeColors();
  const { profile, isLoading, error, refreshProfile } = usePersonalizationProfile();
  const { preferences } = usePersonalizationStore();
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('Checking...');
  const [testResult, setTestResult] = useState<string>('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [profileData, setProfileData] = useState<string>('');

  useEffect(() => {
    checkApiKey();
    loadRawProfileData();
  }, []);

  const checkApiKey = async () => {
    try {
      // Gemini-based personalization uses the unified API key
      const hasGeminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (hasGeminiKey) {
        setApiKeyStatus('✅ Gemini AI personalization (API key configured)');
      } else {
        setApiKeyStatus('⚠️ Gemini API key not found - personalization may fail');
      }
    } catch (error) {
      setApiKeyStatus('❌ Error checking service status');
    }
  };

  const loadRawProfileData = async () => {
    try {
      const data = await AsyncStorage.getItem('userPersonalizationProfile');
      setProfileData(data || 'No profile data found');
    } catch (error) {
      setProfileData('Error loading profile data');
    }
  };

  const testPersonalizationService = async () => {
    setIsTestingApi(true);
    setTestResult('Testing...');

    try {
      const service = PersonalizationService.getInstance();
      
      const testRequest: PersonalizationRequest = {
        userContext: {
          sport: (profile?.sport_activity || 'track-and-field') as any,
          trackFieldEvent: (profile?.specific_role || 'sprints-100m') as any,
        },
        visualizationId: 'peak-performance-sports',
        visualizationTitle: 'Peak Performance Sports Visualization',
        visualizationCategory: 'performance-process',
        baseContent: ['Take a deep breath and visualize yourself performing.'],
        tone: 'motivational',
        length: 'short',
      };

      const result = await service.generatePersonalizedVisualization(testRequest);
      setTestResult(`✅ Success! Generated ${result.steps.length} personalized steps. Model: ${result.model}`);
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 30,
      padding: 15,
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 10,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 5,
    },
    label: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    value: {
      color: colors.secondary,
      fontSize: 14,
      flex: 1,
      textAlign: 'right',
    },
    button: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    codeBlock: {
      backgroundColor: colors.cardBackground,
      padding: 10,
      borderRadius: 5,
      marginTop: 10,
    },
    codeText: {
      fontFamily: 'monospace',
      fontSize: 12,
      color: colors.secondary,
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Debug Personalization',
          headerStyle: { backgroundColor: colors.cardBackground },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Profile Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Status</Text>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Profile Loaded:</Text>
                  <Text style={styles.value}>{profile ? '✅ Yes' : '❌ No'}</Text>
                </View>
                {profile && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Sport:</Text>
                      <Text style={styles.value}>{profile.sport_activity || 'Not set'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Specific Role:</Text>
                      <Text style={styles.value}>{profile.specific_role || 'Not set'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Personalization Enabled:</Text>
                      <Text style={styles.value}>
                        {profile.is_personalization_enabled ? '✅ Yes' : '❌ No'}
                      </Text>
                    </View>
                  </>
                )}
                {error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
              </>
            )}
            <TouchableOpacity style={styles.button} onPress={refreshProfile}>
              <Text style={styles.buttonText}>Refresh Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Store Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Preferences</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Enabled:</Text>
              <Text style={styles.value}>{preferences.enabled ? '✅ Yes' : '❌ No'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Auto Personalize:</Text>
              <Text style={styles.value}>{preferences.autoPersonalize ? '✅ Yes' : '❌ No'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Preferred Tone:</Text>
              <Text style={styles.value}>{preferences.preferredTone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Content Length:</Text>
              <Text style={styles.value}>{preferences.contentLength}</Text>
            </View>
          </View>

          {/* Service Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personalization Service Status</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Service Type:</Text>
              <Text style={styles.value}>{apiKeyStatus}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.button, isTestingApi && { opacity: 0.6 }]} 
              onPress={testPersonalizationService}
              disabled={isTestingApi}
            >
              <Text style={styles.buttonText}>
                {isTestingApi ? 'Testing...' : 'Test Personalization Service'}
              </Text>
            </TouchableOpacity>
            {testResult && (
              <Text style={{ marginTop: 10, color: testResult.includes('✅') ? 'green' : 'red' }}>
                {testResult}
              </Text>
            )}
          </View>

          {/* Raw Profile Data */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Raw Profile Data</Text>
            <TouchableOpacity style={styles.button} onPress={loadRawProfileData}>
              <Text style={styles.buttonText}>Reload Raw Data</Text>
            </TouchableOpacity>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{profileData}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}