/**
 * Clypra Saturation & Brightness 2D Picker Canvas
 * High-performance 2D gradient surface with pointer drag & keyboard nudging.
 */

import React, { useRef, useMemo, useCallback } from 'react';
import type { HSVA } from '../types/color';
import { useColorDrag } from '../hooks/useColorDrag';
import { clamp } from '../utils/colorUtils';

export interface SaturationBrightnessProps {
  hsva: HSVA;
  onChange: (hsva: HSVA) => void;
  onChangeComplete?: (hsva: HSVA) => void;
  disabled?: boolean;
  className?: string;
}

export const SaturationBrightness: React.FC<SaturationBrightnessProps> = ({
  hsva,
  onChange,
  onChangeComplete,
  disabled = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Background color base on current Hue (H, 100%, 50%)
  const pureHueBg = useMemo(() => {
    return `hsl(${Math.round(hsva.h)}, 100%, 50%)`;
  }, [hsva.h]);

  // Map 0..1 coordinates to Saturation (0..100) & Value (0..100)
  const handleDragChange = useCallback(
    (coords: { x: number; y: number }) => {
      const s = Math.round(coords.x * 100);
      const v = Math.round((1 - coords.y) * 100);

      onChange({
        ...hsva,
        s: clamp(s, 0, 100),
        v: clamp(v, 0, 100),
      });
    },
    [hsva, onChange]
  );

  const handleDragComplete = useCallback(
    (coords: { x: number; y: number }) => {
      const s = Math.round(coords.x * 100);
      const v = Math.round((1 - coords.y) * 100);

      const nextHsva: HSVA = {
        ...hsva,
        s: clamp(s, 0, 100),
        v: clamp(v, 0, 100),
      };

      onChange(nextHsva);
      onChangeComplete?.(nextHsva);
    },
    [hsva, onChange, onChangeComplete]
  );

  const { isDragging, handlePointerDown } = useColorDrag({
    containerRef,
    onDragChange: handleDragChange,
    onDragComplete: handleDragComplete,
    disabled,
  });

  // Keyboard navigation support: Arrow keys nudge 1% (or 10% with Shift)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const step = e.shiftKey ? 10 : 1;
      let newS = hsva.s;
      let newV = hsva.v;
      let handled = false;

      switch (e.key) {
        case 'ArrowLeft':
          newS = clamp(hsva.s - step, 0, 100);
          handled = true;
          break;
        case 'ArrowRight':
          newS = clamp(hsva.s + step, 0, 100);
          handled = true;
          break;
        case 'ArrowDown':
          newV = clamp(hsva.v - step, 0, 100);
          handled = true;
          break;
        case 'ArrowUp':
          newV = clamp(hsva.v + step, 0, 100);
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        const nextHsva: HSVA = {
          ...hsva,
          s: newS,
          v: newV,
        };
        onChange(nextHsva);
        onChangeComplete?.(nextHsva);
      }
    },
    [disabled, hsva, onChange, onChangeComplete]
  );

  // Calculate thumb position percentage
  const thumbLeft = `${clamp(hsva.s, 0, 100)}%`;
  const thumbTop = `${clamp(100 - hsva.v, 0, 100)}%`;

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Color saturation and brightness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsva.v)}
      aria-valuetext={`Saturation ${Math.round(hsva.s)}%, Brightness ${Math.round(hsva.v)}%`}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      style={{ backgroundColor: pureHueBg }}
      className={`clypra-sb-canvas relative w-full h-[200px] min-h-[180px] rounded-lg overflow-hidden border border-white/10 select-none shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Horizontal white gradient (Saturation: 0 -> 100) */}
      <div className="clypra-sb-white-overlay" />
      {/* Vertical black gradient (Value/Brightness: 100 -> 0) */}
      <div className="clypra-sb-black-overlay" />

      {/* Double-ring high-contrast thumb cursor */}
      <div
        className={`clypra-color-thumb ${isDragging ? 'dragging' : ''}`}
        style={{
          left: thumbLeft,
          top: thumbTop,
          backgroundColor: `hsl(${Math.round(hsva.h)}, ${Math.round(hsva.s)}%, ${Math.round(hsva.v)}%)`,
        }}
      />
    </div>
  );
};
