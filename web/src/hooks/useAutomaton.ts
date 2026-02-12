import { useState, useCallback } from 'react';
import { Automaton, State, Transition, Position } from '@/types';
import { generateId } from '@/lib/canvas/utils';

export function useAutomaton(initialAutomaton?: Partial<Automaton>) {
  const [automaton, setAutomaton] = useState<Automaton>({
    type: 'DFA',
    states: [],
    transitions: [],
    alphabet: [],
    ...initialAutomaton,
  });

  const addState = useCallback((position: Position, label?: string) => {
    const newState: State = {
      id: generateId(),
      label: label || `q${automaton.states.length}`,
      isInitial: automaton.states.length === 0,
      isAccept: false,
      position,
    };

    setAutomaton((prev) => ({
      ...prev,
      states: [...prev.states, newState],
    }));

    return newState.id;
  }, [automaton.states.length]);

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
    // Check if transition already exists
    const existingTransition = automaton.transitions.find(
      (t) => t.from === from && t.to === to
    );

    if (existingTransition) {
      // Merge symbols
      setAutomaton((prev) => ({
        ...prev,
        transitions: prev.transitions.map((t) =>
          t.id === existingTransition.id
            ? { ...t, symbols: Array.from(new Set([...t.symbols, ...symbols])) }
            : t
        ),
        alphabet: Array.from(new Set([...prev.alphabet, ...symbols])),
      }));
      return existingTransition.id;
    }

    const newTransition: Transition = {
      id: generateId(),
      from,
      to,
      symbols,
    };

    setAutomaton((prev) => ({
      ...prev,
      transitions: [...prev.transitions, newTransition],
      alphabet: Array.from(new Set([...prev.alphabet, ...symbols])),
    }));

    return newTransition.id;
  }, [automaton.transitions]);

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

  return {
    automaton,
    setAutomaton,
    addState,
    removeState,
    updateState,
    toggleStateInitial,
    toggleStateAccept,
    addTransition,
    updateTransition,
    removeTransition,
  };
}