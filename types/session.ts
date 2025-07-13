export type SessionType = 'training' | 'competition' | 'visualization' | 'other';

export interface SessionLog {
  id: string;
  date: string;
  createdAt: string;
  sessionType: SessionType;
  customSessionType?: string;
  activity: string;
  
  // Pre-training
  intention?: string;
  mindsetCues?: string[];
  notes?: string;
  readinessRating?: number;
  
  // Post-training
  positives?: string[];
  stretchGoal?: string;
  rpe?: number;
  sessionRating?: number;
  
  // Session duration
  startTime?: string;
  endTime?: string;
  duration?: number; // in seconds
  
  // Status
  status: 'intention' | 'active' | 'reflection' | 'completed';
  
  // Visualization specific
  visualizationId?: string;
  visualizationTitle?: string;
}