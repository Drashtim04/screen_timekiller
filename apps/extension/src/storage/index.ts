import { BlockingState } from '../types/blocking';

/**
 * Storage wrapper abstracting chrome.storage.local.
 * Provides a typed interface for reading and writing the extension's blocking state.
 */

const DEFAULT_STATE: BlockingState = {
  isDeepWorkMode: false,
  blocklist: [],
  whitelist: [],
  schedules: [],
  temporaryUnlockUntil: null,
  emergencyCooldownUntil: null,
  emergencyUnlocks: [],
};

export const Storage = {
  /**
   * Retrieves the current state from chrome.storage.local
   */
  async getState(): Promise<BlockingState> {
    const data = await chrome.storage.local.get('blockingState');
    return data.blockingState || DEFAULT_STATE;
  },

  /**
   * Merges partial state into chrome.storage.local
   */
  async setState(state: Partial<BlockingState>): Promise<void> {
    const currentState = await this.getState();
    await chrome.storage.local.set({ blockingState: { ...currentState, ...state } });
  },

  /**
   * Listen for state changes
   */
  onChange(callback: (changes: Partial<BlockingState>) => void) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.blockingState) {
        // We pass the new value to the callback
        callback(changes.blockingState.newValue);
      }
    });
  }
};
