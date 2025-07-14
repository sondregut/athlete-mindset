import { useEffect } from 'react';

interface DebugInfo {
  component: string;
  event: string;
  data?: any;
}

export function useDebugPersonalization(component: string) {
  const log = (event: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] [${component}]`;
    
    console.log(`${prefix} ${event}`, data || '');
  };

  useEffect(() => {
    log('Component mounted');
    return () => {
      log('Component unmounted');
    };
  }, []);

  return { log };
}