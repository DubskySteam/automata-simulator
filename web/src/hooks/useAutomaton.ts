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
      isInitial: automaton.states.length === 0, // First state is initial
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
      // Remove transitions connected to this state
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
    const newTransition: Transition = {
      id: generateId(),
      from,
      to,
      symbols,
    };

    setAutomaton((prev) => ({
      ...prev,
      transitions: [...prev.transitions, newTransition],
      // Add symbols to alphabet if not present
      alphabet: Array.from(new Set([...prev.alphabet, ...symbols])),
    }));

    return newTransition.id;
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
    removeTransition,
  };
}