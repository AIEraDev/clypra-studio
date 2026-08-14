/**
 * Clypra Vertical Hue Slider Component
 * Custom rainbow spectrum gradient with precision pointer tracking and keyboard navigation.
 */

import React, { useRef, useCallback } from 'react';
import { useColorDrag } from '../hooks/useColorDrag';
import { clamp, round } from '../utils/colorUtils';

export interface HueSliderProps {
  hue: number; // 0 - 360
  onChange: (hue: number) => void;
  onChangeComplete?: (hue: number) => void;
  disabled?: boolean;
  className?: string;
}

export const HueSlider: React.FC<HueSliderProps> = ({
  hue,
  onChange,
  onChangeComplete,
  disabled = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map 0..1 Y coordinate to Hue (0..360)
  const handleDragChange = useCallback(
    (coords: { x: number; y: number }) => {
      const newHue = round(coords.y * 360, 1);
      onChange(clamp(newHue, 0, 360));
    },
    [onChange]
  );

  const handleDragComplete = useCallback(
    (coords: { x: number; y: number }) => {
      const newHue = round(coords.y * 360, 1);
      const clamped = clamp(newHue, 0, 360);
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

      const step = e.shiftKey ? 10 : 1;
      let newHue = hue;
      let handled = false;

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          newHue = (hue - step + 360) % 360;
          handled = true;
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          newHue = (hue + step) % 360;
          handled = true;
          break;
        case 'Home':
          newHue = 0;
          handled = true;
          break;
        case 'End':
          newHue = 360;
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        onChange(newHue);
        onChangeComplete?.(newHue);
      }
    },
    [disabled, hue, onChange, onChangeComplete]
  );

  const thumbTop = `${clamp((hue / 360) * 100, 0, 100)}%`;

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Color hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      aria-valuetext={`${Math.round(hue)} degrees`}
      aria-disabled={disabled}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      className={`clypra-hue-track relative w-5 min-w-[20px] h-full rounded-md border border-white/10 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <div
        className={`clypra-slider-thumb ${isDragging ? 'dragging' : ''}`}
        style={{
          top: thumbTop,
          backgroundColor: `hsl(${Math.round(hue)}, 100%, 50%)`,
        }}
      />
    </div>
  );
};
