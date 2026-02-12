export interface AppSettings {
  theme: 'light' | 'dark';
  animationsEnabled: boolean;
  cookiesAccepted: boolean;
}

const STORAGE_KEY = 'automata-visualizer-settings';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  animationsEnabled: true,
  cookiesAccepted: false,
};

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Partial<AppSettings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save settings:', error);
  }
}

export function clearSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear settings:', error);
  }
}
