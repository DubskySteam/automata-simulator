import { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '@/lib/storage/settings';
import './CookieConsent.css';

interface CookieConsentProps {
  onAccept: () => void;
}

export function CookieConsent({ onAccept }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const settings = loadSettings();
    console.log('Cookie consent check:', settings.cookiesAccepted); // Debug log
    if (!settings.cookiesAccepted) {
      // Small delay to ensure page is loaded
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleAccept = () => {
    console.log('Accepting cookies'); // Debug log
    saveSettings({ cookiesAccepted: true });
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="cookie-consent-backdrop">
      <div className="cookie-consent">
        <div className="cookie-consent-icon">🍪</div>
        <div className="cookie-consent-content">
          <h3>We use browser storage</h3>
          <p>
            This app uses localStorage to save your preferences (theme, animations) and automaton data locally. 
            No data is sent to any server. By clicking "Accept", you allow us to store data in your browser.
          </p>
        </div>
        <div className="cookie-consent-actions">
          <button className="cookie-btn cookie-btn-secondary" onClick={handleDecline}>
            Decline
          </button>
          <button className="cookie-btn cookie-btn-primary" onClick={handleAccept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
