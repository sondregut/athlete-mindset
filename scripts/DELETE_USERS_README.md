# Delete Firebase Users Scripts

This directory contains scripts to delete all users from your Firebase project. Since this is a development environment with only test users, these scripts are safe to use.

## Available Scripts

### 1. `delete-all-users.ts` (Admin SDK Version)
This is the most comprehensive script that can delete both Firestore data AND Firebase Auth users.

**Requirements:**
- Firebase Admin SDK credentials (service account key)

**Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com) > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the file as `firebase-service-account.json` in the project root
4. Add to `.gitignore` to keep it secure

**Run:**
```bash
bunx tsx scripts/delete-all-users.ts
```

### 2. `delete-all-users-client.ts` (Client SDK Version)
This script uses the regular Firebase client SDK and can only delete Firestore data (not Auth users).

**Run:**
```bash
bunx tsx scripts/delete-all-users-client.ts
```

**Note:** After running this script, you'll need to manually delete Auth users from the Firebase Console.

## What Gets Deleted

Both scripts will delete:
- ✅ All user documents in `/users` collection
- ✅ All user subcollections (`sessions`, `checkins`, `mindset`, etc.)
- ✅ All personalization profiles
- ✅ Firebase Auth users (admin script only)

## Manual Deletion via Firebase Console

If you prefer to delete manually:

1. **Delete Firestore Data:**
   - Go to Firebase Console > Firestore Database
   - Click on the `users` collection
   - Click the three dots menu > Delete collection
   - Confirm deletion

2. **Delete Auth Users:**
   - Go to Firebase Console > Authentication > Users
   - Select all users (checkbox in header)
   - Click "Delete account" button
   - Confirm deletion

## Safety Notes

- These scripts include double confirmation prompts
- They show exactly what will be deleted before proceeding
- Since all users are development/test accounts, deletion is safe
- No production data is at risk

## Troubleshooting

If you get permission errors:
1. Make sure you're using the correct Firebase project
2. For the admin script, ensure your service account has proper permissions
3. For the client script, you may need to temporarily relax Firestore rules