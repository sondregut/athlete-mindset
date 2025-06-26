import { SessionLog } from './session';
import { MindsetCheckin } from '@/store/mindset-store';

export type ActivityType = 'session' | 'checkin';

export interface ActivityItem {
  type: ActivityType;
  data: SessionLog | MindsetCheckin;
  timestamp: string; // ISO string for sorting
}