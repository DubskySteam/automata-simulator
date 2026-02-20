import { ValidationError } from '@/types/validation';
import './ValidationPanel.css';

interface ValidationPanelProps {
  errors: ValidationError[];
  onErrorClick?: (error: ValidationError) => void;
}

export function ValidationPanel({ errors, onErrorClick }: ValidationPanelProps) {
  const errorCount = errors.filter((e) => e.type === 'error').length;
  const warningCount = errors.filter((e) => e.type === 'warning').length;

  if (errors.length === 0) {
    return (
      <div className="validation-panel valid">
        <div className="validation-header">
          <span className="validation-icon">✓</span>
          <span className="validation-title">Automaton is valid</span>
        </div>
      </div>
    );
  }

  return (
    <div className="validation-panel invalid">
      <div className="validation-header">
        <span className="validation-icon">⚠</span>
        <span className="validation-title">
          {errorCount > 0 && `${errorCount} error${errorCount > 1 ? 's' : ''}`}
          {errorCount > 0 && warningCount > 0 && ', '}
          {warningCount > 0 && `${warningCount} warning${warningCount > 1 ? 's' : ''}`}
        </span>
      </div>
      <ul className="validation-list">
        {errors.map((error, idx) => (
          <li
            key={idx}
            className={`validation-item ${error.type}`}
            onClick={() => onErrorClick?.(error)}
            style={{ cursor: onErrorClick ? 'pointer' : 'default' }}
          >
            <div className="error-message">{error.message}</div>
            {error.affectedStates && error.affectedStates.length > 0 && (
              <div className="error-details">
                Affected states: {error.affectedStates.length}
              </div>
            )}
            {error.affectedTransitions && error.affectedTransitions.length > 0 && (
              <div className="error-details">
                Affected transitions: {error.affectedTransitions.length}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
