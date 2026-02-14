import { useState } from 'react';
import { SimulationState } from '@/types/simulation';
import './SimulationPanel.css';

interface SimulationPanelProps {
  simulation: SimulationState | null;
  onStart: (inputString: string) => void;
  onStep: (direction: 'forward' | 'back') => void;
  onReset: () => void;
  onPlay: () => void;
  onPause: () => void;
  validationErrors: string[];
}

export function SimulationPanel({
  simulation,
  onStart,
  onStep,
  onReset,
  onPlay,
  onPause,
  validationErrors,
}: SimulationPanelProps) {
  const [inputString, setInputString] = useState('');

  const handleStart = () => {
    if (inputString) {
      onStart(inputString);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStart();
    }
  };

  // Get state labels from window (exposed by Canvas)
  const getStateLabel = (stateId: string): string => {
    const helpers = (window as any).canvasHelpers;
    if (helpers?.getAutomaton) {
      const automaton = helpers.getAutomaton();
      const state = automaton.states.find((s: any) => s.id === stateId);
      return state?.label || stateId;
    }
    return stateId;
  };

  const currentStep = simulation?.steps[simulation.currentStep];
  const stateLabels = currentStep?.currentStates.map(getStateLabel).join(', ') || 'None';

  return (
    <div className="simulation-panel">
      <div className="simulation-header">
        <h2>Simulation</h2>
      </div>

      {validationErrors.length > 0 && (
        <div className="simulation-errors">
          <h3>⚠️ Validation Errors</h3>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="simulation-input-section">
        <label>Input String:</label>
        <div className="simulation-input-group">
          <input
            type="text"
            className="simulation-input"
            placeholder="Enter string to test..."
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!!simulation}
          />
          {!simulation ? (
            <button
              className="sim-button sim-button-primary"
              onClick={handleStart}
              disabled={!inputString}
            >
              ▶
            </button>
          ) : (
            <button className="sim-button" onClick={onReset}>
              ↺
            </button>
          )}
        </div>
      </div>

      {simulation && (
        <>
          <div className="simulation-controls">
            <button
              className="sim-button"
              onClick={() => onStep('back')}
              disabled={simulation.currentStep === 0}
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
                disabled={simulation.currentStep >= simulation.steps.length - 1}
                title="Play"
              >
                ▶️
              </button>
            )}
            <button
              className="sim-button"
              onClick={() => onStep('forward')}
              disabled={simulation.currentStep >= simulation.steps.length - 1}
              title="Step Forward"
            >
              ⏭
            </button>
          </div>

          <div className="simulation-status">
            <div className="simulation-progress">
              <div className="simulation-string">
                <span className="consumed">{currentStep?.consumedInput}</span>
                {currentStep?.remainingInput && currentStep.remainingInput.length > 0 ? (
                  <>
                    <span className="current">{currentStep.remainingInput[0]}</span>
                    <span className="remaining">{currentStep.remainingInput.slice(1)}</span>
                  </>
                ) : (
                  <span className="remaining">∅</span>
                )}
              </div>
              <div className="simulation-step-info">
                Step {simulation.currentStep + 1} of {simulation.steps.length}
              </div>
            </div>

            <div className="simulation-current-states">
              <strong>Current State{currentStep?.currentStates.length !== 1 ? 's' : ''}:</strong>{' '}
              {currentStep?.currentStates.length === 0 ? (
                <span className="no-states">Stuck (No valid transitions)</span>
              ) : (
                stateLabels
              )}
            </div>

            {simulation.currentStep === simulation.steps.length - 1 && (
              <div className={`simulation-result ${simulation.result}`}>
                {simulation.result === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
