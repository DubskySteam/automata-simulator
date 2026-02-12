import { Automaton, State, Transition } from '@/types';
import { SimulationStep } from '@/types/simulation';

export class SimulationEngine {
  private automaton: Automaton;

  constructor(automaton: Automaton) {
    this.automaton = automaton;
  }

  // Get epsilon closure for NFA (states reachable via ε-transitions)
  private getEpsilonClosure(stateIds: string[]): string[] {
    const closure = new Set(stateIds);
    const stack = [...stateIds];

    while (stack.length > 0) {
      const current = stack.pop()!;
      
      // Find all ε-transitions from current state
      const epsilonTransitions = this.automaton.transitions.filter(
        (t) => t.from === current && t.symbols.includes('ε')
      );

      for (const transition of epsilonTransitions) {
        if (!closure.has(transition.to)) {
          closure.add(transition.to);
          stack.push(transition.to);
        }
      }
    }

    return Array.from(closure);
  }

  // Simulate the automaton with the given input string
  simulate(inputString: string): SimulationStep[] {
    const steps: SimulationStep[] = [];
    
    // Get initial state(s)
    const initialStates = this.automaton.states
      .filter((s) => s.isInitial)
      .map((s) => s.id);

    if (initialStates.length === 0) {
      // No initial state
      steps.push({
        currentStates: [],
        remainingInput: inputString,
        consumedInput: '',
      });
      return steps;
    }

    // Apply epsilon closure to initial states (for NFA)
    let currentStates = this.getEpsilonClosure(initialStates);

    // Initial step
    steps.push({
      currentStates: [...currentStates],
      remainingInput: inputString,
      consumedInput: '',
    });

    // Process each symbol
    for (let i = 0; i < inputString.length; i++) {
      const symbol = inputString[i];
      const nextStates = new Set<string>();

      // For each current state, find transitions with this symbol
      for (const stateId of currentStates) {
        const transitions = this.automaton.transitions.filter(
          (t) => t.from === stateId && t.symbols.includes(symbol)
        );

        for (const transition of transitions) {
          nextStates.add(transition.to);
        }
      }

      // Apply epsilon closure to next states
      currentStates = this.getEpsilonClosure(Array.from(nextStates));

      steps.push({
        currentStates: [...currentStates],
        remainingInput: inputString.slice(i + 1),
        consumedInput: inputString.slice(0, i + 1),
        transitionTaken: currentStates.length > 0 ? {
          from: steps[steps.length - 1].currentStates[0],
          to: currentStates[0],
          symbol,
        } : undefined,
      });

      // If no states, we're stuck (reject)
      if (currentStates.length === 0) {
        break;
      }
    }

    return steps;
  }

  // Check if the simulation accepts
  isAccepted(steps: SimulationStep[]): boolean {
    if (steps.length === 0) return false;

    const finalStep = steps[steps.length - 1];
    
    // Check if we consumed all input and are in an accept state
    if (finalStep.remainingInput.length > 0) return false;

    // For NFA, any accept state means accepted
    return finalStep.currentStates.some((stateId) => {
      const state = this.automaton.states.find((s) => s.id === stateId);
      return state?.isAccept || false;
    });
  }

  // Validate the automaton
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for initial state
    const initialStates = this.automaton.states.filter((s) => s.isInitial);
    if (initialStates.length === 0) {
      errors.push('No initial state defined');
    }
    if (this.automaton.type === 'DFA' && initialStates.length > 1) {
      errors.push('DFA can only have one initial state');
    }

    // Check for accept states
    const acceptStates = this.automaton.states.filter((s) => s.isAccept);
    if (acceptStates.length === 0) {
      errors.push('No accept states defined');
    }

    // Check for DFA determinism
    if (this.automaton.type === 'DFA') {
      // Check for epsilon transitions in DFA
      const epsilonTransitions = this.automaton.transitions.filter((t) => 
        t.symbols.includes('ε')
      );
      if (epsilonTransitions.length > 0) {
        const statesWithEpsilon = new Set(epsilonTransitions.map(t => {
          const state = this.automaton.states.find(s => s.id === t.from);
          return state?.label || t.from;
        }));
        statesWithEpsilon.forEach(stateLabel => {
          errors.push(`DFA cannot have ε-transitions (found in state ${stateLabel})`);
        });
      }

      for (const state of this.automaton.states) {
        const outgoingTransitions = this.automaton.transitions.filter(
          (t) => t.from === state.id
        );

        // Check for multiple transitions with same symbol
        const symbolCounts = new Map<string, number>();
        for (const transition of outgoingTransitions) {
          for (const symbol of transition.symbols) {
            symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
            if (symbolCounts.get(symbol)! > 1) {
              errors.push(
                `State ${state.label} has multiple transitions for symbol "${symbol}"`
              );
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

}
