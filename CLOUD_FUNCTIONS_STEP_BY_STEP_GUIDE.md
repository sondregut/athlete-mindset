# Cloud Functions - Detailed Step-by-Step Implementation Guide

## Phase 1: Preparation (15 minutes)

### 1.1 Verify Prerequisites
```bash
# Check if Firebase CLI is installed
firebase --version
# If not installed: npm install -g firebase-tools

# Check if you're logged in
firebase login
# This should show your Google account

# Verify you're in the correct project directory
pwd
# Should show: /Users/.../athlete-mindset-rork-main-123
```

### 1.2 Verify Project Configuration
```bash
# Check current Firebase project
firebase use
# Should show: athlete-mindset (current)

# If not, set it:
firebase use athlete-mindset
```

### 1.3 Get Your Gemini API Key Ready
1. Go to https://aistudio.google.com/app/apikey
2. Copy your existing Gemini API key (the one in your .env file)
3. Keep it ready for the next phase

## Phase 2: Functions Setup (20 minutes)

### 2.1 Install Functions Dependencies
```bash
# Navigate to functions directory
cd functions

# Install all dependencies
npm install

# You should see packages installing including:
# - firebase-admin
# - firebase-functions
# - @google/generative-ai
```

### 2.2 Build TypeScript Functions
```bash
# Still in functions directory
npm run build

# This compiles TypeScript to JavaScript
# Check that lib/ directory was created:
ls lib/
# Should show: index.js, personalization.js, tts.js, types.js
```

### 2.3 Set Up API Key Secret
```bash
# This is CRITICAL - stores API key securely
firebase functions:secrets:set GEMINI_API_KEY

# When prompted, paste your Gemini API key and press Enter
# You'll see: ✔ Created a new secret version projects/athlete-mindset/secrets/GEMINI_API_KEY/versions/1
```

### 2.4 Verify Secret Was Set
```bash
# List all secrets
firebase functions:secrets:list

# Should show:
# GEMINI_API_KEY

# To verify you can access it (shows metadata, not the actual key):
firebase functions:secrets:access GEMINI_API_KEY
```

## Phase 3: Deploy Functions (10 minutes)

### 3.1 Deploy All Functions
```bash
# Go back to project root
cd ..

# Deploy functions with verbose output
firebase deploy --only functions --debug

# This will:
# 1. Upload your functions code
# 2. Install dependencies in cloud
# 3. Set up HTTPS endpoints
# 4. Configure secrets access
```

### 3.2 Expected Output
You should see something like:
```
✔ functions: Finished running predeploy script.
✔ functions: functions folder uploaded successfully
✔ functions[personalizeVisualization]: Successful create operation.
✔ functions[generateAudioTTS]: Successful create operation.
✔ functions[preloadVisualization]: Successful create operation.
✔ functions[cleanupOldCache]: Successful create operation.

✔ Deploy complete!
```

### 3.3 Verify Deployment
```bash
# List deployed functions
firebase functions:list

# Should show all 4 functions with their trigger types
```

## Phase 4: Deploy Firestore Configuration (5 minutes)

### 4.1 Deploy Indexes
```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# This creates indexes for:
# - personalized_content (userId, visualizationId, generatedAt)
# - tts_metadata (generatedAt, voice)
```

### 4.2 Deploy Security Rules
```bash
# Deploy updated security rules
firebase deploy --only firestore:rules

# This sets up proper read/write permissions
```

## Phase 5: Prepare Service Account (5 minutes)

### 5.1 Download Service Account Key
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your "athlete-mindset" project
3. Click the gear icon → Project settings
4. Go to "Service Accounts" tab
5. Click "Generate new private key"
6. Save the file as `firebase-service-account.json` in your project root
7. **IMPORTANT**: This file contains sensitive credentials!

### 5.2 Verify .gitignore
```bash
# Make sure service account is ignored
grep "firebase-service-account.json" .gitignore
# Should show: firebase-service-account.json

# If not, add it:
echo "firebase-service-account.json" >> .gitignore
```

## Phase 6: Run Migration Script (10 minutes)

### 6.1 Prepare Migration
```bash
# Make sure you're in project root
pwd

# Check that migration script exists
ls scripts/migrate-visualizations-to-firestore.ts
```

### 6.2 Run Migration
```bash
# Run the migration script
bun run scripts/migrate-visualizations-to-firestore.ts

# This will:
# 1. Upload all visualizations to Firestore
# 2. Upload personalization templates
# 3. Show index creation instructions
```

### 6.3 Expected Output
```
Starting visualization migration to Firestore...
✅ Successfully migrated 13 visualizations to Firestore

Loading personalization templates...
✅ Successfully uploaded 10 personalization templates

Please create the following indexes in Firebase Console:
[Index details will be shown]

✅ Migration completed successfully!
```

## Phase 7: Test Functions (15 minutes)

### 7.1 Start Your App
```bash
# In a new terminal, start your app
bunx rork start -p z54qzr5766157j0974fjw --tunnel
```

### 7.2 Navigate to Debug Screen
1. Open your app on device/simulator
2. Go to Profile tab
3. Look for a debug option (might be in Settings)
4. Open "Cloud Functions Debug" screen

**Note**: If you don't see the debug option, you may need to add navigation to it. Let me know and I'll help you add it.

### 7.3 Run Function Tests

#### Test 1: Health Check
1. Tap "Test Health Check"
2. Expected: "Health check: PASSED ✅"
3. If failed, check Firebase Console logs

#### Test 2: Enable Cloud Functions
1. Toggle "Enable Cloud Functions" to ON
2. Note the "Active Provider" should change to "CLOUD"

#### Test 3: Personalization
1. Tap "Test Personalization"
2. Expected: "Personalization successful! Steps: X"
3. Should show provider as "cloud"

#### Test 4: TTS Generation
1. Tap "Test TTS Generation"
2. Expected: "TTS generated successfully!"
3. Should return a URL starting with https://storage.googleapis.com

#### Test 5: Preload
1. Tap "Test Preload"
2. Expected: Progress updates and "Preload completed!"

## Phase 8: Monitor and Verify (10 minutes)

### 8.1 Check Function Logs
```bash
# View recent function invocations
firebase functions:log --limit 50

# Or watch logs in real-time
firebase functions:log --follow
```

### 8.2 Check Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project
3. Go to Functions → Dashboard
4. You should see:
   - Function invocations graph
   - Error rate (should be 0%)
   - Execution time metrics

### 8.3 Verify Firestore Data
1. In Firebase Console, go to Firestore Database
2. Check these collections exist:
   - `visualizations` (13 documents)
   - `personalization_templates` (10+ documents)
   - `personalized_content` (will populate as you test)
   - `tts_metadata` (will populate as you test)

### 8.4 Verify Cloud Storage
1. In Firebase Console, go to Storage
2. Look for `tts-cache/` folder
3. Should contain .wav files after TTS tests

## Phase 9: Production Testing (20 minutes)

### 9.1 Test Full Visualization Flow
1. In your app, go to visualizations
2. Select any visualization
3. It should:
   - Load personalized content
   - Generate audio
   - Play smoothly

### 9.2 Test Offline Fallback
1. In debug screen, toggle "Enable Cloud Functions" OFF
2. Test a visualization again
3. Should work using local processing

### 9.3 Test Error Recovery
1. Turn on Airplane Mode
2. Enable Cloud Functions
3. Try a visualization
4. Should automatically fall back to local

## Phase 10: Cost Monitoring Setup (10 minutes)

### 10.1 Set Up Budget Alert
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select your project
3. Go to Billing → Budgets & alerts
4. Create budget:
   - Name: "Cloud Functions Budget"
   - Amount: $10 (or your preference)
   - Alert at 50%, 90%, 100%

### 10.2 Monitor Initial Costs
- First day: Check billing to understand baseline
- After 1 week: Review actual costs
- Adjust budget if needed

## Troubleshooting Guide

### Issue: "Function not found"
```bash
# Redeploy functions
firebase deploy --only functions --force

# Check function names match exactly
firebase functions:list
```

### Issue: "Authentication error"
```bash
# Verify secret is set
firebase functions:secrets:access GEMINI_API_KEY

# Redeploy to ensure functions have access
firebase deploy --only functions
```

### Issue: "Gemini API error"
1. Verify API key is correct
2. Check Gemini API quotas at https://aistudio.google.com
3. Look at function logs for specific error

### Issue: "No data in Firestore"
```bash
# Re-run migration
bun run scripts/migrate-visualizations-to-firestore.ts

# Check Firebase Console for write permissions
```

## Daily Operations

### Check Function Health
```bash
# Quick health check
firebase functions:log --limit 10

# Check for errors
firebase functions:log --severity ERROR --limit 20
```

### Monitor Costs
- Check daily in first week
- Set up weekly cost report email
- Review cache hit rates to optimize

### Update Functions
```bash
# After making changes
cd functions
npm run build
cd ..
firebase deploy --only functions:personalizeVisualization
```

## Success Checklist

- [ ] Firebase CLI installed and logged in
- [ ] Functions deployed successfully
- [ ] GEMINI_API_KEY secret set
- [ ] Firestore indexes deployed
- [ ] Security rules updated
- [ ] Migration script completed
- [ ] All debug tests passing
- [ ] Visualization plays audio correctly
- [ ] Fallback to local works
- [ ] Budget alerts configured
- [ ] No errors in function logs

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Check function logs every few hours
   - Verify no unexpected errors
   - Monitor cache hit rates

2. **Gradual Rollout**
   - Start with Cloud Functions disabled
   - Enable for testing/development
   - Enable for small user group
   - Roll out to all users

3. **Optimization**
   - Review slow functions
   - Optimize Firestore queries
   - Adjust cache TTLs
   - Fine-tune memory allocation

## Support

If you encounter any issues:

1. **Check Logs First**
   ```bash
   firebase functions:log --limit 50
   ```

2. **Verify Configuration**
   - API key is set correctly
   - Functions are deployed
   - Firestore has data

3. **Test Locally**
   - Disable Cloud Functions
   - Verify app works with local processing

Remember: The hybrid approach means your app will always work, even if Cloud Functions have issues!