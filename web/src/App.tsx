import { useState, useCallback, useEffect } from 'react';
import { Canvas } from './components/editor/Canvas';
import { Toolbar } from './components/editor/Toolbar';
import { SimulationPanel } from './components/simulation/SimulationPanel';
import { CookieConsent } from './components/common/CookieConsent';
import { SettingsPanel } from './components/common/SettingsPanel';
import { AutomatonType } from './types';
import { SimulationState } from './types/simulation';
import { loadSettings, saveSettings, AppSettings } from './lib/storage/settings';
import './App.css';

const APP_VERSION = '1.0.0';
const GITHUB_URL = 'https://github.com/dubskysteam/automata-simulator';

function App() {
  const [toolMode, setToolMode] = useState<'select' | 'addState' | 'addTransition'>('select');
  const [automatonType, setAutomatonType] = useState<AutomatonType>('NFA');
  const [showSimulation, setShowSimulation] = useState(true);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Apply animations setting
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--transition',
      settings.animationsEnabled ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
    );
  }, [settings.animationsEnabled]);

  const handleSettingsChange = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const getSimulationHandlers = () => (window as any).simulationHandlers || {};
  const getCanvasHelpers = () => (window as any).canvasHelpers || {};

  const handleAutomatonTypeChange = useCallback((type: AutomatonType) => {
    if (type === 'DFA') {
      const helpers = getCanvasHelpers();
      if (helpers.hasEpsilonTransitions && helpers.hasEpsilonTransitions()) {
        const confirmed = window.confirm(
          'Switching to DFA will remove all ε-transitions. Continue?'
        );
        if (confirmed) {
          if (helpers.removeEpsilonTransitions) {
            helpers.removeEpsilonTransitions();
          }
          setAutomatonType(type);
        }
        return;
      }
    }
    setAutomatonType(type);
  }, []);

  const handleSimulationStart = useCallback((inputString: string) => {
    const handlers = getSimulationHandlers();
    if (handlers.start) {
      handlers.start(inputString);
    }
  }, []);

  const handleSimulationStep = useCallback((direction: 'forward' | 'back') => {
    const handlers = getSimulationHandlers();
    if (handlers.step) {
      handlers.step(direction);
    }
  }, []);

  const handleSimulationReset = useCallback(() => {
    const handlers = getSimulationHandlers();
    if (handlers.reset) {
      handlers.reset();
    }
  }, []);

  const handleSimulationPlay = useCallback(() => {
    const handlers = getSimulationHandlers();
    if (handlers.play) {
      handlers.play();
    }
  }, []);

  const handleSimulationPause = useCallback(() => {
    const handlers = getSimulationHandlers();
    if (handlers.pause) {
      handlers.pause();
    }
  }, []);

  return (
    <div className="app">
      {/* Modals at app level for proper z-index */}
      <CookieConsent onAccept={() => {}} />
      
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
      
      <header className="header">
        <div className="header-content">
          <div className="header-branding">
            <h1>
              <span className="header-icon">🤖</span>
              Automata Visualizer
            </h1>
            <p className="subtitle">Interactive DFA/NFA/PDA Editor & Simulator</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="toggle-sim-button"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            ⚙️
          </button>
          <button
            className="toggle-sim-button"
            onClick={() => setShowSimulation(!showSimulation)}
          >
            {showSimulation ? '← Hide Simulation' : 'Show Simulation →'}
          </button>
        </div>
      </header>

      <Toolbar 
        toolMode={toolMode} 
        onToolModeChange={setToolMode}
        automatonType={automatonType}
        onAutomatonTypeChange={handleAutomatonTypeChange}
      />

      <main className="main">
        <Canvas
          width={window.innerWidth - (showSimulation ? 400 : 0)}
          height={window.innerHeight - 200}
          toolMode={toolMode}
          automatonType={automatonType}
          onAutomatonTypeChange={setAutomatonType}
          showSimulation={showSimulation}
          onSimulationChange={setSimulation}
          onValidationChange={setValidationErrors}
          animationsEnabled={settings.animationsEnabled}
        />
        {showSimulation && (
          <SimulationPanel
            simulation={simulation}
            onStart={handleSimulationStart}
            onStep={handleSimulationStep}
            onReset={handleSimulationReset}
            onPlay={handleSimulationPlay}
            onPause={handleSimulationPause}
            validationErrors={validationErrors}
          />
        )}
      </main>

      <footer className="footer">
        <div className="footer-left">
          <div className="footer-version">
            <span>v{APP_VERSION}</span>
          </div>
          <span className="footer-divider" />
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.75 1.75V5h2.5a.75.75 0 0 1 0 1.5h-2.5v3h2.5a.75.75 0 0 1 0 1.5h-2.5v3.25a.75.75 0 0 1-1.5 0V11h-2.5a.75.75 0 0 1 0-1.5h2.5v-3h-2.5a.75.75 0 0 1 0-1.5h2.5V1.75a.75.75 0 0 1 1.5 0Z" />
            </svg>
            AGPL-3.0 License
          </a>
        </div>
        <div className="footer-right">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-badge"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
