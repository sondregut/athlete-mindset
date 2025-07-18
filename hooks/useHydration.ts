import { useState, useEffect } from 'react';
import { usePersonalizationStore } from '@/store/personalization-store';

/**
 * Custom hook to determine if the Zustand store has been rehydrated.
 * This is essential to avoid using persisted state before it's loaded.
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(usePersonalizationStore.persist.hasHydrated);

  useEffect(() => {
    const unsubFinishHydration = usePersonalizationStore.persist.onFinishHydration(() => {
      console.log('✅ Store hydration finished.');
      setHydrated(true);
    });

    // Initial check in case hydration finished before the listener was set up
    if (usePersonalizationStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}
