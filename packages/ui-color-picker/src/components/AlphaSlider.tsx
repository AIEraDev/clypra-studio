/**
 * Clypra Vertical Alpha / Opacity Slider Component
 * Checkerboard backdrop with alpha gradient overlay, pointer drag & keyboard nudging.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import type { HSVA } from '../types/color';
import { useColorDrag } from '../hooks/useColorDrag';
import { clamp, round } from '../utils/colorUtils';

export interface AlphaSliderProps {
  hsva: HSVA;
  onChange: (alpha: number) => void;
  onChangeComplete?: (alpha: number) => void;
  disabled?: boolean;
  className?: string;
}

export const AlphaSlider: React.FC<AlphaSliderProps> = ({
  hsva,
  onChange,
  onChangeComplete,
  disabled = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Gradient overlay from full opacity to completely transparent
  const gradientOverlay = useMemo(() => {
    const opaque = `hsl(${Math.round(hsva.h)}, ${Math.round(hsva.s)}%, ${Math.round(hsva.v)}%)`;
    return `linear-gradient(to bottom, ${opaque}, transparent)`;
  }, [hsva.h, hsva.s, hsva.v]);

  // Map 0..1 Y coordinate to Alpha (1.0 at top -> 0.0 at bottom)
  const handleDragChange = useCallback(
    (coords: { x: number; y: number }) => {
      const newAlpha = round(1 - coords.y, 2);
      onChange(clamp(newAlpha, 0, 1));
    },
    [onChange]
  );

  const handleDragComplete = useCallback(
    (coords: { x: number; y: number }) => {
      const newAlpha = round(1 - coords.y, 2);
      const clamped = clamp(newAlpha, 0, 1);
      onChange(clamped);
      onChangeComplete?.(clamped);
    },
    [onChange, onChangeComplete]
  );

  const { isDragging, handlePointerDown } = useColorDrag({
    containerRef,
    onDragChange: handleDragChange,
    onDragComplete: handleDragComplete,
    disabled,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const step = e.shiftKey ? 0.1 : 0.01;
      let newAlpha = hsva.a;
      let handled = false;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          newAlpha = clamp(round(hsva.a + step, 2), 0, 1);
          handled = true;
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          newAlpha = clamp(round(hsva.a - step, 2), 0, 1);
          handled = true;
          break;
        case 'Home':
          newAlpha = 0;
          handled = true;
          break;
        case 'End':
          newAlpha = 1;
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        onChange(newAlpha);
        onChangeComplete?.(newAlpha);
      }
    },
    [disabled, hsva.a, onChange, onChangeComplete]
  );

  const thumbTop = `${clamp((1 - hsva.a) * 100, 0, 100)}%`;

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Color opacity"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsva.a * 100)}
      aria-valuetext={`${Math.round(hsva.a * 100)}% opacity`}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={`clypra-alpha-track relative w-5 min-w-[20px] h-full rounded-md border border-white/10 select-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Dynamic color alpha gradient layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: gradientOverlay }}
      />

      {/* Slider Thumb */}
      <div
        className={`clypra-slider-thumb ${isDragging ? 'dragging' : ''}`}
        style={{
          top: thumbTop,
          backgroundColor: `rgba(255, 255, 255, ${hsva.a})`,
        }}
      />
    </div>
  );
};
