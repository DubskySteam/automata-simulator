import { useState, useCallback, useEffect } from 'react';
import { Canvas } from './components/editor/Canvas';
import { Toolbar } from './components/editor/Toolbar';
import { SimulationPanel } from './components/simulation/SimulationPanel';
import { CookieConsent } from './components/common/CookieConsent';
import { SettingsPanel } from './components/common/SettingsPanel';
import { AutomatonType, ValidationError } from './types';
import { SimulationState } from './types/simulation';
import { loadSettings, saveSettings, AppSettings } from './lib/storage/settings';
import './App.css';

const APP_VERSION = '1.0.0';
const GITHUB_URL = 'https://github.com/dubskysteam/automata-simulator';

function App() {
  const [toolMode, setToolMode] = useState<'select' | 'addState' | 'addTransition'>('select');
  const [automatonType, setAutomatonType] = useState<AutomatonType>('DFA');
  const [showSimulation, setShowSimulation] = useState(true);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

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

  const handleUndo = useCallback(() => {
    const helper = getCanvasHelpers();
    if (helper.undo) helper.undo();
  }, []);

  const handleRedo = useCallback(() => {
    const helper = getCanvasHelpers();
    if (helper.redo) helper.redo();
  }, []);

  const handleUndoRedoChange = useCallback((undoPossible: boolean, redoPossible: boolean) => {
    setCanUndo(undoPossible);
    setCanRedo(redoPossible);
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

  const handleExportPNG = useCallback(() => {
    const helpers = getCanvasHelpers();
    if (helpers.exportToPNG) {
      helpers.exportToPNG();
    }
  }, []);

  const handleExportJSON = useCallback(() => {
    const helpers = getCanvasHelpers();
    if (helpers.getAutomaton) {
      const automaton = helpers.getAutomaton();
      const json = JSON.stringify(automaton, null, 2);

      // Create download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `automaton-${Date.now()}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const automaton = JSON.parse(json);

          // Validate the structure
          if (!automaton.type || !automaton.states || !automaton.transitions) {
            alert('Invalid automaton file format');
            return;
          }

          const helpers = getCanvasHelpers();
          if (helpers.loadAutomaton) {
            helpers.loadAutomaton(automaton);
          }
        } catch (error) {
          alert('Error parsing JSON file: ' + error);
        }
      };
      reader.readAsText(file);
    };

    input.click();
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
        <div className="header-left">
          <div className="header-logo">
            <span className="logo-icon">🤖</span>
            <div className="logo-text">
              <h1>Automata Visualizer</h1>
              <p className="tagline">Interactive DFA/NFA/PDA Editor</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <button className="header-button" onClick={() => setShowSettings(true)} title="Settings">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v6m0 6v6m0-18a9 9 0 1 0 9 9 9 9 0 0 0-9-9z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </button>
          <div className="header-divider"></div>
          <button
            className="header-button header-button-primary"
            onClick={() => setShowSimulation(!showSimulation)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{showSimulation ? 'Hide Simulation' : 'Show Simulation'}</span>
          </button>
        </div>
      </header>

      <Toolbar
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        automatonType={automatonType}
        onAutomatonTypeChange={handleAutomatonTypeChange}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
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
          onUndoRedoChange={handleUndoRedoChange}
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
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="footer-badge">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
