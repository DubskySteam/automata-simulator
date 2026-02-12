export type AutomatonType = 'DFA' | 'NFA' | 'PDA';

export interface Position {
  x: number;
  y: number;
}

export interface State {
  id: string;
  label: string;
  isInitial: boolean;
  isAccept: boolean;
  position: Position;
}

export interface Transition {
  id: string;
  from: string; // state id
  to: string; // state id
  symbols: string[]; // can be ['ε'] for epsilon transitions
}

export interface Automaton {
  type: AutomatonType;
  states: State[];
  transitions: Transition[];
  alphabet: string[];
}