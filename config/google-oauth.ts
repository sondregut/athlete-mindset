import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the auth session on web
WebBrowser.maybeCompleteAuthSession();

// Google OAuth client IDs
// iOS Client ID from GoogleService-Info.plist
const GOOGLE_IOS_CLIENT_ID = '860569454039-tjvf38os5g430uct33se2lbra2sl6is1.apps.googleusercontent.com';

// Web Client ID - Create this in Google Cloud Console
// 1. Go to https://console.cloud.google.com/
// 2. Select your Firebase project
// 3. Go to APIs & Services > Credentials
// 4. Create OAuth 2.0 Client ID > Web application
// 5. Add authorized origins: https://auth.expo.io
// 6. Add redirect URI: https://auth.expo.io/@your-expo-username/athlete-mindset-toolkit-jda24fe
const GOOGLE_WEB_CLIENT_ID = '860569454039-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

// Android Client ID - Create this in Google Cloud Console if supporting Android
// Package name: app.rork.athlete-mindset-toolkit-jda24fe
const GOOGLE_ANDROID_CLIENT_ID = '860569454039-YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'myapp',
  });
  
  console.log('Google OAuth Redirect URI:', redirectUri);

  const clientId = Platform.select({
    web: GOOGLE_WEB_CLIENT_ID,
    ios: GOOGLE_IOS_CLIENT_ID,
    android: GOOGLE_ANDROID_CLIENT_ID,
    default: GOOGLE_WEB_CLIENT_ID,
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId!,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      redirectUri,
    },
    discovery
  );

  return {
    request,
    response,
    promptAsync,
  };
};

// Helper to extract ID token from response
export const getGoogleIdToken = (response: any): string | null => {
  if (response?.type === 'success' && response.params?.id_token) {
    return response.params.id_token;
  }
  return null;
};