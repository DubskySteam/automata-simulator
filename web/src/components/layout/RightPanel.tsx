import { useState } from 'react';
import { SimulationState } from '@/types/simulation';
import { ValidationError } from '@/types/validation';
import { AutomatonType } from '@/types';
import { SimulationPanel } from '@/components/simulation/SimulationPanel';
import { ValidationPanel } from '@/components/validation/ValidationPanel';
import { LanguagePanel } from '@/components/language/LanguagePanel';
import './RightPanel.css';

type Tab = 'language' | 'validate' | 'simulate';

interface RightPanelProps {
  alphabet: string[];
  onAlphabetChange: (symbols: string[]) => void;
  automatonType: AutomatonType;
  validationErrors: ValidationError[];
  simulation: SimulationState | null;
  onStart: (input: string) => void;
  onStep: (direction: 'forward' | 'back') => void;
  onReset: () => void;
  onPlay: () => void;
  onPause: () => void;
  onRunTest: (input: string) => 'accepted' | 'rejected' | null;
}

const TabIcon = {
  language: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M2 4h12M2 8h8M2 12h10" />
      <text
        x="10"
        y="5.5"
        fontSize="7"
        fontWeight="800"
        fill="currentColor"
        stroke="none"
        fontFamily="serif"
      >
        Σ
      </text>
    </svg>
  ),
  validate: (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2L3 4.5V8c0 2.8 2.2 5.2 5 5.8 2.8-.6 5-3 5-5.8V4.5L8 2z" />
      <path d="M5.5 8l2 2 3-3" />
    </svg>
  ),
  simulate: (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.5 3.2l8 4.8-8 4.8V3.2z" />
    </svg>
  ),
};

export function RightPanel({
  alphabet,
  onAlphabetChange,
  automatonType,
  validationErrors,
  simulation,
  onStart,
  onStep,
  onReset,
  onPlay,
  onPause,
  onRunTest,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('simulate');

  const errorCount = validationErrors.filter((e) => e.type === 'error').length;
  const warningCount = validationErrors.filter((e) => e.type === 'warning').length;
  const badgeCount = errorCount > 0 ? errorCount : warningCount > 0 ? warningCount : 0;
  const badgeKind = errorCount > 0 ? 'error' : 'warn';

  return (
    <aside className="right-panel">
      <div className="rp-tabs" role="tablist">
        {(['language', 'validate', 'simulate'] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`rp-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {TabIcon[tab]}
            <span className="rp-tab-label">
              {tab === 'language' ? 'Language' : tab === 'validate' ? 'Validate' : 'Simulate'}
            </span>
            {tab === 'validate' && badgeCount > 0 && (
              <span className={`rp-badge ${badgeKind}`}>{badgeCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="rp-content">
        {activeTab === 'language' && (
          <LanguagePanel
            alphabet={alphabet}
            onAlphabetChange={onAlphabetChange}
            automatonType={automatonType}
            onRunTest={onRunTest}
          />
        )}
        {activeTab === 'validate' && (
          <div className="rp-inner-pad">
            <ValidationPanel errors={validationErrors} />
          </div>
        )}
        {activeTab === 'simulate' && (
          <SimulationPanel
            simulation={simulation}
            onStart={onStart}
            onStep={onStep}
            onReset={onReset}
            onPlay={onPlay}
            onPause={onPause}
            validationErrors={validationErrors}
          />
        )}
      </div>
    </aside>
  );
}
