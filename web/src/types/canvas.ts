import { Position } from './automaton';

export type ToolMode = 'select' | 'addState' | 'addTransition';

export interface CanvasState {
  offset: Position;
  zoom: number;
  isDragging: boolean;
  selectedStates: string[];
  selectedTransitions: string[];
  hoveredState: string | null;
  hoveredTransition: string | null;
}

export interface DragState {
  startPos: Position;
  currentPos: Position;
  isDragging: boolean;
  draggedStates: string[];
}

export interface CanvasConfig {
  width: number;
  height: number;
  gridSize: number;
  snapToGrid: boolean;
  backgroundColor: string;
}