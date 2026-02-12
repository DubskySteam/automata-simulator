import { useState, useEffect } from 'react';
import { SimulationState } from '@/types/simulation';
import './SimulationPanel.css';

interface SimulationPanelProps {
  simulation: SimulationState | null;
  onStart: (input: string) => void;
  onStep: (direction: 'forward' | 'back') => void;
  onReset: () => void;
  onPlay: () => void;
  onPause: () => void;
  validationErrors?: string[];
}

export function SimulationPanel({
  simulation,
  onStart,
  onStep,
  onReset,
  onPlay,
  onPause,
  validationErrors = [],
}: SimulationPanelProps) {
  const [inputString, setInputString] = useState('');

  const handleStart = () => {
    if (inputString.trim()) {
      onStart(inputString);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  };

  const canStepForward = simulation && simulation.currentStep < simulation.steps.length - 1;
  const canStepBack = simulation && simulation.currentStep > 0;

  const currentStep = simulation?.steps[simulation.currentStep];

  return (
    <div className="simulation-panel">
      <div className="simulation-header">
        <h2>Simulation</h2>
      </div>

      {validationErrors.length > 0 && (
        <div className="simulation-errors">
          <h3>⚠️ Automaton Issues:</h3>
          <ul>
            {validationErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="simulation-input-section">
        <label htmlFor="sim-input">Input String:</label>
        <div className="simulation-input-group">
          <input
            id="sim-input"
            type="text"
            className="simulation-input"
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter string to test..."
            disabled={simulation?.isRunning}
          />
          <button
            className="sim-button sim-button-primary"
            onClick={handleStart}
            disabled={!inputString.trim() || simulation?.isRunning || validationErrors.length > 0}
          >
            Start
          </button>
        </div>
      </div>

      {simulation && (
        <>
          <div className="simulation-controls">
            <button
              className="sim-button"
              onClick={() => onStep('back')}
              disabled={!canStepBack || simulation.isRunning}
              title="Step Back"
            >
              ⏮
            </button>
            {simulation.isRunning ? (
              <button className="sim-button" onClick={onPause} title="Pause">
                ⏸
              </button>
            ) : (
              <button
                className="sim-button"
                onClick={onPlay}
                disabled={!canStepForward}
                title="Play"
              >
                ▶️
              </button>
            )}
            <button
              className="sim-button"
              onClick={() => onStep('forward')}
              disabled={!canStepForward || simulation.isRunning}
              title="Step Forward"
            >
              ⏭
            </button>
            <button className="sim-button" onClick={onReset} title="Reset">
              🔄
            </button>
          </div>

          <div className="simulation-status">
            <div className="simulation-progress">
              <div className="simulation-string">
                <span className="consumed">{currentStep?.consumedInput}</span>
                <span className="current">
                  {currentStep?.remainingInput.charAt(0) || ''}
                </span>
                <span className="remaining">
                  {currentStep?.remainingInput.slice(1) || ''}
                </span>
              </div>
              <div className="simulation-step-info">
                Step {simulation.currentStep + 1} of {simulation.steps.length}
              </div>
            </div>

            <div className="simulation-current-states">
              <strong>Current State{currentStep?.currentStates.length !== 1 ? 's' : ''}:</strong>{' '}
              {currentStep?.currentStates.length === 0 ? (
                <span className="no-states">None (stuck)</span>
              ) : (
                currentStep?.currentStates.join(', ') || 'None'
              )}
            </div>

            {simulation.result !== 'running' && (
              <div
                className={`simulation-result ${
                  simulation.result === 'accepted' ? 'accepted' : 'rejected'
                }`}
              >
                {simulation.result === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
