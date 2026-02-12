import { useEffect, useRef, useState } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { CanvasRenderer } from '@/lib/canvas/renderer';
import { State, Transition, Position } from '@/types';
import './Canvas.css';

interface CanvasProps {
  width?: number;
  height?: number;
}

export function Canvas({ width = 800, height = 600 }: CanvasProps) {
  const canvasRef = useCanvas({ width, height });
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Temporary mock data - will be replaced with real state management
  const [states] = useState<State[]>([
    {
      id: '1',
      label: 'q0',
      isInitial: true,
      isAccept: false,
      position: { x: 200, y: 200 },
    },
    {
      id: '2',
      label: 'q1',
      isInitial: false,
      isAccept: true,
      position: { x: 400, y: 200 },
    },
  ]);

  const [transitions] = useState<Transition[]>([
    {
      id: 't1',
      from: '1',
      to: '2',
      symbols: ['a', 'b'],
    },
  ]);

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    rendererRef.current = new CanvasRenderer(canvas);
  }, [canvasRef]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;

    // Clear canvas
    renderer.clear(width, height);

    // Draw grid
    renderer.drawGrid(width, height, offset, zoom);

    // Draw transitions first (behind states)
    transitions.forEach((transition) => {
      const fromState = states.find((s) => s.id === transition.from);
      const toState = states.find((s) => s.id === transition.to);
      if (fromState && toState) {
        renderer.drawTransition(transition, fromState, toState, offset, zoom);
      }
    });

    // Draw states
    states.forEach((state) => {
      renderer.drawState(state, offset, zoom);
    });
  }, [states, transitions, offset, zoom, width, height]);

  return (
    <div className="canvas-container">
      <canvas ref={canvasRef} className="canvas" />
    </div>
  );
}
