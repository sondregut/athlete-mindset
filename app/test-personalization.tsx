import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePersonalizationProfile } from '@/hooks/usePersonalizationProfile';
import { usePersonalizedVisualization } from '@/hooks/usePersonalizedVisualization';
import { getVisualizationById } from '@/constants/visualizations';
import { OpenAIPersonalizationService } from '@/services/openai-personalization-service';

export default function TestPersonalizationScreen() {
  const colors = useThemeColors();
  const { profile, isLoading: profileLoading } = usePersonalizationProfile();
  const [testResult, setTestResult] = useState<string>('');
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  
  // Test with a specific visualization
  const testVisualization = getVisualizationById('pre-comp-focus');
  const { 
    personalizedSteps, 
    isGenerating, 
    error,
    stats 
  } = usePersonalizedVisualization(testVisualization || {} as any, {
    forceRegenerate: true,
  });

  useEffect(() => {
    let result = '=== Personalization Test Results ===\n\n';
    
    // Profile info
    result += `Profile Loaded: ${profile ? 'Yes' : 'No'}\n`;
    if (profile) {
      result += `Sport: ${profile.sport_activity}\n`;
      result += `Goals: ${profile.primary_goals?.join(', ')}\n`;
      result += `Experience: ${profile.experience_level}\n`;
      result += `Enabled: ${profile.is_personalization_enabled}\n`;
    }
    result += '\n';
    
    // Visualization info
    result += `Test Visualization: ${testVisualization?.title || 'Not found'}\n`;
    result += `Original Steps: ${testVisualization?.steps.length || 0}\n`;
    result += '\n';
    
    // Personalization status
    result += `Personalization Status:\n`;
    result += `- Generating: ${isGenerating ? 'Yes' : 'No'}\n`;
    result += `- Error: ${error || 'None'}\n`;
    result += `- Personalized Steps: ${personalizedSteps?.length || 0}\n`;
    result += '\n';
    
    // Compare content
    if (personalizedSteps && testVisualization) {
      result += `Content Comparison:\n\n`;
      result += `Original Step 1:\n"${testVisualization.steps[0]?.content.substring(0, 100)}..."\n\n`;
      result += `Personalized Step 1:\n"${personalizedSteps[0]?.content.substring(0, 100)}..."\n\n`;
    }
    
    // Stats
    if (stats) {
      result += `API Stats:\n`;
      result += `- Total Requests: ${stats.totalRequests}\n`;
      result += `- Cache Hits: ${stats.cacheHits}\n`;
      result += `- API Calls: ${stats.apiCalls}\n`;
    }
    
    setTestResult(result);
  }, [profile, testVisualization, personalizedSteps, isGenerating, error, stats]);

  const testAPIConnection = async () => {
    setIsTestingAPI(true);
    try {
      const service = OpenAIPersonalizationService.getInstance();
      const connected = await service.testConnection();
      setTestResult(prev => prev + `\n\nAPI Connection Test: ${connected ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    } catch (error: any) {
      setTestResult(prev => prev + `\n\nAPI Connection Test Error: ${error.message}`);
    } finally {
      setIsTestingAPI(false);
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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 20,
    },
    result: {
      fontFamily: 'monospace',
      fontSize: 12,
      color: colors.text,
      backgroundColor: colors.lightGray,
      padding: 15,
      borderRadius: 8,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: colors.background,
      fontWeight: '600',
    },
    loading: {
      marginTop: 20,
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Test Personalization',
          headerShown: true,
        }} 
      />
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Personalization Debug</Text>
        
        <Text style={styles.result}>{testResult}</Text>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={testAPIConnection}
          disabled={isTestingAPI}
        >
          <Text style={styles.buttonText}>
            {isTestingAPI ? 'Testing...' : 'Test API Connection'}
          </Text>
        </TouchableOpacity>
        
        {(profileLoading || isGenerating) && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.darkGray, marginTop: 10 }}>
              {profileLoading ? 'Loading profile...' : 'Generating personalized content...'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}