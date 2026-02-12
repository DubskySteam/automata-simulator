import { useCallback, useRef, useState } from 'react';
import { Position, State } from '@/types';
import { getCanvasCoordinates, isPointInCircle } from '@/lib/canvas/utils';
import { CANVAS_CONSTANTS } from '@/lib/canvas/constants';

interface UseCanvasInteractionProps {
  states: State[];
  onStateMove: (stateId: string, newPosition: Position) => void;
  onStateSelect: (stateId: string, multiSelect: boolean) => void;
  onCanvasClick: (position: Position) => void;
  offset: Position;
  zoom: number;
  selectedStates: string[];
}

export function useCanvasInteraction({
  states,
  onStateMove,
  onStateSelect,
  onCanvasClick,
  offset,
  zoom,
  selectedStates,
}: UseCanvasInteractionProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<Position | null>(null);
  const draggedStatesRef = useRef<Map<string, Position>>(new Map());
  const hasMovedRef = useRef(false); // Track if mouse actually moved

  const findStateAtPosition = useCallback(
    (pos: Position): State | null => {
      // Check in reverse order (top-most first)
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
      const canvas = event.currentTarget;
      const pos = getCanvasCoordinates(event, canvas, offset, zoom);
      const clickedState = findStateAtPosition(pos);

      hasMovedRef.current = false; // Reset move tracking

      if (event.button === 0) {
        // Left click
        if (clickedState) {
          // Prepare for potential state drag
          dragStartRef.current = pos;

          // If clicked state is not selected, select only it
          if (!selectedStates.includes(clickedState.id)) {
            onStateSelect(clickedState.id, event.shiftKey);
          }

          // Store initial positions of all selected states
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
          // Prepare for potential canvas pan
          dragStartRef.current = { x: event.clientX, y: event.clientY };
        }
      }
    },
    [states, selectedStates, findStateAtPosition, onStateSelect, offset, zoom]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = event.currentTarget;
      const pos = getCanvasCoordinates(event, canvas, offset, zoom);

      if (dragStartRef.current) {
        const moveThreshold = 5; // pixels to move before considering it a drag

        if (!isDragging && !isPanning) {
          // Check if we've moved enough to start dragging
          const distanceMoved = draggedStatesRef.current.size > 0
            ? Math.hypot(pos.x - dragStartRef.current.x, pos.y - dragStartRef.current.y)
            : Math.hypot(event.clientX - dragStartRef.current.x, event.clientY - dragStartRef.current.y);

          if (distanceMoved > moveThreshold) {
            hasMovedRef.current = true;
            if (draggedStatesRef.current.size > 0) {
              setIsDragging(true);
            } else {
              setIsPanning(true);
            }
          }
        }

        if (isDragging) {
          // Drag states
          const dx = pos.x - dragStartRef.current.x;
          const dy = pos.y - dragStartRef.current.y;

          draggedStatesRef.current.forEach((initialPos, stateId) => {
            onStateMove(stateId, {
              x: initialPos.x + dx,
              y: initialPos.y + dy,
            });
          });
        } else if (isPanning) {
          // Pan canvas
          const dx = event.clientX - dragStartRef.current.x;
          const dy = event.clientY - dragStartRef.current.y;
          dragStartRef.current = { x: event.clientX, y: event.clientY };

          return { panDelta: { x: dx, y: dy } };
        }
      } else {
        // Update hover state
        const hoveredState = findStateAtPosition(pos);
        setHoveredState(hoveredState?.id || null);
      }
    },
    [isDragging, isPanning, findStateAtPosition, onStateMove, offset, zoom]
  );

  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const wasDragging = isDragging;
      const wasPanning = isPanning;
      const hasMoved = hasMovedRef.current;

      // Reset all drag/pan state
      setIsDragging(false);
      setIsPanning(false);
      dragStartRef.current = null;
      draggedStatesRef.current.clear();
      hasMovedRef.current = false;

      // Only trigger click if we didn't drag/pan
      if (!wasDragging && !wasPanning && !hasMoved && event.button === 0) {
        const canvas = event.currentTarget;
        const pos = getCanvasCoordinates(event, canvas, offset, zoom);
        const clickedState = findStateAtPosition(pos);

        if (clickedState) {
          onStateSelect(clickedState.id, event.shiftKey);
        } else {
          onCanvasClick(pos);
        }
      }
    },
    [isDragging, isPanning, findStateAtPosition, onStateSelect, onCanvasClick, offset, zoom]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredState(null);
    setIsDragging(false);
    setIsPanning(false);
    dragStartRef.current = null;
    hasMovedRef.current = false;
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
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onWheel: handleWheel,
    },
  };
}