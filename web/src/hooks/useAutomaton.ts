import { useState, useCallback, useEffect, useRef } from 'react';
import { Automaton, State, Transition, Position } from '@/types';
import { autosave } from '@/lib/storage';

const MAX_HISTORY = 20;

interface HistoryState {
  past: Automaton[];
  present: Automaton;
  future: Automaton[];
}

interface UseAutomatonProps {
  type?: 'DFA' | 'NFA' | 'PDA';
  states?: State[];
  transitions?: Transition[];
}

export function useAutomaton(initialConfig?: UseAutomatonProps) {
  const initialAutomaton: Automaton = {
    type: initialConfig?.type || 'NFA',
    states: initialConfig?.states || [],
    transitions: initialConfig?.transitions || [],
    alphabet: [],
  };

  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialAutomaton,
    future: [],
  });

  const hasRestoredRef = useRef(false);

  const automaton = history.present;
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Autosave whenever automaton changes (but not on initial mount)
  useEffect(() => {
    if (
      hasRestoredRef.current &&
      (automaton.states.length > 0 || automaton.transitions.length > 0)
    ) {
      autosave(automaton);
    }
  }, [automaton]);

  const setAutomaton = useCallback(
    (updater: Automaton | ((prev: Automaton) => Automaton), addToHistory = true) => {
      setHistory((h) => {
        const next = typeof updater === 'function' ? updater(h.present) : updater;
        if (addToHistory) {
          return {
            past: [...h.past.slice(-(MAX_HISTORY - 1)), h.present],
            present: next,
            future: [],
          };
        }
        return { ...h, present: next };
      });
    },
    []
  );

  const pushToHistory = useCallback(() => {
    setHistory((h) => ({
      past: [...h.past.slice(-(MAX_HISTORY - 1)), h.present],
      present: h.present,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future.slice(0, MAX_HISTORY - 1)],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past.slice(-(MAX_HISTORY - 1)), h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, []);

  const addState = useCallback(
    (position: Position) => {
      hasRestoredRef.current = true;
      setAutomaton((prev) => {
        const newId = (prev.states.length + 1).toString();
        const newLabel = `q${prev.states.length}`;
        const newState: State = {
          id: newId,
          label: newLabel,
          isInitial: prev.states.length === 0,
          isAccept: false,
          position,
        };
        return { ...prev, states: [...prev.states, newState] };
      });
    },
    [setAutomaton]
  );

  const removeState = useCallback(
    (stateId: string) => {
      setAutomaton((prev) => ({
        ...prev,
        states: prev.states.filter((s) => s.id != stateId),
        transitions: prev.transitions.filter((t) => t.from !== stateId && t.to !== stateId),
      }));
    },
    [setAutomaton]
  );

  const updateState = useCallback(
    (stateId: string, updates: Partial<State>) => {
      setAutomaton((prev) => ({
        ...prev,
        states: prev.states.map((s) => (s.id === stateId ? { ...s, ...updates } : s)),
      }));
    },
    [setAutomaton]
  );

  const updateStatePosition = useCallback(
    (stateId: string, position: Position) => {
      setAutomaton(
        (prev) => ({
          ...prev,
          states: prev.states.map((s) => (s.id === stateId ? { ...s, position } : s)),
        }),
        false
      );
    },
    [setAutomaton]
  );

  const toggleStateInitial = useCallback(
    (stateId: string) => {
      setAutomaton((prev) => ({
        ...prev,
        states: prev.states.map((s) => ({
          ...s,
          isInitial: s.id === stateId ? !s.isInitial : false,
        })),
      }));
    },
    [setAutomaton]
  );

  const toggleStateAccept = useCallback(
    (stateId: string) => {
      setAutomaton((prev) => ({
        ...prev,
        states: prev.states.map((s) => (s.id === stateId ? { ...s, isAccept: !s.isAccept } : s)),
      }));
    },
    [setAutomaton]
  );

  const addTransition = useCallback(
    (from: string, to: string, symbols: string[]) => {
      setAutomaton((prev) => {
        const newId = `t${prev.transitions.length + 1}`;
        const newTransition: Transition = { id: newId, from, to, symbols };
        return { ...prev, transitions: [...prev.transitions, newTransition] };
      });
    },
    [setAutomaton]
  );

  const updateTransition = useCallback(
    (transitionId: string, updates: Partial<Transition>) => {
      setAutomaton((prev) => ({
        ...prev,
        transitions: prev.transitions.map((t) =>
          t.id === transitionId ? { ...t, ...updates } : t
        ),
      }));
    },
    [setAutomaton]
  );

  const removeTransition = useCallback(
    (transitionId: string) => {
      setAutomaton((prev) => ({
        ...prev,
        transitions: prev.transitions.filter((t) => t.id !== transitionId),
      }));
    },
    [setAutomaton]
  );

  const loadAutomaton = useCallback((newAutomaton: Automaton) => {
    hasRestoredRef.current = true;
    setHistory({ past: [], present: newAutomaton, future: [] });
  }, []);

  const clearAutomaton = useCallback(() => {
    setAutomaton({
      type: automaton.type,
      states: [],
      transitions: [],
      alphabet: [],
    });
  }, [setAutomaton]);

  const setAlphabet = useCallback(
    (alphabet: string[]) => {
      setAutomaton((prev) => ({ ...prev, alphabet }));
    },
    [setAutomaton]
  );

  return {
    automaton,
    addState,
    removeState,
    updateState,
    toggleStateInitial,
    toggleStateAccept,
    addTransition,
    updateTransition,
    removeTransition,
    loadAutomaton,
    clearAutomaton,
    canRedo,
    canUndo,
    redo,
    undo,
    pushToHistory,
    updateStatePosition,
    setAlphabet,
  };
}
