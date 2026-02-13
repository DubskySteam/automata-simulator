import { Automaton } from '@/types';

export interface AutomatonExample {
  id: string;
  name: string;
  description: string;
  automaton: Automaton;
  category: 'DFA' | 'NFA' | 'PDA';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const AUTOMATON_EXAMPLES: AutomatonExample[] = [
  // DFA Examples
  {
    id: 'dfa-even-zeros',
    name: 'Even number of 0s',
    description: 'Accepts strings with an even number of 0s',
    category: 'DFA',
    difficulty: 'beginner',
    automaton: {
      type: 'DFA',
      states: [
        { id: '1', label: 'q0', isInitial: true, isAccept: true, position: { x: 200, y: 200 } },
        { id: '2', label: 'q1', isInitial: false, isAccept: false, position: { x: 400, y: 200 } },
      ],
      transitions: [
        { id: 't1', from: '1', to: '2', symbols: ['0'] },
        { id: 't2', from: '2', to: '1', symbols: ['0'] },
        { id: 't3', from: '1', to: '1', symbols: ['1'] },
        { id: 't4', from: '2', to: '2', symbols: ['1'] },
      ],
      alphabet: ['0', '1'],
    },
  },
  {
    id: 'dfa-contains-01',
    name: 'Contains substring "01"',
    description: 'Accepts strings that contain "01" as a substring',
    category: 'DFA',
    difficulty: 'beginner',
    automaton: {
      type: 'DFA',
      states: [
        { id: '1', label: 'q0', isInitial: true, isAccept: false, position: { x: 150, y: 200 } },
        { id: '2', label: 'q1', isInitial: false, isAccept: false, position: { x: 300, y: 200 } },
        { id: '3', label: 'q2', isInitial: false, isAccept: true, position: { x: 450, y: 200 } },
      ],
      transitions: [
        { id: 't1', from: '1', to: '1', symbols: ['1'] },
        { id: 't2', from: '1', to: '2', symbols: ['0'] },
        { id: 't3', from: '2', to: '2', symbols: ['0'] },
        { id: 't4', from: '2', to: '3', symbols: ['1'] },
        { id: 't5', from: '3', to: '3', symbols: ['0', '1'] },
      ],
      alphabet: ['0', '1'],
    },
  },
  {
    id: 'dfa-divisible-by-3',
    name: 'Binary divisible by 3',
    description: 'Accepts binary numbers divisible by 3',
    category: 'DFA',
    difficulty: 'intermediate',
    automaton: {
      type: 'DFA',
      states: [
        { id: '1', label: 'q0', isInitial: true, isAccept: true, position: { x: 250, y: 150 } },
        { id: '2', label: 'q1', isInitial: false, isAccept: false, position: { x: 400, y: 100 } },
        { id: '3', label: 'q2', isInitial: false, isAccept: false, position: { x: 400, y: 250 } },
      ],
      transitions: [
        { id: 't1', from: '1', to: '1', symbols: ['0'] },
        { id: 't2', from: '1', to: '2', symbols: ['1'] },
        { id: 't3', from: '2', to: '3', symbols: ['0'] },
        { id: 't4', from: '2', to: '1', symbols: ['1'] },
        { id: 't5', from: '3', to: '2', symbols: ['0'] },
        { id: 't6', from: '3', to: '3', symbols: ['1'] },
      ],
      alphabet: ['0', '1'],
    },
  },
  
  // NFA Examples
  {
    id: 'nfa-ends-with-01',
    name: 'Ends with "01"',
    description: 'NFA that accepts strings ending with "01"',
    category: 'NFA',
    difficulty: 'beginner',
    automaton: {
      type: 'NFA',
      states: [
        { id: '1', label: 'q0', isInitial: true, isAccept: false, position: { x: 150, y: 200 } },
        { id: '2', label: 'q1', isInitial: false, isAccept: false, position: { x: 300, y: 200 } },
        { id: '3', label: 'q2', isInitial: false, isAccept: true, position: { x: 450, y: 200 } },
      ],
      transitions: [
        { id: 't1', from: '1', to: '1', symbols: ['0', '1'] },
        { id: 't2', from: '1', to: '2', symbols: ['0'] },
        { id: 't3', from: '2', to: '3', symbols: ['1'] },
      ],
      alphabet: ['0', '1'],
    },
  },
  {
    id: 'nfa-third-from-end-is-1',
    name: 'Third symbol from end is 1',
    description: 'NFA that accepts strings where the third symbol from the end is 1',
    category: 'NFA',
    difficulty: 'intermediate',
    automaton: {
      type: 'NFA',
      states: [
        { id: '1', label: 'q0', isInitial: true, isAccept: false, position: { x: 100, y: 200 } },
        { id: '2', label: 'q1', isInitial: false, isAccept: false, position: { x: 250, y: 200 } },
        { id: '3', label: 'q2', isInitial: false, isAccept: false, position: { x: 400, y: 200 } },
        { id: '4', label: 'q3', isInitial: false, isAccept: true, position: { x: 550, y: 200 } },
      ],
      transitions: [
        { id: 't1', from: '1', to: '1', symbols: ['0', '1'] },
        { id: 't2', from: '1', to: '2', symbols: ['1'] },
        { id: 't3', from: '2', to: '3', symbols: ['0', '1'] },
        { id: 't4', from: '3', to: '4', symbols: ['0', '1'] },
      ],
      alphabet: ['0', '1'],
    },
  },
  {
    id: 'nfa-epsilon',
    name: 'NFA with ε-transitions',
    description: 'Demonstrates epsilon transitions (accepts "a" or "ab")',
    category: 'NFA',
    difficulty: 'intermediate',
    automaton: {
      type: 'NFA',
      states: [
        { id: '1', label: 'q0', isInitial: true, isAccept: false, position: { x: 150, y: 200 } },
        { id: '2', label: 'q1', isInitial: false, isAccept: true, position: { x: 300, y: 200 } },
        { id: '3', label: 'q2', isInitial: false, isAccept: true, position: { x: 450, y: 200 } },
      ],
      transitions: [
        { id: 't1', from: '1', to: '2', symbols: ['a'] },
        { id: 't2', from: '2', to: '3', symbols: ['ε'] },
        { id: 't3', from: '3', to: '3', symbols: ['b'] },
      ],
      alphabet: ['a', 'b'],
    },
  },
  
  // Complex examples
  {
    id: 'dfa-starts-and-ends-same',
    name: 'Starts and ends with same symbol',
    description: 'DFA accepting strings that start and end with the same symbol',
    category: 'DFA',
    difficulty: 'advanced',
    automaton: {
      type: 'DFA',
      states: [
        { id: '1', label: 'q0', isInitial: true, isAccept: false, position: { x: 200, y: 200 } },
        { id: '2', label: 'q1', isInitial: false, isAccept: true, position: { x: 350, y: 100 } },
        { id: '3', label: 'q2', isInitial: false, isAccept: false, position: { x: 500, y: 100 } },
        { id: '4', label: 'q3', isInitial: false, isAccept: true, position: { x: 350, y: 300 } },
        { id: '5', label: 'q4', isInitial: false, isAccept: false, position: { x: 500, y: 300 } },
      ],
      transitions: [
        { id: 't1', from: '1', to: '2', symbols: ['0'] },
        { id: 't2', from: '1', to: '4', symbols: ['1'] },
        { id: 't3', from: '2', to: '2', symbols: ['0'] },
        { id: 't4', from: '2', to: '3', symbols: ['1'] },
        { id: 't5', from: '3', to: '2', symbols: ['0'] },
        { id: 't6', from: '3', to: '3', symbols: ['1'] },
        { id: 't7', from: '4', to: '5', symbols: ['0'] },
        { id: 't8', from: '4', to: '4', symbols: ['1'] },
        { id: 't9', from: '5', to: '5', symbols: ['0'] },
        { id: 't10', from: '5', to: '4', symbols: ['1'] },
      ],
      alphabet: ['0', '1'],
    },
  },
];

export function getExamplesByCategory(category: 'DFA' | 'NFA' | 'PDA'): AutomatonExample[] {
  return AUTOMATON_EXAMPLES.filter((example) => example.category === category);
}

export function getExamplesByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): AutomatonExample[] {
  return AUTOMATON_EXAMPLES.filter((example) => example.difficulty === difficulty);
}

export function getExampleById(id: string): AutomatonExample | undefined {
  return AUTOMATON_EXAMPLES.find((example) => example.id === id);
}
