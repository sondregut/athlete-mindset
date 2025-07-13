import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalizationProfile } from '@/types/personalization-profile';

interface UsePersonalizationProfileResult {
  profile: PersonalizationProfile | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

export function usePersonalizationProfile(): UsePersonalizationProfileResult {
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profileData = await AsyncStorage.getItem('userPersonalizationProfile');
      
      if (profileData) {
        const parsed = JSON.parse(profileData) as PersonalizationProfile;
        setProfile(parsed);
        console.log('[usePersonalizationProfile] Loaded profile:', {
          sport: parsed.sport_activity,
          goals: parsed.primary_goals?.length || 0,
          enabled: parsed.is_personalization_enabled,
        });
      } else {
        console.log('[usePersonalizationProfile] No profile found');
        setProfile(null);
      }
    } catch (err) {
      console.error('[usePersonalizationProfile] Error loading profile:', err);
      setError('Failed to load personalization profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const refreshProfile = async () => {
    await loadProfile();
  };

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
  };
}