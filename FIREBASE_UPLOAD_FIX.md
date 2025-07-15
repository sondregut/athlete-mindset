# Firebase Storage Upload Fix for React Native

## What was fixed

The TTS audio upload to Firebase Storage was failing due to React Native's lack of support for creating blobs from ArrayBuffer/ArrayBufferView. This is a known issue with Firebase Storage SDK v11 in React Native environments.

## Solution implemented

1. **Added react-native-blob-util** to package.json for proper blob support
2. **Created multiple upload strategies**:
   - Primary: react-native-blob-util (if available)
   - Fallback 1: XMLHttpRequest (placeholder)
   - Fallback 2: Firebase REST API with authentication
3. **Fixed error handling** to not report false success
4. **Added retry logic** with exponential backoff

## Installation steps

1. Install the new dependency:
```bash
bun install
# or
npm install
# or
yarn install
```

2. For iOS, you may need to run:
```bash
cd ios && pod install
```

3. Rebuild the app:
```bash
bunx rork start --clear
```

## Files modified/created

### Modified:
- `package.json` - Added react-native-blob-util dependency
- `services/tts-firebase-client.ts` - Updated to use new upload helper
- `services/tts-firebase-cache.ts` - Fixed error handling

### Created:
- `services/firebase-storage-upload.ts` - Main upload utility with fallbacks
- `services/firebase-storage-blob-util.ts` - react-native-blob-util implementation
- `services/firebase-storage-rest-api.ts` - REST API implementation
- `services/tts-firebase-upload-helper.ts` - High-level helper for TTS uploads

## Testing

1. Clear the app cache to force new uploads:
   - Settings > Apps > Your App > Clear Cache
   - Or reinstall the app

2. Open the app and navigate to a visualization

3. Check the logs for upload status:
   - Look for: "✅ TTS audio uploaded successfully"
   - Instead of: "Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported"

4. Verify in Firebase Console:
   - Go to Firebase Console > Storage
   - Check the `tts-cache/` folder for new .mp3 files

## Troubleshooting

If uploads still fail:

1. **Check react-native-blob-util installation**:
   - Make sure it's properly linked (should be automatic with React Native 0.60+)
   - Try manual linking if needed

2. **Check Firebase Auth**:
   - Ensure the user is authenticated (even anonymously)
   - Check Firebase Storage rules allow authenticated writes

3. **Check network**:
   - Ensure device has internet connection
   - Check for any proxy/firewall issues

4. **Enable debug logging**:
   - The upload helper logs detailed error information
   - Check React Native logs for specific error messages

## Firebase Storage Rules

Ensure your Firebase Storage rules allow authenticated uploads:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tts-cache/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Future improvements

1. Consider implementing a Firebase Function for server-side uploads
2. Add progress tracking for large file uploads
3. Implement offline queue for failed uploads
4. Add telemetry to track upload success rates