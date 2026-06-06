export type BehavioralEvent = 
  | 'TAB_SWITCH' 
  | 'BLOCKED_SITE_ATTEMPT' 
  | 'EXCESSIVE_SCROLL'
  | 'RAPID_REOPEN';

export interface DistractionLog {
  id: string;
  timestamp: number;
  type: BehavioralEvent;
  weight: number;
}

export interface AIWarning {
  message: string;
  suggestDeepWork: boolean;
}
