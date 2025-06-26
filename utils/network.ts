import { Platform } from 'react-native';

/**
 * Check if device has internet connectivity
 * Simplified approach that's more reliable across different environments
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    // In development mode, assume we're connected unless proven otherwise
    if (__DEV__) {
      console.log('Network check in development mode - assuming connected');
      // Always return true in development to avoid simulator issues
      return true;
    }
    
    // Use a simple, reliable endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    try {
      // Try Firebase first since our app uses it
      const response = await fetch('https://www.googleapis.com/robot.txt', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      
      // Any response (even 404) means we have internet
      return true;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Only return false if it's truly a network error
      if (fetchError instanceof TypeError && fetchError.message.includes('Network request failed')) {
        return false;
      }
      
      // For other errors (CORS, etc), assume we're online
      return true;
    }
  } catch (error) {
    console.warn('Network check error:', error);
    // Default to online to avoid blocking the app
    return true;
  }
};

/**
 * Check Firebase connectivity by making a simple test request
 */
export const checkFirebaseConnectivity = async (): Promise<boolean> => {
  try {
    // Try to fetch Firebase config endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('https://firebase.googleapis.com/v1alpha/projects', {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 401; // 401 is expected without auth
  } catch (error) {
    console.error('Firebase connectivity check failed:', error);
    return false;
  }
};

/**
 * Wait for network connectivity with timeout
 */
export const waitForNetwork = async (timeoutMs: number = 10000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const isConnected = await checkNetworkConnection();
    if (isConnected) {
      return true;
    }
    
    // Wait 500ms before checking again
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
};