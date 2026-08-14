/**
 * Clypra Circular HSV Color Wheel Component
 * 360-degree chromatic disc with polar pointer tracking & keyboard rotation.
 */

import React, { useRef, useCallback } from 'react';
import type { HSVA } from '../types/color';
import { clamp, round } from '../utils/colorUtils';

export interface ColorWheelProps {
  hsva: HSVA;
  onChange: (hsva: HSVA) => void;
  onChangeComplete?: (hsva: HSVA) => void;
  disabled?: boolean;
  className?: string;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  hsva,
  onChange,
  onChangeComplete,
  disabled = false,
  className = '',
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();

      const wheel = wheelRef.current;
      if (!wheel) return;

      const rect = wheel.getBoundingClientRect();
      const radius = rect.width / 2;
      const centerX = rect.left + radius;
      const centerY = rect.top + radius;

      const updatePosition = (clientX: number, clientY: number) => {
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sat = clamp(round((dist / radius) * 100, 1), 0, 100);

        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;

        const nextHsva: HSVA = {
          ...hsva,
          h: round(angle, 1),
          s: sat,
        };
        onChange(nextHsva);
        return nextHsva;
      };

      const initial = updatePosition(e.clientX, e.clientY);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        updatePosition(moveEvent.clientX, moveEvent.clientY);
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        const finalHsva = updatePosition(upEvent.clientX, upEvent.clientY) || initial;
        onChangeComplete?.(finalHsva);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [disabled, hsva, onChange, onChangeComplete]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const step = e.shiftKey ? 10 : 1;
      let newH = hsva.h;
      let newS = hsva.s;
      let handled = false;

      switch (e.key) {
        case 'ArrowLeft':
          newH = (hsva.h - step + 360) % 360;
          handled = true;
          break;
        case 'ArrowRight':
          newH = (hsva.h + step) % 360;
          handled = true;
          break;
        case 'ArrowUp':
          newS = clamp(hsva.s + step, 0, 100);
          handled = true;
          break;
        case 'ArrowDown':
          newS = clamp(hsva.s - step, 0, 100);
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        const next: HSVA = { ...hsva, h: newH, s: newS };
        onChange(next);
        onChangeComplete?.(next);
      }
    },
    [disabled, hsva, onChange, onChangeComplete]
  );

  // Map polar (h, s) to Cartesian percentage
  const rad = (hsva.h * Math.PI) / 180;
  const distPercent = (hsva.s / 100) * 46; // max 46% radius so thumb stays within border
  const thumbX = 50 + distPercent * Math.cos(rad);
  const thumbY = 50 + distPercent * Math.sin(rad);

  return (
    <div className="flex flex-col items-center justify-center w-full py-1">
      <div
        ref={wheelRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Color wheel hue and saturation"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsva.h)}
        aria-valuetext={`Hue ${Math.round(hsva.h)} degrees, Saturation ${Math.round(hsva.s)}%`}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        className={`relative w-44 h-44 rounded-full border border-white/20 shadow-2xl cursor-crosshair overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
        style={{
          background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        }}
      >
        {/* Radial neutral saturation mask */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at center, #ffffff 0%, rgba(255, 255, 255, 0.4) 45%, transparent 100%)',
          }}
        />

        {/* Reticle grid */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black/10 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-black/10 pointer-events-none" />

        {/* Draggable Double-Ring Thumb Indicator */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white bg-violet-600 outline outline-1 outline-black/80 shadow-lg shadow-violet-500/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-75"
          style={{
            left: `${thumbX}%`,
            top: `${thumbY}%`,
            backgroundColor: `hsl(${Math.round(hsva.h)}, ${Math.round(hsva.s)}%, ${Math.round(hsva.v)}%)`,
          }}
        />
      </div>
    </div>
  );
};
