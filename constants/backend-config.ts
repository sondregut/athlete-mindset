// Backend API Configuration
// For local development, you need to use your computer's IP address instead of localhost
// when testing on physical devices or simulators

import { Platform } from 'react-native';
import { EXPO_PUBLIC_BACKEND_URL, EXPO_PUBLIC_BYPASS_BACKEND } from '@env';

// Get backend URL from environment variable or use default
const getBackendUrl = () => {
  // Check for environment variable first
  if (EXPO_PUBLIC_BACKEND_URL) {
    return EXPO_PUBLIC_BACKEND_URL;
  }
  
  // Default URLs for different environments
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'web') {
      // Web can use localhost
      return 'http://localhost:3000';
    } else {
      // Mobile devices need your computer's IP address
      // IMPORTANT: Replace this with your actual IP address
      // To find your IP:
      // - Mac: System Preferences > Network > Wi-Fi > Advanced > TCP/IP
      // - Windows: ipconfig in command prompt
      // - Linux: ip addr or ifconfig
      console.warn(
        'Using localhost for mobile app. This will not work!\n' +
        'Please set EXPO_PUBLIC_BACKEND_URL in your .env file to your computer\'s IP address.\n' +
        'Example: EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000'
      );
      return 'http://localhost:3000'; // This won't work on mobile!
    }
  } else {
    // Production mode - replace with your production API URL
    return 'https://api.your-domain.com';
  }
};

export const BACKEND_URL = getBackendUrl();

// Helper to check if backend is reachable
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    console.log(`🔍 Checking backend connection at: ${BACKEND_URL}/health`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Backend connection successful');
      return true;
    } else {
      console.log(`❌ Backend returned status: ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Backend connection check failed:', error.message);
    
    if (error.name === 'AbortError') {
      console.error('⏱️ Connection timeout - backend took too long to respond');
    } else if (error.message.includes('Network request failed')) {
      console.error('🌐 Network error - cannot reach backend server');
      console.error(`📍 Attempted URL: ${BACKEND_URL}`);
      
      if (BACKEND_URL.includes('localhost') && Platform.OS !== 'web') {
        console.error('\n⚠️  LOCALHOST DETECTED ON MOBILE DEVICE!');
        console.error('👉 Run: node scripts/find-ip-address.js');
        console.error('👉 Update .env with your computer\'s IP address');
        console.error('👉 Restart the Expo server after updating .env\n');
      }
    }
    
    return false;
  }
};

// Development mode flag to bypass backend requirement
export const BYPASS_BACKEND = EXPO_PUBLIC_BYPASS_BACKEND === 'true';