/**
 * Responsive Canvas Controller Hook
 *
 * Manages container size observation and calculates display dimensions
 * that fit within the container while preserving aspect ratio.
 */

import { useEffect, useRef, useState, useCallback } from "react";

export interface ResponsiveCanvasConfig {
  /** Render resolution aspect ratio (width / height) */
  aspectRatio: number;
  /** Fit mode: how to scale canvas within container */
  fit?: "contain" | "cover" | "fill";
  /** Whether responsive sizing is enabled */
  enabled?: boolean;
  /** Callback when display size changes */
  onDisplaySizeChange?: (size: { width: number; height: number }) => void;
}

export interface ResponsiveCanvasState {
  /** Container element ref */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Calculated display size for canvas CSS */
  displaySize: { width: number; height: number };
  /** Container size */
  containerSize: { width: number; height: number };
  /** Whether the controller is initialized */
  isReady: boolean;
}

/**
 * Calculate display size based on container size, aspect ratio, and fit mode
 */
function calculateDisplaySize(containerWidth: number, containerHeight: number, aspectRatio: number, fit: "contain" | "cover" | "fill"): { width: number; height: number } {
  if (containerWidth === 0 || containerHeight === 0) {
    return { width: 0, height: 0 };
  }

  if (fit === "fill") {
    // Stretch to fill container (breaks aspect ratio)
    return { width: containerWidth, height: containerHeight };
  }

  const containerAspectRatio = containerWidth / containerHeight;

  if (fit === "contain") {
    // Scale to fit within container, preserve aspect ratio
    if (containerAspectRatio > aspectRatio) {
      // Container is wider than content
      const height = containerHeight;
      const width = height * aspectRatio;
      return { width, height };
    } else {
      // Container is taller than content
      const width = containerWidth;
      const height = width / aspectRatio;
      return { width, height };
    }
  }

  if (fit === "cover") {
    // Scale to cover container, may crop
    if (containerAspectRatio > aspectRatio) {
      // Container is wider than content
      const width = containerWidth;
      const height = width / aspectRatio;
      return { width, height };
    } else {
      // Container is taller than content
      const height = containerHeight;
      const width = height * aspectRatio;
      return { width, height };
    }
  }

  // Fallback to contain
  return calculateDisplaySize(containerWidth, containerHeight, aspectRatio, "contain");
}

/**
 * Hook for responsive canvas sizing
 *
 * Observes container size and calculates appropriate display dimensions
 * based on aspect ratio and fit mode.
 */
export function useResponsiveCanvas(config: ResponsiveCanvasConfig): ResponsiveCanvasState {
  const { aspectRatio, fit = "contain", enabled = true, onDisplaySizeChange } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Use ref to avoid dependency array issues with callback
  const onDisplaySizeChangeRef = useRef(onDisplaySizeChange);
  useEffect(() => {
    onDisplaySizeChangeRef.current = onDisplaySizeChange;
  }, [onDisplaySizeChange]);

  // Calculate display size when container or config changes
  useEffect(() => {
    if (!enabled || containerSize.width === 0 || containerSize.height === 0) {
      setDisplaySize({ width: 0, height: 0 });
      setIsReady(false);
      return;
    }

    const newDisplaySize = calculateDisplaySize(containerSize.width, containerSize.height, aspectRatio, fit);

    setDisplaySize(newDisplaySize);
    setIsReady(true);

    if (onDisplaySizeChangeRef.current) {
      onDisplaySizeChangeRef.current(newDisplaySize);
    }
  }, [containerSize.width, containerSize.height, aspectRatio, fit, enabled]);

  // Set up ResizeObserver
  useEffect(() => {
    if (!enabled || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    // Create ResizeObserver
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    // Start observing
    resizeObserverRef.current.observe(container);

    // Initial size measurement
    const rect = container.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [enabled]);

  return {
    containerRef,
    displaySize,
    containerSize,
    isReady,
  };
}
