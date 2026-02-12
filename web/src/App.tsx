import { useState } from 'react';
import { Canvas } from './components/editor/Canvas';
import { Toolbar } from './components/editor/Toolbar';
import { ToolMode } from './types';
import './App.css';

function App() {
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  return (
    <div className="app">
      <header className="header">
        <h1>Automata Visualizer</h1>
        <p className="subtitle">Interactive DFA/NFA Editor & Simulator</p>
      </header>

      <Toolbar toolMode={toolMode} onToolModeChange={setToolMode} />

      <main className="main">
        <Canvas
          width={window.innerWidth}
          height={window.innerHeight - 200}
          toolMode={toolMode}
        />
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