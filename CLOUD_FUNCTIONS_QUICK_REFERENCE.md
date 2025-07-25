# Cloud Functions Quick Reference

## 🚀 Essential Commands

### Initial Setup (One Time)
```bash
# 1. Set API Key Secret
firebase functions:secrets:set GEMINI_API_KEY

# 2. Build Functions
cd functions && npm install && npm run build && cd ..

# 3. Deploy Everything
firebase deploy --only functions,firestore

# 4. Run Migration
bun run scripts/migrate-visualizations-to-firestore.ts
```

### Daily Operations
```bash
# Check function logs
firebase functions:log --limit 20

# Watch logs live
firebase functions:log --follow

# Check for errors
firebase functions:log --severity ERROR

# Deploy specific function after changes
firebase deploy --only functions:personalizeVisualization
```

### Testing Commands
```bash
# Run diagnostic script
bun run scripts/check-cloud-functions-setup.ts

# Start app with debug logging
DEBUG=* bunx rork start -p z54qzr5766157j0974fjw --tunnel

# Clear all caches
bun run scripts/clear-all-caches.ts
```

## 📱 In-App Testing Path

1. **Profile Tab** → Look for debug/settings option
2. **Cloud Functions Debug** screen
3. Toggle **Enable Cloud Functions** ON
4. Run tests in order:
   - Health Check
   - Personalization
   - TTS Generation
   - Preload

## 🔍 Quick Diagnostics

### Function Not Working?
```bash
# 1. Check if deployed
firebase functions:list

# 2. Check recent errors
firebase functions:log --severity ERROR --limit 10

# 3. Verify secret is set
firebase functions:secrets:access GEMINI_API_KEY

# 4. Redeploy
firebase deploy --only functions --force
```

### No Audio Generated?
```bash
# Check Cloud Storage
# Go to Firebase Console → Storage → tts-cache/

# Check TTS function logs
firebase functions:log --only generateAudioTTS
```

### Personalization Not Working?
```bash
# Check if templates exist in Firestore
# Firebase Console → Firestore → visualizations

# Re-run migration if needed
bun run scripts/migrate-visualizations-to-firestore.ts
```

## 💰 Cost Monitoring

```bash
# View function invocations (rough cost indicator)
firebase functions:list

# Set up budget alert
# Google Cloud Console → Billing → Budgets & alerts
```

## 🔧 Common Fixes

### "Function not found"
```bash
firebase deploy --only functions
```

### "Permission denied"
```bash
# Update rules
firebase deploy --only firestore:rules
```

### "API key error"
```bash
# Re-set the secret
firebase functions:secrets:destroy GEMINI_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```

### Complete Reset
```bash
# If all else fails, redeploy everything
cd functions && npm run build && cd ..
firebase deploy
```

## 📊 Monitoring URLs

- **Function Logs**: https://console.firebase.google.com/project/athlete-mindset/functions
- **Firestore Data**: https://console.firebase.google.com/project/athlete-mindset/firestore
- **Storage Files**: https://console.firebase.google.com/project/athlete-mindset/storage
- **Usage & Billing**: https://console.cloud.google.com/billing

## 🎯 Success Indicators

✅ Health check passes in debug screen  
✅ "Active Provider: CLOUD" shows in debug screen  
✅ Visualizations play audio smoothly  
✅ No errors in function logs  
✅ Cache hit rate > 50% after first day  

## 🆘 Emergency Rollback

If things go wrong:
1. In app: Debug screen → Toggle Cloud Functions OFF
2. App immediately uses local processing
3. Fix issues at your pace
4. Re-enable when ready

Remember: The app ALWAYS works, even if Cloud Functions are down!