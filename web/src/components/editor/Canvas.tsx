import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useAutomaton } from '@/hooks/useAutomaton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CanvasRenderer } from '@/lib/canvas/renderer';
import { Position } from '@/types';
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
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPosRef = useRef<Position>({ x: 0, y: 0 });

  // Use automaton hook
  const {
    automaton,
    addState,
    removeState,
    updateState,
    toggleStateAccept,
  } = useAutomaton({
    states: [
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
    ],
    transitions: [
      {
        id: 't1',
        from: '1',
        to: '2',
        symbols: ['a', 'b'],
      },
    ],
  });

  const { states, transitions } = automaton;

  // State mutation handlers
  const handleStateMove = useCallback(
    (stateId: string, newPosition: Position) => {
      updateState(stateId, { position: newPosition });
    },
    [updateState]
  );

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

  const handleCanvasClick = useCallback(
    (position: Position) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;
      const distance = Math.hypot(
        position.x - lastClickPosRef.current.x,
        position.y - lastClickPosRef.current.y
      );

      // Check for double-click
      if (
        timeSinceLastClick < CANVAS_CONSTANTS.DOUBLE_CLICK_THRESHOLD &&
        distance < 10
      ) {
        // Double-click: create new state
        addState(position);
        lastClickTimeRef.current = 0; // Reset to prevent triple-click
      } else {
        // Single click: deselect all
        setSelectedStates([]);
        lastClickTimeRef.current = now;
        lastClickPosRef.current = position;
      }
    },
    [addState]
  );

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: () => {
      if (selectedStates.length > 0) {
        selectedStates.forEach((id) => removeState(id));
        setSelectedStates([]);
      }
    },
    onSelectAll: () => {
      setSelectedStates(states.map((s) => s.id));
    },
  });

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
          return Math.max(
            CANVAS_CONSTANTS.MIN_ZOOM,
            Math.min(CANVAS_CONSTANTS.MAX_ZOOM, newZoom)
          );
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

  // Handle right-click for context menu
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      
      const canvas = event.currentTarget;
      const pos = {
        x: (event.clientX - canvas.getBoundingClientRect().left - offset.x) / zoom,
        y: (event.clientY - canvas.getBoundingClientRect().top - offset.y) / zoom,
      };

      // Find state at position
      const clickedState = states.find((state) => {
        const dx = pos.x - state.position.x;
        const dy = pos.y - state.position.y;
        return Math.sqrt(dx * dx + dy * dy) <= CANVAS_CONSTANTS.STATE_RADIUS;
      });

      if (clickedState) {
        // Toggle accept state for now (will add full context menu later)
        toggleStateAccept(clickedState.id);
      }
    },
    [states, offset, zoom, toggleStateAccept]
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
        onContextMenu={handleContextMenu}
      />
      <div className="canvas-hint">
        Double-click to create state • Right-click state to toggle accept • Delete key to remove
      </div>
    </div>
  );
}