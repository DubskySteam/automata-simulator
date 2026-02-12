import { State, Transition, Position } from '@/types';
import { CANVAS_CONSTANTS, CANVAS_COLORS } from './constants';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = CANVAS_COLORS.canvas.background;
    this.ctx.fillRect(0, 0, width, height);
  }

  drawGrid(width: number, height: number, offset: Position, zoom: number): void {
    const gridSize = CANVAS_CONSTANTS.GRID_SIZE * zoom;
    this.ctx.strokeStyle = CANVAS_COLORS.canvas.grid;
    this.ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = offset.x % gridSize; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = offset.y % gridSize; y < height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }

  drawState(
    state: State,
    offset: Position,
    zoom: number,
    options: {
      isHovered?: boolean;
      isSelected?: boolean;
      isActive?: boolean;
    } = {}
  ): void {
    const x = state.position.x * zoom + offset.x;
    const y = state.position.y * zoom + offset.y;
    const radius = CANVAS_CONSTANTS.STATE_RADIUS * zoom;

    // Determine fill color
    let fillColor = CANVAS_COLORS.state.default;
    if (options.isActive) fillColor = CANVAS_COLORS.state.active;
    else if (options.isSelected) fillColor = CANVAS_COLORS.state.selected;
    else if (options.isHovered) fillColor = CANVAS_COLORS.state.hover;
    else if (state.isAccept) fillColor = CANVAS_COLORS.state.accept;
    else if (state.isInitial) fillColor = CANVAS_COLORS.state.initial;

    // Draw outer circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
    this.ctx.strokeStyle = CANVAS_COLORS.state.border;
    this.ctx.lineWidth = CANVAS_CONSTANTS.STATE_BORDER_WIDTH;
    this.ctx.stroke();

    // Draw inner circle for accept states
    if (state.isAccept) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius - 6, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Draw initial state arrow
    if (state.isInitial) {
      const arrowStart = x - radius - 20;
      const arrowEnd = x - radius;
      this.ctx.beginPath();
      this.ctx.moveTo(arrowStart, y);
      this.ctx.lineTo(arrowEnd, y);
      this.ctx.strokeStyle = CANVAS_COLORS.state.border;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Arrow head
      this.ctx.beginPath();
      this.ctx.moveTo(arrowEnd, y);
      this.ctx.lineTo(arrowEnd - 8, y - 5);
      this.ctx.lineTo(arrowEnd - 8, y + 5);
      this.ctx.closePath();
      this.ctx.fillStyle = CANVAS_COLORS.state.border;
      this.ctx.fill();
    }

    // Draw label
    this.ctx.fillStyle = '#000';
    this.ctx.font = `${14 * zoom}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(state.label, x, y);
  }

  drawTransition(
    transition: Transition,
    fromState: State,
    toState: State,
    offset: Position,
    zoom: number,
    options: {
      isHovered?: boolean;
      isSelected?: boolean;
    } = {}
  ): void {
    const fromX = fromState.position.x * zoom + offset.x;
    const fromY = fromState.position.y * zoom + offset.y;
    const toX = toState.position.x * zoom + offset.x;
    const toY = toState.position.y * zoom + offset.y;

    const strokeColor = options.isSelected
      ? CANVAS_COLORS.transition.selected
      : options.isHovered
      ? CANVAS_COLORS.transition.hover
      : CANVAS_COLORS.transition.default;

    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2;

    // Self-loop
    if (fromState.id === toState.id) {
      this.drawSelfLoop(fromX, fromY, zoom, transition.symbols.join(','));
      return;
    }

    // Regular transition
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const radius = CANVAS_CONSTANTS.STATE_RADIUS * zoom;

    const startX = fromX + Math.cos(angle) * radius;
    const startY = fromY + Math.sin(angle) * radius;
    const endX = toX - Math.cos(angle) * radius;
    const endY = toY - Math.sin(angle) * radius;

    // Draw curved line
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    this.ctx.quadraticCurveTo(midX, midY, endX, endY);
    this.ctx.stroke();

    // Draw arrow head
    this.drawArrowHead(endX, endY, angle);

    // Draw label
    this.ctx.fillStyle = '#000';
    this.ctx.font = `${12 * zoom}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(transition.symbols.join(','), midX, midY - 5);
  }

  private drawSelfLoop(x: number, y: number, zoom: number, label: string): void {
    const radius = CANVAS_CONSTANTS.STATE_RADIUS * zoom;
    const loopRadius = radius * 0.8;

    this.ctx.beginPath();
    this.ctx.arc(x, y - radius - loopRadius, loopRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Label
    this.ctx.fillStyle = '#000';
    this.ctx.font = `${12 * zoom}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(label, x, y - radius - loopRadius * 2 - 10);
  }

  private drawArrowHead(x: number, y: number, angle: number): void {
    const size = CANVAS_CONSTANTS.ARROW_HEAD_SIZE;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - size * Math.cos(angle - Math.PI / 6),
      y - size * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.lineTo(
      x - size * Math.cos(angle + Math.PI / 6),
      y - size * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.closePath();
    this.ctx.fillStyle = this.ctx.strokeStyle;
    this.ctx.fill();
  }
}
