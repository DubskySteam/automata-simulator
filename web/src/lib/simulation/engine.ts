import { Automaton, State, Transition } from '@/types';
import { SimulationStep } from '@/types/simulation';

export class SimulationEngine {
  private automaton: Automaton;

  constructor(automaton: Automaton) {
    this.automaton = automaton;
  }

  /**
   * Validate the automaton
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for initial state
    const initialStates = this.automaton.states.filter((s) => s.isInitial);
    if (initialStates.length === 0) {
      errors.push('No initial state defined');
    }
    if (initialStates.length > 1) {
      errors.push('Multiple initial states defined (only one allowed)');
    }

    // Check for accept states
    const acceptStates = this.automaton.states.filter((s) => s.isAccept);
    if (acceptStates.length === 0) {
      errors.push('No accept states defined');
    }

    // DFA-specific validation
    if (this.automaton.type === 'DFA') {
      // Check for epsilon transitions in DFA
      const epsilonTransitions = this.automaton.transitions.filter((t) =>
        t.symbols.includes('ε')
      );
      if (epsilonTransitions.length > 0) {
        const statesWithEpsilon = new Set(
          epsilonTransitions.map((t) => {
            const state = this.automaton.states.find((s) => s.id === t.from);
            return state?.label || t.from;
          })
        );
        statesWithEpsilon.forEach((stateLabel) => {
          errors.push(`DFA cannot have ε-transitions (found in state ${stateLabel})`);
        });
      }

      // Check for determinism: each state must have at most one transition per symbol
      for (const state of this.automaton.states) {
        const outgoingTransitions = this.automaton.transitions.filter(
          (t) => t.from === state.id
        );

        const symbolCounts = new Map<string, number>();
        for (const transition of outgoingTransitions) {
          for (const symbol of transition.symbols) {
            symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
          }
        }

        // Report duplicates
        for (const [symbol, count] of symbolCounts.entries()) {
          if (count > 1) {
            errors.push(
              `State ${state.label} has ${count} transitions for symbol "${symbol}" (DFA allows only one)`
            );
          }
        }
      }
    }

    // Validate transitions reference valid states
    for (const transition of this.automaton.transitions) {
      const fromState = this.automaton.states.find((s) => s.id === transition.from);
      const toState = this.automaton.states.find((s) => s.id === transition.to);

      if (!fromState) {
        errors.push(`Transition references invalid source state: ${transition.from}`);
      }
      if (!toState) {
        errors.push(`Transition references invalid target state: ${transition.to}`);
      }
      if (transition.symbols.length === 0) {
        errors.push(
          `Transition from ${fromState?.label || transition.from} to ${
            toState?.label || transition.to
          } has no symbols`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Simulate the automaton with the given input string
   */
  simulate(inputString: string): SimulationStep[] {
    const initialStates = this.automaton.states.filter((s) => s.isInitial);

    if (initialStates.length === 0) {
      return [
        {
          currentStates: [],
          remainingInput: inputString,
          consumedInput: '',
        },
      ];
    }

    // Use different simulation logic for DFA vs NFA
    if (this.automaton.type === 'DFA') {
      return this.simulateDFA(inputString, initialStates[0]);
    } else {
      return this.simulateNFA(inputString, initialStates[0]);
    }
  }

  /**
   * Simulate a DFA - deterministic, single state at a time
   */
  private simulateDFA(inputString: string, initialState: State): SimulationStep[] {
    const steps: SimulationStep[] = [];
    let currentState = initialState.id;
    let consumed = '';
    let remaining = inputString;

    // Initial step
    steps.push({
      currentStates: [currentState],
      remainingInput: remaining,
      consumedInput: consumed,
    });

    // Process each symbol
    for (let i = 0; i < inputString.length; i++) {
      const symbol = inputString[i];

      // Find THE transition for this symbol (DFA = deterministic = exactly one)
      const transition = this.automaton.transitions.find(
        (t) => t.from === currentState && t.symbols.includes(symbol)
      );

      consumed += symbol;
      remaining = remaining.slice(1);

      if (!transition) {
        // No transition found - DFA gets stuck and rejects
        steps.push({
          currentStates: [], // Empty = stuck/rejected
          remainingInput: remaining,
          consumedInput: consumed,
        });
        break;
      }

      // Take the transition
      currentState = transition.to;

      steps.push({
        currentStates: [currentState],
        remainingInput: remaining,
        consumedInput: consumed,
        transitionTaken: {
          from: transition.from,
          to: transition.to,
          symbol: symbol,
        },
      });
    }

    return steps;
  }

  /**
   * Simulate an NFA - nondeterministic, multiple states possible
   */
  private simulateNFA(inputString: string, initialState: State): SimulationStep[] {
    const steps: SimulationStep[] = [];

    // Get epsilon closure of initial state
    let currentStates = this.getEpsilonClosure([initialState.id]);
    let consumed = '';
    let remaining = inputString;

    // Initial step
    steps.push({
      currentStates: [...currentStates],
      remainingInput: remaining,
      consumedInput: consumed,
    });

    // Process each symbol
    for (let i = 0; i < inputString.length; i++) {
      const symbol = inputString[i];
      const nextStates = new Set<string>();

      // For each current state, find ALL transitions with this symbol
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

      consumed += symbol;
      remaining = remaining.slice(1);

      steps.push({
        currentStates: [...currentStates],
        remainingInput: remaining,
        consumedInput: consumed,
        transitionTaken:
          currentStates.length > 0
            ? {
                from: steps[steps.length - 1].currentStates[0],
                to: currentStates[0],
                symbol,
              }
            : undefined,
      });

      // If no states, we're stuck (reject)
      if (currentStates.length === 0) {
        break;
      }
    }

    return steps;
  }

  /**
   * Get epsilon closure for NFA (states reachable via ε-transitions)
   * For DFA, this should never be called
   */
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

  /**
   * Check if the simulation accepts
   */
  isAccepted(steps: SimulationStep[]): boolean {
    if (steps.length === 0) return false;

    const finalStep = steps[steps.length - 1];

    // Must have consumed all input
    if (finalStep.remainingInput.length > 0) return false;

    // Must be in at least one accept state (for NFA) or the accept state (for DFA)
    return finalStep.currentStates.some((stateId) => {
      const state = this.automaton.states.find((s) => s.id === stateId);
      return state?.isAccept || false;
    });
  }
}
