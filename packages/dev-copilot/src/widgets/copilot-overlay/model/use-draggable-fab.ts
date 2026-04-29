import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const FLOATING_BUTTON_SIZE = 48;
const DRAG_CLICK_THRESHOLD = 4;
const DEFAULT_FLOATING_OFFSET = 24;
const FLOATING_Z_INDEX = 2147483000;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
}

const clampPosition = (value: number, max: number) => {
  return Math.min(Math.max(value, 0), Math.max(0, max - FLOATING_BUTTON_SIZE));
};

export const useDraggableFab = () => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressMainToggleClickRef = useRef(false);

  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          x: clampPosition(prev.x, window.innerWidth),
          y: clampPosition(prev.y, window.innerHeight),
        };
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = useCallback((
    event: React.PointerEvent<HTMLButtonElement>,
    origin?: { x: number; y: number },
  ) => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin?.x ?? 0,
      originY: origin?.y ?? 0,
      moved: false,
    };
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const moved = Math.abs(deltaX) > DRAG_CLICK_THRESHOLD || Math.abs(deltaY) > DRAG_CLICK_THRESHOLD;

    if (!moved && !dragState.moved) {
      return;
    }

    dragState.moved = true;

    setPosition({
      x: clampPosition(dragState.originX + deltaX, window.innerWidth),
      y: clampPosition(dragState.originY + deltaY, window.innerHeight),
    });
  }, []);

  const onPointerEnd = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    suppressMainToggleClickRef.current = dragStateRef.current.moved;
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const consumeToggleSuppression = useCallback(() => {
    if (suppressMainToggleClickRef.current) {
      suppressMainToggleClickRef.current = false;
      return true;
    }

    return false;
  }, []);

  const resetDragState = useCallback(() => {
    dragStateRef.current = null;
    suppressMainToggleClickRef.current = false;
    setPosition(null);
  }, []);

  const floatingWrapperStyle: CSSProperties = useMemo(() => {
    if (position) {
      return {
        position: "fixed",
        zIndex: FLOATING_Z_INDEX,
        left: `${position.x}px`,
        top: `${position.y}px`,
      };
    }

    return {
      position: "fixed",
      right: DEFAULT_FLOATING_OFFSET,
      bottom: DEFAULT_FLOATING_OFFSET,
      zIndex: FLOATING_Z_INDEX,
    };
  }, [position]);

  return {
    position,
    floatingWrapperStyle,
    onPointerDown,
    onPointerMove,
    onPointerEnd,
    consumeToggleSuppression,
    resetDragState,
  };
};
