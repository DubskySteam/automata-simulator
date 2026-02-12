import { useState } from 'react';
import { Canvas } from './components/editor/Canvas';
import { Toolbar } from './components/editor/Toolbar';
import { SimulationPanel } from './components/simulation/SimulationPanel';
import { ToolMode } from './types';
import './App.css';

function App() {
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [showSimulation, setShowSimulation] = useState(true);

  return (
    <div className="app">
      <header className="header">
        <h1>Automata Visualizer</h1>
        <p className="subtitle">Interactive DFA/NFA Editor & Simulator</p>
        <button
          className="toggle-sim-button"
          onClick={() => setShowSimulation(!showSimulation)}
        >
          {showSimulation ? 'Hide' : 'Show'} Simulation
        </button>
      </header>

      <Toolbar toolMode={toolMode} onToolModeChange={setToolMode} />

      <main className="main">
        <Canvas
          width={window.innerWidth - (showSimulation ? 400 : 0)}
          height={window.innerHeight - 200}
          toolMode={toolMode}
          showSimulation={showSimulation}
        />
        {showSimulation && <SimulationPanel />}
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
