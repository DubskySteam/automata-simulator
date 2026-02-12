import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useAutomaton } from '@/hooks/useAutomaton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CanvasRenderer } from '@/lib/canvas/renderer';
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu';
import { StateEditModal } from './StateEditModal';
import { TransitionModal } from './TransitionModal';
import { SimulationPanel } from '@/components/simulation/SimulationPanel';
import { SimulationEngine } from '@/lib/simulation/engine';
import { Position, ToolMode, State, Transition } from '@/types';
import { SimulationState } from '@/types/simulation';
import { CANVAS_CONSTANTS, CANVAS_COLORS } from '@/lib/canvas/constants';
import { getCanvasCoordinates, isPointOnTransition } from '@/lib/canvas/utils';
import './Canvas.css';

interface CanvasProps {
  width?: number;
  height?: number;
  toolMode: ToolMode;
  showSimulation?: boolean;
}

export function Canvas({ width = 800, height = 600, toolMode, showSimulation = false }: CanvasProps) {
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
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target: { type: 'state'; id: string } | { type: 'transition'; id: string } | null;
  } | null>(null);
  const [stateEditModal, setStateEditModal] = useState<State | null>(null);
  const [transitionModal, setTransitionModal] = useState<{
    fromState: string;
    toState: string;
    editingTransitionId?: string;
  } | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const simulationEngineRef = useRef<SimulationEngine | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use automaton hook
  const {
    automaton,
    addState,
    removeState,
    updateState,
    toggleStateInitial,
    toggleStateAccept,
    addTransition,
    updateTransition,
    removeTransition,
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

  // Update simulation engine when automaton changes
  useEffect(() => {
    simulationEngineRef.current = new SimulationEngine(automaton);
    const validation = simulationEngineRef.current.validate();
    setValidationErrors(validation.errors);
  }, [automaton]);

  // Find transition at position
  const findTransitionAtPosition = useCallback(
    (pos: Position): Transition | null => {
      for (let i = transitions.length - 1; i >= 0; i--) {
        const transition = transitions[i];
        const fromState = states.find((s) => s.id === transition.from);
        const toState = states.find((s) => s.id === transition.to);

        if (fromState && toState && isPointOnTransition(pos, transition, fromState, toState, 10)) {
          return transition;
        }
      }
      return null;
    },
    [transitions, states]
  );

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

  const handleStateClick = useCallback(
    (stateId: string, event: React.MouseEvent) => {
      if (toolMode === 'addTransition') {
        if (!transitionDraft) {
          setTransitionDraft({ fromState: stateId });
        } else {
          setTransitionModal({ fromState: transitionDraft.fromState, toState: stateId });
          setTransitionDraft(null);
        }
      } else if (toolMode === 'select') {
        handleStateSelect(stateId, event.shiftKey);
      }
    },
    [toolMode, transitionDraft, handleStateSelect]
  );

  const handleTransitionStart = useCallback((stateId: string) => {
    setTransitionDraft({ fromState: stateId });
  }, []);

  const handleTransitionEnd = useCallback(
    (stateId: string) => {
      if (transitionDraft) {
        setTransitionModal({ fromState: transitionDraft.fromState, toState: stateId });
      }
      setTransitionDraft(null);
    },
    [transitionDraft]
  );

  const handleCanvasClick = useCallback(
    (position: Position, event: React.MouseEvent) => {
      if (toolMode === 'addState') {
        addState(position);
        return;
      }

      if (toolMode === 'addTransition') {
        setTransitionDraft(null);
        return;
      }

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
        addState(position);
        lastClickTimeRef.current = 0;
      } else {
        setSelectedStates([]);
        lastClickTimeRef.current = now;
        lastClickPosRef.current = position;
      }
    },
    [toolMode, addState]
  );

  // Simulation handlers
  const handleSimulationStart = useCallback((inputString: string) => {
    if (!simulationEngineRef.current) return;

    const steps = simulationEngineRef.current.simulate(inputString);
    const accepted = simulationEngineRef.current.isAccepted(steps);

    setSimulation({
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      steps,
      result: steps.length > 0 && steps[steps.length - 1].remainingInput === '' ? 
        (accepted ? 'accepted' : 'rejected') : 'rejected',
      inputString,
    });
  }, []);

  const handleSimulationStep = useCallback((direction: 'forward' | 'back') => {
    setSimulation((prev) => {
      if (!prev) return null;

      const newStep =
        direction === 'forward'
          ? Math.min(prev.currentStep + 1, prev.steps.length - 1)
          : Math.max(prev.currentStep - 1, 0);

      return { ...prev, currentStep: newStep };
    });
  }, []);

  const handleSimulationReset = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setSimulation(null);
  }, []);

  const handleSimulationPlay = useCallback(() => {
    setSimulation((prev) => {
      if (!prev) return null;
      return { ...prev, isRunning: true };
    });

    playIntervalRef.current = setInterval(() => {
      setSimulation((prev) => {
        if (!prev) return null;

        if (prev.currentStep >= prev.steps.length - 1) {
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
          }
          return { ...prev, isRunning: false };
        }

        return { ...prev, currentStep: prev.currentStep + 1 };
      });
    }, 800);
  }, []);

  const handleSimulationPause = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setSimulation((prev) => {
      if (!prev) return null;
      return { ...prev, isRunning: false };
    });
  }, []);

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

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault();

      const canvas = event.currentTarget;
      const pos = getCanvasCoordinates(event, canvas, offset, zoom);

      const clickedState = states.find((state) => {
        const dx = pos.x - state.position.x;
        const dy = pos.y - state.position.y;
        return Math.sqrt(dx * dx + dy * dy) <= CANVAS_CONSTANTS.STATE_RADIUS;
      });

      if (clickedState) {
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          target: { type: 'state', id: clickedState.id },
        });
        return;
      }

      const clickedTransition = findTransitionAtPosition(pos);
      if (clickedTransition) {
        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          target: { type: 'transition', id: clickedTransition.id },
        });
        return;
      }

      setContextMenu(null);
    },
    [states, findTransitionAtPosition, offset, zoom]
  );

  const getContextMenuItems = useCallback((): ContextMenuItem[] => {
    if (!contextMenu?.target) return [];

    if (contextMenu.target.type === 'state') {
      const state = states.find((s) => s.id === contextMenu.target.id);
      if (!state) return [];

      return [
        {
          label: 'Edit State',
          icon: '✏️',
          onClick: () => {
            setStateEditModal(state);
          },
        },
        { separator: true } as ContextMenuItem,
        {
          label: state.isInitial ? 'Unset Initial State' : 'Set as Initial State',
          icon: '▶️',
          onClick: () => toggleStateInitial(state.id),
        },
        {
          label: state.isAccept ? 'Unset Accept State' : 'Set as Accept State',
          icon: '⭕',
          onClick: () => toggleStateAccept(state.id),
        },
        { separator: true } as ContextMenuItem,
        {
          label: 'Delete State',
          icon: '🗑️',
          destructive: true,
          onClick: () => {
            removeState(state.id);
            setSelectedStates((prev) => prev.filter((id) => id !== state.id));
          },
        },
      ];
    }

    if (contextMenu.target.type === 'transition') {
      const transition = transitions.find((t) => t.id === contextMenu.target.id);
      if (!transition) return [];

      return [
        {
          label: 'Edit Transition',
          icon: '✏️',
          onClick: () => {
            setTransitionModal({
              fromState: transition.from,
              toState: transition.to,
              editingTransitionId: transition.id,
            });
          },
        },
        { separator: true } as ContextMenuItem,
        {
          label: 'Delete Transition',
          icon: '🗑️',
          destructive: true,
          onClick: () => {
            removeTransition(transition.id);
          },
        },
      ];
    }

    return [];
  }, [contextMenu, states, transitions, toggleStateInitial, toggleStateAccept, removeState, removeTransition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    rendererRef.current = new CanvasRenderer(canvas);
  }, [canvasRef]);

  // Get active states for visual feedback
  const activeStates = simulation?.steps[simulation.currentStep]?.currentStates || [];

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;

    renderer.clear(width, height);
    renderer.drawGrid(width, height, offset, zoom);

    transitions.forEach((transition) => {
      const fromState = states.find((s) => s.id === transition.from);
      const toState = states.find((s) => s.id === transition.to);
      if (fromState && toState) {
        renderer.drawTransition(transition, fromState, toState, offset, zoom);
      }
    });

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

    states.forEach((state) => {
      const isHighlighted = transitionDraft?.fromState === state.id;
      const isActive = activeStates.includes(state.id);
      renderer.drawState(state, offset, zoom, {
        isHovered: hoveredState === state.id || isHighlighted,
        isSelected: selectedStates.includes(state.id),
        isActive,
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
    activeStates,
  ]);

  const getCursorClass = () => {
    if (toolMode === 'addState') return 'cursor-crosshair';
    if (toolMode === 'addTransition' || isCreatingTransition) return 'cursor-pointer';
    return isDragging ? 'dragging' : '';
  };

  return (
    <>
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
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={getContextMenuItems()}
            onClose={() => setContextMenu(null)}
          />
        )}
        <StateEditModal
          state={stateEditModal}
          isOpen={!!stateEditModal}
          onClose={() => setStateEditModal(null)}
          onSave={updateState}
        />
        <TransitionModal
          isOpen={!!transitionModal}
          onClose={() => setTransitionModal(null)}
          onSave={(symbols) => {
            if (transitionModal) {
              if (transitionModal.editingTransitionId) {
                updateTransition(transitionModal.editingTransitionId, { symbols });
              } else {
                addTransition(transitionModal.fromState, transitionModal.toState, symbols);
              }
            }
          }}
          initialSymbols={
            transitionModal?.editingTransitionId
              ? transitions.find((t) => t.id === transitionModal.editingTransitionId)?.symbols
              : undefined
          }
          fromLabel={transitionModal ? states.find((s) => s.id === transitionModal.fromState)?.label : undefined}
          toLabel={transitionModal ? states.find((s) => s.id === transitionModal.toState)?.label : undefined}
        />
      </div>
      {showSimulation && (
        <SimulationPanel
          simulation={simulation}
          onStart={handleSimulationStart}
          onStep={handleSimulationStep}
          onReset={handleSimulationReset}
          onPlay={handleSimulationPlay}
          onPause={handleSimulationPause}
          validationErrors={validationErrors}
        />
      )}
    </>
  );
}
