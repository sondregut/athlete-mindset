import { z } from 'zod';

// Session validation schemas
export const SessionTypeSchema = z.enum(['training', 'competition', 'visualization', 'other']);

export const SessionStatusSchema = z.enum(['intention', 'active', 'reflection', 'completed']);

export const SessionLogSchema = z.object({
  id: z.string().min(1),
  date: z.string().datetime(),
  createdAt: z.string().datetime(),
  sessionType: SessionTypeSchema,
  customSessionType: z.string().optional(),
  activity: z.string().min(1),
  
  // Pre-training
  intention: z.string().optional(),
  mindsetCues: z.array(z.string()).optional(),
  notes: z.string().optional(),
  readinessRating: z.number().min(1).max(10).optional(),
  
  // Post-training
  positives: z.array(z.string()).optional(),
  stretchGoal: z.string().optional(),
  rpe: z.number().min(1).max(10).optional(),
  sessionRating: z.number().min(1).max(5).optional(),
  
  // Session duration
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  duration: z.number().min(0).optional(), // in seconds
  
  // Status
  status: SessionStatusSchema,
  
  // Visualization specific
  visualizationId: z.string().optional(),
  visualizationTitle: z.string().optional(),
});

// User profile validation
export const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  sport: z.string().optional(),
  position: z.string().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).optional(),
  trainingGoals: z.array(z.string()).optional(),
  preferredEnergyStyle: z.enum(['calm', 'intense', 'balanced']).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Firebase data validation helpers
export function validateSessionLog(data: unknown) {
  return SessionLogSchema.safeParse(data);
}

export function validateUserProfile(data: unknown) {
  return UserProfileSchema.safeParse(data);
}

// Type inference helpers
export type ValidatedSessionLog = z.infer<typeof SessionLogSchema>;
export type ValidatedUserProfile = z.infer<typeof UserProfileSchema>;