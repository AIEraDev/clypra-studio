/**
 * Clypra Color Trigger Button Component
 * Swatch trigger with checkerboard background, size variants, and accessible dialog invoker semantics.
 */

import React from 'react';
import type { ColorSize } from '../types/color';

export interface ColorTriggerProps {
  color: string;
  isOpen: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: ColorSize;
  label?: string;
  className?: string;
  showValue?: boolean;
}

const SIZE_STYLES: Record<ColorSize, { button: string; swatch: string; text: string }> = {
  sm: {
    button: 'h-7 px-2 gap-1.5 text-xs',
    swatch: 'w-4 h-4 rounded-sm',
    text: 'text-xs',
  },
  md: {
    button: 'h-9 px-2.5 gap-2 text-sm',
    swatch: 'w-5 h-5 rounded-md',
    text: 'text-xs font-mono',
  },
  lg: {
    button: 'h-11 px-3 gap-2.5 text-base',
    swatch: 'w-6 h-6 rounded-md',
    text: 'text-sm font-mono',
  },
};

export const ColorTrigger = React.forwardRef<HTMLButtonElement, ColorTriggerProps>(
  (
    {
      color,
      isOpen,
      onClick,
      disabled = false,
      size = 'md',
      label,
      className = '',
      showValue = true,
    },
    ref
  ) => {
    const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.md;

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={label ? `${label}: ${color}` : `Choose color, current: ${color}`}
        onClick={onClick}
        className={`group relative inline-flex items-center justify-between bg-zinc-900/90 hover:bg-zinc-800/90 active:bg-zinc-950 border border-white/10 hover:border-white/20 rounded-lg text-zinc-200 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 shadow-sm ${
          sizeConfig.button
        } ${isOpen ? 'ring-2 ring-violet-500/50 border-violet-500/50' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          {/* Swatch with checkerboard backplate */}
          <div
            className={`clypra-checkerboard-sm relative border border-white/20 overflow-hidden shadow-inner flex-shrink-0 ${sizeConfig.swatch}`}
          >
            <div
              className="clypra-live-preview absolute inset-0 w-full h-full"
              style={{ backgroundColor: color }}
            />
          </div>

          {/* Label or Value */}
          {label && <span className="font-medium text-zinc-300 truncate max-w-[120px]">{label}</span>}
          {showValue && <span className={`text-zinc-400 font-mono uppercase ${sizeConfig.text}`}>{color}</span>}
        </div>

        {/* Subtle Chevron / Indicator */}
        <svg
          className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-violet-400' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);

ColorTrigger.displayName = 'ColorTrigger';
