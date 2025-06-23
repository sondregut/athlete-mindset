# Google Services Android Setup

To complete the Android configuration for Firebase, you need to download the `google-services.json` file from Firebase Console.

## Steps to Download google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **Athlete Mindset**
3. Click on the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Click on the Android app (if you haven't added one yet, click "Add app" and select Android)
7. For Android package name, use: `app.rork.athlete-mindset-toolkit-jda24fe`
8. Download the `google-services.json` file
9. Place it in the root directory of your project (same level as `package.json`)

## Android App Configuration

When registering your Android app in Firebase:
- **Package name**: `app.rork.athlete-mindset-toolkit-jda24fe`
- **App nickname**: Athlete Mindset Android (optional)
- **Debug signing certificate SHA-1**: (optional for now, required for Google Sign-In in production)

## Getting SHA-1 Certificate (for Google Sign-In)

For development:
```bash
# For Expo managed workflow (after creating a development build)
eas credentials
```

For production:
```bash
# Generate from your keystore
keytool -list -v -keystore path/to/your/keystore.jks -alias your-alias-name
```

## Note
The `google-services.json` file contains your Firebase configuration for Android and should be committed to your repository (it doesn't contain any secrets, just configuration).