import { State, Transition, Position } from '@/types';
import { CANVAS_CONSTANTS, getCanvasColors } from './constants';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
  }

  clear(width: number, height: number): void {
    const CANVAS_COLORS = getCanvasColors();
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = CANVAS_COLORS.canvas.background;
    this.ctx.fillRect(0, 0, width, height);
  }

  drawGrid(width: number, height: number, offset: Position, zoom: number): void {
    const CANVAS_COLORS = getCanvasColors();
    const gridSize = CANVAS_CONSTANTS.GRID_SIZE * zoom;
    this.ctx.strokeStyle = CANVAS_COLORS.canvas.grid;
    this.ctx.lineWidth = 1;

    for (let x = offset.x % gridSize; x < width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

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
      hasError?: boolean; // NEW
      animationTime?: number;
    } = {}
  ): void {
    const CANVAS_COLORS = getCanvasColors();
    const x = state.position.x * zoom + offset.x;
    const y = state.position.y * zoom + offset.y;
    const radius = CANVAS_CONSTANTS.STATE_RADIUS * zoom;

    let fillColor = CANVAS_COLORS.state.default;
    let borderColor = CANVAS_COLORS.state.border;

    // Priority: Error > Active > Selected > Hover > Accept > Initial > Default
    if (options.hasError) {
      borderColor = '#ef5350'; // Material Red
      this.ctx.lineWidth = CANVAS_CONSTANTS.STATE_BORDER_WIDTH * zoom * 1.8;

      // Add error glow
      this.ctx.shadowColor = 'rgba(239, 83, 80, 0.5)';
      this.ctx.shadowBlur = 12 * zoom;
    } else if (options.isActive) {
      fillColor = CANVAS_COLORS.state.active;
      borderColor = CANVAS_COLORS.state.borderActive;
      if (options.animationTime !== undefined) {
        const pulse = Math.sin(options.animationTime * 2.5) * 0.15 + 1;
        const animatedRadius = radius * pulse;
        const gradient = this.ctx.createRadialGradient(
          x,
          y,
          animatedRadius * 0.5,
          x,
          y,
          animatedRadius * 1.5
        );
        gradient.addColorStop(0, 'rgba(239, 83, 80, 0.6)');
        gradient.addColorStop(0.5, 'rgba(239, 83, 80, 0.3)');
        gradient.addColorStop(1, 'rgba(239, 83, 80, 0)');
        this.ctx.beginPath();
        this.ctx.arc(x, y, animatedRadius * 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
      }
    } else if (options.isSelected) {
      fillColor = CANVAS_COLORS.state.selected;
    } else if (options.isHovered) {
      fillColor = CANVAS_COLORS.state.hover;
    } else if (state.isAccept) {
      fillColor = CANVAS_COLORS.state.accept;
    } else if (state.isInitial) {
      fillColor = CANVAS_COLORS.state.initial;
    }

    if (!options.isActive && !options.hasError) {
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      this.ctx.shadowBlur = 8 * zoom;
      this.ctx.shadowOffsetX = 2 * zoom;
      this.ctx.shadowOffsetY = 2 * zoom;
    }

    // Draw main circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;

    // Draw border
    this.ctx.strokeStyle = borderColor;
    if (!options.hasError) {
      this.ctx.lineWidth = CANVAS_CONSTANTS.STATE_BORDER_WIDTH * zoom;
    }
    this.ctx.stroke();

    // Accept state double circle
    if (state.isAccept) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius - 6 * zoom, 0, Math.PI * 2);
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = CANVAS_CONSTANTS.STATE_BORDER_WIDTH * zoom;
      this.ctx.stroke();
    }

    // Initial state arrow
    if (state.isInitial) {
      const arrowStart = x - radius - 25 * zoom;
      const arrowEnd = x - radius - 2 * zoom;
      this.ctx.beginPath();
      this.ctx.moveTo(arrowStart, y);
      this.ctx.lineTo(arrowEnd, y);
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = 2.5 * zoom;
      this.ctx.stroke();

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
      hasReverse?: boolean;
      hasError?: boolean; // NEW
    } = {}
  ): void {
    const CANVAS_COLORS = getCanvasColors();
    const fromX = fromState.position.x * zoom + offset.x;
    const fromY = fromState.position.y * zoom + offset.y;
    const toX = toState.position.x * zoom + offset.x;
    const toY = toState.position.y * zoom + offset.y;

    // Priority: Error > Selected > Hover > Default
    const strokeColor = options.hasError
      ? '#ef5350' // Material Red
      : options.isSelected
        ? CANVAS_COLORS.transition.selected
        : options.isHovered
          ? CANVAS_COLORS.transition.hover
          : CANVAS_COLORS.transition.default;

    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = options.hasError ? 3.5 * zoom : 2.5 * zoom;

    if (fromState.id === toState.id) {
      this.drawSelfLoop(fromX, fromY, zoom, transition.symbols.join(', '), strokeColor);
      return;
    }

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const radius = CANVAS_CONSTANTS.STATE_RADIUS * zoom;

    const startX = fromX + Math.cos(angle) * radius;
    const startY = fromY + Math.sin(angle) * radius;
    const endX = toX - Math.cos(angle) * (radius + 2 * zoom);
    const endY = toY - Math.sin(angle) * (radius + 2 * zoom);

    if (options.hasReverse) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const curveOffset = 25 * zoom;
      const perpAngle = angle + Math.PI / 2;
      const controlX = midX + Math.cos(perpAngle) * curveOffset;
      const controlY = midY + Math.sin(perpAngle) * curveOffset;

      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      this.ctx.stroke();

      const dx = endX - controlX;
      const dy = endY - controlY;
      const endAngle = Math.atan2(dy, dx);
      this.drawArrowHead(endX, endY, endAngle, strokeColor, zoom);

      const labelX = (startX + controlX + endX) / 3 + Math.cos(perpAngle) * 5 * zoom;
      const labelY = (startY + controlY + endY) / 3 + Math.sin(perpAngle) * 5 * zoom;
      this.drawTransitionLabel(transition.symbols.join(', '), labelX, labelY, zoom);
    } else {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();

      this.drawArrowHead(endX, endY, angle, strokeColor, zoom);

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      this.drawTransitionLabel(transition.symbols.join(', '), midX, midY, zoom);
    }
  }

  private drawTransitionLabel(label: string, x: number, y: number, zoom: number): void {
    const CANVAS_COLORS = getCanvasColors();
    this.ctx.font = `${13 * zoom}px sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const metrics = this.ctx.measureText(label);
    const padding = 4 * zoom;
    const bgWidth = metrics.width + padding * 2;
    const bgHeight = 18 * zoom;

    this.ctx.fillStyle = CANVAS_COLORS.canvas.background;
    this.ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);

    this.ctx.fillStyle = CANVAS_COLORS.text.transition;
    this.ctx.fillText(label, x, y);
  }

  // Holy fuck, kill me already
  private drawSelfLoop(x: number, y: number, zoom: number, label: string, color: string): void {
    const radius = CANVAS_CONSTANTS.STATE_RADIUS * zoom;
    const loopRadius = radius * 0.85;
    const loopOffset = radius + loopRadius * 0.6;
    const loopCenterY = y - loopOffset;

    // Draw the circular loop
    this.ctx.beginPath();
    this.ctx.arc(x, loopCenterY, loopRadius, 0.3, Math.PI * 2 - 0.3);
    this.ctx.stroke();

    // Draw arrow head
    const arrowAngle = -0.3;
    const arrowX = x + loopRadius * Math.cos(arrowAngle);
    const arrowY = loopCenterY + loopRadius * Math.sin(arrowAngle);
    const arrowDirection = arrowAngle - Math.PI / 2;

    this.drawArrowHead(arrowX, arrowY, arrowDirection, color, zoom);

    // Draw label
    const labelY = loopCenterY - loopRadius - 10 * zoom;
    this.drawTransitionLabel(label, x, labelY, zoom);
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
