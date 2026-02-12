import { Canvas } from './components/editor/Canvas';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Automata Visualizer</h1>
        <p className="subtitle">Interactive DFA/NFA Editor & Simulator</p>
      </header>

      <main className="main">
        <Canvas width={window.innerWidth} height={window.innerHeight - 160} />
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
