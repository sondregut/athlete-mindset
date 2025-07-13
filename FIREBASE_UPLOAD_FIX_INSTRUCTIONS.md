# Firebase TTS Upload Fix Instructions

## Problem Summary
Firebase uploads are failing despite local cache working perfectly. The system shows "No document to update" errors because documents aren't being created in Firebase.

## Solution Steps

### 1. Deploy Test Firebase Rules (REQUIRED)

You need to manually deploy these rules in the Firebase Console:

#### Firestore Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Replace existing rules with content from `firestore-tts-cache-TEST.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY TEST RULES - VERY PERMISSIVE
    // DO NOT USE IN PRODUCTION
    
    // TTS Cache Collection - Allow everything for testing
    match /tts-cache/{document=**} {
      // Allow all operations for testing
      allow read: if true;
      allow write: if true; // This includes create, update, delete
    }
    
    // Other collections...
  }
}
```
3. Click "Publish"

#### Storage Rules
1. Go to Firebase Console → Storage → Rules
2. Replace existing rules with content from `storage-tts-cache-TEST.rules`:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // TEMPORARY TEST RULES - VERY PERMISSIVE
    // DO NOT USE IN PRODUCTION
    
    // TTS Cache files - Allow everything for testing
    match /tts-cache/{allPaths=**} {
      // Allow all operations for testing
      allow read: if true;
      allow write: if true; // This includes create, update, delete
    }
    
    // Other paths...
  }
}
```
3. Click "Publish"

**⚠️ WARNING**: These rules are ONLY for testing! They allow anyone to read/write. Replace with proper rules after testing.

### 2. Restart the App Completely
```bash
# Kill the app and restart
bunx rork start -p z54qzr5766157j0974fjw --clear --tunnel
```

### 3. Run Firebase Upload Test

1. Open the app
2. Navigate to the Debug TTS screen (should be accessible from your home or settings)
3. You'll see new Firebase Upload Test buttons:
   - **"Test Firebase Upload"** - Tests a single upload to diagnose issues
   - **"Upload Existing Cache to Firebase"** - Uploads all existing local cache files

4. Run "Test Firebase Upload" first and check console logs for detailed output

### 4. Check Firebase Console

After running the test, check:
1. **Firestore**: Go to `tts-cache` collection - you should see documents appearing
2. **Storage**: Go to `tts-cache/` folder - you should see MP3 files

### 5. What to Look For in Logs

The test will show:
- Authentication status
- Cache key generation
- OpenAI API call success
- Firebase upload attempt
- Document creation in Firestore

Look for error messages like:
- `storage/unauthorized` - Storage rules issue
- `permission-denied` - Firestore rules issue
- `Failed to fetch` - Network connectivity issue

### 6. If Upload Still Fails

Try these alternatives:

#### Option A: Development Build
Instead of Expo Go, create a development build:
```bash
eas build --profile development --platform ios
```
This removes Expo Go limitations and may resolve SDK issues.

#### Option B: Use Simplified Rules
Use `firestore-tts-cache-SIMPLIFIED.rules` which has less strict validation:
```
allow create, update: if request.auth != null;
```

#### Option C: Check Anonymous Auth
Ensure anonymous auth is enabled in Firebase Console:
1. Go to Authentication → Sign-in method
2. Enable "Anonymous" provider

### 7. Production Rules

Once uploads work, deploy these safer rules:

**Firestore**:
```
match /tts-cache/{cacheId} {
  allow read: if true; // Public read for cache sharing
  allow create: if request.auth != null; // Authenticated writes
  allow update: if request.auth != null && resource != null;
  allow delete: if false; // No deletion
}
```

**Storage**:
```
match /tts-cache/{fileName} {
  allow read: if true; // Public read
  allow write: if request.auth != null && request.resource.size < 10 * 1024 * 1024;
}
```

## Expected Outcome

After following these steps:
1. Firebase uploads should start working
2. You'll see documents in Firestore `tts-cache` collection
3. MP3 files will appear in Storage `tts-cache/` folder
4. "No document to update" errors will stop
5. Cache sharing across users will work

## Next Steps

Once uploads work:
1. Deploy production-safe rules
2. Monitor cache hit rates
3. Consider implementing cache cleanup for old entries
4. Set up Firebase Functions for additional security if needed