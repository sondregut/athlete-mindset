# Firebase Blob Upload Fix

## Issue
The error "Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported" was occurring when trying to upload audio files to Firebase Storage. This is a React Native specific issue where the Blob constructor doesn't support ArrayBuffer/Uint8Array inputs.

## Solution
Replaced the custom `base64ToBlob` method with React Native's fetch API approach:

```typescript
// Old approach (not React Native compatible):
const byteArray = new Uint8Array(byteNumbers);
return new Blob([byteArray], { type: contentType });

// New approach (React Native compatible):
const blob = await fetch(`data:${contentType};base64,${fileString}`).then(r => r.blob());
```

## Changes Made
1. Updated `uploadToFirebase` method in `services/tts-firebase-cache-gemini.ts`
2. Removed unused `base64ToBlob` method
3. Used fetch API with data URI to create blobs

## Benefits
- Firebase uploads now work correctly in React Native
- Audio files are properly cached in Firebase Storage
- Cross-user caching is enabled, reducing API calls
- No change to local caching functionality

## Testing
To verify the fix:
1. Generate new audio in the app
2. Check console logs for "[TTSFirebaseCacheGemini] Uploaded to Firebase: ..." messages
3. Verify files appear in Firebase Storage Console under `tts-cache/` directory
4. Test that cached audio loads from Firebase on app restart

## Additional Notes
- The app was already working because local caching was functioning
- Firebase caching is a performance optimization for sharing audio across users
- Missing personalization templates (like public-speaking) use fallback content successfully