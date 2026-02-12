export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface SimulationStep {
  currentStates: string[]; // state ids (can be multiple for NFA)
  remainingInput: string;
  consumedInput: string;
  transition?: {
    from: string;
    to: string;
    symbol: string;
  };
}

export interface SimulationResult {
  accepted: boolean;
  steps: SimulationStep[];
}
