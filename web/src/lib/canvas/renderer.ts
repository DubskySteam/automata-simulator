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
    this.ctx.lineWidth = 1;

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
    let borderColor = CANVAS_COLORS.state.border;
    
    if (options.isActive) {
      fillColor = CANVAS_COLORS.state.active;
      borderColor = CANVAS_COLORS.state.borderActive;
    } else if (options.isSelected) {
      fillColor = CANVAS_COLORS.state.selected;
    } else if (options.isHovered) {
      fillColor = CANVAS_COLORS.state.hover;
    } else if (state.isAccept) {
      fillColor = CANVAS_COLORS.state.accept;
    } else if (state.isInitial) {
      fillColor = CANVAS_COLORS.state.initial;
    }

    // Draw shadow for non-active states
    if (!options.isActive) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      this.ctx.shadowBlur = 8 * zoom;
      this.ctx.shadowOffsetX = 2 * zoom;
      this.ctx.shadowOffsetY = 2 * zoom;
    }

    // Draw outer circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = CANVAS_CONSTANTS.STATE_BORDER_WIDTH * zoom;
    this.ctx.stroke();

    // Draw inner circle for accept states
    if (state.isAccept) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius - 6 * zoom, 0, Math.PI * 2);
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = CANVAS_CONSTANTS.STATE_BORDER_WIDTH * zoom;
      this.ctx.stroke();
    }

    // Draw initial state arrow
    if (state.isInitial) {
      const arrowStart = x - radius - 25 * zoom;
      const arrowEnd = x - radius - 2 * zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(arrowStart, y);
      this.ctx.lineTo(arrowEnd, y);
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = 2.5 * zoom;
      this.ctx.stroke();

      // Arrow head
      const arrowSize = CANVAS_CONSTANTS.ARROW_HEAD_SIZE * zoom * 0.7;
      this.ctx.beginPath();
      this.ctx.moveTo(arrowEnd, y);
      this.ctx.lineTo(arrowEnd - arrowSize, y - arrowSize * 0.6);
      this.ctx.lineTo(arrowEnd - arrowSize, y + arrowSize * 0.6);
      this.ctx.closePath();
      this.ctx.fillStyle = borderColor;
      this.ctx.fill();
    }

    // Draw label
    this.ctx.fillStyle = options.isActive ? '#ffffff' : CANVAS_COLORS.text.state;
    this.ctx.font = `bold ${16 * zoom}px sans-serif`;
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
    this.ctx.lineWidth = 2.5 * zoom;

    // Self-loop
    if (fromState.id === toState.id) {
      this.drawSelfLoop(fromX, fromY, zoom, transition.symbols.join(','), strokeColor);
      return;
    }

    // Regular transition
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const radius = CANVAS_CONSTANTS.STATE_RADIUS * zoom;

    const startX = fromX + Math.cos(angle) * radius;
    const startY = fromY + Math.sin(angle) * radius;
    const endX = toX - Math.cos(angle) * (radius + 2 * zoom);
    const endY = toY - Math.sin(angle) * (radius + 2 * zoom);

    // Draw curved line (straight for now, can add curve later)
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // Draw arrow head
    this.drawArrowHead(endX, endY, angle, strokeColor, zoom);

    // Draw label with background
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const label = transition.symbols.join(', ');
    
    this.ctx.font = `${13 * zoom}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const metrics = this.ctx.measureText(label);
    const padding = 4 * zoom;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 18 * zoom;
    
    // Draw label background
    this.ctx.fillStyle = CANVAS_COLORS.canvas.background;
    this.ctx.fillRect(midX - bgWidth / 2, midY - bgHeight / 2, bgWidth, bgHeight);
    
    // Draw label text
    this.ctx.fillStyle = CANVAS_COLORS.text.transition;
    this.ctx.fillText(label, midX, midY);
  }

private drawSelfLoop(x: number, y: number, zoom: number, label: string, color: string): void {
    const radius = CANVAS_CONSTANTS.STATE_RADIUS * zoom;
    const loopRadius = radius * 0.8;
    const loopCenterY = y - radius - loopRadius * 0.7;

    // Draw the arc (top part of the loop)
    this.ctx.beginPath();
    this.ctx.arc(x, loopCenterY, loopRadius, 0.4, Math.PI - 0.4);
    this.ctx.stroke();

    // Calculate arrow position at the left side of the arc
    const arrowAngle = Math.PI - 0.4;
    const arrowX = x + loopRadius * Math.cos(arrowAngle);
    const arrowY = loopCenterY + loopRadius * Math.sin(arrowAngle);
    
    // Draw arrow pointing downward and to the left
    const arrowDirection = arrowAngle + Math.PI * 0.5;
    this.drawArrowHead(arrowX, arrowY, arrowDirection, color, zoom);

    // Label positioned above the loop
    this.ctx.font = `${13 * zoom}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    
    const labelY = loopCenterY - loopRadius - 8 * zoom;
    const metrics = this.ctx.measureText(label);
    const padding = 4 * zoom;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 18 * zoom;
    
    // Draw label background
    this.ctx.fillStyle = CANVAS_COLORS.canvas.background;
    this.ctx.fillRect(x - bgWidth / 2, labelY - bgHeight, bgWidth, bgHeight);
    
    // Draw label text
    this.ctx.fillStyle = CANVAS_COLORS.text.transition;
    this.ctx.fillText(label, x, labelY - 2 * zoom);
  }

  private drawArrowHead(x: number, y: number, angle: number, color: string, zoom: number): void {
    const size = CANVAS_CONSTANTS.ARROW_HEAD_SIZE * zoom;

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
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }
}
