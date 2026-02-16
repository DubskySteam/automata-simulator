export interface ValidationError {
  message: string;
  type: 'error' | 'warning';
  affectedStates?: string[];
  affectedTransitions?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}