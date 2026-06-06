export interface FocusSession {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  duration?: number; // in seconds
  status: 'active' | 'completed' | 'interrupted';
  blockedWebsites: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: 'free' | 'premium';
  totalFocusTime: number; // in seconds
}
