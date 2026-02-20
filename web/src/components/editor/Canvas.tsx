import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useCanvasInteraction } from '@/hooks/useCanvasInteraction';
import { useAutomaton } from '@/hooks/useAutomaton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CanvasRenderer } from '@/lib/canvas/renderer';
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu';
import { StateEditModal } from './StateEditModal';
import { TransitionModal } from './TransitionModal';
import { SimulationEngine } from '@/lib/simulation/engine';
import { Position, ToolMode, State, Transition, AutomatonType, Automaton } from '@/types';
import { SimulationState } from '@/types/simulation';
import { ValidationError } from '@/types/validation';
import { CANVAS_CONSTANTS, getCanvasColors } from '@/lib/canvas/constants';
import { getCanvasCoordinates, isPointOnTransition } from '@/lib/canvas/utils';
import { storage } from '@/lib/storage';
import './Canvas.css';

interface CanvasProps {
  width?: number;
  height?: number;
  toolMode: ToolMode;
  showSimulation?: boolean;
  automatonType?: AutomatonType;
  onAutomatonTypeChange?: (type: AutomatonType) => void;
  onSimulationChange?: (simulation: SimulationState | null) => void;
  onValidationChange?: (errors: ValidationError[]) => void;
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void;
  onAlphabetChange?: (alphabet: string[]) => void;
  animationsEnabled?: boolean;
  onLoadAutomaton?: (automaton: Automaton) => void;
}

export function Canvas({
  width: propWidth,
  height: propHeight,
  toolMode,
  showSimulation = false,
  automatonType = 'NFA',
  onSimulationChange,
  onValidationChange,
  onUndoRedoChange,
  onAlphabetChange,
  animationsEnabled = true,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({
    width: propWidth || 800,
    height: propHeight || 600,
  });
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const lastClickTimeRef = useRef(0);
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
  const simulationEngineRef = useRef<SimulationEngine | null>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Validation error tracking
  const validationErrorsRef = useRef<{
    states: Set<string>;
    transitions: Set<string>;
    errors: ValidationError[];
  }>({ states: new Set(), transitions: new Set(), errors: [] });

  // Stale-closure fix for toolMode
  const toolModeRef = useRef(toolMode);
  useEffect(() => {
    toolModeRef.current = toolMode;
  }, [toolMode]);

  // Drag tracking
  const prevIsDraggingRef = useRef(false);
  const dragDidMoveRef = useRef(false);

  const DEFAULT_AUTOMATON: Automaton = {
    type: automatonType,
    states: [
      { id: '1', label: 'q0', isInitial: true, isAccept: false, position: { x: 200, y: 200 } },
      { id: '2', label: 'q1', isInitial: false, isAccept: true, position: { x: 400, y: 200 } },
    ],
    transitions: [{ id: 't1', from: '1', to: '2', symbols: ['a', 'b'] }],
    alphabet: [],
  };

  const {
    automaton,
    canUndo,
    canRedo,
    undo,
    redo,
    pushToHistory,
    addState,
    removeState,
    updateState,
    updateStatePosition,
    toggleStateInitial,
    toggleStateAccept,
    addTransition,
    updateTransition,
    removeTransition,
    loadAutomaton,
    clearAutomaton,
    setAlphabet,
  } = useAutomaton(DEFAULT_AUTOMATON);

  const { states, transitions } = automaton;
  const activeStates = simulation?.steps[simulation.currentStep]?.currentStates || [];

  // Restore from localStorage
  useEffect(() => {
    const saved = storage.load();
    if (saved && saved.states.length > 0) {
      loadAutomaton(saved);
    }
  }, [loadAutomaton]);

  // Sync automaton type when prop changes
  useEffect(() => {
    if (automaton.type !== automatonType) {
      loadAutomaton({ ...automaton, type: automatonType });
    }
  }, [automatonType]); // eslint-disable-line

  // Validation — run on every automaton change
  useEffect(() => {
    simulationEngineRef.current = new SimulationEngine(automaton);
    const result = simulationEngineRef.current.validate();

    const errorStates = new Set<string>();
    const errorTransitions = new Set<string>();
    result.errors.forEach((error) => {
      error.affectedStates?.forEach((id) => errorStates.add(id));
      error.affectedTransitions?.forEach((id) => errorTransitions.add(id));
    });
    validationErrorsRef.current = {
      states: errorStates,
      transitions: errorTransitions,
      errors: result.errors,
    };

    onValidationChange?.(result.errors);
  }, [automaton, onValidationChange]);

  // Notify parent of undo/redo capability
  useEffect(() => {
    onUndoRedoChange?.(canUndo, canRedo);
  }, [canUndo, canRedo, onUndoRedoChange]);

  // Notify parent of alphabet changes
  useEffect(() => {
    onAlphabetChange?.(automaton.alphabet);
  }, [automaton.alphabet, onAlphabetChange]);

  // Notify parent of simulation changes
  useEffect(() => {
    onSimulationChange?.(simulation);
  }, [simulation, onSimulationChange]);

  // Expose simulation handlers to App via window
  useEffect(() => {
    if (showSimulation) {
      (window as any).simulationHandlers = {
        start: handleSimulationStart,
        step: handleSimulationStep,
        reset: handleSimulationReset,
        play: handleSimulationPlay,
        pause: handleSimulationPause,
      };
    }
  }, [showSimulation]); // eslint-disable-line

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const width = containerSize.width;
  const height = containerSize.height;
  const canvasRef = useCanvas({ width, height });

  useEffect(() => {
    (window as any).canvasHelpers = {
      hasEpsilonTransitions: () => transitions.some((t) => t.symbols.includes('ε')),
      removeEpsilonTransitions: () => {
        const toRemove: string[] = [];
        const toUpdate: { id: string; symbols: string[] }[] = [];
        transitions.forEach((t) => {
          if (t.symbols.includes('ε')) {
            const s = t.symbols.filter((x) => x !== 'ε');
            if (s.length === 0) toRemove.push(t.id);
            else toUpdate.push({ id: t.id, symbols: s });
          }
        });
        toRemove.forEach((id) => removeTransition(id));
        toUpdate.forEach(({ id, symbols }) => updateTransition(id, { symbols }));
      },
      exportToPNG: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `automaton-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      },
      getAutomaton: () => automaton,
      loadAutomaton: (a: Automaton) => loadAutomaton(a),
      clearWorkspace: () => {
        loadAutomaton(DEFAULT_AUTOMATON);
        setOffset({ x: 0, y: 0 });
        setZoom(1);
      },
      undo,
      redo,
      canUndo,
      canRedo,
      setAlphabet,
    };
  }, [
    transitions,
    removeTransition,
    updateTransition,
    automaton,
    canvasRef,
    loadAutomaton,
    clearAutomaton,
    undo,
    redo,
    canUndo,
    canRedo,
    setAlphabet,
  ]);

  // Animation loop
  useEffect(() => {
    if (!animationsEnabled) return;
    let startTime = Date.now();
    const animate = () => {
      setAnimationTime((Date.now() - startTime) / 1000);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    if (activeStates.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeStates.length, animationsEnabled]);

  const findTransitionAtPosition = useCallback(
    (pos: Position): Transition | null => {
      for (let i = transitions.length - 1; i >= 0; i--) {
        const t = transitions[i];
        const from = states.find((s) => s.id === t.from);
        const to = states.find((s) => s.id === t.to);
        if (from && to && isPointOnTransition(pos, from, to, 10)) return t;
      }
      return null;
    },
    [transitions, states]
  );

  const handleStateMove = useCallback(
    (stateId: string, newPosition: Position) => {
      dragDidMoveRef.current = true;
      updateStatePosition(stateId, newPosition);
    },
    [updateStatePosition]
  );

  const handleStateSelect = useCallback((stateId: string, multiSelect: boolean) => {
    setSelectedStates((prev) =>
      multiSelect
        ? prev.includes(stateId)
          ? prev.filter((id) => id !== stateId)
          : [...prev, stateId]
        : [stateId]
    );
  }, []);

  const handleStateClick = useCallback(
    (stateId: string, event: React.MouseEvent) => {
      const mode = toolModeRef.current;
      if (mode === 'addTransition') {
        if (!transitionDraft) {
          setTransitionDraft({ fromState: stateId });
        } else {
          setTransitionModal({ fromState: transitionDraft.fromState, toState: stateId });
          setTransitionDraft(null);
        }
      } else if (mode === 'select') {
        handleStateSelect(stateId, event.shiftKey);
      }
    },
    [transitionDraft, handleStateSelect]
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
    (position: Position) => {
      const mode = toolModeRef.current;
      if (mode === 'addState') {
        addState(position);
        return;
      }
      if (mode === 'addTransition') {
        setTransitionDraft(null);
        return;
      }

      const now = Date.now();
      const timeSince = now - lastClickTimeRef.current;
      const dist = Math.hypot(
        position.x - lastClickPosRef.current.x,
        position.y - lastClickPosRef.current.y
      );

      if (timeSince < CANVAS_CONSTANTS.DOUBLE_CLICK_THRESHOLD && dist < 10) {
        addState(position);
        lastClickTimeRef.current = 0;
      } else {
        setSelectedStates([]);
        lastClickTimeRef.current = now;
        lastClickPosRef.current = position;
      }
    },
    [addState]
  );

  const handleSimulationStart = useCallback((inputString: string) => {
    if (!simulationEngineRef.current) return;
    const steps = simulationEngineRef.current.simulate(inputString);
    const accepted = simulationEngineRef.current.isAccepted(steps);
    setSimulation({
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      steps,
      result:
        steps.length > 0 && steps[steps.length - 1].remainingInput === ''
          ? accepted
            ? 'accepted'
            : 'rejected'
          : 'rejected',
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
    setSimulation((prev) => (prev ? { ...prev, isRunning: true } : null));
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
    }, 1000);
  }, []);

  const handleSimulationPause = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setSimulation((prev) => (prev ? { ...prev, isRunning: false } : null));
  }, []);

  useKeyboardShortcuts({
    onDelete: () => {
      if (selectedStates.length > 0) {
        selectedStates.forEach((id) => removeState(id));
        setSelectedStates([]);
      }
    },
    onSelectAll: () => {
      if (toolModeRef.current === 'select') {
        setSelectedStates(states.map((s) => s.id));
      }
    },
    onUndo: undo,
    onRedo: redo,
  });

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

  // Commit drag to history when drag ends
  useEffect(() => {
    if (prevIsDraggingRef.current && !isDragging && dragDidMoveRef.current) {
      pushToHistory();
      dragDidMoveRef.current = false;
    }
    prevIsDraggingRef.current = isDragging;
  }, [isDragging, pushToHistory]);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      const result = handlers.onWheel(event);
      if (result) {
        setZoom((prev) =>
          Math.max(
            CANVAS_CONSTANTS.MIN_ZOOM,
            Math.min(CANVAS_CONSTANTS.MAX_ZOOM, prev + result.zoomDelta)
          )
        );
      }
    },
    [handlers]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasCoordinates(event, event.currentTarget, offset, zoom);
      setMousePos(pos);
      const result = handlers.onMouseMove(event);
      if (result?.panDelta && toolModeRef.current === 'select') {
        setOffset((prev) => ({ x: prev.x + result.panDelta.x, y: prev.y + result.panDelta.y }));
      }
    },
    [handlers, offset, zoom]
  );

  const handleContextMenu = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const pos = getCanvasCoordinates(event, event.currentTarget, offset, zoom);

      const clickedState = states.find((s) => {
        const dx = pos.x - s.position.x,
          dy = pos.y - s.position.y;
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
      const state = states.find(
        (s) => s.id === (contextMenu.target as { type: 'state'; id: string }).id
      );
      if (!state) return [];
      return [
        { label: 'Edit State', icon: '✏️', onClick: () => setStateEditModal(state) },
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
            setSelectedStates((p) => p.filter((id) => id !== state.id));
          },
        },
      ];
    }

    if (contextMenu.target.type === 'transition') {
      const t = transitions.find((tr) => tr.id === contextMenu.target!.id);
      if (!t) return [];
      return [
        {
          label: 'Edit Transition',
          icon: '✏️',
          onClick: () =>
            setTransitionModal({ fromState: t.from, toState: t.to, editingTransitionId: t.id }),
        },
        { separator: true } as ContextMenuItem,
        {
          label: 'Delete Transition',
          icon: '🗑️',
          destructive: true,
          onClick: () => removeTransition(t.id),
        },
      ];
    }
    return [];
  }, [
    contextMenu,
    states,
    transitions,
    toggleStateInitial,
    toggleStateAccept,
    removeState,
    removeTransition,
  ]);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current = new CanvasRenderer(canvas);
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;

    renderer.clear(width, height);
    renderer.drawGrid(width, height, offset, zoom);

    // Detect bidirectional transitions for curve rendering
    const reverseMap = new Map<string, boolean>();
    transitions.forEach((t) => {
      if (transitions.some((r) => r.from === t.to && r.to === t.from)) {
        reverseMap.set(`${t.from}-${t.to}`, true);
      }
    });

    // Draw transitions
    transitions.forEach((t) => {
      const from = states.find((s) => s.id === t.from);
      const to = states.find((s) => s.id === t.to);
      if (from && to) {
        renderer.drawTransition(t, from, to, offset, zoom, {
          hasReverse: reverseMap.get(`${t.from}-${t.to}`) || false,
          hasError: validationErrorsRef.current.transitions.has(t.id),
        });
      }
    });

    // Draft transition line while drawing
    if ((transitionDraft || isCreatingTransition) && transitionDraft) {
      const from = states.find((s) => s.id === transitionDraft.fromState);
      if (from) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const COLORS = getCanvasColors();
          ctx.strokeStyle = COLORS.transition.hover;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(from.position.x * zoom + offset.x, from.position.y * zoom + offset.y);
          ctx.lineTo(mousePos.x * zoom + offset.x, mousePos.y * zoom + offset.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Draw states
    states.forEach((state) => {
      const isActive = activeStates.includes(state.id);
      const isHighlighted = transitionDraft?.fromState === state.id;
      renderer.drawState(state, offset, zoom, {
        isHovered: hoveredState === state.id || isHighlighted,
        isSelected: selectedStates.includes(state.id),
        isActive,
        hasError: validationErrorsRef.current.states.has(state.id),
        animationTime: isActive ? animationTime : undefined,
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
    animationTime,
  ]);

  const getCursorClass = () => {
    if (toolMode === 'addState') return 'cursor-crosshair';
    if (toolMode === 'addTransition' || isCreatingTransition) return 'cursor-pointer';
    return isDragging ? 'dragging' : '';
  };

  return (
    <>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      <StateEditModal
        isOpen={stateEditModal !== null}
        state={stateEditModal}
        onClose={() => setStateEditModal(null)}
        onSave={updateState}
      />

      <TransitionModal
        isOpen={transitionModal !== null}
        onClose={() => setTransitionModal(null)}
        onSave={(symbols) => {
          if (!transitionModal) return;
          if (transitionModal.editingTransitionId) {
            updateTransition(transitionModal.editingTransitionId, { symbols });
          } else {
            addTransition(transitionModal.fromState, transitionModal.toState, symbols);
          }
        }}
        initialSymbols={
          transitionModal?.editingTransitionId
            ? transitions.find((t) => t.id === transitionModal.editingTransitionId)?.symbols
            : undefined
        }
        fromLabel={
          transitionModal
            ? states.find((s) => s.id === transitionModal.fromState)?.label
            : undefined
        }
        toLabel={
          transitionModal ? states.find((s) => s.id === transitionModal.toState)?.label : undefined
        }
      />

      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          className={getCursorClass()}
          onMouseDown={handlers.onMouseDown as React.MouseEventHandler<HTMLCanvasElement>}
          onMouseUp={handlers.onMouseUp as React.MouseEventHandler<HTMLCanvasElement>}
          onMouseLeave={handlers.onMouseLeave as React.MouseEventHandler<HTMLCanvasElement>}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    </>
  );
}
