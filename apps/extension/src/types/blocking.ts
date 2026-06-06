export interface BlockRule {
  id: string;
  domain: string; // supports wildcard e.g., *.reddit.com
  isRegex?: boolean;
}

export interface WhitelistRule {
  id: string;
  domain: string;
}

export interface Schedule {
  id: string;
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  isActive: boolean;
}

export interface EmergencyUnlockRecord {
  id: string;
  domain: string;
  reason: 'Work Related' | 'Quick Check' | 'Habit' | 'Bored';
  timestamp: number;
}

export interface BlockingState {
  isDeepWorkMode: boolean;
  blocklist: BlockRule[];
  whitelist: WhitelistRule[];
  schedules: Schedule[];
  temporaryUnlockUntil: number | null; // Timestamp
  emergencyCooldownUntil: number | null; // Timestamp
  emergencyUnlocks?: EmergencyUnlockRecord[];
}
