import { useState, useCallback, useEffect } from 'react';
import { Automaton, State, Transition, Position } from '@/types';
import { generateId } from '@/lib/canvas/utils';

export function useAutomaton(initialAutomaton?: Partial<Automaton>) {
  const [automaton, setAutomaton] = useState<Automaton>({
    type: 'NFA',
    states: [],
    transitions: [],
    alphabet: [],
    ...initialAutomaton,
  });

  // Update automaton type when it changes externally
  useEffect(() => {
    if (initialAutomaton?.type && initialAutomaton.type !== automaton.type) {
      setAutomaton((prev) => ({ ...prev, type: initialAutomaton.type! }));
    }
  }, [initialAutomaton?.type]);

  const setAutomatonType = useCallback((type: 'DFA' | 'NFA') => {
    setAutomaton((prev) => ({ ...prev, type }));
  }, []);

  const addState = useCallback((position: Position, label?: string) => {
    setAutomaton((prev) => {
      const newState: State = {
        id: generateId(),
        label: label || `q${prev.states.length}`,
        isInitial: prev.states.length === 0,
        isAccept: false,
        position,
      };

      return {
        ...prev,
        states: [...prev.states, newState],
      };
    });
  }, []);

  const removeState = useCallback((stateId: string) => {
    setAutomaton((prev) => ({
      ...prev,
      states: prev.states.filter((s) => s.id !== stateId),
      transitions: prev.transitions.filter(
        (t) => t.from !== stateId && t.to !== stateId
      ),
    }));
  }, []);

  const updateState = useCallback((stateId: string, updates: Partial<State>) => {
    setAutomaton((prev) => ({
      ...prev,
      states: prev.states.map((state) =>
        state.id === stateId ? { ...state, ...updates } : state
      ),
    }));
  }, []);

  const toggleStateInitial = useCallback((stateId: string) => {
    setAutomaton((prev) => ({
      ...prev,
      states: prev.states.map((state) => ({
        ...state,
        isInitial: state.id === stateId ? !state.isInitial : state.isInitial,
      })),
    }));
  }, []);

  const toggleStateAccept = useCallback((stateId: string) => {
    setAutomaton((prev) => ({
      ...prev,
      states: prev.states.map((state) =>
        state.id === stateId ? { ...state, isAccept: !state.isAccept } : state
      ),
    }));
  }, []);

  const addTransition = useCallback((from: string, to: string, symbols: string[]) => {
    setAutomaton((prev) => {
      // Check if transition already exists
      const existingTransition = prev.transitions.find(
        (t) => t.from === from && t.to === to
      );

      if (existingTransition) {
        // Merge symbols
        return {
          ...prev,
          transitions: prev.transitions.map((t) =>
            t.id === existingTransition.id
              ? { ...t, symbols: Array.from(new Set([...t.symbols, ...symbols])) }
              : t
          ),
          alphabet: Array.from(new Set([...prev.alphabet, ...symbols.filter(s => s !== 'ε')])),
        };
      }

      const newTransition: Transition = {
        id: generateId(),
        from,
        to,
        symbols,
      };

      return {
        ...prev,
        transitions: [...prev.transitions, newTransition],
        alphabet: Array.from(new Set([...prev.alphabet, ...symbols.filter(s => s !== 'ε')])),
      };
    });
  }, []);

  const updateTransition = useCallback((transitionId: string, updates: Partial<Transition>) => {
    setAutomaton((prev) => ({
      ...prev,
      transitions: prev.transitions.map((t) =>
        t.id === transitionId ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const removeTransition = useCallback((transitionId: string) => {
    setAutomaton((prev) => ({
      ...prev,
      transitions: prev.transitions.filter((t) => t.id !== transitionId),
    }));
  }, []);

  const loadAutomaton = useCallback((newAutomaton: Automaton) => {
    setAutomaton(newAutomaton);
  }, []);

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
};
}
