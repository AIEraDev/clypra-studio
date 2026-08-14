/**
 * Clypra Multi-Stop Gradient Studio Component
 * Supports Linear, Radial, Conic gradients with interactive stops, angle dial, and Oklab interpolation.
 */

import React, { useRef, useCallback, useMemo } from 'react';
import type { GradientValue, GradientStop, GradientType, GradientInterpolation } from '../types/color';
import { clamp, round } from '../utils/colorUtils';

export interface GradientEditorProps {
  gradient: GradientValue;
  onChange: (gradient: GradientValue) => void;
  activeStopId: string;
  onSelectStop: (stopId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function generateCssGradient(gradient: GradientValue): string {
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const stopStrings = sortedStops.map((s) => `${s.color} ${Math.round(s.position * 100)}%`).join(', ');

  switch (gradient.type) {
    case 'linear':
      return `linear-gradient(${gradient.angle}deg, ${stopStrings})`;
    case 'radial':
      return `radial-gradient(circle at center, ${stopStrings})`;
    case 'conic':
      return `conic-gradient(from ${gradient.angle}deg at center, ${stopStrings})`;
  }
}

export const GradientEditor: React.FC<GradientEditorProps> = ({
  gradient,
  onChange,
  activeStopId,
  onSelectStop,
  disabled = false,
  className = '',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const cssGradientPreview = useMemo(() => {
    return generateCssGradient(gradient);
  }, [gradient]);

  // Add stop on track click
  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const pos = clamp((e.clientX - rect.left) / rect.width, 0, 1);

      const newStop: GradientStop = {
        id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        position: round(pos, 3),
        color: '#FFFFFF',
      };

      const nextStops = [...gradient.stops, newStop].sort((a, b) => a.position - b.position);
      onChange({
        ...gradient,
        stops: nextStops,
      });
      onSelectStop(newStop.id);
    },
    [disabled, gradient, onChange, onSelectStop]
  );

  // Drag stop handle
  const handleStopPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, stopId: string) => {
      if (disabled) return;
      e.stopPropagation();
      e.preventDefault();

      onSelectStop(stopId);

      const target = e.currentTarget;
      if ('setPointerCapture' in target) {
        try {
          target.setPointerCapture(e.pointerId);
        } catch {}
      }

      const initialY = e.clientY;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const track = trackRef.current;
        if (!track) return;

        const rect = track.getBoundingClientRect();
        const newPos = clamp((moveEvent.clientX - rect.left) / rect.width, 0, 1);

        // If dragged down far enough (>40px), delete stop if more than 2 stops exist
        const verticalDelta = moveEvent.clientY - initialY;
        if (verticalDelta > 40 && gradient.stops.length > 2) {
          const remaining = gradient.stops.filter((s) => s.id !== stopId);
          onChange({
            ...gradient,
            stops: remaining,
          });
          window.removeEventListener('pointermove', handlePointerMove);
          window.removeEventListener('pointerup', handlePointerUp);
          return;
        }

        const updatedStops = gradient.stops.map((s) =>
          s.id === stopId ? { ...s, position: round(newPos, 3) } : s
        );

        onChange({
          ...gradient,
          stops: updatedStops,
        });
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [disabled, gradient, onChange, onSelectStop]
  );

  const setType = (type: GradientType) => {
    onChange({ ...gradient, type });
  };

  const setInterpolation = (interpolation: GradientInterpolation) => {
    onChange({ ...gradient, interpolation });
  };

  const setAngle = (angle: number) => {
    onChange({ ...gradient, angle: clamp(angle, 0, 360) });
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Type Selector (Linear, Radial, Conic) */}
      <div className="flex items-center justify-between gap-1 p-0.5 bg-zinc-900/80 rounded-lg border border-white/5">
        {(['linear', 'radial', 'conic'] as const).map((t) => (
          <button
            key={t}
            type="button"
            disabled={disabled}
            onClick={() => setType(t)}
            className={`flex-1 py-1 text-[11px] font-medium uppercase tracking-wider rounded-md transition-all ${
              gradient.type === t
                ? 'bg-violet-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Visual Live Gradient Preview Surface */}
      <div
        className="w-full h-20 rounded-lg border border-white/15 overflow-hidden shadow-inner relative clypra-checkerboard"
      >
        <div
          className="absolute inset-0 w-full h-full"
          style={{ background: cssGradientPreview }}
        />
      </div>

      {/* Multi-Stop Interactive Track */}
      <div className="flex flex-col gap-1.5 pt-1 pb-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>Stops (Click track to add, drag down to delete)</span>
          <span>{gradient.stops.length} stops</span>
        </div>

        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="clypra-checkerboard relative w-full h-5 rounded-md border border-white/20 cursor-crosshair shadow-inner"
        >
          <div
            className="absolute inset-0 w-full h-full rounded-md"
            style={{
              background: `linear-gradient(to right, ${[...gradient.stops]
                .sort((a, b) => a.position - b.position)
                .map((s) => `${s.color} ${Math.round(s.position * 100)}%`)
                .join(', ')})`,
            }}
          />

          {/* Draggable Stop Handles */}
          {gradient.stops.map((stop) => {
            const isActive = stop.id === activeStopId;
            return (
              <button
                key={stop.id}
                type="button"
                disabled={disabled}
                onPointerDown={(e) => handleStopPointerDown(e, stop.id)}
                title={`Stop: ${Math.round(stop.position * 100)}% - ${stop.color}`}
                aria-label={`Gradient stop at ${Math.round(stop.position * 100)} percent`}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-6 rounded-sm border-2 transition-transform cursor-ew-resize focus-visible:outline-none ${
                  isActive
                    ? 'border-violet-400 scale-110 shadow-lg shadow-violet-500/50 z-20'
                    : 'border-white/80 z-10'
                }`}
                style={{
                  left: `${stop.position * 100}%`,
                  backgroundColor: stop.color,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Gradient Angle & Interpolation Row */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
        {gradient.type !== 'radial' && (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[11px] font-medium text-zinc-400">Angle:</span>
            <input
              type="range"
              min={0}
              max={360}
              disabled={disabled}
              value={gradient.angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="flex-1 accent-violet-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-zinc-300 w-9 text-right">{gradient.angle}°</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Space:</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setInterpolation(gradient.interpolation === 'oklab' ? 'srgb' : 'oklab')}
            className="px-2 py-0.5 text-[10px] uppercase font-mono font-medium rounded bg-zinc-900 border border-white/10 text-violet-400 hover:bg-zinc-800"
          >
            {gradient.interpolation}
          </button>
        </div>
      </div>
    </div>
  );
};
