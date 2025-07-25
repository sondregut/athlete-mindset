import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { featureFlags } from '@/config/feature-flags';
import { UnifiedVisualizationService } from '@/services/unified-visualization-service';
import { CloudFunctionsService } from '@/services/cloud-functions-service';
import { useUserStore } from '@/store/user-store';
import { getVisualizationById } from '@/constants/visualizations';

export default function DebugCloudFunctionsScreen() {
  const colors = useThemeColors();
  const { profile } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [cloudFunctionsEnabled, setCloudFunctionsEnabled] = useState(false);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    const enabled = await featureFlags.isEnabled('useCloudFunctions');
    setCloudFunctionsEnabled(enabled);
    
    const service = UnifiedVisualizationService.getInstance();
    const status = await service.refreshProviderStatus();
    setProviderStatus(status);
  };
  
  const toggleCloudFunctions = async (value: boolean) => {
    setCloudFunctionsEnabled(value);
    await featureFlags.setFlag('useCloudFunctions', value);
    
    // Refresh provider status
    const service = UnifiedVisualizationService.getInstance();
    const status = await service.refreshProviderStatus();
    setProviderStatus(status);
    
    addTestResult(`Cloud Functions ${value ? 'enabled' : 'disabled'}`);
  };
  
  const addTestResult = (message: string) => {
    setTestResults(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };
  
  const testHealthCheck = async () => {
    setIsLoading(true);
    try {
      const cloudService = CloudFunctionsService.getInstance();
      const healthy = await cloudService.healthCheck();
      addTestResult(`Health check: ${healthy ? 'PASSED ✅' : 'FAILED ❌'}`);
    } catch (error: any) {
      addTestResult(`Health check error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const testPersonalization = async () => {
    setIsLoading(true);
    try {
      const service = UnifiedVisualizationService.getInstance();
      const result = await service.getPersonalizedVisualization({
        visualizationId: 'peak-performance-sports',
        userContext: {
          sport: profile?.sport || 'track-and-field',
          trackFieldEvent: profile?.trackFieldEvent,
        },
        baseContent: [],
        visualizationTitle: 'Peak Performance Sports',
        visualizationCategory: 'performance-process',
      });
      
      addTestResult(`Personalization successful! Steps: ${result.steps.length}`);
      addTestResult(`Provider: ${providerStatus?.activeProvider || 'unknown'}`);
      addTestResult(`First step preview: "${result.steps[0].content.substring(0, 50)}..."`);
    } catch (error: any) {
      addTestResult(`Personalization error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const testTTS = async () => {
    setIsLoading(true);
    try {
      const service = UnifiedVisualizationService.getInstance();
      const testText = "This is a test of the Cloud Functions TTS service.";
      const url = await service.generateTTS(testText, {
        voice: 'Kore',
        speed: 1.0,
      });
      
      addTestResult(`TTS generated successfully!`);
      addTestResult(`URL: ${url.substring(0, 50)}...`);
      addTestResult(`Provider: ${providerStatus?.activeProvider || 'unknown'}`);
    } catch (error: any) {
      addTestResult(`TTS error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const testPreload = async () => {
    setIsLoading(true);
    try {
      const service = UnifiedVisualizationService.getInstance();
      const result = await service.preloadVisualizationAudio(
        'peak-performance-sports',
        {
          sport: profile?.sport || 'track-and-field',
          trackFieldEvent: profile?.trackFieldEvent,
        },
        ['Kore'],
        {},
        (progress) => {
          addTestResult(`Preload progress: ${progress}%`);
        }
      );
      
      addTestResult(`Preload completed! Voices: ${result.size}`);
      const firstVoice = result.values().next().value;
      if (firstVoice) {
        addTestResult(`Steps preloaded: ${firstVoice.size}`);
      }
    } catch (error: any) {
      addTestResult(`Preload error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearResults = () => {
    setTestResults([]);
  };
  
  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    label: {
      fontSize: 16,
      color: colors.text,
    },
    value: {
      fontSize: 14,
      color: colors.secondary,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    resultsContainer: {
      maxHeight: 300,
      backgroundColor: '#000000',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
    },
    resultText: {
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#00FF00',
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    statusText: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '600' as const,
    },
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cloud Functions Debug',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.primary,
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Provider Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Status</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Active Provider:</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: providerStatus?.activeProvider === 'cloud' ? colors.success : colors.warning
              }]}>
                <Text style={styles.statusText}>
                  {providerStatus?.activeProvider?.toUpperCase() || 'UNKNOWN'}
                </Text>
              </View>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Cloud Functions Health:</Text>
              <Text style={styles.value}>
                {providerStatus?.cloudFunctionsHealthy ? '✅ Healthy' : '❌ Unhealthy'}
              </Text>
            </View>
          </View>
          
          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Enable Cloud Functions</Text>
              <Switch
                value={cloudFunctionsEnabled}
                onValueChange={toggleCloudFunctions}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
          
          {/* Tests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Function Tests</Text>
            
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={testHealthCheck}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Test Health Check</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={testPersonalization}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Test Personalization</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={testTTS}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Test TTS Generation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={testPreload}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Test Preload</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.error }]}
              onPress={clearResults}
            >
              <Text style={styles.buttonText}>Clear Results</Text>
            </TouchableOpacity>
          </View>
          
          {/* Results */}
          {testResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Test Results</Text>
              <ScrollView style={styles.resultsContainer}>
                {testResults.map((result, index) => (
                  <Text key={index} style={styles.resultText}>{result}</Text>
                ))}
              </ScrollView>
            </View>
          )}
          
          {isLoading && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}