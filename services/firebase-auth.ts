import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

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
      const result = await auth().signInAnonymously();
      return this.mapFirebaseUser(result.user);
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
      throw new Error('Failed to sign in anonymously');
    }
  }

  /**
   * Create account with email and password
   */
  async createAccount(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      const result = await auth().createUserWithEmailAndPassword(email, password);
      
      // Update display name if provided
      if (displayName && result.user) {
        await result.user.updateProfile({ displayName });
      }

      return this.mapFirebaseUser(result.user);
    } catch (error: any) {
      console.error('Account creation failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const result = await auth().signInWithEmailAndPassword(email, password);
      return this.mapFirebaseUser(result.user);
    } catch (error: any) {
      console.error('Sign in failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Link anonymous account to email/password
   */
  async linkWithEmailAndPassword(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      const user = auth().currentUser;
      if (!user || !user.isAnonymous) {
        throw new Error('No anonymous user to link');
      }

      const credential = auth.EmailAuthProvider.credential(email, password);
      const result = await user.linkWithCredential(credential);

      // Update display name if provided
      if (displayName && result.user) {
        await result.user.updateProfile({ displayName });
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
      await auth().signOut();
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
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No user to delete');
      }
      await user.delete();
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
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Password reset failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    const user = auth().currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return auth().onAuthStateChanged((user) => {
      callback(user ? this.mapFirebaseUser(user) : null);
    });
  }

  /**
   * Map Firebase user to our AuthUser interface
   */
  private mapFirebaseUser(user: FirebaseAuthTypes.User): AuthUser {
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
        return 'Network error. Please check your connection';
      default:
        return 'Authentication failed. Please try again';
    }
  }
}

export const firebaseAuth = new FirebaseAuthService();