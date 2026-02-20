import { useState, useCallback, useEffect } from 'react';
import { Canvas } from './components/editor/Canvas';
import { Toolbar } from './components/editor/Toolbar';
import { RightPanel } from './components/layout/RightPanel';
import { CookieConsent } from './components/common/CookieConsent';
import { SettingsPanel } from './components/common/SettingsPanel';
import { AutomatonType } from './types';
import { SimulationState } from './types/simulation';
import { ValidationError } from './types/validation';
import { SimulationEngine } from './lib/simulation/engine';
import { loadSettings, saveSettings, AppSettings } from './lib/storage/settings';
import './App.css';

function App() {
  const [toolMode, setToolMode] = useState<'select' | 'addState' | 'addTransition'>('select');
  const [automatonType, setAutomatonType] = useState<AutomatonType>('DFA');
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [alphabet, setAlphabet] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [settings, setSettings] = useState(loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

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

  const handleThemeToggle = useCallback(() => {
    handleSettingsChange({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  }, [settings.theme, handleSettingsChange]);

  const getCanvasHelpers = () => (window as any).canvasHelpers || {};
  const getSimulationHandlers = () => (window as any).simulationHandlers || {};

  const handleAutomatonTypeChange = useCallback((type: AutomatonType) => {
    if (type === 'DFA') {
      const helpers = getCanvasHelpers();
      if (helpers.hasEpsilonTransitions?.()) {
        const confirmed = window.confirm(
          'Switching to DFA will remove all ε-transitions. Continue?'
        );
        if (!confirmed) return;
        helpers.removeEpsilonTransitions?.();
      }
    }
    setAutomatonType(type);
  }, []);

  const handleUndo = useCallback(() => getCanvasHelpers().undo?.(), []);
  const handleRedo = useCallback(() => getCanvasHelpers().redo?.(), []);

  const handleUndoRedoChange = useCallback((u: boolean, r: boolean) => {
    setCanUndo(u);
    setCanRedo(r);
  }, []);

  const handleSimulationStart = useCallback((inputString: string) => {
    getSimulationHandlers().start?.(inputString);
  }, []);
  const handleSimulationStep = useCallback((direction: 'forward' | 'back') => {
    getSimulationHandlers().step?.(direction);
  }, []);
  const handleSimulationReset = useCallback(() => getSimulationHandlers().reset?.(), []);
  const handleSimulationPlay = useCallback(() => getSimulationHandlers().play?.(), []);
  const handleSimulationPause = useCallback(() => getSimulationHandlers().pause?.(), []);

  const handleAlphabetChange = useCallback((symbols: string[]) => {
    getCanvasHelpers().setAlphabet?.(symbols);
  }, []);

  const handleRunTest = useCallback((input: string): 'accepted' | 'rejected' | null => {
    const helpers = getCanvasHelpers();
    if (!helpers.getAutomaton) return null;
    const engine = new SimulationEngine(helpers.getAutomaton());
    const steps = engine.simulate(input);
    return engine.isAccepted(steps) ? 'accepted' : 'rejected';
  }, []);

  const handleExportPNG = useCallback(() => {
    getCanvasHelpers().exportToPNG?.();
  }, []);

  const handleExportJSON = useCallback(() => {
    const helpers = getCanvasHelpers();
    if (!helpers.getAutomaton) return;
    const json = JSON.stringify(helpers.getAutomaton(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `automaton-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
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
          const automaton = JSON.parse(event.target?.result as string);
          if (!automaton.type || !automaton.states || !automaton.transitions) {
            alert('Invalid automaton file format');
            return;
          }
          getCanvasHelpers().loadAutomaton?.(automaton);
        } catch (err) {
          alert('Error parsing JSON file: ' + err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return (
    <div className="app">
      {/* Modals */}
      <CookieConsent onAccept={() => {}} />
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Toolbar */}
      <Toolbar
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        automatonType={automatonType}
        onAutomatonTypeChange={handleAutomatonTypeChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExportPNG={handleExportPNG}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onOpenSettings={() => setShowSettings(true)}
        theme={settings.theme}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main layout */}
      <div className="app-layout">
        <Canvas
          toolMode={toolMode}
          automatonType={automatonType}
          showSimulation={true}
          onSimulationChange={setSimulation}
          onValidationChange={setValidationErrors}
          onUndoRedoChange={handleUndoRedoChange}
          onAlphabetChange={setAlphabet}
          animationsEnabled={settings.animationsEnabled}
        />

        <RightPanel
          alphabet={alphabet}
          onAlphabetChange={handleAlphabetChange}
          automatonType={automatonType}
          validationErrors={validationErrors}
          simulation={simulation}
          onStart={handleSimulationStart}
          onStep={handleSimulationStep}
          onReset={handleSimulationReset}
          onPlay={handleSimulationPlay}
          onPause={handleSimulationPause}
          onRunTest={handleRunTest}
        />
      </div>
    </div>
  );
}

export default App;