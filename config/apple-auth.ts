import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export interface AppleAuthResult {
  identityToken: string | null;
  authorizationCode: string | null;
  fullName: AppleAuthentication.AppleAuthenticationFullName | null;
  email: string | null;
  realUserStatus: AppleAuthentication.AppleAuthenticationUserDetectionStatus;
}

export const useAppleAuth = () => {
  const isAvailable = Platform.OS === 'ios';

  const signInWithApple = async (): Promise<AppleAuthResult> => {
    if (!isAvailable) {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      return {
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        fullName: credential.fullName,
        email: credential.email,
        realUserStatus: credential.realUserStatus,
      };
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Apple Sign-In was canceled');
      } else if (error.code === 'ERR_INVALID_RESPONSE') {
        throw new Error('Invalid response from Apple');
      } else if (error.code === 'ERR_NOT_HANDLED') {
        throw new Error('Apple Sign-In not handled');
      } else if (error.code === 'ERR_UNKNOWN') {
        throw new Error('Unknown Apple Sign-In error');
      }
      throw error;
    }
  };

  const checkAvailability = async (): Promise<boolean> => {
    if (!isAvailable) {
      return false;
    }

    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  };

  return {
    signInWithApple,
    checkAvailability,
    isAvailable,
  };
};

// Helper to get display name from Apple auth result
export const getAppleDisplayName = (fullName: AppleAuthentication.AppleAuthenticationFullName | null): string | null => {
  if (!fullName) return null;
  
  const { givenName, familyName } = fullName;
  if (givenName && familyName) {
    return `${givenName} ${familyName}`;
  } else if (givenName) {
    return givenName;
  } else if (familyName) {
    return familyName;
  }
  
  return null;
};