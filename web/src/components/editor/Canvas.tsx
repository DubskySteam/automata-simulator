import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { CanvasRenderer } from '@/lib/canvas/renderer';
import { State, Transition, Position } from '@/types';
import { CANVAS_CONSTANTS } from '@/lib/canvas/constants';
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
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  // Temporary mock data
  const [states, setStates] = useState<State[]>([
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

  // State mutation handlers
  const handleStateMove = useCallback((stateId: string, newPosition: Position) => {
    setStates((prev) =>
      prev.map((state) =>
        state.id === stateId ? { ...state, position: newPosition } : state
      )
    );
  }, []);

  const handleStateSelect = useCallback((stateId: string, multiSelect: boolean) => {
    setSelectedStates((prev) => {
      if (multiSelect) {
        return prev.includes(stateId)
          ? prev.filter((id) => id !== stateId)
          : [...prev, stateId];
      }
      return [stateId];
    });
  }, []);

  const handleCanvasClick = useCallback((position: Position) => {
    // For now, just deselect all
    setSelectedStates([]);
    console.log('Canvas clicked at:', position);
  }, []);

  // Canvas interaction hook
  const { hoveredState, isDragging, handlers } = useCanvasInteraction({
    states,
    onStateMove: handleStateMove,
    onStateSelect: handleStateSelect,
    onCanvasClick: handleCanvasClick,
    offset,
    zoom,
    selectedStates,
  });

  // Handle zoom
  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      const result = handlers.onWheel(event);
      if (result) {
        setZoom((prev) => {
          const newZoom = prev + result.zoomDelta;
          return Math.max(CANVAS_CONSTANTS.MIN_ZOOM, Math.min(CANVAS_CONSTANTS.MAX_ZOOM, newZoom));
        });
      }
    },
    [handlers]
  );

  // Handle mouse move with pan
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const result = handlers.onMouseMove(event);
      if (result?.panDelta) {
        setOffset((prev) => ({
          x: prev.x + result.panDelta.x,
          y: prev.y + result.panDelta.y,
        }));
      }
    },
    [handlers]
  );

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
      renderer.drawState(state, offset, zoom, {
        isHovered: hoveredState === state.id,
        isSelected: selectedStates.includes(state.id),
      });
    });
  }, [states, transitions, offset, zoom, width, height, hoveredState, selectedStates]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className={`canvas ${isDragging ? 'dragging' : ''}`}
        {...handlers}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      />
    </div>
  );
}