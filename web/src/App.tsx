import { useState, useCallback, useRef } from 'react';
import { Canvas } from './components/editor/Canvas';
import { Toolbar } from './components/editor/Toolbar';
import { SimulationPanel } from './components/simulation/SimulationPanel';
import { ToolMode } from './types';
import { SimulationState } from './types/simulation';
import './App.css';

function App() {
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [automatonType, setAutomatonType] = useState<'DFA' | 'NFA'>('NFA');
  const [showSimulation, setShowSimulation] = useState(true);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const canvasRef = useRef<any>(null);

  // Get simulation handlers from window (set by Canvas)
  const getSimulationHandlers = () => (window as any).simulationHandlers || {};
  const getCanvasHelpers = () => (window as any).canvasHelpers || {};

  const handleAutomatonTypeChange = useCallback((type: 'DFA' | 'NFA') => {
    // If switching to DFA, check for epsilon transitions
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
        // If not confirmed, don't switch
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
      <header className="header">
        <div>
          <h1>Automata Visualizer</h1>
          <p className="subtitle">Interactive DFA/NFA Editor & Simulator</p>
        </div>
        <button
          className="toggle-sim-button"
          onClick={() => setShowSimulation(!showSimulation)}
        >
          {showSimulation ? 'Hide' : 'Show'} Simulation
        </button>
      </header>

      <Toolbar 
        toolMode={toolMode} 
        onToolModeChange={setToolMode}
        automatonType={automatonType}
        onAutomatonTypeChange={handleAutomatonTypeChange}
      />

      <main className="main">
        <Canvas
          ref={canvasRef}
          width={window.innerWidth - (showSimulation ? 400 : 0)}
          height={window.innerHeight - 200}
          toolMode={toolMode}
          automatonType={automatonType}
          onAutomatonTypeChange={setAutomatonType}
          showSimulation={showSimulation}
          onSimulationChange={setSimulation}
          onValidationChange={setValidationErrors}
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
        <p>
          Licensed under{' '}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            AGPL-3.0
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
