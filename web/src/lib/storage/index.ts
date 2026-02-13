import { Automaton } from '@/types';

const STORAGE_KEY = 'automata-visualizer-state';
const AUTOSAVE_DELAY = 1000; // 1 second debounce

export const storage = {
  save(automaton: Automaton): void {
    try {
      const data = JSON.stringify(automaton);
      localStorage.setItem(STORAGE_KEY, data);
      localStorage.setItem(`${STORAGE_KEY}-timestamp`, new Date().toISOString());
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  load(): Automaton | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as Automaton;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  },

  getLastSaveTime(): Date | null {
    const timestamp = localStorage.getItem(`${STORAGE_KEY}-timestamp`);
    return timestamp ? new Date(timestamp) : null;
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}-timestamp`);
  },

  hasSavedData(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },
};

// Debounced autosave
let autosaveTimeout: NodeJS.Timeout | null = null;

export function autosave(automaton: Automaton): void {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }
  autosaveTimeout = setTimeout(() => {
    storage.save(automaton);
  }, AUTOSAVE_DELAY);
}