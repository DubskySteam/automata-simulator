import { useState, KeyboardEvent } from 'react';
import './AlphabetEditor.css';

interface AlphabetEditorProps {
  alphabet: string[];
  onChange: (symbols: string[]) => void;
  disabled?: boolean;
}

export function AlphabetEditor({ alphabet, onChange, disabled }: AlphabetEditorProps) {
  const [input, setInput] = useState('');

  const addSymbol = () => {
    const sym = input.trim();
    if (!sym || alphabet.includes(sym)) {
      setInput('');
      return;
    }
    onChange([...alphabet, sym]);
    setInput('');
  };

  const removeSymbol = (sym: string) => {
    onChange(alphabet.filter((s) => s !== sym));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addSymbol();
    }
    if (e.key === 'Backspace' && input === '' && alphabet.length > 0) {
      removeSymbol(alphabet[alphabet.length - 1]);
    }
  };

  return (
    <div className="alphabet-editor">
      <span className="alphabet-label">Σ =</span>
      <div className="alphabet-tags">
        {alphabet.map((sym) => (
          <span key={sym} className="alphabet-tag">
            {sym}
            {!disabled && (
              <button onClick={() => removeSymbol(sym)} aria-label={`Remove ${sym}`}>
                ×
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            className="alphabet-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addSymbol}
            placeholder={alphabet.length === 0 ? 'a, b, 0, 1...' : ''}
            maxLength={4}
          />
        )}
      </div>
    </div>
  );
}
