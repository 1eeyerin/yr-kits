import { useEffect, useRef, useState, type CSSProperties } from "react";

const FLOATING_BUTTON_SIZE = 48;
const DRAG_CLICK_THRESHOLD = 4;

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
}

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
          x: Math.min(Math.max(prev.x, 0), Math.max(0, window.innerWidth - FLOATING_BUTTON_SIZE)),
          y: Math.min(Math.max(prev.y, 0), Math.max(0, window.innerHeight - FLOATING_BUTTON_SIZE)),
        };
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (
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
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
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
      x: Math.min(Math.max(dragState.originX + deltaX, 0), Math.max(0, window.innerWidth - FLOATING_BUTTON_SIZE)),
      y: Math.min(Math.max(dragState.originY + deltaY, 0), Math.max(0, window.innerHeight - FLOATING_BUTTON_SIZE)),
    });
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    suppressMainToggleClickRef.current = dragStateRef.current.moved;
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const consumeToggleSuppression = () => {
    if (suppressMainToggleClickRef.current) {
      suppressMainToggleClickRef.current = false;
      return true;
    }

    return false;
  };

  const resetDragState = () => {
    dragStateRef.current = null;
    suppressMainToggleClickRef.current = false;
    setPosition(null);
  };

  const floatingWrapperStyle: CSSProperties = position
    ? {
        position: "fixed",
        zIndex: 2147483000,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : {
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 2147483000,
      };

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
