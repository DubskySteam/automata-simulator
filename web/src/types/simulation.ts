export interface SimulationStep {
  currentStates: string[]; // Can be multiple for NFA
  remainingInput: string;
  consumedInput: string;
  transitionTaken?: {
    from: string;
    to: string;
    symbol: string;
  };
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: number;
  steps: SimulationStep[];
  result: 'accepted' | 'rejected' | 'running';
  inputString: string;
}