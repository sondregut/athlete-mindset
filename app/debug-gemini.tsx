import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { featureFlags } from '@/config/feature-flags';
import { GeminiCoreService } from '@/services/gemini-core-service';
import { PersonalizationService } from '@/services/personalization-service';
import { TTSService } from '@/services/tts-service';
import { geminiQuotaManager } from '@/services/gemini-quota-manager';

export default function DebugGeminiScreen() {
  const router = useRouter();
  const [flags, setFlags] = useState<any>({
    useGeminiAPI: true,
    geminiTTSEnabled: true,
    geminiPersonalizationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [geminiStatus, setGeminiStatus] = useState({
    configured: false,
    connected: false,
    error: '',
  });
  const [serviceStatus, setServiceStatus] = useState({
    personalization: '',
    tts: '',
  });
  const [quotaStatus, setQuotaStatus] = useState({
    checking: false,
    hasQuota: false,
    error: '',
    details: '',
  });
  const [localQuotaStatus, setLocalQuotaStatus] = useState({
    used: 0,
    limit: 0,
    percentage: 0,
    remaining: 0,
    resetTime: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    
    // Load feature flags
    const currentFlags = featureFlags.getFlags();
    setFlags(currentFlags);
    
    // Check Gemini status
    const configured = GeminiCoreService.isConfigured();
    let connected = false;
    let error = '';
    
    if (configured) {
      try {
        const geminiCore = GeminiCoreService.getInstance();
        connected = await geminiCore.validateConnection();
        if (!connected) {
          error = 'Failed to connect to Gemini API';
        }
      } catch (e: any) {
        error = e.message;
      }
    } else {
      error = 'GEMINI_API_KEY not configured';
    }
    
    setGeminiStatus({ configured, connected, error });
    
    // Check active services
    setServiceStatus({
      personalization: 'Excel-based',
      tts: 'Gemini',
    });
    
    // Check quota status if Gemini is configured
    if (configured) {
      checkQuotaStatus();
      updateLocalQuotaStatus();
    }
    
    setIsLoading(false);
  };
  
  const updateLocalQuotaStatus = async () => {
    const status = await geminiQuotaManager.getQuotaStatus();
    setLocalQuotaStatus({
      used: status.used,
      limit: status.limit,
      percentage: status.percentage,
      remaining: status.limit - status.used,
      resetTime: status.resetTime.toLocaleString(),
    });
  };

  const checkQuotaStatus = async () => {
    setQuotaStatus({ checking: true, hasQuota: false, error: '', details: '' });
    
    try {
      // Get API key from app config (since process.env doesn't work in React Native)
      const Constants = require('expo-constants').default;
      const apiKey = Constants.expoConfig?.extra?.geminiApiKey || '';
      
      // Test TTS generation to check quota
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: 'Quota test' }]
            }],
            generationConfig: {
              response_modalities: ['AUDIO'],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: {
                    voice_name: 'Kore'
                  }
                }
              }
            }
          })
        }
      );
      
      if (response.ok) {
        setQuotaStatus({
          checking: false,
          hasQuota: true,
          error: '',
          details: 'API quota available - TTS generation successful',
        });
      } else {
        const errorData = await response.json();
        
        if (response.status === 429) {
          let details = 'Daily quota exceeded. ';
          if (errorData.error?.details) {
            const violations = errorData.error.details
              .filter((d: any) => d.violations)
              .flatMap((d: any) => d.violations);
            
            if (violations.length > 0) {
              details += `Limit: ${violations[0].quotaMetric}`;
            }
          }
          
          setQuotaStatus({
            checking: false,
            hasQuota: false,
            error: 'Quota Exceeded',
            details: details + '\nQuotas reset at midnight Pacific Time.',
          });
        } else {
          setQuotaStatus({
            checking: false,
            hasQuota: false,
            error: `API Error (${response.status})`,
            details: errorData.error?.message || 'Unknown error',
          });
        }
      }
    } catch (error: any) {
      setQuotaStatus({
        checking: false,
        hasQuota: false,
        error: 'Connection Error',
        details: error.message,
      });
    }
  };

  const toggleFlag = async (key: string) => {
    const newValue = !flags[key];
    // Legacy flag toggling is no longer supported
    setFlags((prev: any) => ({ ...prev, [key]: newValue }));
  };

  const toggleMasterSwitch = async () => {
    const newValue = !flags.useGeminiAPI;
    await featureFlags.forceGemini(newValue);
    await loadData();
  };

  const testPersonalization = async () => {
    try {
      setIsLoading(true);
      const service = PersonalizationService.getInstance();
      
      const testRequest = {
        userContext: {
          sport: 'track-and-field' as const,
          trackFieldEvent: 'sprints-100m' as const,
        },
        visualizationId: 'peak-performance-sports',
        visualizationTitle: 'Peak Performance Sports Visualization',
        visualizationCategory: 'performance-process' as const,
        baseContent: ['Test content for personalization'],
      };
      
      const result = await service.generatePersonalizedVisualization(testRequest);
      
      Alert.alert(
        'Personalization Test Success',
        `Service: Excel-based\n` +
        `Model: ${result.model}\n` +
        `Steps: ${result.steps.length}\n` +
        `Cache Key: ${result.cacheKey.substring(0, 20)}...`
      );
    } catch (error: any) {
      Alert.alert('Personalization Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testTTS = async () => {
    try {
      setIsLoading(true);
      
      // Check quota first
      const quotaCheck = await geminiQuotaManager.canMakeRequest();
      if (!quotaCheck.allowed) {
        Alert.alert(
          'Quota Check Failed',
          `Cannot make request: ${quotaCheck.reason}\n\n` +
          `Current usage: ${localQuotaStatus.used}/${localQuotaStatus.limit}`
        );
        return;
      }
      
      const service = TTSService.getInstance();
      
      const testText = 'This is a test of the unified text to speech service with quota management.';
      const sound = await service.synthesizeAndPlay(testText, {
        voice: 'Kore',
        volume: 0.8,
      });
      
      if (sound) {
        // Update quota status after successful request
        await updateLocalQuotaStatus();
        
        const quotaStatus = await geminiQuotaManager.getQuotaStatus();
        Alert.alert(
          'TTS Test Success',
          `Service: Gemini\n` +
          `Voice: Kore\n` +
          `Quota used: ${quotaStatus.used}/${quotaStatus.limit} (${quotaStatus.percentage.toFixed(1)}%)\n\n` +
          'Audio is playing...'
        );
        
        // Stop after 3 seconds
        setTimeout(() => {
          service.stopCurrentAudio();
        }, 3000);
      } else {
        Alert.alert('TTS Test Failed', 'No sound returned');
      }
    } catch (error: any) {
      // Check if it's a quota error
      if (error.message?.includes('Quota') || error.message?.includes('quota')) {
        const quotaStatus = await geminiQuotaManager.getQuotaStatus();
        Alert.alert(
          'Quota Exceeded',
          `${error.message}\n\n` +
          `Current usage: ${quotaStatus.used}/${quotaStatus.limit}\n` +
          `Resets at: ${quotaStatus.resetTime.toLocaleString()}`
        );
      } else {
        Alert.alert('TTS Test Failed', error.message);
      }
    } finally {
      setIsLoading(false);
      // Always update quota status after test
      await updateLocalQuotaStatus();
    }
  };

  const showCacheStats = async () => {
    try {
      const personalizationService = PersonalizationService.getInstance();
      const ttsService = TTSService.getInstance();
      
      const personalizationStats = personalizationService.getStats();
      const ttsStats = await ttsService.getCacheStats();
      
      Alert.alert(
        'Cache Statistics',
        `=== Personalization ===\n` +
        `Service: ${(personalizationStats as any).service || 'Unknown'}\n` +
        `Total Requests: ${personalizationStats.totalRequests}\n` +
        `Cache Hits: ${personalizationStats.cacheHits}\n` +
        `API Calls: ${personalizationStats.apiCalls}\n` +
        `\n=== TTS ===\n` +
        `Service: ${(ttsStats as any).service || 'Unknown'}\n` +
        `Local Cache: ${(ttsStats as any).local?.entries || 0} entries\n` +
        `Firebase Cache: ${(ttsStats as any).firebase?.entries || 0} entries`
      );
    } catch (error: any) {
      Alert.alert('Stats Error', error.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>
          Gemini API Debug
        </Text>

        {/* Gemini Status */}
        <View style={{ backgroundColor: colors.cardBackground, padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
            Gemini Status
          </Text>
          <Text style={{ color: geminiStatus.configured ? colors.success : colors.error, marginBottom: 5 }}>
            • Configured: {geminiStatus.configured ? 'Yes' : 'No'}
          </Text>
          <Text style={{ color: geminiStatus.connected ? colors.success : colors.error, marginBottom: 5 }}>
            • Connected: {geminiStatus.connected ? 'Yes' : 'No'}
          </Text>
          {geminiStatus.error && (
            <Text style={{ color: colors.error, fontSize: 12 }}>
              Error: {geminiStatus.error}
            </Text>
          )}
        </View>

        {/* Active Services */}
        <View style={{ backgroundColor: colors.cardBackground, padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
            Active Services
          </Text>
          <Text style={{ color: colors.darkGray, marginBottom: 5 }}>
            • Personalization: {serviceStatus.personalization}
          </Text>
          <Text style={{ color: colors.darkGray }}>
            • Text-to-Speech: {serviceStatus.tts}
          </Text>
        </View>

        {/* Local Quota Tracking */}
        <View style={{ backgroundColor: colors.cardBackground, padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
              Local Quota Tracking
            </Text>
            <TouchableOpacity
              onPress={updateLocalQuotaStatus}
              style={{
                backgroundColor: colors.mediumGray,
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
                Update
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Tier Info */}
          <View style={{ 
            backgroundColor: geminiQuotaManager.getTierInfo().tier === 'paid' ? colors.success + '20' : colors.warning + '20',
            padding: 10,
            borderRadius: 5,
            marginBottom: 10
          }}>
            <Text style={{ 
              color: colors.text, 
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontSize: 12,
              marginBottom: 5
            }}>
              {geminiQuotaManager.getTierInfo().tier} TIER
            </Text>
            <Text style={{ color: colors.darkGray, fontSize: 11 }}>
              Daily limit: {geminiQuotaManager.getTierInfo().dailyLimit.toLocaleString()} requests
            </Text>
            <Text style={{ color: colors.darkGray, fontSize: 11 }}>
              Rate limit: {geminiQuotaManager.getTierInfo().rateLimit} requests {geminiQuotaManager.getTierInfo().rateLimitUnit}
            </Text>
          </View>
          
          <View style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ color: colors.darkGray }}>API Calls Today:</Text>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                {localQuotaStatus.used} / {localQuotaStatus.limit}
              </Text>
            </View>
            
            <View style={{ height: 8, backgroundColor: colors.lightGray, borderRadius: 4, overflow: 'hidden' }}>
              <View 
                style={{ 
                  height: '100%', 
                  backgroundColor: localQuotaStatus.percentage > 80 ? colors.error : 
                                 localQuotaStatus.percentage > 50 ? colors.warning : 
                                 colors.success,
                  width: `${Math.min(localQuotaStatus.percentage, 100)}%`
                }}
              />
            </View>
            
            <Text style={{ color: colors.darkGray, fontSize: 12, marginTop: 5 }}>
              {localQuotaStatus.percentage.toFixed(1)}% used • {localQuotaStatus.remaining} remaining
            </Text>
            
            <Text style={{ color: colors.darkGray, fontSize: 12, marginTop: 5 }}>
              Resets: {localQuotaStatus.resetTime}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={async () => {
              Alert.alert(
                'Reset Local Quota Tracking',
                'This will reset the local quota counter to 0. Use this if:\n\n' +
                '• The counter is out of sync with actual API usage\n' +
                '• You\'ve waited for the daily reset time\n' +
                '• You want to retry after upgrading to paid tier\n\n' +
                'Note: This only resets the local counter, not your actual API quota.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Reset', 
                    style: 'destructive',
                    onPress: async () => {
                      await geminiQuotaManager.resetQuota();
                      await updateLocalQuotaStatus();
                      Alert.alert(
                        'Local Counter Reset', 
                        'The local quota counter has been reset to 0.\n\n' +
                        'You can now try making API requests again. If you still get quota errors, ' +
                        'it means your actual API quota is still exceeded.'
                      );
                    }
                  }
                ]
              );
            }}
            style={{ marginTop: 10 }}
          >
            <Text style={{ color: colors.error, fontSize: 12, textAlign: 'center' }}>
              Reset Local Counter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quota Status */}
        <View style={{ backgroundColor: colors.cardBackground, padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>
              API Quota Status (Live Check)
            </Text>
            <TouchableOpacity
              onPress={() => {
                checkQuotaStatus();
                updateLocalQuotaStatus();
              }}
              disabled={quotaStatus.checking}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>
                {quotaStatus.checking ? 'Checking...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {quotaStatus.checking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Text style={{ 
                color: quotaStatus.hasQuota ? colors.success : colors.error, 
                marginBottom: 5,
                fontSize: 16,
                fontWeight: '600'
              }}>
                {quotaStatus.hasQuota ? '✅ Quota Available' : '❌ ' + (quotaStatus.error || 'Quota Check Failed')}
              </Text>
              {quotaStatus.details && (
                <Text style={{ color: colors.darkGray, fontSize: 12, marginTop: 5 }}>
                  {quotaStatus.details}
                </Text>
              )}
              <TouchableOpacity
                onPress={() => Alert.alert(
                  'Quota Information',
                  `You are on the ${geminiQuotaManager.getTierInfo().tier.toUpperCase()} tier.\n\n` +
                  (geminiQuotaManager.getTierInfo().tier === 'free' 
                    ? 'To increase your limits:\n\n' +
                      '1. Enable billing at:\n' +
                      'https://aistudio.google.com/app/billing\n\n' +
                      '2. Add to .env file:\n' +
                      'GEMINI_PAID_TIER=true\n\n' +
                      '3. Restart the app\n\n' +
                      'You\'ll get 2 million requests/day!'
                    : 'You have paid tier limits:\n' +
                      '• 2,000,000 requests per day\n' +
                      '• 2,000 requests per minute\n\n' +
                      'Monitor usage at:\n' +
                      'https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics'
                  )
                )}
                style={{ marginTop: 10 }}
              >
                <Text style={{ color: colors.primary, fontSize: 12, textDecorationLine: 'underline' }}>
                  {geminiQuotaManager.getTierInfo().tier === 'free' ? 'How to Increase Limits →' : 'View Usage Dashboard →'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Feature Flags */}
        <View style={{ backgroundColor: colors.cardBackground, padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
            Feature Flags
          </Text>

          {/* Master Switch */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 15,
            paddingBottom: 15,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: 'bold' }}>
                Use Gemini API (Master)
              </Text>
              <Text style={{ color: colors.darkGray, fontSize: 12 }}>
                Enable all Gemini features
              </Text>
            </View>
            <Switch
              value={flags.useGeminiAPI}
              onValueChange={toggleMasterSwitch}
              trackColor={{ false: colors.mediumGray, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Individual Flags */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 10,
            opacity: flags.useGeminiAPI ? 1 : 0.5
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 16 }}>
                Gemini TTS
              </Text>
              <Text style={{ color: colors.darkGray, fontSize: 12 }}>
                Use Gemini for voice synthesis
              </Text>
            </View>
            <Switch
              value={flags.geminiTTSEnabled}
              onValueChange={() => toggleFlag('geminiTTSEnabled')}
              trackColor={{ false: colors.mediumGray, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={!flags.useGeminiAPI}
            />
          </View>

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            opacity: flags.useGeminiAPI ? 1 : 0.5
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 16 }}>
                Gemini Personalization
              </Text>
              <Text style={{ color: colors.darkGray, fontSize: 12 }}>
                Use Gemini for text generation
              </Text>
            </View>
            <Switch
              value={flags.geminiPersonalizationEnabled}
              onValueChange={() => toggleFlag('geminiPersonalizationEnabled')}
              trackColor={{ false: colors.mediumGray, true: colors.primary }}
              thumbColor="#ffffff"
              disabled={!flags.useGeminiAPI}
            />
          </View>
        </View>

        {/* Test Actions */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
            Test Functions
          </Text>

          <TouchableOpacity
            onPress={testPersonalization}
            style={{
              backgroundColor: colors.primary,
              padding: 15,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold' }}>
              Test Personalization
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={testTTS}
            style={{
              backgroundColor: colors.primary,
              padding: 15,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold' }}>
              Test TTS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={showCacheStats}
            style={{
              backgroundColor: colors.mediumGray,
              padding: 15,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: colors.text, textAlign: 'center', fontWeight: 'bold' }}>
              Show Cache Stats
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={{ backgroundColor: colors.lightGray, padding: 15, borderRadius: 8, marginBottom: 40 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
            Instructions
          </Text>
          <Text style={{ color: colors.darkGray, marginBottom: 5 }}>
            1. Add GEMINI_API_KEY to your .env file
          </Text>
          <Text style={{ color: colors.darkGray, marginBottom: 5 }}>
            2. Restart the app for env changes to take effect
          </Text>
          <Text style={{ color: colors.darkGray, marginBottom: 5 }}>
            3. Enable the master switch to use Gemini
          </Text>
          <Text style={{ color: colors.darkGray }}>
            4. Test individual features with the buttons above
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}