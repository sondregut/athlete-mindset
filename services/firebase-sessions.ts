import { 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/config/firebase';
import { SessionLog } from '@/types/session';
import { firebaseAuth } from './firebase-auth';
import { smartLogger } from '@/utils/smart-logger';

export interface FirebaseSessionLog extends Omit<SessionLog, 'id'> {
  id?: string;
  updatedAt: Date;
  syncStatus?: 'synced' | 'pending' | 'error';
}

class FirebaseSessionsService {
  private getCollectionRef(userId: string) {
    return collection(getFirebaseFirestore(), 'users', userId, 'sessions');
  }

  // Utility to remove undefined fields from an object
  private removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    ) as T;
  }

  /**
   * Create a new session in Firestore
   */
  async createSession(session: SessionLog): Promise<void> {
    try {
      const user = firebaseAuth.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      let sessionData: FirebaseSessionLog = {
        ...session,
        updatedAt: new Date(),
        syncStatus: 'synced',
      };
      sessionData = this.removeUndefinedFields(sessionData);

      const sessionRef = doc(this.getCollectionRef(user.uid), session.id);
      await setDoc(sessionRef, sessionData);
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

      const sessionRef = doc(this.getCollectionRef(user.uid), sessionId);
      await updateDoc(sessionRef, updateData);
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

      const sessionRef = doc(this.getCollectionRef(user.uid), sessionId);
      await deleteDoc(sessionRef);
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

      const q = query(
        this.getCollectionRef(user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

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

      const sessionRef = doc(this.getCollectionRef(user.uid), sessionId);
      const docSnap = await getDoc(sessionRef);
      
      if (!docSnap.exists()) return null;

      return {
        id: docSnap.id,
        ...docSnap.data(),
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

    const q = query(
      this.getCollectionRef(user.uid),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as SessionLog[];
        callback(sessions);
      },
      (error) => {
        if (error.code === 'permission-denied') {
          smartLogger.warn('session-permission', '📱 Session listener: Using local data (no cloud sync)');
        } else {
          smartLogger.error('session-listener', '❌ Session listener error:', error);
        }
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

      const batch = writeBatch(getFirebaseFirestore());
      const collectionRef = this.getCollectionRef(user.uid);

      sessions.forEach(session => {
        const sessionData: FirebaseSessionLog = {
          ...session,
          updatedAt: new Date(),
          syncStatus: 'synced',
        };
        const sessionRef = doc(collectionRef, session.id);
        batch.set(sessionRef, sessionData);
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

      const q = query(
        this.getCollectionRef(user.uid),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);

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