# Firebase TTS Cache Setup Guide

This guide will help you set up Firebase Storage TTS caching with minimal manual work. Most of the setup is automated through scripts.

## Prerequisites

1. **Node.js** installed (for running setup scripts)
2. **Firebase account** (free tier is sufficient)
3. **OpenAI API key** (already configured in your app)

## Step 1: Create Firebase Project (2-3 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter a project name (e.g., "athlete-mindset-tts")
4. Disable Google Analytics (not needed for TTS cache)
5. Click "Create project"

## Step 2: Get Service Account Key (1 minute)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **Service accounts** tab
3. Click **Generate new private key**
4. Save the downloaded JSON file as `service-account-key.json` in your project root
5. Add this file to `.gitignore` (already done)

## Step 3: Get Web App Configuration (1 minute)

1. In Firebase Console, go to **Project Settings** > **General**
2. Scroll down to "Your apps" section
3. Click **Add app** > **Web** (</> icon)
4. Register app with nickname "TTS Cache"
5. Copy the configuration values
6. Update `/config/firebase-tts-config.ts` with these values:

```typescript
export const firebaseTTSConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 4: Run Automated Setup (1 minute)

Install Node dependencies for scripts:
```bash
cd scripts
npm install firebase-admin node-fetch
cd ..
```

Run the setup script:
```bash
node scripts/setup-firebase-tts.js
```

This script will:
- ✅ Create Firestore collections
- ✅ Set up Storage buckets
- ✅ Configure security rules
- ✅ Initialize metadata

## Step 5: Verify Setup

Run verification script:
```bash
node scripts/verify-firebase-tts.js
```

You should see all green checkmarks.

## Step 6: Update Your App

The app is already configured to use Firebase TTS cache. The service will automatically:
- Check memory cache first (instant)
- Check local device cache (fast)
- Check Firebase Storage (cross-user cache)
- Generate via OpenAI only if not cached

## Step 7: (Optional) Pre-generate Common Phrases

To pre-populate the cache with common phrases:
```bash
node scripts/generate-tts-batch.js nova
```

You can run this for different voices:
- `nova` (default, recommended)
- `alloy`, `echo`, `fable`, `onyx`, `shimmer`

## Step 8: Monitor Usage

Check cache statistics anytime:
```bash
node scripts/firebase-tts-stats.js
```

## Migration from Existing Cache

If you have existing cached audio files:
```bash
node scripts/migrate-tts-cache.js
```

## Environment Variables

Add to your `.env` file (optional - can use hardcoded config):
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

## Cost Estimates

- **Firebase Free Tier**:
  - 10GB Storage (enough for ~10,000 audio files)
  - 1GB/day download (enough for ~1,000 plays/day)
  - 50K Firestore reads/day
  
- **Cache Hit Rate**: Typically 90%+ after initial usage
- **Cost Reduction**: 90%+ reduction in OpenAI TTS API costs

## Troubleshooting

1. **"Service account key not found"**
   - Ensure `firebase-service-account.json` is in project root
   - Check file is properly downloaded from Firebase Console

2. **"Config file needs actual values"**
   - Update `/config/firebase-tts-config.ts` with your Firebase project values

3. **"OPENAI_API_KEY not set"**
   - Ensure your `.env` file has `OPENAI_API_KEY=sk-...`

4. **Cache not working**
   - Run `node scripts/verify-firebase-tts.js` to check setup
   - Check browser console for errors
   - Verify Firebase project is active

## Security Notes

- The provided rules allow public read access to cached audio
- Write access requires authentication (admin SDK only)
- Consider adding Firebase Authentication for production use
- Never commit `firebase-service-account.json` to git

## Next Steps

1. Test the app with visualizations - audio should load faster
2. Monitor cache hit rates with the stats script
3. Pre-generate common phrases for your use case
4. Consider adding user authentication for write access

That's it! Your Firebase TTS cache is ready to use. The implementation will automatically handle all caching layers and significantly reduce your OpenAI API costs.