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

      if (event.button === 0) {
        // Left click
        if (clickedState) {
          // Start dragging state(s)
          setIsDragging(true);
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
          // Start panning
          setIsPanning(true);
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

      if (isDragging && dragStartRef.current) {
        // Drag states
        const dx = pos.x - dragStartRef.current.x;
        const dy = pos.y - dragStartRef.current.y;

        draggedStatesRef.current.forEach((initialPos, stateId) => {
          onStateMove(stateId, {
            x: initialPos.x + dx,
            y: initialPos.y + dy,
          });
        });
      } else if (isPanning && dragStartRef.current) {
        // Pan canvas
        const dx = event.clientX - dragStartRef.current.x;
        const dy = event.clientY - dragStartRef.current.y;
        dragStartRef.current = { x: event.clientX, y: event.clientY };

        return { panDelta: { x: dx, y: dy } };
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
      if (isDragging) {
        setIsDragging(false);
        dragStartRef.current = null;
        draggedStatesRef.current.clear();
      }

      if (isPanning) {
        setIsPanning(false);
        dragStartRef.current = null;
      }

      // Handle click (not drag)
      if (!isDragging && !isPanning && event.button === 0) {
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