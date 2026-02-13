import { useState, useCallback, useEffect, useRef } from 'react';
import { Automaton, State, Transition, Position } from '@/types';
import { autosave } from '@/lib/storage';

interface UseAutomatonProps {
  type?: 'DFA' | 'NFA' | 'PDA';
  states?: State[];
  transitions?: Transition[];
}

export function useAutomaton(initialConfig?: UseAutomatonProps) {
  const [automaton, setAutomaton] = useState<Automaton>({
    type: initialConfig?.type || 'NFA',
    states: initialConfig?.states || [],
    transitions: initialConfig?.transitions || [],
    alphabet: [],
  });

  const hasRestoredRef = useRef(false);

  // Autosave whenever automaton changes (but not on initial mount)
  useEffect(() => {
    if (hasRestoredRef.current && (automaton.states.length > 0 || automaton.transitions.length > 0)) {
      autosave(automaton);
    }
  }, [automaton]);

  const addState = useCallback((position: Position) => {
    hasRestoredRef.current = true;
    const newId = (automaton.states.length + 1).toString();
    const newLabel = `q${automaton.states.length}`;
    const newState: State = {
      id: newId,
      label: newLabel,
      isInitial: automaton.states.length === 0,
      isAccept: false,
      position,
    };
    setAutomaton((prev) => ({
      ...prev,
      states: [...prev.states, newState],
    }));
  }, [automaton.states.length]);

  const removeState = useCallback((stateId: string) => {
    setAutomaton((prev) => ({
      ...prev,
      states: prev.states.filter((s) => s.id !== stateId),
      transitions: prev.transitions.filter((t) => t.from !== stateId && t.to !== stateId),
    }));
  }, []);

  const updateState = useCallback((stateId: string, updates: Partial<State>) => {
    setAutomaton((prev) => ({
      ...prev,
      states: prev.states.map((s) => (s.id === stateId ? { ...s, ...updates } : s)),
    }));
  }, []);

  const toggleStateInitial = useCallback((stateId: string) => {
    setAutomaton((prev) => ({
      ...prev,
      states: prev.states.map((s) => ({
        ...s,
        isInitial: s.id === stateId ? !s.isInitial : false,
      })),
    }));
  }, []);

  const toggleStateAccept = useCallback((stateId: string) => {
    setAutomaton((prev) => ({
      ...prev,
      states: prev.states.map((s) =>
        s.id === stateId ? { ...s, isAccept: !s.isAccept } : s
      ),
    }));
  }, []);

  const addTransition = useCallback((from: string, to: string, symbols: string[]) => {
    const newId = `t${automaton.transitions.length + 1}`;
    const newTransition: Transition = {
      id: newId,
      from,
      to,
      symbols,
    };
    setAutomaton((prev) => ({
      ...prev,
      transitions: [...prev.transitions, newTransition],
    }));
  }, [automaton.transitions.length]);

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
    hasRestoredRef.current = true;
    setAutomaton(newAutomaton);
  }, []);

  const clearAutomaton = useCallback(() => {
    setAutomaton({
      type: automaton.type,
      states: [],
      transitions: [],
      alphabet: [],
    });
  }, [automaton.type]);

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
  };
}
