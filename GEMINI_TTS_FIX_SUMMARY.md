# Gemini TTS Fix Summary

## Issue
The Gemini TTS implementation was failing with the error: 
`models/gemini-2.5-flash-preview-tts is not found for API version v1beta`

## Root Cause
The JavaScript SDK (@google/generative-ai version 0.24.1) does not fully support audio response modalities yet. While the REST API supports TTS functionality, the SDK hasn't been updated to handle the audio-specific configuration properly.

## Solution Implemented

### 1. Confirmed Correct Model Name
- The correct model name is `gemini-2.5-flash-preview-tts` (not without the -tts suffix)
- Verified via REST API that this model exists and supports TTS

### 2. Implemented REST API Fallback
Created `services/gemini-tts-rest-service.ts` that:
- Makes direct REST API calls to Gemini API
- Handles audio response data properly
- Converts L16 PCM audio (24kHz) to WAV format
- Includes rate limiting to respect API limits

### 3. Updated GeminiTTSService
Modified `services/gemini-tts-service.ts` to:
- First attempt using the SDK
- Automatically fall back to REST API when SDK fails
- Cache the fallback state to avoid repeated SDK attempts
- Seamlessly handle both SDK and REST responses

### 4. Fixed TypeScript Types
Created `types/gemini-extended.ts` with extended interfaces:
- `GenerationConfigWithAudio` - includes responseModalities and speechConfig
- `ModelConfigWithAudio` - for model initialization
- These extend the official SDK types to include audio-specific properties

### 5. Updated Voice List
- Removed "Orbit" voice which isn't supported
- Updated voice mappings to use supported voices only
- Available voices: Kore, Aoede, Charon, Fenrir, Puck

## Technical Details

### REST API Request Format
```json
{
  "contents": [{
    "parts": [{ "text": "Your text here" }]
  }],
  "generationConfig": {
    "responseModalities": ["AUDIO"],
    "speechConfig": {
      "voiceConfig": {
        "prebuiltVoiceConfig": {
          "voiceName": "Kore"
        }
      }
    }
  }
}
```

### Audio Response Format
- MIME type: `audio/L16;codec=pcm;rate=24000`
- Format: 16-bit Linear PCM at 24kHz
- Encoding: Base64 in the API response
- Conversion: PCM data is converted to WAV format for playback

## Testing
- Direct REST API test: `bun run scripts/test-gemini-tts-fallback.ts`
- All voices tested and working (except Orbit)
- Audio generation successful with proper WAV conversion
- TypeScript compilation passes with extended types

## Future Considerations
1. Monitor @google/generative-ai SDK updates for native audio support
2. When SDK is updated, remove REST fallback code
3. Consider migrating to @google/genai package (newer SDK) when stable

## Impact
- TTS functionality is now working properly
- Seamless fallback ensures reliability
- No changes needed in consuming code
- All existing voice selections work correctly