import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (initialSymbols.length > 0) {
      setSymbolsText(initialSymbols.join(', '));
    } else {
      setSymbolsText('');
    }
  }, [initialSymbols, isOpen]);

  const handleSave = () => {
    const symbols = symbolsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (symbols.length === 0) return;

    onSave(symbols);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
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
        <input
          id="transition-symbols"
          type="text"
          className="modal-input"
          value={symbolsText}
          onChange={(e) => setSymbolsText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., a, b, 0, 1, ε"
          autoFocus
        />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
          Use ε (epsilon) for empty transitions in NFA
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
