import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useAutomaton } from '@/hooks/useAutomaton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CanvasRenderer } from '@/lib/canvas/renderer';
import { Position, ToolMode } from '@/types';
import { CANVAS_CONSTANTS, CANVAS_COLORS } from '@/lib/canvas/constants';
import { getCanvasCoordinates } from '@/lib/canvas/utils';
import './Canvas.css';

interface CanvasProps {
  width?: number;
  height?: number;
  toolMode: ToolMode;
}

export function Canvas({ width = 800, height = 600, toolMode }: CanvasProps) {
  const canvasRef = useCanvas({ width, height });
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const lastClickTimeRef = useRef<number>(0);
  const lastClickPosRef = useRef<Position>({ x: 0, y: 0 });
  const [transitionDraft, setTransitionDraft] = useState<{
    fromState: string;
    toState?: string;
  } | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });

  // Use automaton hook
  const {
    automaton,
    addState,
    removeState,
    updateState,
    toggleStateAccept,
    addTransition,
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

  // Handle state click (for transition mode)
  const handleStateClick = useCallback(
    (stateId: string, event: React.MouseEvent) => {
      if (toolMode === 'addTransition') {
        if (!transitionDraft) {
          // Start transition
          setTransitionDraft({ fromState: stateId });
        } else {
          // Complete transition
          const symbols = prompt('Enter transition symbol(s) (comma-separated):');
          if (symbols) {
            const symbolArray = symbols.split(',').map((s) => s.trim()).filter((s) => s);
            if (symbolArray.length > 0) {
              addTransition(transitionDraft.fromState, stateId, symbolArray);
            }
          }
          setTransitionDraft(null);
        }
      } else if (toolMode === 'select') {
        // In select mode, use default select behavior
        handleStateSelect(stateId, event.shiftKey);
      }
    },
    [toolMode, transitionDraft, addTransition, handleStateSelect]
  );

  const handleTransitionStart = useCallback((stateId: string) => {
    setTransitionDraft({ fromState: stateId });
  }, []);

  const handleTransitionEnd = useCallback(
    (stateId: string) => {
      if (transitionDraft) {
        const symbols = prompt('Enter transition symbol(s) (comma-separated):');
        if (symbols) {
          const symbolArray = symbols.split(',').map((s) => s.trim()).filter((s) => s);
          if (symbolArray.length > 0) {
            addTransition(transitionDraft.fromState, stateId, symbolArray);
          }
        }
      }
      setTransitionDraft(null);
    },
    [transitionDraft, addTransition]
  );

  const handleCanvasClick = useCallback(
    (position: Position, event: React.MouseEvent) => {
      if (toolMode === 'addState') {
        // Add state mode: create state on click
        addState(position);
        return;
      }

      if (toolMode === 'addTransition') {
        // Cancel transition if clicking on empty canvas
        setTransitionDraft(null);
        return;
      }

      // Select mode: check for double-click
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;
      const distance = Math.hypot(
        position.x - lastClickPosRef.current.x,
        position.y - lastClickPosRef.current.y
      );

      if (
        timeSinceLastClick < CANVAS_CONSTANTS.DOUBLE_CLICK_THRESHOLD &&
        distance < 10
      ) {
        // Double-click: create new state
        addState(position);
        lastClickTimeRef.current = 0;
      } else {
        // Single click: deselect all
        setSelectedStates([]);
        lastClickTimeRef.current = now;
        lastClickPosRef.current = position;
      }
    },
    [toolMode, addState]
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
      if (toolMode === 'select') {
        setSelectedStates(states.map((s) => s.id));
      }
    },
  });

  // Canvas interaction hook
  const { hoveredState, isDragging, isCreatingTransition, handlers } = useCanvasInteraction({
    states,
    onStateMove: handleStateMove,
    onStateSelect: handleStateSelect,
    onStateClick: toolMode !== 'select' ? handleStateClick : undefined,
    onCanvasClick: handleCanvasClick,
    onTransitionStart: handleTransitionStart,
    onTransitionEnd: handleTransitionEnd,
    offset,
    zoom,
    selectedStates,
    enabled: true,
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

  // Handle mouse move
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget;
      const pos = getCanvasCoordinates(event, canvas, offset, zoom);
      setMousePos(pos);

      const result = handlers.onMouseMove(event);
      if (result?.panDelta && toolMode === 'select') {
        setOffset((prev) => ({
          x: prev.x + result.panDelta.x,
          y: prev.y + result.panDelta.y,
        }));
      }
    },
    [handlers, toolMode, offset, zoom]
  );

  // Handle right-click for context menu
  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault();

      if (toolMode !== 'select') return;

      const canvas = event.currentTarget;
      const pos = getCanvasCoordinates(event, canvas, offset, zoom);
      
      // Find state at position
      const clickedState = states.find((state) => {
        const dx = pos.x - state.position.x;
        const dy = pos.y - state.position.y;
        return Math.sqrt(dx * dx + dy * dy) <= CANVAS_CONSTANTS.STATE_RADIUS;
      });

      if (clickedState) {
        toggleStateAccept(clickedState.id);
      }
    },
    [toolMode, states, offset, zoom, toggleStateAccept]
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

    renderer.clear(width, height);
    renderer.drawGrid(width, height, offset, zoom);

    // Draw transitions
    transitions.forEach((transition) => {
      const fromState = states.find((s) => s.id === transition.from);
      const toState = states.find((s) => s.id === transition.to);
      if (fromState && toState) {
        renderer.drawTransition(transition, fromState, toState, offset, zoom);
      }
    });

    // Draw draft transition (both modes)
    if ((transitionDraft || isCreatingTransition) && transitionDraft) {
      const fromState = states.find((s) => s.id === transitionDraft.fromState);
      if (fromState) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const fromX = fromState.position.x * zoom + offset.x;
          const fromY = fromState.position.y * zoom + offset.y;
          const toX = mousePos.x * zoom + offset.x;
          const toY = mousePos.y * zoom + offset.y;

          ctx.strokeStyle = CANVAS_COLORS.transition.hover;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Draw states
    states.forEach((state) => {
      const isHighlighted = transitionDraft?.fromState === state.id;
      renderer.drawState(state, offset, zoom, {
        isHovered: hoveredState === state.id || isHighlighted,
        isSelected: selectedStates.includes(state.id),
      });
    });
  }, [
    states,
    transitions,
    offset,
    zoom,
    width,
    height,
    hoveredState,
    selectedStates,
    transitionDraft,
    isCreatingTransition,
    mousePos,
  ]);

  // Get cursor style based on tool mode
  const getCursorClass = () => {
    if (toolMode === 'addState') return 'cursor-crosshair';
    if (toolMode === 'addTransition' || isCreatingTransition) return 'cursor-pointer';
    return isDragging ? 'dragging' : '';
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        className={`canvas ${getCursorClass()}`}
        onMouseDown={handlers.onMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handlers.onMouseUp}
        onMouseLeave={handlers.onMouseLeave}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
