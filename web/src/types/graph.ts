import { Position } from './automaton';

export interface GraphNode {
  id: string;
  position: Position;
  velocity: Position;
  radius: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
