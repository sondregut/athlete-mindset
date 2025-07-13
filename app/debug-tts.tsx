import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TTSFirebaseCache } from '@/services/tts-firebase-cache';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  details?: any;
}

export default function DebugTTSScreen() {
  const colors = useThemeColors();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    const ttsService = TTSFirebaseCache.getInstance();
    const stats = await ttsService.getCacheStats();
    setCacheStats(stats);
  };

  const runFirebaseUploadTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    const ttsService = TTSFirebaseCache.getInstance();
    const results: TestResult[] = [];

    try {
      results.push({
        test: 'Firebase Upload Test',
        status: 'pending',
        message: 'Starting test...',
      });
      setTestResults([...results]);

      await ttsService.testFirebaseUpload();
      
      results[results.length - 1] = {
        test: 'Firebase Upload Test',
        status: 'success',
        message: 'Test completed! Check console logs for detailed results.',
      };
    } catch (error: any) {
      results[results.length - 1] = {
        test: 'Firebase Upload Test',
        status: 'error',
        message: error.message,
        details: error,
      };
    }
    setTestResults([...results]);
    setIsRunning(false);
  };

  const uploadExistingCache = async () => {
    setIsRunning(true);
    setTestResults([]);
    const ttsService = TTSFirebaseCache.getInstance();
    const results: TestResult[] = [];

    try {
      results.push({
        test: 'Upload Existing Cache',
        status: 'pending',
        message: 'Uploading existing cache files to Firebase...',
      });
      setTestResults([...results]);

      await ttsService.uploadExistingCacheToFirebase();
      
      results[results.length - 1] = {
        test: 'Upload Existing Cache',
        status: 'success',
        message: 'Upload completed! Check console logs for summary.',
      };
    } catch (error: any) {
      results[results.length - 1] = {
        test: 'Upload Existing Cache',
        status: 'error',
        message: error.message,
        details: error,
      };
    }
    setTestResults([...results]);
    setIsRunning(false);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const ttsService = TTSFirebaseCache.getInstance();
    const results: TestResult[] = [];

    // Test 1: Basic network connectivity
    try {
      const response = await fetch('https://www.google.com/robots.txt');
      results.push({
        test: 'Basic Network Test (Google)',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Network connectivity OK' : `HTTP ${response.status}`,
      });
    } catch (error: any) {
      results.push({
        test: 'Basic Network Test (Google)',
        status: 'error',
        message: error.message,
        details: error,
      });
    }
    setTestResults([...results]);

    // Test 2: HTTPS SSL Test
    try {
      const response = await fetch('https://api.github.com');
      results.push({
        test: 'HTTPS/SSL Test (GitHub)',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'HTTPS requests working' : `HTTP ${response.status}`,
      });
    } catch (error: any) {
      results.push({
        test: 'HTTPS/SSL Test (GitHub)',
        status: 'error',
        message: error.message,
        details: error,
      });
    }
    setTestResults([...results]);

    // Test 3: OpenAI endpoint reachability
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'HEAD',
      });
      results.push({
        test: 'OpenAI Endpoint Reachability',
        status: 'success',
        message: `Endpoint reachable (${response.status})`,
      });
    } catch (error: any) {
      results.push({
        test: 'OpenAI Endpoint Reachability',
        status: 'error',
        message: error.message,
        details: error,
      });
    }
    setTestResults([...results]);

    // Test 4: Cache Stats
    try {
      const stats = await ttsService.getCacheStats();
      results.push({
        test: 'TTS Cache Stats',
        status: 'success',
        message: `Memory: ${stats.memoryCache} entries, Local: ${stats.localCache} entries`,
        details: stats,
      });
    } catch (error: any) {
      results.push({
        test: 'TTS Cache Stats',
        status: 'error',
        message: error.message,
        details: error,
      });
    }
    setTestResults([...results]);

    // Test 5: Simple TTS request
    try {
      const uri = await ttsService.synthesizeSpeech('Test audio generation', {
        voice: 'nova',
        model: 'tts-1',
        speed: 1.0,
      });
      results.push({
        test: 'TTS Audio Generation',
        status: 'success',
        message: 'Audio generated successfully',
        details: { uri },
      });
    } catch (error: any) {
      results.push({
        test: 'TTS Audio Generation',
        status: 'error',
        message: error.message,
        details: error,
      });
    }
    setTestResults([...results]);

    // Test 6: XMLHttpRequest test
    try {
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.openai.com/v1/models');
        xhr.setRequestHeader('Authorization', `Bearer ${process.env.OPENAI_API_KEY || 'test'}`);
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            results.push({
              test: 'XMLHttpRequest to OpenAI',
              status: 'success',
              message: `Status: ${xhr.status}`,
            });
            resolve(xhr.response);
          } else {
            results.push({
              test: 'XMLHttpRequest to OpenAI',
              status: 'error',
              message: `Status: ${xhr.status}`,
            });
            reject(new Error(`HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => {
          results.push({
            test: 'XMLHttpRequest to OpenAI',
            status: 'error',
            message: 'Network error',
          });
          reject(new Error('Network error'));
        };
        xhr.send();
      });
    } catch (error: any) {
      // Error already added in promise
    }
    setTestResults([...results]);


    setIsRunning(false);
  };

  const copyResults = () => {
    const text = testResults
      .map(r => `${r.test}: ${r.status} - ${r.message || 'No message'}`)
      .join('\n');
    Alert.alert('Test Results', text);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.darkGray,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    runButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    runButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    testResult: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      borderLeftWidth: 4,
    },
    testResultPending: {
      borderLeftColor: colors.darkGray,
    },
    testResultSuccess: {
      borderLeftColor: colors.success,
    },
    testResultError: {
      borderLeftColor: colors.error,
    },
    testName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    testMessage: {
      fontSize: 14,
      color: colors.darkGray,
    },
    testDetails: {
      fontSize: 12,
      color: colors.darkGray,
      marginTop: 4,
      fontFamily: 'monospace',
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.lightGray,
    },
    copyButton: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.darkGray,
      alignItems: 'center',
    },
    copyButtonText: {
      color: colors.text,
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Debug TTS Network',
          headerBackTitle: 'Back',
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>TTS Network Debugger</Text>
        <Text style={styles.subtitle}>
          Run tests to identify network connectivity issues
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cache Stats */}
        {cacheStats && (
          <View style={[styles.testResult, { marginBottom: 20, borderLeftColor: colors.primary }]}>
            <Text style={styles.testName}>Cache Statistics</Text>
            <Text style={styles.testMessage}>
              Total entries: {cacheStats.totalEntries}
            </Text>
            <Text style={styles.testMessage}>
              Total size: {(cacheStats.totalSize / 1024 / 1024).toFixed(2)} MB
            </Text>
            {cacheStats.oldestEntry && (
              <Text style={styles.testMessage}>
                Oldest: {cacheStats.oldestEntry.toLocaleDateString()}
              </Text>
            )}
            {cacheStats.newestEntry && (
              <Text style={styles.testMessage}>
                Newest: {cacheStats.newestEntry.toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.runButton, isRunning && { opacity: 0.6 }]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.runButtonText}>Run Network Tests</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.runButton, { backgroundColor: colors.error, marginBottom: 10 }]}
          onPress={async () => {
            const ttsService = TTSFirebaseCache.getInstance();
            await ttsService.clearLocalCache();
            await loadCacheStats();
            Alert.alert('Cache Cleared', 'TTS cache has been cleared successfully');
          }}
        >
          <Text style={styles.runButtonText}>Clear TTS Cache</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: '#ffe4b5', padding: 15, borderRadius: 10, marginBottom: 10 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10, color: colors.text }}>Firebase Upload Tests:</Text>
          <Text style={{ marginBottom: 5, color: colors.text }}>Before running these tests:</Text>
          <Text style={{ marginLeft: 10, fontSize: 12, marginBottom: 5, color: colors.text }}>
            1. Deploy TEST Firebase rules
          </Text>
          <Text style={{ marginLeft: 10, fontSize: 12, marginBottom: 5, color: colors.text }}>
            2. Check console logs for details
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.runButton, { backgroundColor: '#ff8c00', marginBottom: 10 }]}
          onPress={runFirebaseUploadTest}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.runButtonText}>Test Firebase Upload</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.runButton, { backgroundColor: '#28a745', marginBottom: 20 }]}
          onPress={uploadExistingCache}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.runButtonText}>Upload Existing Cache to Firebase</Text>
          )}
        </TouchableOpacity>

        {testResults.map((result, index) => (
          <View
            key={index}
            style={[
              styles.testResult,
              result.status === 'pending' && styles.testResultPending,
              result.status === 'success' && styles.testResultSuccess,
              result.status === 'error' && styles.testResultError,
            ]}
          >
            <Text style={styles.testName}>{result.test}</Text>
            {result.message && (
              <Text style={styles.testMessage}>{result.message}</Text>
            )}
            {result.details && (
              <Text style={styles.testDetails}>
                {JSON.stringify(result.details, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {testResults.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.copyButton} onPress={copyResults}>
            <Text style={styles.copyButtonText}>Show Results Summary</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}