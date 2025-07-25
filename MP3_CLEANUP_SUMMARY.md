# MP3 Cache Cleanup Implementation

## Overview
Old MP3 audio files have been replaced with WAV format for better compatibility with Gemini TTS. This document describes the cleanup implementation.

## Automatic Cleanup
The app now automatically cleans up old MP3 files when the cache service initializes:

### Location: `services/tts-firebase-cache-gemini.ts`
- `cleanupOldMP3Files()` - Runs on initialization
- Deletes all `.mp3` files from the cache directory
- Preserves new `.wav` files

## Manual Cleanup Options

### 1. Debug Screen
- **Location**: `app/debug-cache-cleanup.tsx`
- **Access**: Navigate to `/debug-cache-cleanup` in the app
- **Features**:
  - View cache statistics
  - Clean MP3 files only
  - Clear all cache
  - Refresh stats

### 2. Service Methods
```typescript
// Clean only MP3 files
const cacheService = TTSFirebaseCacheGemini.getInstance();
const deletedCount = await cacheService.cleanupMP3Files();

// Clear all cache
await cacheService.clearCache();
```

## File Format Changes
- **Old**: `.mp3` files (from ElevenLabs)
- **New**: `.wav` files (from Gemini TTS)
- **Format**: L16 PCM @ 24kHz

## User Impact
- First app launch after update will automatically clean MP3 files
- No user action required
- Audio files regenerate as needed
- Improved compatibility with iOS/Android audio players

## Technical Details

### Cache Structure
```
tts-cache-gemini/
├── tts_gemini_[hash].wav     # New format
├── tts_gemini_[hash].json    # Metadata
└── (old .mp3 files removed)
```

### Cleanup Process
1. Scan cache directory for `.mp3` files
2. Delete each MP3 file
3. Remove from cache index
4. Update cache size tracking
5. Log cleanup results

## Testing
Run the verification script to confirm cleanup:
```bash
node scripts/verify-gemini-integration.js
```

## Notes
- Firebase cache not automatically cleaned (shared resource)
- Local device cache cleaned on each app start
- No data loss - audio regenerates on demand