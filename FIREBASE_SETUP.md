# Firebase Setup Guide

## Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Logged in to Firebase: `firebase login`

## Deploy Security Rules

### Option 1: Deploy All Rules
```bash
bun run deploy:rules
```

### Option 2: Deploy Individually
```bash
# Deploy Firestore rules only
bun run deploy:firestore

# Deploy Storage rules only  
bun run deploy:storage
```

## Manual Deployment (if scripts don't work)
```bash
# Deploy both rules
firebase deploy --only firestore:rules,storage:rules

# Or deploy individually
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## Verify Deployment
1. Go to [Firebase Console](https://console.firebase.google.com/project/athlete-mindset/firestore/rules)
2. Check that the rules match the files in this project
3. Test the app to ensure authentication and data sync work properly

## Testing the App

### Start the App
```bash
bun run start
```

### What to Test
1. **Anonymous Sign-in**: App should automatically sign in anonymously on first launch
2. **Create Session**: Log a training session and verify it appears in Firestore
3. **Account Creation**: From profile screen, tap "Secure Your Data" to create an account
4. **Sign Out/In**: Test signing out and back in to verify data persistence

## Monitoring
- **Authentication**: Check [Users tab](https://console.firebase.google.com/project/athlete-mindset/authentication/users)
- **Firestore**: Check [Database](https://console.firebase.google.com/project/athlete-mindset/firestore/data)
- **Storage**: Check [Storage](https://console.firebase.google.com/project/athlete-mindset/storage)

## Troubleshooting

### If deployment fails:
1. Ensure you're logged in: `firebase login`
2. Check project is correct: `firebase use athlete-mindset`
3. Verify files exist: `firestore.rules` and `storage.rules`

### If auth doesn't work:
1. Verify Anonymous auth is enabled in Firebase Console
2. Check browser console/logs for errors
3. Ensure Firebase config in `config/firebase.ts` is correct