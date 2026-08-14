/**
 * Clypra 3-Way Video Color Grading Wheels Component
 * Professional Lift (Shadows), Gamma (Midtones), Gain (Highlights) wheels with master luminance controls.
 */

import React, { useRef, useCallback } from 'react';
import type { ThreeWayColorGrading, WheelColorGrading } from '../types/color';
import { clamp, round } from '../utils/colorUtils';

export interface ColorGradingWheelsProps {
  grading?: ThreeWayColorGrading;
  onChange: (grading: ThreeWayColorGrading) => void;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_GRADING: ThreeWayColorGrading = {
  lift: { h: 0, s: 0, luminance: 0 },
  gamma: { h: 0, s: 0, luminance: 0 },
  gain: { h: 0, s: 0, luminance: 0 },
};

interface SingleWheelProps {
  title: string;
  value: WheelColorGrading;
  onChange: (value: WheelColorGrading) => void;
  disabled?: boolean;
}

const SingleGradingWheel: React.FC<SingleWheelProps> = ({
  title,
  value,
  onChange,
  disabled = false,
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

      const updateFromPointer = (clientX: number, clientY: number) => {
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sat = clamp(round((dist / radius) * 100, 1), 0, 100);

        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;

        onChange({
          ...value,
          h: round(angle, 1),
          s: sat,
        });
      };

      updateFromPointer(e.clientX, e.clientY);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        updateFromPointer(moveEvent.clientX, moveEvent.clientY);
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [disabled, onChange, value]
  );

  const handleLuminanceChange = (lum: number) => {
    onChange({ ...value, luminance: clamp(lum, -100, 100) });
  };

  const handleReset = () => {
    onChange({ h: 0, s: 0, luminance: 0 });
  };

  // Convert polar (h, s) to Cartesian (x, y) relative to 50% center
  const rad = (value.h * Math.PI) / 180;
  const distPercent = (value.s / 100) * 45; // Max 45% radius
  const thumbX = 50 + distPercent * Math.cos(rad);
  const thumbY = 50 + distPercent * Math.sin(rad);

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[85px]">
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">{title}</span>
        {(value.s > 0 || value.luminance !== 0) && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleReset}
            className="text-[9px] text-zinc-500 hover:text-violet-400 uppercase"
            title="Reset Wheel"
          >
            Reset
          </button>
        )}
      </div>

      {/* Circular Chromatic Color Wheel */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        className={`relative w-20 h-20 rounded-full border border-white/20 shadow-inner cursor-crosshair overflow-hidden ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        }}
      >
        {/* Radial neutral desaturation mask overlay (white/neutral center) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at center, #18181b 0%, rgba(24, 24, 27, 0.4) 60%, transparent 100%)',
          }}
        />

        {/* Center reticle crosshair */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/15 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/15 pointer-events-none" />

        {/* Draggable Thumb Indicator */}
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white bg-violet-500 shadow-md shadow-violet-500/50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${thumbX}%`,
            top: `${thumbY}%`,
          }}
        />
      </div>

      {/* Master Luminance Slider */}
      <div className="flex flex-col items-center w-full gap-0.5 pt-1">
        <input
          type="range"
          min={-100}
          max={100}
          disabled={disabled}
          value={value.luminance}
          onChange={(e) => handleLuminanceChange(Number(e.target.value))}
          className="w-full accent-violet-500 h-1 bg-zinc-800 rounded cursor-pointer"
          title={`Luminance: ${value.luminance}`}
          aria-label={`${title} luminance offset`}
        />
        <div className="flex justify-between w-full text-[9px] font-mono text-zinc-500">
          <span>-</span>
          <span className="text-zinc-300">{value.luminance > 0 ? `+${value.luminance}` : value.luminance}</span>
          <span>+</span>
        </div>
      </div>
    </div>
  );
};

export const ColorGradingWheels: React.FC<ColorGradingWheelsProps> = ({
  grading = DEFAULT_GRADING,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between gap-2 p-2 bg-zinc-900/60 border border-white/10 rounded-lg ${className}`}>
      <SingleGradingWheel
        title="Lift"
        value={grading.lift}
        onChange={(lift) => onChange({ ...grading, lift })}
        disabled={disabled}
      />
      <SingleGradingWheel
        title="Gamma"
        value={grading.gamma}
        onChange={(gamma) => onChange({ ...grading, gamma })}
        disabled={disabled}
      />
      <SingleGradingWheel
        title="Gain"
        value={grading.gain}
        onChange={(gain) => onChange({ ...grading, gain })}
        disabled={disabled}
      />
    </div>
  );
};
