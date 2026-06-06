import { create } from 'zustand';
import { FocusSession } from '../types/focus';

interface FocusState {
  currentSession: FocusSession | null;
  startSession: (blockedSites: string[]) => void;
  endSession: () => void;
  interruptSession: () => void;
}

export const useFocusStore = create<FocusState>((set) => ({
  currentSession: null,
  startSession: (blockedSites) => set({
    currentSession: {
      id: crypto.randomUUID(),
      userId: 'local-user', // Will be replaced by real auth
      startTime: Date.now(),
      status: 'active',
      blockedWebsites: blockedSites
    }
  }),
  endSession: () => set((state) => ({
    currentSession: state.currentSession ? {
      ...state.currentSession,
      endTime: Date.now(),
      duration: Math.floor((Date.now() - state.currentSession.startTime) / 1000),
      status: 'completed'
    } : null
  })),
  interruptSession: () => set((state) => ({
    currentSession: state.currentSession ? {
      ...state.currentSession,
      endTime: Date.now(),
      status: 'interrupted'
    } : null
  }))
}));
