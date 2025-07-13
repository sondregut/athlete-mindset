import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import AudioService from '../services/audio-service';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  details?: any;
}

export function NetworkDebugger() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], ...update };
      return newResults;
    });
  };

  const runTests = async () => {
    setTesting(true);
    const tests: TestResult[] = [
      { test: 'Basic HTTPS (Google)', status: 'pending', message: 'Testing...' },
      { test: 'OpenAI Domain', status: 'pending', message: 'Testing...' },
      { test: 'OpenAI API Auth', status: 'pending', message: 'Testing...' },
      { test: 'TTS API Call', status: 'pending', message: 'Testing...' },
      { test: 'AudioService Test', status: 'pending', message: 'Testing...' },
    ];
    setResults(tests);

    // Test 1: Basic HTTPS
    try {
      const response = await fetch('https://www.google.com/robots.txt');
      updateResult(0, { 
        status: 'success', 
        message: `OK (Status: ${response.status})` 
      });
    } catch (error: any) {
      updateResult(0, { 
        status: 'failed', 
        message: error.message,
        details: error 
      });
    }

    // Test 2: OpenAI Domain
    try {
      const response = await fetch('https://api.openai.com');
      updateResult(1, { 
        status: 'success', 
        message: `Reachable (Status: ${response.status})` 
      });
    } catch (error: any) {
      updateResult(1, { 
        status: 'failed', 
        message: error.message,
        details: error 
      });
    }

    // Test 3: OpenAI API with Auth
    try {
      const audioService = AudioService.getInstance();
      const isValid = await audioService.testAPIKey();
      updateResult(2, { 
        status: isValid ? 'success' : 'failed', 
        message: isValid ? 'API Key Valid' : 'API Key Invalid' 
      });
    } catch (error: any) {
      updateResult(2, { 
        status: 'failed', 
        message: error.message,
        details: error 
      });
    }

    // Test 4: Direct TTS API Call
    try {
      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: 'Test',
          voice: 'nova',
        }),
      });
      
      updateResult(3, { 
        status: response.ok ? 'success' : 'failed', 
        message: `Status: ${response.status}`,
        details: response.ok ? 'TTS endpoint working' : await response.text()
      });
    } catch (error: any) {
      updateResult(3, { 
        status: 'failed', 
        message: error.message,
        details: error 
      });
    }

    // Test 5: AudioService synthesis
    try {
      const audioService = AudioService.getInstance();
      const uri = await audioService.synthesizeSpeech('Hello test', { voice: 'nova' });
      updateResult(4, { 
        status: 'success', 
        message: 'Audio synthesized',
        details: uri 
      });
    } catch (error: any) {
      updateResult(4, { 
        status: 'failed', 
        message: error.message,
        details: error 
      });
    }

    setTesting(false);
  };

  const showDetails = (result: TestResult) => {
    Alert.alert(
      result.test,
      `Status: ${result.status}\nMessage: ${result.message}\n\nDetails: ${JSON.stringify(result.details, null, 2)}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Network Debugger</Text>
      
      <TouchableOpacity 
        style={[styles.button, testing && styles.buttonDisabled]} 
        onPress={runTests}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Running Tests...' : 'Run Network Tests'}
        </Text>
      </TouchableOpacity>

      {results.map((result, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.resultItem}
          onPress={() => showDetails(result)}
        >
          <View style={styles.resultHeader}>
            <Text style={styles.resultTest}>{result.test}</Text>
            <Text style={[
              styles.resultStatus,
              result.status === 'success' && styles.statusSuccess,
              result.status === 'failed' && styles.statusFailed,
            ]}>
              {result.status === 'pending' ? '⏳' : result.status === 'success' ? '✅' : '❌'}
            </Text>
          </View>
          <Text style={styles.resultMessage}>{result.message}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Debug Information:</Text>
        <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
        <Text style={styles.infoText}>React Native: {Platform.Version}</Text>
        <Text style={styles.infoText}>Dev Mode: {__DEV__ ? 'Yes' : 'No'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resultStatus: {
    fontSize: 18,
  },
  statusSuccess: {
    color: '#4CAF50',
  },
  statusFailed: {
    color: '#F44336',
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
  },
  infoSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});