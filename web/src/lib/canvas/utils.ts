import { Position, State } from '@/types';
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

// Distance from point to line segment
function distanceToLineSegment(
  point: Position,
  lineStart: Position,
  lineEnd: Position
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return getDistance(point, lineStart);
  }

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const closestPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };

  return getDistance(point, closestPoint);
}

// Check if point is near a transition
export function isPointOnTransition(
  point: Position,
  fromState: State,
  toState: State,
  threshold: number = 10
): boolean {
  // Handle self-loop
  if (fromState.id === toState.id) {
    const loopCenter = {
      x: fromState.position.x,
      y: fromState.position.y - CANVAS_CONSTANTS.STATE_RADIUS - CANVAS_CONSTANTS.STATE_RADIUS * 0.8,
    };
    const loopRadius = CANVAS_CONSTANTS.STATE_RADIUS * 0.8;
    const distance = Math.abs(getDistance(point, loopCenter) - loopRadius);
    return distance <= threshold;
  }

  // Regular transition (simplified - check line segment)
  const distance = distanceToLineSegment(point, fromState.position, toState.position);
  return distance <= threshold;
}
