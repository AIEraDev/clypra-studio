import React, { useState, useEffect, useRef } from "react";
import { ClypraColorPicker } from "@clypra/ui-color-picker";
import { Copy, Check, Pipette } from "lucide-react";

export interface ControlColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showInput?: boolean;
  size?: "sm" | "md";
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ControlColorPicker({
  value,
  onChange,
  label,
  showInput = true,
  size = "sm",
  className = "",
  placeholder = "#FFFFFF",
  disabled = false,
}: ControlColorPickerProps) {
  const safeValue =
    value && value.startsWith("#") ? value : value || "#FFFFFF";
  const [localText, setLocalText] = useState(safeValue);
  const [copied, setCopied] = useState(false);
  const isTypingRef = useRef(false);

  // Keep local input in sync when value changes externally (e.g. from preset or undo/redo)
  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalText(safeValue);
    }
  }, [safeValue]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(safeValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Fallback
    }
  };

  const handleColorChange = (newColor: string) => {
    setLocalText(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);
    isTypingRef.current = true;

    // Normalize and validate hex format
    let val = raw.trim();
    if (!val.startsWith("#") && /^[0-9a-fA-F]{3,8}$/.test(val)) {
      val = `#${val}`;
    }
    if (
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
        val,
      )
    ) {
      onChange(val);
    }
  };

  const handleInputBlur = () => {
    isTypingRef.current = false;
    let val = localText.trim();
    if (!val.startsWith("#") && /^[0-9a-fA-F]{3,8}$/.test(val)) {
      val = `#${val}`;
    }
    if (
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
        val,
      )
    ) {
      setLocalText(val);
      onChange(val);
    } else {
      // Revert invalid input to safe value
      setLocalText(safeValue);
    }
  };

  const canUseEyeDropper =
    typeof window !== "undefined" && "EyeDropper" in window;

  const handleEyeDropper = async () => {
    if (!canUseEyeDropper) return;
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        handleColorChange(result.sRGBHex);
      }
    } catch {
      // User cancelled
    }
  };

  // Swatch-only mode (for tight layout spaces like gradient stop bars, multi-color rows)
  if (!showInput) {
    return (
      <div className={`inline-flex shrink-0 ${className}`}>
        <ClypraColorPicker
          value={safeValue}
          onChange={handleColorChange}
          onChangeComplete={handleColorChange}
          size={size}
          placement="left-start"
          disabled={disabled}
          showTriggerValue={false}
          showChevron={false}
          triggerClassName="clypra-swatch-trigger w-6 h-6 rounded border border-white/20 hover:border-white/40 shadow-sm transition-all hover:scale-105 cursor-pointer bg-[#121218] p-0 overflow-hidden"
        />
      </div>
    );
  }

  // Full unified professional Studio Color input row
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label className="text-[9px] uppercase font-mono text-clypra-muted block truncate">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2 w-full">
        {/* Swatch button */}
        <div className="relative shrink-0 flex items-center">
          <ClypraColorPicker
            value={safeValue}
            onChange={handleColorChange}
            onChangeComplete={handleColorChange}
            size={size}
            placement="left-start"
            disabled={disabled}
            showTriggerValue={false}
            showChevron={false}
            triggerClassName="clypra-swatch-trigger w-7.5 h-7.5 rounded-md border border-white/20 hover:border-white/40 shadow-sm transition-transform hover:scale-105 cursor-pointer bg-[#121218] p-0 overflow-hidden"
          />
        </div>

        {/* Unified Hex input field with actions */}
        <div className="flex-1 min-w-0 flex items-center bg-[#121218] border border-clypra-border/80 hover:border-[#3D3D4E] focus-within:border-[#7C6FFF] focus-within:ring-1 focus-within:ring-[#7C6FFF]/30 rounded-lg px-2 h-7.5 transition-all">
          <input
            type="text"
            value={localText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-w-0 bg-transparent text-[10px] font-mono text-white tracking-wider uppercase outline-none placeholder:text-gray-600"
            spellCheck={false}
          />
          <div className="flex items-center gap-0.5 ml-1 shrink-0">
            {canUseEyeDropper && (
              <button
                type="button"
                onClick={handleEyeDropper}
                disabled={disabled}
                title="Sample screen color"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Pipette size={11} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              disabled={disabled}
              title={copied ? "Copied!" : "Copy Hex"}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check size={11} className="text-emerald-400" />
              ) : (
                <Copy size={11} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

