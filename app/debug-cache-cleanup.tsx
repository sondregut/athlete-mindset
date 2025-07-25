import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';
import { TTSFirebaseCacheGemini } from '@/services/tts-firebase-cache-gemini';
import { Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react-native';

export default function DebugCacheCleanupScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    mp3Count: number;
    completed: boolean;
  } | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const loadCacheStats = async () => {
    setIsLoading(true);
    try {
      const cacheService = TTSFirebaseCacheGemini.getInstance();
      const stats = await cacheService.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupMP3Files = async () => {
    Alert.alert(
      'Clean MP3 Files',
      'This will remove all old MP3 audio files from your device cache. New WAV files will be generated as needed. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const cacheService = TTSFirebaseCacheGemini.getInstance();
              const deletedCount = await cacheService.cleanupMP3Files();
              
              setCleanupResult({
                mp3Count: deletedCount,
                completed: true,
              });
              
              // Reload stats
              await loadCacheStats();
              
              Alert.alert(
                'Cleanup Complete',
                `Removed ${deletedCount} old MP3 files from cache.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Cleanup failed:', error);
              Alert.alert('Error', 'Failed to clean cache files');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const clearAllCache = async () => {
    Alert.alert(
      'Clear All Cache',
      'This will remove ALL cached audio files. They will be regenerated as needed. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const cacheService = TTSFirebaseCacheGemini.getInstance();
              await cacheService.clearCache();
              
              setCleanupResult(null);
              await loadCacheStats();
              
              Alert.alert('Success', 'All cache files cleared');
            } catch (error) {
              console.error('Clear cache failed:', error);
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  React.useEffect(() => {
    loadCacheStats();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>
            Cache Cleanup
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={{ backgroundColor: colors.info + '20', padding: 15, borderRadius: 10, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AlertCircle size={20} color={colors.info} style={{ marginRight: 10 }} />
            <Text style={{ color: colors.text, flex: 1 }}>
              The app now uses WAV format for better compatibility. Old MP3 files can be safely removed.
            </Text>
          </View>
        </View>

        {/* Cache Stats */}
        {cacheStats && (
          <View style={{ backgroundColor: colors.cardBackground, padding: 15, borderRadius: 10, marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
              Cache Statistics
            </Text>
            <View style={{ gap: 5 }}>
              <Text style={{ color: colors.mediumGray }}>
                Total Requests: {cacheStats.totalRequests}
              </Text>
              <Text style={{ color: colors.mediumGray }}>
                Local Cache Hits: {cacheStats.localCacheHits} ({cacheStats.localCacheHitRate})
              </Text>
              <Text style={{ color: colors.mediumGray }}>
                Firebase Cache Hits: {cacheStats.firebaseCacheHits} ({cacheStats.firebaseCacheHitRate})
              </Text>
              <Text style={{ color: colors.mediumGray }}>
                API Calls: {cacheStats.geminiApiCalls}
              </Text>
            </View>
          </View>
        )}

        {/* Cleanup Result */}
        {cleanupResult && (
          <View style={{ 
            backgroundColor: colors.success + '20', 
            padding: 15, 
            borderRadius: 10, 
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <CheckCircle size={20} color={colors.success} style={{ marginRight: 10 }} />
            <Text style={{ color: colors.text }}>
              Removed {cleanupResult.mp3Count} MP3 files
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ gap: 15 }}>
          <TouchableOpacity
            onPress={cleanupMP3Files}
            disabled={isLoading}
            style={{
              backgroundColor: colors.warning,
              padding: 16,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Trash2 size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  Clean MP3 Files
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={clearAllCache}
            disabled={isLoading}
            style={{
              backgroundColor: colors.error,
              padding: 16,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Trash2 size={20} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  Clear All Cache
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={loadCacheStats}
            disabled={isLoading}
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <RefreshCw size={20} color="white" style={{ marginRight: 10 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Refresh Stats
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={{ marginTop: 30, padding: 15, backgroundColor: colors.cardBackground, borderRadius: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
            When to Use
          </Text>
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.mediumGray }}>
              • Clean MP3 Files: Run once after app update to remove old format files
            </Text>
            <Text style={{ color: colors.mediumGray }}>
              • Clear All Cache: Use if experiencing audio playback issues
            </Text>
            <Text style={{ color: colors.mediumGray }}>
              • Cache will rebuild automatically as you use the app
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}