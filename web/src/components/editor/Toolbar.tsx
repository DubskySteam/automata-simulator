import { ToolMode, AutomatonType } from '@/types';
import { useState } from 'react';
import { ExamplesPanel } from '@/components/common/ExamplesPanel';
import './Toolbar.css';
import { AutomatonExample } from '@/lib/automata/examples';

const IconUndo = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 7h5a3.5 3.5 0 1 1 0 7H6" />
    <path d="M4 4L1.5 7 4 10" />
  </svg>
);
const IconRedo = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 7H7a3.5 3.5 0 1 0 0 7h3" />
    <path d="M12 4l2.5 3L12 10" />
  </svg>
);
const IconSelect = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.5 2l9 5.5-4.2.9-2.6 5.1z" />
  </svg>
);
const IconAddState = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="8" cy="8" r="5.5" />
    <line x1="8" y1="5.5" x2="8" y2="10.5" />
    <line x1="5.5" y1="8" x2="10.5" y2="8" />
  </svg>
);
const IconAddTransition = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="2.5" cy="8" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="13.5" cy="8" r="1.5" fill="currentColor" stroke="none" />
    <path d="M4 8h6.5" />
    <path d="M9 5.5l3 2.5-3 2.5" />
  </svg>
);
const IconClear = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </svg>
);
const IconExamples = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
    <line x1="5" y1="6.5" x2="11" y2="6.5" />
    <line x1="5" y1="9.5" x2="8.5" y2="9.5" />
  </svg>
);
const IconImport = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 11v1.5a1 1 0 001 1h8a1 1 0 001-1V11" />
    <path d="M8 9.5V3" />
    <path d="M5.5 5.5L8 3l2.5 2.5" />
  </svg>
);

const IconExportJson = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 11v1.5a1 1 0 001 1h8a1 1 0 001-1V11" />
    <path d="M8 3v6.5" />
    <path d="M5.5 7L8 9.5 10.5 7" />
  </svg>
);

const IconExportPng = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="12" height="9" rx="1.5" />
    <circle cx="5.5" cy="6" r="1.2" />
    <path d="M2 10l3.5-3.5 2.5 2.5 1.5-1.5 4.5 4.5" />
  </svg>
);

const IconSun = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M3.6 12.4l1.4-1.4M11 5l1.4-1.4" />
  </svg>
);
const IconMoon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M13.5 10A6.5 6.5 0 0 1 6 2.5a6.5 6.5 0 1 0 7.5 7.5z" />
  </svg>
);
const IconSettings = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <circle cx="8" cy="8" r="2.5" />
    <path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.7 3.7l1.3 1.3M11 11l1.3 1.3M3.7 12.3l1.3-1.3M11 5l1.3-1.3" />
  </svg>
);
const IconGitHub = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

interface ToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  automatonType: AutomatonType;
  onAutomatonTypeChange: (type: AutomatonType) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onExportPNG?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: () => void;
  onOpenSettings?: () => void;
  theme?: string;
  onThemeToggle?: () => void;
}

const GITHUB_URL = 'https://github.com/dubskysteam/automata-simulator';

export function Toolbar({
  toolMode,
  onToolModeChange,
  automatonType,
  onAutomatonTypeChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onExportPNG,
  onExportJSON,
  onImportJSON,
  onOpenSettings,
  theme = 'dark',
  onThemeToggle,
}: ToolbarProps) {
  const [showExamples, setShowExamples] = useState(false);

  const handleClear = () => {
    const helpers = (window as any).canvasHelpers;
    if (
      helpers?.clearWorkspace &&
      window.confirm('Clear the workspace? This action can be undone.')
    ) {
      helpers.clearWorkspace();
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="tb-group">
          <button
            className="tb-btn"
            onClick={onUndo}
            disabled={!canUndo}
            data-tooltip="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <IconUndo />
          </button>
          <button
            className="tb-btn"
            onClick={onRedo}
            disabled={!canRedo}
            data-tooltip="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <IconRedo />
          </button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group">
          <button
            className={`tb-btn ${toolMode === 'select' ? 'active' : ''}`}
            onClick={() => onToolModeChange('select')}
            data-tooltip="Select · Move (V)"
          >
            <IconSelect />
            <span className="tb-label">Select</span>
          </button>
          <button
            className={`tb-btn ${toolMode === 'addState' ? 'active' : ''}`}
            onClick={() => onToolModeChange('addState')}
            data-tooltip="Add State — click canvas (S)"
          >
            <IconAddState />
            <span className="tb-label">State</span>
          </button>
          <button
            className={`tb-btn ${toolMode === 'addTransition' ? 'active' : ''}`}
            onClick={() => onToolModeChange('addTransition')}
            data-tooltip="Add Transition — click two states (T)"
          >
            <IconAddTransition />
            <span className="tb-label">Transition</span>
          </button>
        </div>

        <div className="tb-sep" />

        {/* Automaton type */}
        <div className="tb-type-group">
          <button
            className={`tb-type-btn ${automatonType === 'DFA' ? 'active' : ''}`}
            onClick={() => onAutomatonTypeChange('DFA')}
            data-tooltip="Deterministic Finite Automaton"
          >
            DFA
          </button>
          <button
            className={`tb-type-btn ${automatonType === 'NFA' ? 'active' : ''}`}
            onClick={() => onAutomatonTypeChange('NFA')}
            data-tooltip="Non-deterministic Finite Automaton"
          >
            NFA
          </button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group">
          <button
            className="tb-btn tb-danger"
            onClick={handleClear}
            data-tooltip="Clear Workspace"
            aria-label="Clear"
          >
            <IconClear />
            <span className="tb-label">Clear</span>
          </button>
          <button
            className="tb-btn"
            onClick={() => setShowExamples(true)}
            data-tooltip="Load an example automaton"
          >
            <IconExamples />
            <span className="tb-label">Examples</span>
          </button>
        </div>

        <div className="tb-sep" />

        <div className="tb-group">
          <button className="tb-btn" onClick={onImportJSON} data-tooltip="Import JSON">
            <IconImport />
            <span className="tb-label">Import</span>
          </button>
          <button className="tb-btn" onClick={onExportJSON} data-tooltip="Export JSON">
            <IconExportJson />
            <span className="tb-label">Export</span>
          </button>
          <button className="tb-btn" onClick={onExportPNG} data-tooltip="Export PNG">
            <IconExportPng />
            <span className="tb-label">PNG</span>
          </button>
        </div>

        <div className="tb-spacer" />

        <div className="tb-group">
          <button
            className="tb-btn"
            onClick={onThemeToggle}
            data-tooltip={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
          <button
            className="tb-btn"
            onClick={onOpenSettings}
            data-tooltip="Settings"
            aria-label="Settings"
          >
            <IconSettings />
          </button>
          <a
            className="tb-btn"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-tooltip="View on GitHub"
            aria-label="GitHub"
          >
            <IconGitHub />
          </a>
        </div>
      </div>

      <ExamplesPanel
        isOpen={showExamples}
        onClose={() => setShowExamples(false)}
        onLoadExample={(example: AutomatonExample) => {
          (window as any).canvasHelpers?.loadAutomaton?.(example.automaton);
          onAutomatonTypeChange(example.automaton.type);
          setShowExamples(false);
        }}
      />
    </>
  );
}
