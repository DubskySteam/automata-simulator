import { ToolMode, AutomatonType } from '@/types';
import './Toolbar.css';

interface ToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  automatonType: AutomatonType;
  onAutomatonTypeChange: (type: AutomatonType) => void;
  onExportPNG?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: () => void;
}

export function Toolbar({ 
  toolMode, 
  onToolModeChange, 
  automatonType, 
  onAutomatonTypeChange,
  onExportPNG,
  onExportJSON,
  onImportJSON,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3 className="toolbar-title">Type</h3>
        <div className="toolbar-buttons">
          <button
            className={`toolbar-button ${automatonType === 'DFA' ? 'active' : ''}`}
            onClick={() => onAutomatonTypeChange('DFA')}
            title="Deterministic Finite Automaton"
          >
            DFA
          </button>
          <button
            className={`toolbar-button ${automatonType === 'NFA' ? 'active' : ''}`}
            onClick={() => onAutomatonTypeChange('NFA')}
            title="Nondeterministic Finite Automaton"
          >
            NFA
          </button>
          <button
            className={`toolbar-button ${automatonType === 'PDA' ? 'active' : ''}`}
            onClick={() => onAutomatonTypeChange('PDA')}
            title="Pushdown Automaton (Coming Soon)"
            disabled
          >
            PDA
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3 className="toolbar-title">Tools</h3>
        <div className="toolbar-buttons">
          <button
            className={`toolbar-button ${toolMode === 'select' ? 'active' : ''}`}
            onClick={() => onToolModeChange('select')}
            title="Select Mode (V)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3 L4 17 L9 12 L12 17 L14 16 L11 11 L17 11 Z" />
            </svg>
            <span>Select</span>
          </button>

          <button
            className={`toolbar-button ${toolMode === 'addState' ? 'active' : ''}`}
            onClick={() => onToolModeChange('addState')}
            title="Add State Mode (S)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7" />
            </svg>
            <span>State</span>
          </button>

          <button
            className={`toolbar-button ${toolMode === 'addTransition' ? 'active' : ''}`}
            onClick={() => onToolModeChange('addTransition')}
            title="Add Transition Mode (T)"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10 L17 10" markerEnd="url(#arrow)" />
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <path d="M0 0 L0 6 L9 3 Z" fill="currentColor" stroke="none" />
                </marker>
              </defs>
            </svg>
            <span>Transition</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <h3 className="toolbar-title">File</h3>
        <div className="toolbar-buttons">
          <button
            className="toolbar-button"
            onClick={onExportPNG}
            title="Export as PNG"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="14" rx="2" />
              <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
              <path d="M3 13 L6 10 L9 13 L13 9 L17 13 L17 17 L3 17 Z" fill="currentColor" stroke="none" />
            </svg>
            <span>PNG</span>
          </button>

          <button
            className="toolbar-button"
            onClick={onExportJSON}
            title="Export as JSON"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 3 L17 7 L17 17 L3 17 L3 3 Z M13 3 L13 7 L17 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
            <span>Export</span>
          </button>

          <button
            className="toolbar-button"
            onClick={onImportJSON}
            title="Import from JSON"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3 L10 12 M7 9 L10 12 L13 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 17 L16 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Import</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-info">
          <div className="toolbar-hint">
            {toolMode === 'select' && '• Click to select • Drag to move • Double-click to add state'}
            {toolMode === 'addState' && '• Click anywhere to add a state'}
            {toolMode === 'addTransition' && '• Click a state, then click target state'}
          </div>
        </div>
      </div>
    </div>
  );
}
