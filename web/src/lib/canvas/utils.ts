import { Position } from '@/types';
import { CANVAS_CONSTANTS } from './constants';

export function snapToGrid(pos: Position, gridSize: number): Position {
  return {
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize,
  };
}

export function getDistance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isPointInCircle(point: Position, center: Position, radius: number): boolean {
  return getDistance(point, center) <= radius;
}

export function getCanvasCoordinates(
  event: MouseEvent | React.MouseEvent,
  canvas: HTMLCanvasElement,
  offset: Position,
  zoom: number
): Position {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - offset.x) / zoom,
    y: (event.clientY - rect.top - offset.y) / zoom,
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}