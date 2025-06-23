# Google Authentication Setup

To complete the Google Sign-In setup, you need to:

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your existing project
3. Enable the "Google+ API" or "Google Identity" API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"

## 2. Create OAuth Client IDs

You need to create THREE client IDs:

### Web Client ID
- Application type: Web application
- Authorized JavaScript origins: 
  - `https://auth.expo.io`
  - `http://localhost:8081` (for local development)
- Authorized redirect URIs:
  - `https://auth.expo.io/@your-expo-username/your-app-slug`

### iOS Client ID
- Application type: iOS
- Bundle ID: Your iOS bundle identifier (e.g., `com.yourcompany.athletemindset`)

### Android Client ID
- Application type: Android
- Package name: Your Android package name (e.g., `com.yourcompany.athletemindset`)
- SHA-1 certificate fingerprint: Get this from your keystore

## 3. Update the Configuration

Replace the placeholder client IDs in `/config/google-oauth.ts`:

```typescript
const GOOGLE_WEB_CLIENT_ID = 'YOUR_ACTUAL_WEB_CLIENT_ID';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_ACTUAL_IOS_CLIENT_ID';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ACTUAL_ANDROID_CLIENT_ID';
```

## 4. Configure OAuth Consent Screen

1. In Google Cloud Console, go to "OAuth consent screen"
2. Fill in required information:
   - App name: Athlete Mindset
   - User support email: Your email
   - Authorized domains: `expo.io`
   - Developer contact: Your email
3. Add scopes (only need basic profile info)
4. Add test users if in testing mode

## 5. For Expo Go Development

When using Expo Go, the redirect URI should be:
- `https://auth.expo.io/@your-expo-username/athlete-mindset-toolkit-jda24fe`

Based on your app.json:
- Slug: `athlete-mindset-toolkit-jda24fe`
- Scheme: `myapp`

The redirect URI will be logged to console when you try to sign in.

## Important Notes

- Google Sign-In will NOT work in Expo Go on iOS due to native module requirements
- It WILL work in:
  - Expo Go on Android
  - Web browsers
  - Standalone/production builds on both iOS and Android
- For iOS development, you'll need to use a development build or test in production

## Testing

1. Make sure you're logged into Expo: `expo login`
2. The redirect URI must match exactly what's in Google Console
3. Test on Android device/emulator or web first
4. For iOS, create a development build