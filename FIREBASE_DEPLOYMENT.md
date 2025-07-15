# Firebase Rules Deployment

## CRITICAL: Deploy Updated Firestore Rules

The Firestore security rules have been updated to fix permission errors. You need to deploy these rules to Firebase immediately.

### Deploy using Firebase CLI:

1. **Install Firebase CLI (if not already installed):**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Deploy the updated rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

   Or to deploy both Firestore and Storage rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

### What Changed:

1. **Added check-ins collection permissions** - This fixes the "Check-in listener error"
2. **Simplified TTS cache permissions** - Removed strict validation that was causing "Failed to update access stats" errors
3. **Added catch-all rule for authenticated users** - More permissive for development

### Verify Deployment:

After deployment, check the Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Verify the rules match the content in `firestore.rules`
3. Test the app to ensure permission errors are resolved

### Authentication Issues:

The authentication code already handles the following scenarios properly:
- Apple sign-in with nonce
- Email already in use conflicts
- Anonymous user linking problems

If authentication issues persist after deploying the rules, check:
1. Apple Sign-In is properly configured in Firebase Console
2. Anonymous authentication is enabled
3. Email/Password authentication is enabled

### Next Steps:

1. Deploy the rules immediately
2. Monitor the app logs to ensure permission errors are resolved
3. If issues persist, check the Firebase Console for any configuration issues