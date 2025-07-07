import { 
  signInAnonymously as firebaseSignInAnonymously, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signOut,
  deleteUser,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { getFirebaseAuth } from '@/config/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
}

class FirebaseAuthService {
  /**
   * Sign in anonymously for immediate app access
   */
  async signInAnonymously(): Promise<AuthUser> {
    try {
      const auth = getFirebaseAuth();
      
      // Check if we already have a user
      if (auth.currentUser) {
        return this.mapFirebaseUser(auth.currentUser);
      }
      
      const result = await firebaseSignInAnonymously(auth);
      return this.mapFirebaseUser(result.user);
    } catch (error: any) {
      // Provide more specific error messages
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please wait before trying again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Anonymous authentication is not enabled. Please enable it in Firebase Console.');
      } else if (error.code === 'auth/configuration-not-found') {
        throw new Error('Firebase configuration error. Please check your Firebase setup.');
      } else if (error.message?.includes('Network request failed')) {
        throw new Error('Network connection failed. Please check your internet.');
      } else {
        throw new Error(`Failed to sign in anonymously: ${error.code || error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Create account with email and password with retry logic
   */
  async createAccount(email: string, password: string, displayName?: string): Promise<AuthUser> {
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        
        // Update display name if provided
        if (displayName && result.user) {
          await updateProfile(result.user, { displayName });
        }

        return this.mapFirebaseUser(result.user);
      } catch (error: any) {
        lastError = error;
        console.error(`Account creation attempt ${attempt} failed:`, error);
        
        // Only retry on network errors
        if (error.code === 'auth/network-request-failed' && attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        // For other errors or final attempt, throw immediately
        break;
      }
    }
    
    throw new Error(this.getAuthErrorMessage(lastError.code));
  }

  /**
   * Sign in with email and password with retry logic
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        return this.mapFirebaseUser(result.user);
      } catch (error: any) {
        lastError = error;
        console.error(`Sign in attempt ${attempt} failed:`, error);
        
        // Only retry on network errors
        if (error.code === 'auth/network-request-failed' && attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        
        // For other errors or final attempt, throw immediately
        break;
      }
    }
    
    throw new Error(this.getAuthErrorMessage(lastError.code));
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(idToken: string): Promise<AuthUser> {
    try {
      const auth = getFirebaseAuth();
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Check if we have an anonymous user to link
      if (auth.currentUser?.isAnonymous) {
        try {
          // Try to link the Google account to the anonymous account
          const result = await linkWithCredential(auth.currentUser, credential);
          return this.mapFirebaseUser(result.user);
        } catch (linkError: any) {
          // If linking fails (e.g., Google account already exists), sign in normally
          if (linkError.code === 'auth/credential-already-in-use') {
            const result = await signInWithCredential(auth, credential);
            return this.mapFirebaseUser(result.user);
          }
          throw linkError;
        }
      } else {
        // Regular Google sign-in
        const result = await signInWithCredential(auth, credential);
        return this.mapFirebaseUser(result.user);
      }
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign in with Apple ID token
   */
  async signInWithApple(identityToken: string, nonce?: string): Promise<AuthUser> {
    try {
      const auth = getFirebaseAuth();
      
      // Create Apple provider
      const provider = new OAuthProvider('apple.com');
      
      // Create credential with identity token
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce, // optional nonce for security
      });

      // Check if we have an anonymous user to link
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        console.log('Linking Apple account to anonymous user...');
        const result = await linkWithCredential(auth.currentUser, credential);
        return this.mapFirebaseUser(result.user);
      } else {
        console.log('Signing in with Apple credential...');
        const result = await signInWithCredential(auth, credential);
        return this.mapFirebaseUser(result.user);
      }
    } catch (error: any) {
      console.error('Apple sign-in failed:', error);
      if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email address. Please use a different sign-in method.');
      } else if (error.code === 'auth/credential-already-in-use') {
        throw new Error('This Apple ID is already linked to another account.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid Apple credentials. Please try signing in again.');
      }
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Link anonymous account to email/password
   */
  async linkWithEmailAndPassword(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user || !user.isAnonymous) {
        throw new Error('No anonymous user to link');
      }

      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(user, credential);

      // Update display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      return this.mapFirebaseUser(result.user);
    } catch (error: any) {
      console.error('Account linking failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(getFirebaseAuth());
    } catch (error) {
      console.error('Sign out failed:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<void> {
    try {
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        throw new Error('No user to delete');
      }
      await deleteUser(user);
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw new Error('Failed to delete account');
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    const user = getFirebaseAuth().currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  /**
   * Map Firebase user to our AuthUser interface
   */
  private mapFirebaseUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified,
    };
  }

  /**
   * Get user-friendly error messages
   */
  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again';
      default:
        return 'Authentication failed. Please try again';
    }
  }
}

export const firebaseAuth = new FirebaseAuthService();