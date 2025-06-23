import firestore from '@react-native-firebase/firestore';
import { SessionLog } from '@/types/session';
import { firebaseAuth } from './firebase-auth';

export interface FirebaseSessionLog extends Omit<SessionLog, 'id'> {
  id?: string;
  updatedAt: Date;
  syncStatus?: 'synced' | 'pending' | 'error';
}

class FirebaseSessionsService {
  private getCollectionRef(userId: string) {
    return firestore().collection('users').doc(userId).collection('sessions');
  }

  /**
   * Create a new session in Firestore
   */
  async createSession(session: SessionLog): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const sessionData: FirebaseSessionLog = {
        ...session,
        updatedAt: new Date(),
        syncStatus: 'synced',
      };

      await this.getCollectionRef(user.uid).doc(session.id).set(sessionData);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to save session to cloud');
    }
  }

  /**
   * Update an existing session in Firestore
   */
  async updateSession(sessionId: string, updates: Partial<SessionLog>): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const updateData = {
        ...updates,
        updatedAt: new Date(),
        syncStatus: 'synced',
      };

      await this.getCollectionRef(user.uid).doc(sessionId).update(updateData);
    } catch (error) {
      console.error('Failed to update session:', error);
      throw new Error('Failed to update session in cloud');
    }
  }

  /**
   * Delete a session from Firestore
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      await this.getCollectionRef(user.uid).doc(sessionId).delete();
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw new Error('Failed to delete session from cloud');
    }
  }

  /**
   * Get all sessions for the current user
   */
  async getAllSessions(): Promise<SessionLog[]> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const snapshot = await this.getCollectionRef(user.uid)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SessionLog[];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      throw new Error('Failed to load sessions from cloud');
    }
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<SessionLog | null> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const doc = await this.getCollectionRef(user.uid).doc(sessionId).get();
      
      if (!doc.exists) return null;

      return {
        id: doc.id,
        ...doc.data(),
      } as SessionLog;
    } catch (error) {
      console.error('Failed to get session:', error);
      throw new Error('Failed to load session from cloud');
    }
  }

  /**
   * Listen to real-time session updates
   */
  onSessionsChange(callback: (sessions: SessionLog[]) => void): () => void {
    const user = firebaseAuth.getCurrentUser();
    if (!user) {
      callback([]);
      return () => {};
    }

    return this.getCollectionRef(user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const sessions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as SessionLog[];
          callback(sessions);
        },
        (error) => {
          console.error('Session listener error:', error);
          callback([]);
        }
      );
  }

  /**
   * Batch upload sessions (for migration)
   */
  async batchUploadSessions(sessions: SessionLog[]): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const batch = firestore().batch();
      const collectionRef = this.getCollectionRef(user.uid);

      sessions.forEach(session => {
        const sessionData: FirebaseSessionLog = {
          ...session,
          updatedAt: new Date(),
          syncStatus: 'synced',
        };
        batch.set(collectionRef.doc(session.id), sessionData);
      });

      await batch.commit();
    } catch (error) {
      console.error('Failed to batch upload sessions:', error);
      throw new Error('Failed to upload sessions to cloud');
    }
  }

  /**
   * Get sessions within a date range
   */
  async getSessionsByDateRange(startDate: string, endDate: string): Promise<SessionLog[]> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const snapshot = await this.getCollectionRef(user.uid)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SessionLog[];
    } catch (error) {
      console.error('Failed to get sessions by date range:', error);
      throw new Error('Failed to load sessions from cloud');
    }
  }
}

export const firebaseSessions = new FirebaseSessionsService();