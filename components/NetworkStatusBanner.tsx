import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { checkNetworkConnection } from '@/utils/network';

export default function NetworkStatusBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [failureCount, setFailureCount] = useState(0);
  const slideAnim = new Animated.Value(-100);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    const checkConnection = async () => {
      try {
        const connected = await checkNetworkConnection();
        
        if (!connected) {
          // Increment failure count
          setFailureCount(prev => prev + 1);
          
          // Only show banner after 2 consecutive failures (more reliable)
          if (failureCount >= 1) {
            setIsConnected(false);
            setIsVisible(true);
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        } else {
          // Reset failure count on success
          setFailureCount(0);
          setIsConnected(true);
          
          if (isVisible) {
            // Hide banner when reconnected
            setTimeout(() => {
              Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
              }).start(() => setIsVisible(false));
            }, 2000); // Show "connected" message for 2 seconds
          }
        }
      } catch (error) {
        console.error('Error checking network status:', error);
        // Don't show banner on check errors
        setIsConnected(true);
      }
    };
    
    // Don't check immediately in development
    if (!__DEV__) {
      checkConnection();
    }
    
    // Check periodically with longer interval to avoid spam
    intervalId = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isVisible, failureCount]);

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.banner, 
        { transform: [{ translateY: slideAnim }] },
        isConnected ? styles.connectedBanner : styles.disconnectedBanner
      ]}
    >
      {isConnected ? (
        <>
          <Wifi size={16} color="#fff" />
          <Text style={styles.text}>Connected</Text>
        </>
      ) : (
        <>
          <WifiOff size={16} color="#fff" />
          <Text style={styles.text}>No Internet Connection</Text>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50, // Account for status bar
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  disconnectedBanner: {
    backgroundColor: colors.error,
  },
  connectedBanner: {
    backgroundColor: colors.success,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});