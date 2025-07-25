# Cloud Functions Deployment Guide

This guide walks through deploying Firebase Cloud Functions for visualization personalization and TTS generation.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project access with proper permissions
3. Google Gemini API key

## Deployment Steps

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Set Up Gemini API Key Secret

This is critical for security - the API key is stored as a Firebase secret, not in code:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

When prompted, paste your Gemini API key. The key will be securely stored and only accessible to your Cloud Functions.

### 3. Build TypeScript

```bash
cd functions
npm run build
```

### 4. Deploy Functions

Deploy all functions:
```bash
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:personalizeVisualization,functions:generateAudioTTS
```

### 5. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### 6. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 7. Run Migration Script

First, download your Firebase service account key:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save as `firebase-service-account.json` in project root
4. Add to `.gitignore` (should already be there)

Then run the migration:
```bash
bun run scripts/migrate-visualizations-to-firestore.ts
```

## Testing Cloud Functions

### 1. Enable in App

Navigate to the debug screen in the app:
- Profile tab → Debug → Cloud Functions Debug

Toggle "Enable Cloud Functions" to ON.

### 2. Test Functions

Use the debug screen to test:
- Health Check - Verifies functions are deployed
- Personalization - Tests content generation
- TTS Generation - Tests audio generation
- Preload - Tests batch audio generation

### 3. Monitor Logs

View function logs:
```bash
firebase functions:log
```

Or for specific function:
```bash
firebase functions:log --only personalizeVisualization
```

## Production Considerations

### 1. Authentication

Currently, functions allow unauthenticated access. For production:
- Uncomment authentication checks in functions
- Update Firestore rules to require authentication
- Implement proper user management

### 2. Rate Limiting

Consider implementing:
- Per-user rate limits
- Request throttling
- Quota management

### 3. Cost Optimization

Monitor and optimize:
- Function execution time
- Memory allocation
- Cache hit rates
- Storage usage

### 4. Error Handling

Implement:
- Error monitoring (e.g., Sentry)
- Alerting for failures
- Graceful degradation

## Rollback Plan

If issues arise:

1. Disable Cloud Functions in app:
   - Use feature flag in debug screen
   - App will fall back to local processing

2. Revert function deployment:
   ```bash
   firebase functions:delete personalizeVisualization generateAudioTTS preloadVisualization
   ```

3. Clear Firestore cache if needed:
   - Delete documents from `personalized_content` collection
   - Delete documents from `tts_metadata` collection

## Monitoring

### Firebase Console

Monitor function performance:
- Firebase Console > Functions > Dashboard
- Check invocation count, errors, latency

### Cloud Logging

View detailed logs:
- Google Cloud Console > Logging
- Filter by resource type: Cloud Function

### Budget Alerts

Set up budget alerts:
- Google Cloud Console > Billing > Budgets & alerts
- Create alerts for function costs

## Troubleshooting

### Function Not Found

If you get "Function not found" errors:
1. Verify deployment: `firebase deploy --only functions`
2. Check function names match exactly
3. Ensure project ID is correct

### Authentication Errors

If you get authentication errors:
1. Verify API key is set: `firebase functions:secrets:access GEMINI_API_KEY`
2. Check function has access to secret in code
3. Verify Firebase Auth is properly configured

### Performance Issues

If functions are slow:
1. Check cold start times in logs
2. Consider increasing memory allocation
3. Optimize Firestore queries
4. Review cache hit rates

### Cost Concerns

To reduce costs:
1. Implement aggressive caching
2. Use Firestore for personalization cache
3. Set appropriate TTLs
4. Monitor API usage

## Next Steps

1. Set up monitoring dashboards
2. Implement user authentication
3. Add request analytics
4. Set up CI/CD pipeline
5. Configure production environment variables