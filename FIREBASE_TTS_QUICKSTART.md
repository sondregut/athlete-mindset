# Firebase TTS Cache - Quick Start Guide 🚀

## 5-Minute Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name: "athlete-mindset-tts" (or any name)
4. **Disable** Google Analytics
5. Click "Create project"

### Step 2: Download Service Account Key
1. In Firebase Console → ⚙️ **Project Settings**
2. Click **Service accounts** tab
3. Click **Generate new private key**
4. Save as `service-account-key.json` in project root

### Step 3: Get Web App Config
1. In Firebase Console → ⚙️ **Project Settings** → **General**
2. Scroll to "Your apps" → Click **Add app** → **Web** (</> icon)
3. Register app with nickname "TTS Cache"
4. Copy the config object
5. Open `/config/firebase-tts-config.ts`
6. Replace the placeholder values with your actual config:

```typescript
export const firebaseTTSConfig = {
  apiKey: "AIza...",              // Your actual API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 4: Run Setup Script
```bash
# Install dependencies (one time only)
cd scripts
npm install firebase-admin node-fetch
cd ..

# Run automated setup
node scripts/setup-firebase-tts.js

# Verify everything works
node scripts/verify-firebase-tts.js
```

### Step 5: Done! 🎉
Your app now has Firebase TTS caching! Test it:
1. Open the app
2. Navigate to a visualization
3. Play audio - first time generates via OpenAI
4. Play again - loads from cache instantly!

## Optional: Pre-generate Common Audio
```bash
# Generate common phrases with nova voice
node scripts/generate-tts-batch.js nova
```

## Monitor Usage
```bash
# See cache statistics
node scripts/firebase-tts-stats.js
```

## How It Saves Money
- First user generates audio → costs $0.015 per 1K chars
- All other users get it from cache → costs $0
- Result: 90%+ cost reduction!

## Troubleshooting
- **"Config not set"** → Update `/config/firebase-tts-config.ts`
- **"Service account not found"** → Ensure `firebase-service-account.json` exists
- **"Permission denied"** → Run setup script first

That's it! Your Firebase TTS cache is ready. 🚀