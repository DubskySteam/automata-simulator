import { useCallback, useRef, useState } from 'react';
import { Position, State } from '@/types';
import { getCanvasCoordinates, isPointInCircle } from '@/lib/canvas/utils';
import { CANVAS_CONSTANTS } from '@/lib/canvas/constants';

interface UseCanvasInteractionProps {
  states: State[];
  onStateMove: (stateId: string, newPosition: Position) => void;
  onStateSelect: (stateId: string, multiSelect: boolean) => void;
  onStateClick?: (stateId: string, event: React.MouseEvent) => void;
  onCanvasClick: (position: Position, event: React.MouseEvent) => void;
  onTransitionStart?: (stateId: string) => void;
  onTransitionEnd?: (stateId: string) => void;
  offset: Position;
  zoom: number;
  selectedStates: string[];
  enabled?: boolean;
}

export function useCanvasInteraction({
  states,
  onStateMove,
  onStateSelect,
  onStateClick,
  onCanvasClick,
  onTransitionStart,
  onTransitionEnd,
  offset,
  zoom,
  selectedStates,
  enabled = true,
}: UseCanvasInteractionProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isCreatingTransition, setIsCreatingTransition] = useState(false);
  const dragStartRef = useRef<Position | null>(null);
  const draggedStatesRef = useRef<Map<string, Position>>(new Map());
  const hasMovedRef = useRef(false);
  const transitionStartStateRef = useRef<string | null>(null);

  const findStateAtPosition = useCallback(
    (pos: Position): State | null => {
      for (let i = states.length - 1; i >= 0; i--) {
        const state = states[i];
        if (isPointInCircle(pos, state.position, CANVAS_CONSTANTS.STATE_RADIUS)) {
          return state;
        }
      }
      return null;
    },
    [states]
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enabled) return;

      const canvas = event.currentTarget;
      const pos = getCanvasCoordinates(event, canvas, offset, zoom);
      const clickedState = findStateAtPosition(pos);

      hasMovedRef.current = false;

      if (event.button === 0) {
        // Left click
        if (clickedState && event.shiftKey) {
          // Shift+click on state: start transition creation
          setIsCreatingTransition(true);
          transitionStartStateRef.current = clickedState.id;
          dragStartRef.current = pos;
          if (onTransitionStart) {
            onTransitionStart(clickedState.id);
          }
        } else if (clickedState) {
          // Regular click on state: prepare for drag
          dragStartRef.current = pos;

          if (!selectedStates.includes(clickedState.id)) {
            onStateSelect(clickedState.id, event.shiftKey);
          }

          const statesToDrag = selectedStates.includes(clickedState.id)
            ? selectedStates
            : [clickedState.id];

          draggedStatesRef.current = new Map(
            statesToDrag.map((id) => {
              const state = states.find((s) => s.id === id);
              return [id, state ? { ...state.position } : { x: 0, y: 0 }];
            })
          );
        } else {
          // Click on empty canvas: prepare for pan
          dragStartRef.current = { x: event.clientX, y: event.clientY };
        }
      }
    },
    [enabled, states, selectedStates, findStateAtPosition, onStateSelect, onTransitionStart, offset, zoom]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enabled) return;

      const canvas = event.currentTarget;
      const pos = getCanvasCoordinates(event, canvas, offset, zoom);

      if (dragStartRef.current) {
        const moveThreshold = 5;

        if (!isDragging && !isPanning && !isCreatingTransition) {
          const distanceMoved = draggedStatesRef.current.size > 0
            ? Math.hypot(pos.x - dragStartRef.current.x, pos.y - dragStartRef.current.y)
            : Math.hypot(event.clientX - dragStartRef.current.x, event.clientY - dragStartRef.current.y);

          if (distanceMoved > moveThreshold) {
            hasMovedRef.current = true;
            if (transitionStartStateRef.current) {
              setIsCreatingTransition(true);
            } else if (draggedStatesRef.current.size > 0) {
              setIsDragging(true);
            } else {
              setIsPanning(true);
            }
          }
        }

        if (isDragging) {
          const dx = pos.x - dragStartRef.current.x;
          const dy = pos.y - dragStartRef.current.y;

          draggedStatesRef.current.forEach((initialPos, stateId) => {
            onStateMove(stateId, {
              x: initialPos.x + dx,
              y: initialPos.y + dy,
            });
          });
        } else if (isPanning) {
          const dx = event.clientX - dragStartRef.current.x;
          const dy = event.clientY - dragStartRef.current.y;
          dragStartRef.current = { x: event.clientX, y: event.clientY };

          return { panDelta: { x: dx, y: dy } };
        } else if (isCreatingTransition) {
          return { transitionDraftPos: pos };
        }
      } else {
        const hoveredState = findStateAtPosition(pos);
        setHoveredState(hoveredState?.id || null);
      }
    },
    [enabled, isDragging, isPanning, isCreatingTransition, findStateAtPosition, onStateMove, offset, zoom]
  );

  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!enabled) return;

      const canvas = event.currentTarget;
      const pos = getCanvasCoordinates(event, canvas, offset, zoom);
      const wasDragging = isDragging;
      const wasPanning = isPanning;
      const wasCreatingTransition = isCreatingTransition;
      const hasMoved = hasMovedRef.current;

      // Handle transition end
      if (wasCreatingTransition && transitionStartStateRef.current) {
        const targetState = findStateAtPosition(pos);
        if (targetState && onTransitionEnd) {
          onTransitionEnd(targetState.id);
        }
        setIsCreatingTransition(false);
        transitionStartStateRef.current = null;
      }

      // Reset all drag/pan state
      setIsDragging(false);
      setIsPanning(false);
      dragStartRef.current = null;
      draggedStatesRef.current.clear();
      hasMovedRef.current = false;

      // Only trigger click if we didn't drag/pan
      if (!wasDragging && !wasPanning && !wasCreatingTransition && !hasMoved && event.button === 0) {
        const clickedState = findStateAtPosition(pos);

        if (clickedState) {
          // If onStateClick is provided, use it (for tool modes that need custom state click behavior)
          if (onStateClick) {
            onStateClick(clickedState.id, event);
          } else {
            onStateSelect(clickedState.id, event.shiftKey);
          }
        } else {
          onCanvasClick(pos, event);
        }
      }
    },
    [enabled, isDragging, isPanning, isCreatingTransition, findStateAtPosition, onStateSelect, onStateClick, onCanvasClick, onTransitionEnd, offset, zoom]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredState(null);
    setIsDragging(false);
    setIsPanning(false);
    setIsCreatingTransition(false);
    dragStartRef.current = null;
    hasMovedRef.current = false;
    transitionStartStateRef.current = null;
  }, []);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const delta = -event.deltaY * 0.001;
    return { zoomDelta: delta, zoomCenter: { x: event.clientX, y: event.clientY } };
  }, []);

  return {
    hoveredState,
    isDragging,
    isPanning,
    isCreatingTransition,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onWheel: handleWheel,
    },
  };
}
