// src/components/language/LanguagePanel.tsx
import { useState, KeyboardEvent } from 'react';
import { AutomatonType } from '@/types';
import './LanguagePanel.css';

interface TestCase {
  id: string;
  input: string;
  result: 'accepted' | 'rejected' | 'error';
}

interface LanguagePanelProps {
  alphabet: string[];
  onAlphabetChange: (symbols: string[]) => void;
  automatonType: AutomatonType;
  onRunTest: (input: string) => 'accepted' | 'rejected' | null;
}

export function LanguagePanel({
  alphabet,
  onAlphabetChange,
  automatonType,
  onRunTest,
}: LanguagePanelProps) {
  const [symInput, setSymInput] = useState('');
  const [testInput, setTestInput] = useState('');
  const [tests, setTests] = useState<TestCase[]>([]);

  const addSymbol = () => {
    const s = symInput.trim();
    if (!s || alphabet.includes(s)) {
      setSymInput('');
      return;
    }
    onAlphabetChange([...alphabet, s]);
    setSymInput('');
  };
  const removeSymbol = (s: string) => onAlphabetChange(alphabet.filter((x) => x !== s));
  const onSymKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSymbol();
    }
    if (e.key === 'Backspace' && symInput === '' && alphabet.length > 0)
      removeSymbol(alphabet[alphabet.length - 1]);
  };

  const addTest = () => {
    const input = testInput.trim();
    if (tests.some((t) => t.input === input)) {
      setTestInput('');
      return;
    }
    const result = onRunTest(input) ?? 'error';
    setTests((prev) => [...prev, { id: crypto.randomUUID(), input, result }]);
    setTestInput('');
  };
  const removeTest = (id: string) => setTests((p) => p.filter((t) => t.id !== id));
  const rerunAll = () =>
    setTests((p) => p.map((t) => ({ ...t, result: onRunTest(t.input) ?? 'error' })));
  const onTestKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTest();
    }
  };

  const acceptedN = tests.filter((t) => t.result === 'accepted').length;
  const rejectedN = tests.filter((t) => t.result === 'rejected').length;

  return (
    <div className="language-panel">
      <section className="lp-section">
        <header className="lp-header">
          <h3 className="lp-title">
            <span className="lp-sigma">Σ</span> Alphabet
          </h3>
          {alphabet.length > 0 && (
            <span className="lp-meta">
              {alphabet.length} symbol{alphabet.length !== 1 ? 's' : ''}
            </span>
          )}
        </header>

        <div className="lp-tag-box">
          {alphabet.map((s) => (
            <span key={s} className="lp-tag">
              <code>{s}</code>
              <button onClick={() => removeSymbol(s)} aria-label={`Remove ${s}`}>
                ×
              </button>
            </span>
          ))}
          {automatonType === 'NFA' && (
            <span className="lp-tag lp-tag-auto">
              <code>ε</code>
              <span className="lp-tag-hint">NFA</span>
            </span>
          )}
          <input
            className="lp-sym-input"
            value={symInput}
            onChange={(e) => setSymInput(e.target.value.slice(0, 4))}
            onKeyDown={onSymKey}
            onBlur={addSymbol}
            placeholder={alphabet.length === 0 ? 'a, b, 0, 1…' : '+'}
            aria-label="Add symbol"
          />
        </div>

        {alphabet.length === 0 && (
          <p className="lp-hint">
            Define your alphabet to constrain transitions and catch invalid symbols. Type a symbol
            and press Enter.
          </p>
        )}
      </section>

      <div className="lp-divider" />

      <section className="lp-section">
        <header className="lp-header">
          <h3 className="lp-title">🧪 Test Suite</h3>
          {tests.length > 0 && (
            <button className="lp-rerun" onClick={rerunAll}>
              ↺ Re-run
            </button>
          )}
        </header>

        <div className="lp-test-row">
          <input
            className="lp-test-input"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={onTestKey}
            placeholder="Input string (Enter to add)"
            spellCheck={false}
            aria-label="Test string"
          />
          <button className="lp-test-add" onClick={addTest} aria-label="Add test">
            +
          </button>
        </div>

        {tests.length > 0 && (
          <div className="lp-summary">
            <span className="lp-ok">{acceptedN} accepted</span>
            <span className="lp-dot">·</span>
            <span className="lp-fail">{rejectedN} rejected</span>
            {tests.length - acceptedN - rejectedN > 0 && (
              <>
                <span className="lp-dot">·</span>
                <span className="lp-err">{tests.length - acceptedN - rejectedN} error</span>
              </>
            )}
          </div>
        )}

        {tests.length === 0 && (
          <p className="lp-hint">
            Add strings to instantly see whether the automaton accepts or rejects them.
          </p>
        )}

        <ul className="lp-test-list">
          {tests.map((t) => (
            <li key={t.id} className={`lp-test-item ${t.result}`}>
              <span className="lp-icon">
                {t.result === 'accepted' ? '✓' : t.result === 'rejected' ? '✗' : '?'}
              </span>
              <code className="lp-str">{t.input === '' ? 'ε' : t.input}</code>
              <span className="lp-result-label">{t.result}</span>
              <button className="lp-del" onClick={() => removeTest(t.id)} aria-label="Remove">
                ×
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
