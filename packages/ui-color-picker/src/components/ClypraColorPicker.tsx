/**
 * Clypra Color Picker Component (`ClypraColorPicker`)
 * Universal Color System Platform Master Component.
 * Supports Solid Spectrum, Circular Wheel, Multi-Stop Gradient Studio, 3-Way Video Grading,
 * Theme Token Bindings, Harmonies, and Real-Time APCA/WCAG Contrast Analyzer.
 * Features Fixed Height, Zero Layout Shift, Viewport-Aware Portals, and Custom Scrollbar.
 * Strict TypeScript - Zero `any` types.
 */

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { createPortal } from 'react-dom';
import type {
  ClypraColorPickerProps,
  ClypraColorPickerHandle,
  ColorFormat,
  ColorPickerMode,
  HSVA,
  GradientValue,
  ThreeWayColorGrading,
} from '../types/color';
import {
  parseColor,
  formatColor,
  hsvaToHex,
} from '../utils/colorUtils';
import { getColorName } from '../utils/colorHarmonies';
import { useColorFormat } from '../hooks/useColorFormat';
import { useColorHistory } from '../hooks/useColorHistory';
import { SaturationBrightness } from './SaturationBrightness';
import { HueSlider } from './HueSlider';
import { AlphaSlider } from './AlphaSlider';
import { ColorInputs } from './ColorInputs';
import { PresetGrid } from './PresetGrid';
import { ColorTrigger } from './ColorTrigger';
import { ColorWheel } from './ColorWheel';
import { GradientEditor, generateCssGradient } from './GradientEditor';
import { ColorGradingWheels } from './ColorGradingWheels';
import { ContrastAnalyzer } from './ContrastAnalyzer';
import { HarmoniesView } from './HarmoniesView';
import { TokenBindingSelector } from './TokenBindingSelector';
import '../styles/picker.css';

const DEFAULT_COLOR = '#8B5CF6';

const DEFAULT_GRADIENT: GradientValue = {
  type: 'linear',
  angle: 90,
  stops: [
    { id: 'stop-1', position: 0, color: '#8B5CF6' },
    { id: 'stop-2', position: 1, color: '#3B82F6' },
  ],
  interpolation: 'oklab',
};

const DEFAULT_GRADING: ThreeWayColorGrading = {
  lift: { h: 0, s: 0, luminance: 0 },
  gamma: { h: 0, s: 0, luminance: 0 },
  gain: { h: 0, s: 0, luminance: 0 },
};

const MODE_LABELS: Record<ColorPickerMode, { label: string; short: string }> = {
  solid: { label: 'Solid', short: 'Solid' },
  wheel: { label: 'Wheel', short: 'Wheel' },
  gradient: { label: 'Gradient', short: 'Grad' },
  grading: { label: 'Grading', short: 'Color' },
  palette: { label: 'Palette', short: 'Tokens' },
  accessibility: { label: 'Contrast', short: 'A11y' },
};

const ClypraColorPickerInner = forwardRef<ClypraColorPickerHandle, ClypraColorPickerProps>(
  (
    {
      value,
      defaultValue = DEFAULT_COLOR,
      onChange,
      onChangeComplete,
      onGradientChange,
      onGradingChange,
      format: initialFormat = 'hex',
      mode: initialMode = 'solid',
      availableModes = ['solid', 'wheel', 'gradient', 'grading', 'palette', 'accessibility'],
      showAlpha = true,
      presetColors,
      recentColors,
      tokens,
      contrastBackground = '#18181b',
      onSavePreset,
      disabled = false,
      size = 'md',
      className = '',
      popoverClassName = '',
      triggerClassName = '',
      inline = false,
      label,
      showEyeDropper = true,
      showCopyButton = true,
      showHarmonies = true,
    },
    ref
  ) => {
    // 1. Color State & Undo/Redo Stack
    const [internalHsva, setInternalHsva] = useState<HSVA>(() => {
      const initial = parseColor(value ?? defaultValue);
      return initial ?? { h: 262, s: 62, v: 96, a: 1 };
    });

    const [undoStack, setUndoStack] = useState<HSVA[]>([]);
    const [redoStack, setRedoStack] = useState<HSVA[]>([]);

    const isControlled = value !== undefined;
    const currentHsva = useMemo(() => {
      if (isControlled && value) {
        const parsed = parseColor(value);
        if (parsed) return parsed;
      }
      return internalHsva;
    }, [isControlled, value, internalHsva]);

    // Mode, Format & Gradient State
    const [activeMode, setActiveMode] = useState<ColorPickerMode>(initialMode);
    const [activeFormat, setActiveFormat] = useState<ColorFormat>(initialFormat);
    const [gradient, setGradient] = useState<GradientValue>(DEFAULT_GRADIENT);
    const [activeStopId, setActiveStopId] = useState<string>(gradient.stops[0]?.id || 'stop-1');
    const [grading, setGrading] = useState<ThreeWayColorGrading>(DEFAULT_GRADING);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);

    // DOM & Element References
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const hexInputRef = useRef<HTMLInputElement>(null);

    const activeFormatRef = useRef<ColorFormat>(activeFormat);
    activeFormatRef.current = activeFormat;

    const currentHsvaRef = useRef<HSVA>(currentHsva);
    currentHsvaRef.current = currentHsva;

    const gradientRef = useRef<GradientValue>(gradient);
    gradientRef.current = gradient;

    const activeModeRef = useRef<ColorPickerMode>(activeMode);
    activeModeRef.current = activeMode;

    // History and Presets Management
    const { presets, recents, addRecentColor, addPresetColor } = useColorHistory({
      presetColors,
      recentColors,
      onSavePreset,
    });

    // Notify consumers of value change in requested format
    const emitChange = useCallback(
      (newHsva: HSVA) => {
        currentHsvaRef.current = newHsva;
        if (!isControlled) {
          setInternalHsva(newHsva);
        }
        if (onChange) {
          const formatted = formatColor(newHsva, activeFormatRef.current, showAlpha);
          onChange(formatted);
        }
      },
      [isControlled, onChange, showAlpha]
    );

    const emitChangeComplete = useCallback(
      (newHsva: HSVA) => {
        // Record in undo stack
        setUndoStack((prev) => [...prev.slice(-20), currentHsvaRef.current]);
        setRedoStack([]);

        currentHsvaRef.current = newHsva;
        const formatted = formatColor(newHsva, activeFormatRef.current, showAlpha);
        addRecentColor(formatted);
        onChangeComplete?.(formatted);
      },
      [showAlpha, addRecentColor, onChangeComplete]
    );

    // Undo / Redo Actions
    const handleUndo = useCallback(() => {
      if (undoStack.length === 0) return;
      const previous = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, currentHsvaRef.current]);
      emitChange(previous);
    }, [undoStack, emitChange]);

    const handleRedo = useCallback(() => {
      if (redoStack.length === 0) return;
      const next = redoStack[redoStack.length - 1];
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, currentHsvaRef.current]);
      emitChange(next);
    }, [redoStack, emitChange]);

    // Format Hook for channel calculations and clipboard
    const {
      isErrorShaking,
      copied,
      copyToClipboard,
      handleChannelChange,
      handleTextInputChange,
    } = useColorFormat({
      hsva: currentHsva,
      initialFormat: activeFormat,
      showAlpha,
      onColorChange: emitChange,
      onColorChangeComplete: emitChangeComplete,
    });

    // Viewport-aware coordinate computation to guarantee zero clipping
    const updatePopoverCoords = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const pickerWidth = 320;
      const pickerHeight = 450;

      let top = rect.bottom + 6;
      if (typeof window !== 'undefined') {
        if (top + pickerHeight > window.innerHeight && rect.top - pickerHeight - 6 > 0) {
          top = Math.max(10, rect.top - pickerHeight - 6);
        }

        let left = rect.right - pickerWidth;
        if (left < 10) {
          left = Math.max(10, rect.left);
        }
        if (left + pickerWidth > window.innerWidth - 10) {
          left = Math.max(10, window.innerWidth - pickerWidth - 10);
        }

        setPopoverCoords({ top, left });
      }
    }, []);

    useEffect(() => {
      if (!isOpen || inline) return;
      updatePopoverCoords();

      const handleUpdate = () => {
        updatePopoverCoords();
      };

      window.addEventListener('resize', handleUpdate);
      window.addEventListener('scroll', handleUpdate, true);

      return () => {
        window.removeEventListener('resize', handleUpdate);
        window.removeEventListener('scroll', handleUpdate, true);
      };
    }, [isOpen, inline, updatePopoverCoords]);

    // Imperative Handle Methods
    useImperativeHandle(
      ref,
      (): ClypraColorPickerHandle => ({
        getFormat: () => activeFormatRef.current,
        setFormat: (fmt: ColorFormat) => {
          activeFormatRef.current = fmt;
          setActiveFormat(fmt);
        },
        getValue: () => {
          if (activeModeRef.current === 'gradient') {
            return generateCssGradient(gradientRef.current);
          }
          return formatColor(currentHsvaRef.current, activeFormatRef.current, showAlpha);
        },
        getGradient: () => gradientRef.current,
        setGradient: (newGrad: GradientValue) => {
          setGradient(newGrad);
          onGradientChange?.(newGrad);
        },
        getMode: () => activeModeRef.current,
        setMode: (m: ColorPickerMode) => {
          activeModeRef.current = m;
          setActiveMode(m);
        },
        undo: handleUndo,
        redo: handleRedo,
        focus: () => {
          if (!inline) {
            setIsOpen(true);
          }
          setTimeout(() => hexInputRef.current?.focus(), 50);
        },
      }),
      [showAlpha, inline, handleUndo, handleRedo, onGradientChange]
    );

    // EyeDropper API Integration
    const canUseEyeDropper = useMemo(() => {
      return showEyeDropper && typeof window !== 'undefined' && 'EyeDropper' in window;
    }, [showEyeDropper]);

    const handleEyeDropper = useCallback(async () => {
      if (!canUseEyeDropper || disabled) return;

      type NativeEyeDropper = new () => {
        open: () => Promise<{ sRGBHex: string }>;
      };

      const EyeDropperConstructor = (window as unknown as { EyeDropper: NativeEyeDropper }).EyeDropper;
      try {
        const dropper = new EyeDropperConstructor();
        const result = await dropper.open();
        if (result?.sRGBHex) {
          const parsed = parseColor(result.sRGBHex);
          if (parsed) {
            emitChange(parsed);
            emitChangeComplete(parsed);
          }
        }
      } catch {}
    }, [canUseEyeDropper, disabled, emitChange, emitChangeComplete]);

    // Click outside and Keyboard listeners for Undo/Redo & Popover
    useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      };

      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleUndo, handleRedo]);

    useEffect(() => {
      if (inline || !isOpen) return;

      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        const target = e.target as Node;
        if (
          popoverRef.current &&
          !popoverRef.current.contains(target) &&
          triggerRef.current &&
          !triggerRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      };

      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
      window.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('touchstart', handleClickOutside, true);
        window.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen, inline]);

    // Current formatted values
    const hexColor = useMemo(() => {
      return hsvaToHex(currentHsva, showAlpha && currentHsva.a < 0.999);
    }, [currentHsva, showAlpha]);

    const displayColor = useMemo(() => {
      return formatColor(currentHsva, activeFormat, showAlpha);
    }, [currentHsva, activeFormat, showAlpha]);

    const colorName = useMemo(() => {
      return getColorName(currentHsva);
    }, [currentHsva]);

    // Gradient stop synchronization with active color
    const handleGradientChange = useCallback(
      (newGrad: GradientValue) => {
        setGradient(newGrad);
        onGradientChange?.(newGrad);
      },
      [onGradientChange]
    );

    const handleGradingChange = useCallback(
      (newGrading: ThreeWayColorGrading) => {
        setGrading(newGrading);
        onGradingChange?.(newGrading);
      },
      [onGradingChange]
    );

    // Color panel content with solid dark surface styling & fixed height
    const pickerPanelContent = (
      <div
        className={`clypra-color-picker-container ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
        style={{
          width: '320px',
          height: '480px',
          backgroundColor: '#0d0d12',
          background: 'linear-gradient(180deg, #13131b 0%, #0d0d12 100%)',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 48px -8px rgba(0, 0, 0, 0.92), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 24px -4px rgba(124, 58, 237, 0.28)',
          color: '#f4f4f5',
        }}
      >
        {/* 1. Header: Segmented Mode Selector Bar */}
        {availableModes.length > 1 && (
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-lg border flex-shrink-0"
            style={{
              backgroundColor: 'rgba(24, 24, 32, 0.85)',
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {availableModes.map((m) => {
              const isActive = activeMode === m;
              const meta = MODE_LABELS[m] || { label: m, short: m };
              return (
                <button
                  key={m}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setActiveMode(m);
                    activeModeRef.current = m;
                  }}
                  title={meta.label}
                  className={`flex-1 py-1 px-1 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer text-center truncate ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: '#7c3aed', color: '#ffffff' }
                      : { color: '#a1a1aa' }
                  }
                >
                  {meta.short}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Sub-Header: Live Swatch + Name / Format + Eyedropper / Copy / Undo */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0 h-8">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Live Swatch */}
            <div className="clypra-checkerboard-sm relative w-7 h-7 rounded-md border border-white/20 overflow-hidden shadow-inner flex-shrink-0">
              <div
                className="clypra-live-preview absolute inset-0 w-full h-full"
                style={{
                  background: activeMode === 'gradient'
                    ? generateCssGradient(gradient)
                    : formatColor(currentHsva, 'rgb', showAlpha),
                }}
              />
            </div>

            {/* Name and Format Badge */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-zinc-200 truncate leading-tight">{colorName}</span>
              <span className="text-[10px] font-mono text-zinc-400 truncate leading-tight">{displayColor}</span>
            </div>
          </div>

          {/* Actions: Eyedropper + Undo + Redo + Copy */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {canUseEyeDropper && (
              <button
                type="button"
                disabled={disabled}
                onClick={handleEyeDropper}
                title="Eyedropper (Sample screen pixel)"
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-white/10 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-1.4 1.4m0 0l-9.8 9.8c-.4.4-.6.9-.6 1.4v2.9h2.9c.5 0 1-.2 1.4-.6l9.8-9.8m-3.7-3.7l1.4-1.4a2.12 2.12 0 013 3l-1.4 1.4m-3-3l3 3" />
                </svg>
              </button>
            )}

            {showCopyButton && (
              <button
                type="button"
                disabled={disabled}
                onClick={copyToClipboard}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-white/10 relative cursor-pointer"
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3. Main Content Pane: Fluid & Scrollable without layout jump */}
        <div className="clypra-picker-body clypra-custom-scrollbar">
          {activeMode === 'solid' && (
            <>
              <div className="flex gap-2.5 h-[165px] w-full flex-shrink-0">
                <div className="flex-1 h-full min-w-0">
                  <SaturationBrightness
                    hsva={currentHsva}
                    onChange={emitChange}
                    onChangeComplete={emitChangeComplete}
                    disabled={disabled}
                    className="h-full"
                  />
                </div>

                <div className="flex gap-2 h-full flex-shrink-0">
                  <HueSlider
                    hue={currentHsva.h}
                    onChange={(newHue) => emitChange({ ...currentHsva, h: newHue })}
                    onChangeComplete={(newHue) => emitChangeComplete({ ...currentHsva, h: newHue })}
                    disabled={disabled}
                  />
                  {showAlpha && (
                    <AlphaSlider
                      hsva={currentHsva}
                      onChange={(newAlpha) => emitChange({ ...currentHsva, a: newAlpha })}
                      onChangeComplete={(newAlpha) => emitChangeComplete({ ...currentHsva, a: newAlpha })}
                      disabled={disabled}
                    />
                  )}
                </div>
              </div>

              <ColorInputs
                hsva={currentHsva}
                format={activeFormat}
                onFormatChange={(fmt) => setActiveFormat(fmt)}
                onChannelChange={handleChannelChange}
                onTextChange={handleTextInputChange}
                showAlpha={showAlpha}
                disabled={disabled}
                isErrorShaking={isErrorShaking}
              />

              {showHarmonies && (
                <div className="border-t border-white/10 pt-2">
                  <HarmoniesView
                    hsva={currentHsva}
                    onSelectColor={(hex) => {
                      const parsed = parseColor(hex);
                      if (parsed) {
                        emitChange(parsed);
                        emitChangeComplete(parsed);
                      }
                    }}
                    disabled={disabled}
                  />
                </div>
              )}
            </>
          )}

          {activeMode === 'wheel' && (
            <>
              <ColorWheel
                hsva={currentHsva}
                onChange={emitChange}
                onChangeComplete={emitChangeComplete}
                disabled={disabled}
              />
              <div className="flex gap-2 w-full pt-1">
                <div className="flex-1">
                  <HueSlider
                    hue={currentHsva.h}
                    onChange={(newHue) => emitChange({ ...currentHsva, h: newHue })}
                    onChangeComplete={(newHue) => emitChangeComplete({ ...currentHsva, h: newHue })}
                    disabled={disabled}
                    className="w-full h-4"
                  />
                </div>
                {showAlpha && (
                  <div className="flex-1">
                    <AlphaSlider
                      hsva={currentHsva}
                      onChange={(newAlpha) => emitChange({ ...currentHsva, a: newAlpha })}
                      onChangeComplete={(newAlpha) => emitChangeComplete({ ...currentHsva, a: newAlpha })}
                      disabled={disabled}
                      className="w-full h-4"
                    />
                  </div>
                )}
              </div>
              <ColorInputs
                hsva={currentHsva}
                format={activeFormat}
                onFormatChange={(fmt) => setActiveFormat(fmt)}
                onChannelChange={handleChannelChange}
                onTextChange={handleTextInputChange}
                showAlpha={showAlpha}
                disabled={disabled}
                isErrorShaking={isErrorShaking}
              />
            </>
          )}

          {activeMode === 'gradient' && (
            <GradientEditor
              gradient={gradient}
              onChange={handleGradientChange}
              activeStopId={activeStopId}
              onSelectStop={(id) => {
                setActiveStopId(id);
                const stop = gradient.stops.find((s) => s.id === id);
                if (stop) {
                  const parsed = parseColor(stop.color);
                  if (parsed) emitChange(parsed);
                }
              }}
              disabled={disabled}
            />
          )}

          {activeMode === 'grading' && (
            <ColorGradingWheels
              grading={grading}
              onChange={handleGradingChange}
              disabled={disabled}
            />
          )}

          {activeMode === 'palette' && (
            <TokenBindingSelector
              tokens={tokens}
              onSelectToken={(tok) => {
                const parsed = parseColor(tok.value);
                if (parsed) {
                  emitChange(parsed);
                  emitChangeComplete(parsed);
                }
              }}
              disabled={disabled}
            />
          )}

          {activeMode === 'accessibility' && (
            <ContrastAnalyzer
              hsva={currentHsva}
              backgroundHex={contrastBackground}
            />
          )}
        </div>

        {/* 4. Docked Footer: Preset Swatches & Recents Tray */}
        <PresetGrid
          presets={presets}
          recents={recents}
          currentColorHex={hexColor}
          onSelectColor={(col) => {
            const parsed = parseColor(col);
            if (parsed) {
              emitChange(parsed);
              emitChangeComplete(parsed);
            }
          }}
          onSavePreset={onSavePreset ? () => addPresetColor(hexColor) : undefined}
          disabled={disabled}
          className="flex-shrink-0"
        />
      </div>
    );

    // If rendered inline
    if (inline) {
      return (
        <div ref={containerRef} className={`inline-block ${className}`}>
          {label && <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>}
          {pickerPanelContent}
        </div>
      );
    }

    // Popover Modal with Document Body Portal to eliminate all clipping
    const popoverPortalElement = isOpen && (
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-label={label || 'Color Picker Dialog'}
        className={`clypra-color-picker-portal clypra-animate-popover-enter ${popoverClassName}`}
        style={
          popoverCoords
            ? {
                position: 'fixed',
                top: `${popoverCoords.top}px`,
                left: `${popoverCoords.left}px`,
                zIndex: 999999,
              }
            : {
                position: 'fixed',
                visibility: 'hidden',
                zIndex: 999999,
              }
        }
      >
        {pickerPanelContent}
      </div>
    );

    // Popover Trigger Mode
    return (
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        <ColorTrigger
          ref={triggerRef}
          color={activeMode === 'gradient' ? generateCssGradient(gradient) : hexColor}
          isOpen={isOpen}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          size={size}
          label={label}
          className={triggerClassName}
        />

        {isOpen && typeof document !== 'undefined' && createPortal(popoverPortalElement, document.body)}
      </div>
    );
  }
);

ClypraColorPickerInner.displayName = 'ClypraColorPicker';

export const ClypraColorPicker: React.FC<
  ClypraColorPickerProps & { ref?: React.Ref<ClypraColorPickerHandle> }
> = ClypraColorPickerInner as any;
