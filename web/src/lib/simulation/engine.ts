import { Automaton, State } from '@/types';
import { SimulationStep } from '@/types/simulation';
import { ValidationError, ValidationResult } from '@/types/validation';

export class SimulationEngine {
  private automaton: Automaton;

  constructor(automaton: Automaton) {
    this.automaton = automaton;
  }

  /**
   * Validate the automaton with detailed error information
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    // Check for initial state
    const initialStates = this.automaton.states.filter((s) => s.isInitial);
    if (initialStates.length === 0) {
      errors.push({ message: 'No initial state defined', type: 'error', affectedStates: [] });
    }
    if (initialStates.length > 1) {
      errors.push({
        message: 'Multiple initial states defined (only one allowed)',
        type: 'error',
        affectedStates: initialStates.map((s) => s.id),
      });
    }

    // Check for accept states
    const acceptStates = this.automaton.states.filter((s) => s.isAccept);
    if (acceptStates.length === 0) {
      errors.push({ message: 'No accept states defined', type: 'warning', affectedStates: [] });
    }

    // DFA-specific validation
    if (this.automaton.type === 'DFA') {
      // No ε-transitions allowed
      const epsilonTransitions = this.automaton.transitions.filter((t) => t.symbols.includes('ε'));
      if (epsilonTransitions.length > 0) {
        const affectedStates = new Set<string>();
        epsilonTransitions.forEach((t) => affectedStates.add(t.from));
        errors.push({
          message: `DFA cannot have ε-transitions (found ${epsilonTransitions.length})`,
          type: 'error',
          affectedStates: Array.from(affectedStates),
          affectedTransitions: epsilonTransitions.map((t) => t.id),
        });
      }

      // Each state must have at most one transition per symbol
      for (const state of this.automaton.states) {
        const outgoing = this.automaton.transitions.filter((t) => t.from === state.id);
        const symbolToTransitions = new Map<string, string[]>();

        for (const transition of outgoing) {
          for (const symbol of transition.symbols) {
            if (!symbolToTransitions.has(symbol)) symbolToTransitions.set(symbol, []);
            symbolToTransitions.get(symbol)!.push(transition.id);
          }
        }

        for (const [symbol, transitionIds] of symbolToTransitions.entries()) {
          if (transitionIds.length > 1) {
            errors.push({
              message: `State ${state.label} has ${transitionIds.length} transitions for symbol "${symbol}" (DFA allows only one)`,
              type: 'error',
              affectedStates: [state.id],
              affectedTransitions: transitionIds,
            });
          }
        }
      }
      // ← state loop ends here. Alphabet check must NOT be inside this loop.
    }

    // Alphabet validation — applies to both DFA and NFA
    if (this.automaton.alphabet.length > 0) {
      for (const transition of this.automaton.transitions) {
        const invalid = transition.symbols.filter(
          (s) => s !== 'ε' && !this.automaton.alphabet.includes(s)
        );
        if (invalid.length === 0) continue;

        const from = this.automaton.states.find((s) => s.id === transition.from);
        const to = this.automaton.states.find((s) => s.id === transition.to);
        errors.push({
          message: `Transition ${from?.label} → ${to?.label} uses symbols not in alphabet: ${invalid.map((s) => `"${s}"`).join(', ')}`,
          type: 'error',
          affectedStates: [transition.from],
          affectedTransitions: [transition.id],
        });
      }
    }

    // Transitions reference valid states and have symbols
    for (const transition of this.automaton.transitions) {
      const fromState = this.automaton.states.find((s) => s.id === transition.from);
      const toState = this.automaton.states.find((s) => s.id === transition.to);

      if (!fromState) {
        errors.push({
          message: `Transition references invalid source state: ${transition.from}`,
          type: 'error',
          affectedTransitions: [transition.id],
        });
      }
      if (!toState) {
        errors.push({
          message: `Transition references invalid target state: ${transition.to}`,
          type: 'error',
          affectedTransitions: [transition.id],
        });
      }
      if (transition.symbols.length === 0) {
        errors.push({
          message: `Transition from ${fromState?.label ?? transition.from} to ${toState?.label ?? transition.to} has no symbols`,
          type: 'error',
          affectedTransitions: [transition.id],
        });
      }
    }

    return {
      valid: errors.filter((e) => e.type === 'error').length === 0,
      errors,
    };
  }

  // Keep all existing simulation methods unchanged
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

    if (this.automaton.type === 'DFA') {
      return this.simulateDFA(inputString, initialStates[0]);
    } else {
      return this.simulateNFA(inputString, initialStates[0]);
    }
  }

  private simulateDFA(inputString: string, initialState: State): SimulationStep[] {
    const steps: SimulationStep[] = [];
    let currentState = initialState.id;
    let consumed = '';
    let remaining = inputString;

    steps.push({
      currentStates: [currentState],
      remainingInput: remaining,
      consumedInput: consumed,
    });

    for (let i = 0; i < inputString.length; i++) {
      const symbol = inputString[i];

      const transition = this.automaton.transitions.find(
        (t) => t.from === currentState && t.symbols.includes(symbol)
      );

      consumed += symbol;
      remaining = remaining.slice(1);

      if (!transition) {
        steps.push({
          currentStates: [],
          remainingInput: remaining,
          consumedInput: consumed,
        });
        break;
      }

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

  private simulateNFA(inputString: string, initialState: State): SimulationStep[] {
    const steps: SimulationStep[] = [];
    let currentStates = this.getEpsilonClosure([initialState.id]);
    let consumed = '';
    let remaining = inputString;

    steps.push({
      currentStates: [...currentStates],
      remainingInput: remaining,
      consumedInput: consumed,
    });

    for (let i = 0; i < inputString.length; i++) {
      const symbol = inputString[i];
      const nextStates = new Set<string>();

      for (const stateId of currentStates) {
        const transitions = this.automaton.transitions.filter(
          (t) => t.from === stateId && t.symbols.includes(symbol)
        );

        for (const transition of transitions) {
          nextStates.add(transition.to);
        }
      }

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

      if (currentStates.length === 0) {
        break;
      }
    }

    return steps;
  }

  private getEpsilonClosure(stateIds: string[]): string[] {
    const closure = new Set(stateIds);
    const stack = [...stateIds];

    while (stack.length > 0) {
      const current = stack.pop()!;

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

  isAccepted(steps: SimulationStep[]): boolean {
    if (steps.length === 0) return false;
    const finalStep = steps[steps.length - 1];

    if (finalStep.remainingInput.length > 0) return false;

    return finalStep.currentStates.some((stateId) => {
      const state = this.automaton.states.find((s) => s.id === stateId);
      return state?.isAccept || false;
    });
  }
}
