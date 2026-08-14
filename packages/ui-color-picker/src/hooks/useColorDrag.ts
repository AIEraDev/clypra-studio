/**
 * Clypra Color Drag Interaction Hook
 * High-performance pointer tracking with requestAnimationFrame & 16ms onChange debouncing.
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { clamp } from '../utils/colorUtils';

export interface UseColorDragOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  onDragChange?: (coords: { x: number; y: number }) => void;
  onDragComplete?: (coords: { x: number; y: number }) => void;
  disabled?: boolean;
}

export interface UseColorDragReturn {
  isDragging: boolean;
  handlePointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}

export function useColorDrag({
  containerRef,
  onDragChange,
  onDragComplete,
  disabled = false,
}: UseColorDragOptions): UseColorDragReturn {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // References for keeping callbacks up-to-date and managing RAF
  const onDragChangeRef = useRef(onDragChange);
  onDragChangeRef.current = onDragChange;

  const onDragCompleteRef = useRef(onDragComplete);
  onDragCompleteRef.current = onDragComplete;

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const rafIdRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pendingChangeCoordsRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Calculates normalized (0 to 1) coordinates from a pointer event relative to container.
   */
  const computeNormalizedPosition = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const rawX = (clientX - rect.left) / rect.width;
    const rawY = (clientY - rect.top) / rect.height;

    const x = clamp(rawX, 0, 1);
    const y = clamp(rawY, 0, 1);

    return { x, y };
  }, [containerRef]);

  /**
   * Schedule update on the next animation frame.
   */
  const scheduleUpdate = useCallback((coords: { x: number; y: number }) => {
    latestCoordsRef.current = coords;
    pendingChangeCoordsRef.current = coords;

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (debounceTimerRef.current === null) {
          if (pendingChangeCoordsRef.current) {
            onDragChangeRef.current?.(pendingChangeCoordsRef.current);
            pendingChangeCoordsRef.current = null;
          }

          // Debounce subsequent rapid changes at 16ms (~1 frame)
          debounceTimerRef.current = setTimeout(() => {
            debounceTimerRef.current = null;
            if (pendingChangeCoordsRef.current) {
              onDragChangeRef.current?.(pendingChangeCoordsRef.current);
              pendingChangeCoordsRef.current = null;
            }
          }, 16);
        }
      });
    }
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (disabledRef.current) return;
    if (event.button !== 0) return; // Only primary button

    // Prevent text selection and unwanted default gesture behavior
    event.preventDefault();
    event.stopPropagation();

    const targetElement = event.currentTarget;
    if (targetElement && 'setPointerCapture' in targetElement) {
      try {
        targetElement.setPointerCapture(event.pointerId);
      } catch {
        // Fallback gracefully if setPointerCapture is unsupported or fails
      }
    }

    const pos = computeNormalizedPosition(event.clientX, event.clientY);
    if (!pos) return;

    setIsDragging(true);
    scheduleUpdate(pos);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const currentPos = computeNormalizedPosition(moveEvent.clientX, moveEvent.clientY);
      if (currentPos) {
        scheduleUpdate(currentPos);
      }
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();

      if (targetElement && 'releasePointerCapture' in targetElement) {
        try {
          targetElement.releasePointerCapture(upEvent.pointerId);
        } catch {
          // Ignored
        }
      }

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      // Cancel pending throttles
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      setIsDragging(false);

      const finalPos = computeNormalizedPosition(upEvent.clientX, upEvent.clientY) || latestCoordsRef.current;
      // Fire immediate change and completion on release
      onDragChangeRef.current?.(finalPos);
      onDragCompleteRef.current?.(finalPos);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', handlePointerUp, { passive: false });
  }, [computeNormalizedPosition, scheduleUpdate]);

  // Clean up RAF and timer on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isDragging,
    handlePointerDown,
  };
}
