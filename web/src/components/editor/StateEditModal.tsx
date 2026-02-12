import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { State } from '@/types';

interface StateEditModalProps {
  state: State | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (stateId: string, updates: Partial<State>) => void;
}

export function StateEditModal({ state, isOpen, onClose, onSave }: StateEditModalProps) {
  const [label, setLabel] = useState('');
  const [isInitial, setIsInitial] = useState(false);
  const [isAccept, setIsAccept] = useState(false);

  useEffect(() => {
    if (state) {
      setLabel(state.label);
      setIsInitial(state.isInitial);
      setIsAccept(state.isAccept);
    }
  }, [state]);

  const handleSave = () => {
    if (!state || !label.trim()) return;

    onSave(state.id, {
      label: label.trim(),
      isInitial,
      isAccept,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!state) return null;

  return (
    <Modal title="Edit State" isOpen={isOpen} onClose={onClose}>
      <div className="modal-form-group">
        <label className="modal-label" htmlFor="state-label">
          Label
        </label>
        <input
          id="state-label"
          type="text"
          className="modal-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., q0, q1, start"
          autoFocus
        />
      </div>

      <div className="modal-form-group">
        <label className="modal-checkbox">
          <input
            type="checkbox"
            checked={isInitial}
            onChange={(e) => setIsInitial(e.target.checked)}
          />
          <span>Initial State</span>
        </label>
      </div>

      <div className="modal-form-group">
        <label className="modal-checkbox">
          <input
            type="checkbox"
            checked={isAccept}
            onChange={(e) => setIsAccept(e.target.checked)}
          />
          <span>Accept State</span>
        </label>
      </div>

      <div className="modal-footer">
        <button className="modal-button modal-button-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="modal-button modal-button-primary"
          onClick={handleSave}
          disabled={!label.trim()}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}