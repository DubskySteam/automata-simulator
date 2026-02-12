import { useEffect } from 'react';

interface KeyboardShortcuts {
  onDelete?: () => void;
  onSelectAll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey } = event;
      const cmdOrCtrl = ctrlKey || metaKey;

      // Delete or Backspace
      if ((key === 'Delete' || key === 'Backspace') && shortcuts.onDelete) {
        event.preventDefault();
        shortcuts.onDelete();
      }

      // Ctrl/Cmd + A (Select All)
      if (cmdOrCtrl && key === 'a' && shortcuts.onSelectAll) {
        event.preventDefault();
        shortcuts.onSelectAll();
      }

      // Ctrl/Cmd + Z (Undo)
      if (cmdOrCtrl && !shiftKey && key === 'z' && shortcuts.onUndo) {
        event.preventDefault();
        shortcuts.onUndo();
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z (Redo)
      if (
        (cmdOrCtrl && key === 'y') ||
        (cmdOrCtrl && shiftKey && key === 'z')
      ) {
        if (shortcuts.onRedo) {
          event.preventDefault();
          shortcuts.onRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}