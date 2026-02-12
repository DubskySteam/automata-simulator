import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/common/Modal';

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (symbols: string[]) => void;
  initialSymbols?: string[];
  fromLabel?: string;
  toLabel?: string;
}

export function TransitionModal({
  isOpen,
  onClose,
  onSave,
  initialSymbols = [],
  fromLabel,
  toLabel,
}: TransitionModalProps) {
  const [symbolsText, setSymbolsText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Only reset when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      if (initialSymbols.length > 0) {
        setSymbolsText(initialSymbols.join(', '));
      } else {
        setSymbolsText('');
      }
    }
  }, [isOpen]); // Remove initialSymbols from deps to prevent reset on every render

  const handleSave = () => {
    const symbols = symbolsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (symbols.length === 0) return;

    onSave(symbols);
    setSymbolsText(''); // Clear for next time
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const insertEpsilon = () => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newText = symbolsText.slice(0, start) + 'ε' + symbolsText.slice(end);
    
    setSymbolsText(newText);
    
    // Set cursor position after epsilon
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + 1, start + 1);
    }, 0);
  };

  return (
    <Modal
      title={fromLabel && toLabel ? `Transition: ${fromLabel} → ${toLabel}` : 'Add Transition'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="modal-form-group">
        <label className="modal-label" htmlFor="transition-symbols">
          Symbols (comma-separated)
        </label>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <input
            ref={inputRef}
            id="transition-symbols"
            type="text"
            className="modal-input"
            value={symbolsText}
            onChange={(e) => setSymbolsText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., a, b, 0, 1, ε"
            autoFocus
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="modal-button modal-button-secondary"
            onClick={insertEpsilon}
            style={{ 
              padding: 'var(--spacing-sm) var(--spacing-md)',
              minWidth: 'auto',
              fontSize: '1.1rem'
            }}
            title="Insert epsilon (ε)"
          >
            ε
          </button>
        </div>
        <p style={{ 
          fontSize: '0.85rem', 
          color: 'var(--text-secondary)', 
          marginTop: 'var(--spacing-xs)' 
        }}>
          Use ε (epsilon) for empty transitions in NFA. Click the ε button to insert it.
        </p>
      </div>

      <div className="modal-footer">
        <button className="modal-button modal-button-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="modal-button modal-button-primary"
          onClick={handleSave}
          disabled={symbolsText.trim().length === 0}
        >
          {initialSymbols.length > 0 ? 'Update' : 'Add'}
        </button>
      </div>
    </Modal>
  );
}
