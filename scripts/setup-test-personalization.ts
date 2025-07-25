import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage for Node.js environment
const storage = new Map();

(global as any).AsyncStorage = {
  setItem: async (key: string, value: string) => {
    storage.set(key, value);
    console.log(`Stored ${key}`);
  },
  getItem: async (key: string) => storage.get(key) || null,
  removeItem: async (key: string) => storage.delete(key),
  clear: async () => storage.clear(),
};

async function setupTestPersonalization() {
  console.log('🔧 Setting up test personalization profile...\n');

  const testProfile = {
    id: 'test-user-123',
    sport_activity: 'track-and-field',
    specific_role: 'sprints-100m',
    experience_level: 'advanced',
    primary_goals: ['Improve speed', 'Mental toughness'],
    preferred_style: 'motivational',
    is_personalization_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // Store the profile
    await AsyncStorage.setItem('userPersonalizationProfile', JSON.stringify(testProfile));
    console.log('✅ Test profile created successfully!');
    console.log('\n📋 Profile details:');
    console.log(JSON.stringify(testProfile, null, 2));
    
    // Also ensure personalization preferences are enabled
    const preferences = {
      preferences: {
        enabled: true,
        autoPersonalize: true,
        preferredTone: 'motivational',
        contentLength: 'medium',
        includeContextualFactors: true,
        cachePersonalizedContent: true,
      },
      personalizedContentCount: 0,
    };
    
    await AsyncStorage.setItem('personalization-store', JSON.stringify({ state: preferences }));
    console.log('\n✅ Personalization preferences enabled!');
    
    console.log('\n🎉 Setup complete! You can now test personalization in the app.');
    console.log('\nTo verify, navigate to /debug-personalization in the app.');
    
  } catch (error) {
    console.error('❌ Error setting up test profile:', error);
  }
}

// Run the setup
setupTestPersonalization();