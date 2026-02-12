import { AppSettings } from '@/lib/storage/settings';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>Appearance</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Dark Mode</span>
                <span className="setting-description">Use dark color scheme</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.theme === 'dark'}
                  onChange={(e) => onSettingsChange({ theme: e.target.checked ? 'dark' : 'light' })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Animations</span>
                <span className="setting-description">Enable smooth animations</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.animationsEnabled}
                  onChange={(e) => onSettingsChange({ animationsEnabled: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
