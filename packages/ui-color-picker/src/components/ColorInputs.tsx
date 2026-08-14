/**
 * Clypra Color Inputs & Format Selector Component
 * Pill-style format toggles, channel number fields, hex input, and error animation feedback.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { ColorFormat, HSVA } from '../types/color';
import { getChannelsFromHsva } from '../utils/colorValidation';

export interface ColorInputsProps {
  hsva: HSVA;
  format: ColorFormat;
  onFormatChange: (format: ColorFormat) => void;
  onChannelChange: (key: string, value: string | number) => boolean;
  onTextChange: (text: string) => boolean;
  showAlpha?: boolean;
  disabled?: boolean;
  isErrorShaking?: boolean;
}

const FORMAT_OPTIONS: ColorFormat[] = ['hex', 'rgb', 'hsl', 'hsv'];

export const ColorInputs: React.FC<ColorInputsProps> = ({
  hsva,
  format,
  onFormatChange,
  onChannelChange,
  onTextChange,
  showAlpha = true,
  disabled = false,
  isErrorShaking = false,
}) => {
  const [localText, setLocalText] = useState<string>('');
  const [localChannels, setLocalChannels] = useState<Record<string, string>>({});

  // Sync internal state when HSVA or format changes
  useEffect(() => {
    const channels = getChannelsFromHsva(hsva, format);
    const channelStrings: Record<string, string> = {};
    Object.entries(channels).forEach(([k, v]) => {
      channelStrings[k] = String(v);
    });
    setLocalChannels(channelStrings);

    // Format Hex string
    if (format === 'hex') {
      const cleanHex = hsva.a < 1 && showAlpha
        ? undefined
        : undefined;
      void cleanHex;
    }
  }, [hsva, format, showAlpha]);

  const handleChannelInputChange = (key: string, val: string) => {
    setLocalChannels((prev) => ({ ...prev, [key]: val }));
  };

  const handleChannelBlur = (key: string) => {
    const val = localChannels[key];
    if (val !== undefined) {
      const success = onChannelChange(key, val);
      if (!success) {
        // Revert to current prop state on failed validation
        const channels = getChannelsFromHsva(hsva, format);
        setLocalChannels((prev) => ({ ...prev, [key]: String(channels[key]) }));
      }
    }
  };

  const handleChannelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, key: string) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleHexBlur = () => {
    if (localText.trim()) {
      const success = onTextChange(localText);
      if (!success) {
        setLocalText('');
      }
    }
  };

  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`flex flex-col gap-2.5 w-full ${isErrorShaking ? 'clypra-animate-shake' : ''}`}>
      {/* Format Toggle Pill Tabs */}
      <div className="flex items-center justify-between gap-1 p-0.5 bg-zinc-900/80 rounded-lg border border-white/5">
        <div className="flex items-center gap-1 w-full" role="tablist" aria-label="Color format tabs">
          {FORMAT_OPTIONS.map((fmt) => {
            const isActive = format === fmt;
            return (
              <button
                key={fmt}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={disabled}
                onClick={() => onFormatChange(fmt)}
                className={`flex-1 py-1 px-2 text-xs font-medium uppercase tracking-wider rounded-md transition-all duration-150 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {fmt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs per Format */}
      <div className="flex items-center gap-2">
        {format === 'hex' && (
          <>
            <div className="flex-1 relative">
              <input
                type="text"
                disabled={disabled}
                placeholder={showAlpha && hsva.a < 1 ? '#RRGGBBAA' : '#RRGGBB'}
                value={localText !== '' ? localText : undefined}
                defaultValue={localText === '' ? undefined : undefined}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={handleHexBlur}
                onKeyDown={handleHexKeyDown}
                className="w-full bg-zinc-900 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 font-mono tracking-wide focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all placeholder:text-zinc-600"
                aria-label="Hex color value"
              />
            </div>
            {showAlpha && (
              <div className="w-16 flex flex-col items-center">
                <div className="relative w-full">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={disabled}
                    value={localChannels.a ?? Math.round(hsva.a * 100)}
                    onChange={(e) => handleChannelInputChange('a', e.target.value)}
                    onBlur={() => handleChannelBlur('a')}
                    onKeyDown={(e) => handleChannelKeyDown(e, 'a')}
                    className="w-full bg-zinc-900 border border-white/10 rounded-md px-1.5 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                    aria-label="Alpha percentage"
                  />
                  <span className="absolute right-1.5 top-1.5 text-[10px] text-zinc-500 pointer-events-none">%</span>
                </div>
              </div>
            )}
          </>
        )}

        {format === 'rgb' && (
          <div className="grid grid-cols-4 gap-1.5 w-full">
            {(['r', 'g', 'b'] as const).map((ch) => (
              <div key={ch} className="flex flex-col items-center gap-0.5">
                <input
                  type="number"
                  min={0}
                  max={255}
                  disabled={disabled}
                  value={localChannels[ch] ?? ''}
                  onChange={(e) => handleChannelInputChange(ch, e.target.value)}
                  onBlur={() => handleChannelBlur(ch)}
                  onKeyDown={(e) => handleChannelKeyDown(e, ch)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  aria-label={`RGB ${ch.toUpperCase()} channel`}
                />
                <span className="text-[10px] uppercase font-medium text-zinc-500">{ch}</span>
              </div>
            ))}
            {showAlpha ? (
              <div className="flex flex-col items-center gap-0.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={disabled}
                  value={localChannels.a ?? ''}
                  onChange={(e) => handleChannelInputChange('a', e.target.value)}
                  onBlur={() => handleChannelBlur('a')}
                  onKeyDown={(e) => handleChannelKeyDown(e, 'a')}
                  className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  aria-label="Alpha percentage"
                />
                <span className="text-[10px] uppercase font-medium text-zinc-500">A (%)</span>
              </div>
            ) : null}
          </div>
        )}

        {format === 'hsl' && (
          <div className="grid grid-cols-4 gap-1.5 w-full">
            <div className="flex flex-col items-center gap-0.5">
              <input
                type="number"
                min={0}
                max={360}
                disabled={disabled}
                value={localChannels.h ?? ''}
                onChange={(e) => handleChannelInputChange('h', e.target.value)}
                onBlur={() => handleChannelBlur('h')}
                onKeyDown={(e) => handleChannelKeyDown(e, 'h')}
                className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                aria-label="HSL Hue channel"
              />
              <span className="text-[10px] uppercase font-medium text-zinc-500">H (°)</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <input
                type="number"
                min={0}
                max={100}
                disabled={disabled}
                value={localChannels.s ?? ''}
                onChange={(e) => handleChannelInputChange('s', e.target.value)}
                onBlur={() => handleChannelBlur('s')}
                onKeyDown={(e) => handleChannelKeyDown(e, 's')}
                className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                aria-label="HSL Saturation channel"
              />
              <span className="text-[10px] uppercase font-medium text-zinc-500">S (%)</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <input
                type="number"
                min={0}
                max={100}
                disabled={disabled}
                value={localChannels.l ?? ''}
                onChange={(e) => handleChannelInputChange('l', e.target.value)}
                onBlur={() => handleChannelBlur('l')}
                onKeyDown={(e) => handleChannelKeyDown(e, 'l')}
                className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                aria-label="HSL Lightness channel"
              />
              <span className="text-[10px] uppercase font-medium text-zinc-500">L (%)</span>
            </div>
            {showAlpha && (
              <div className="flex flex-col items-center gap-0.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={disabled}
                  value={localChannels.a ?? ''}
                  onChange={(e) => handleChannelInputChange('a', e.target.value)}
                  onBlur={() => handleChannelBlur('a')}
                  onKeyDown={(e) => handleChannelKeyDown(e, 'a')}
                  className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  aria-label="Alpha percentage"
                />
                <span className="text-[10px] uppercase font-medium text-zinc-500">A (%)</span>
              </div>
            )}
          </div>
        )}

        {format === 'hsv' && (
          <div className="grid grid-cols-4 gap-1.5 w-full">
            <div className="flex flex-col items-center gap-0.5">
              <input
                type="number"
                min={0}
                max={360}
                disabled={disabled}
                value={localChannels.h ?? ''}
                onChange={(e) => handleChannelInputChange('h', e.target.value)}
                onBlur={() => handleChannelBlur('h')}
                onKeyDown={(e) => handleChannelKeyDown(e, 'h')}
                className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                aria-label="HSV Hue channel"
              />
              <span className="text-[10px] uppercase font-medium text-zinc-500">H (°)</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <input
                type="number"
                min={0}
                max={100}
                disabled={disabled}
                value={localChannels.s ?? ''}
                onChange={(e) => handleChannelInputChange('s', e.target.value)}
                onBlur={() => handleChannelBlur('s')}
                onKeyDown={(e) => handleChannelKeyDown(e, 's')}
                className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                aria-label="HSV Saturation channel"
              />
              <span className="text-[10px] uppercase font-medium text-zinc-500">S (%)</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <input
                type="number"
                min={0}
                max={100}
                disabled={disabled}
                value={localChannels.v ?? ''}
                onChange={(e) => handleChannelInputChange('v', e.target.value)}
                onBlur={() => handleChannelBlur('v')}
                onKeyDown={(e) => handleChannelKeyDown(e, 'v')}
                className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                aria-label="HSV Value channel"
              />
              <span className="text-[10px] uppercase font-medium text-zinc-500">V (%)</span>
            </div>
            {showAlpha && (
              <div className="flex flex-col items-center gap-0.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={disabled}
                  value={localChannels.a ?? ''}
                  onChange={(e) => handleChannelInputChange('a', e.target.value)}
                  onBlur={() => handleChannelBlur('a')}
                  onKeyDown={(e) => handleChannelKeyDown(e, 'a')}
                  className="w-full bg-zinc-900 border border-white/10 rounded-md px-1 py-1.5 text-xs text-center text-zinc-100 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  aria-label="Alpha percentage"
                />
                <span className="text-[10px] uppercase font-medium text-zinc-500">A (%)</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
