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
      // Ignore shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInput = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput) {
        return; // Don't handle shortcuts in input fields
      }

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
