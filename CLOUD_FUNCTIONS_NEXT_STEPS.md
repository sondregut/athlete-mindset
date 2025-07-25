# Cloud Functions - Next Steps

Based on your current progress, here's exactly what you need to do:

## ✅ What's Already Done
- Firebase rules deployed successfully
- Functions directory created with Gemini TTS (now fixed)
- Firestore indexes fixed (removed single-field indexes)

## 🔧 What You Need to Do Now

### Step 1: Rebuild Functions (2 minutes)
```bash
cd functions
npm install
npm run build
cd ..
```

### Step 2: Deploy Firestore Indexes (1 minute)
```bash
firebase deploy --only firestore:indexes
```
This should work now that we removed the problematic single-field indexes.

### Step 3: Deploy Functions (5 minutes)
```bash
firebase deploy --only functions
```

### Step 4: Migrate Data to Firestore (5 minutes)

#### Option A: Use the In-App Migration Tool (Easiest)
1. Start your app: `bunx rork start -p z54qzr5766157j0974fjw --tunnel`
2. Navigate to: `/migrate-visualizations` in your app
3. Tap "Start Migration"
4. Wait for success message

#### Option B: Use Client Script
```bash
bun run scripts/migrate-visualizations-client.ts
```

#### Option C: Get Service Account (If you prefer)
1. Go to https://console.firebase.google.com
2. Select "athlete-mindset" project
3. Settings → Service Accounts → Generate New Private Key
4. Save as `firebase-service-account.json` in project root
5. Run: `bun run scripts/migrate-visualizations-to-firestore.ts`

### Step 5: Test Cloud Functions (10 minutes)
1. In your app, navigate to `/debug-cloud-functions`
2. Toggle "Enable Cloud Functions" ON
3. Run these tests in order:
   - Test Health Check
   - Test Personalization
   - Test TTS Generation
   - Test Preload

## 🚨 Common Issues & Fixes

### If Functions Deploy Fails
```bash
# Check if API key secret is set
firebase functions:secrets:access GEMINI_API_KEY

# If not set:
firebase functions:secrets:set GEMINI_API_KEY
# Paste your Gemini API key when prompted
```

### If Migration Fails
- Make sure you're logged into Firebase: `firebase login`
- Check project: `firebase use` (should show athlete-mindset)
- Try the in-app migration tool instead

### If TTS Test Fails
- Check function logs: `firebase functions:log --only generateAudioTTS`
- Verify Gemini API key is correct
- Make sure you're using a valid voice name (Aoede, Charon, Fenrir, Kore, Puck, Saga)

## 📊 Verify Everything Works

After completing all steps, check:

1. **Firebase Console** (https://console.firebase.google.com)
   - Functions → All 4 functions should be listed
   - Firestore → Should see visualizations and personalization_templates collections
   - Storage → tts-cache folder will appear after first TTS generation

2. **In Your App**
   - Cloud Functions Debug screen shows "CLOUD" as active provider
   - Visualizations play with personalized content
   - Audio generates and plays smoothly

## 🎯 Quick Command Summary

```bash
# Complete deployment sequence
cd functions && npm install && npm run build && cd ..
firebase deploy --only firestore:indexes
firebase deploy --only functions

# Then migrate data (choose one):
# Option 1: In app at /migrate-visualizations
# Option 2: bun run scripts/migrate-visualizations-client.ts

# Monitor
firebase functions:log --follow
```

## ✨ Success Indicators

- ✅ No errors during deployment
- ✅ Migration shows all visualizations uploaded
- ✅ Debug screen health check passes
- ✅ TTS generates audio successfully
- ✅ No errors in function logs

That's it! The Gemini TTS is now properly configured and ready to deploy.