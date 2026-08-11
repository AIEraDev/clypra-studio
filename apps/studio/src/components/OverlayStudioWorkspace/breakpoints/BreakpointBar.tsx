import React, { useState, useRef, useEffect } from "react";
import { Monitor, Smartphone, Square, Plus, X, Check } from "lucide-react";
import type { OverlayDocument, Breakpoint, DocumentCommand } from "@clypra-studio/engine";

interface BreakpointBarProps {
  doc: OverlayDocument;
  activeBreakpointId: string | null;
  onExecuteCommand: (cmd: DocumentCommand) => void;
  onSetActive: (id: string | null) => void;
}

const PRESET_BREAKPOINTS: Omit<Breakpoint, "id">[] = [
  { label: "Portrait", canvas: { width: 1080, height: 1920 }, description: "Mobile / Reels 9:16" },
  { label: "Square", canvas: { width: 1080, height: 1080 }, description: "Instagram 1:1" },
  { label: "4:5", canvas: { width: 1080, height: 1350 }, description: "Instagram 4:5" },
];

function bpIcon(label: string, size = 12) {
  const l = label.toLowerCase();
  if (l.includes("portrait") || l.includes("mobile") || l.includes("reels") || l.includes("9:16")) {
    return <Smartphone size={size} />;
  }
  if (l.includes("square") || l.includes("1:1")) {
    return <Square size={size} />;
  }
  return <Monitor size={size} />;
}

function nanoid6(): string {
  return Math.random().toString(36).slice(2, 8);
}

export const BreakpointBar: React.FC<BreakpointBarProps> = ({
  doc,
  activeBreakpointId,
  onExecuteCommand,
  onSetActive,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newWidth, setNewWidth] = useState("1080");
  const [newHeight, setNewHeight] = useState("1920");
  const addRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showAdd) return;
    const handler = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setShowAdd(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAdd]);

  const breakpoints = doc.breakpoints?.breakpoints ?? [];

  function handleAddPreset(preset: Omit<Breakpoint, "id">) {
    const bp: Breakpoint = { ...preset, id: `bp-${nanoid6()}` };
    onExecuteCommand({ type: "ADD_BREAKPOINT", breakpoint: bp });
    onSetActive(bp.id);
    setShowAdd(false);
  }

  function handleAddCustom() {
    const w = parseInt(newWidth, 10);
    const h = parseInt(newHeight, 10);
    if (!newLabel.trim() || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    const bp: Breakpoint = {
      id: `bp-${nanoid6()}`,
      label: newLabel.trim(),
      canvas: { width: w, height: h },
    };
    onExecuteCommand({ type: "ADD_BREAKPOINT", breakpoint: bp });
    onSetActive(bp.id);
    setNewLabel("");
    setNewWidth("1080");
    setNewHeight("1920");
    setShowAdd(false);
  }

  function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (activeBreakpointId === id) onSetActive(null);
    onExecuteCommand({ type: "REMOVE_BREAKPOINT", breakpointId: id });
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 12px",
        background: "#0C0C11",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        minHeight: 36,
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Base / canonical */}
      <button
        onClick={() => onSetActive(null)}
        title="Base layout (canonical)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          borderRadius: 6,
          border: activeBreakpointId === null
            ? "1px solid rgba(124,111,255,0.5)"
            : "1px solid rgba(255,255,255,0.06)",
          background: activeBreakpointId === null
            ? "rgba(124,111,255,0.12)"
            : "rgba(255,255,255,0.03)",
          color: activeBreakpointId === null ? "#A78BFA" : "#6B7280",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s",
          fontFamily: "inherit",
        }}
      >
        <Monitor size={11} />
        <span>Base</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>
          {doc.canvas.width}×{doc.canvas.height}
        </span>
      </button>

      {/* Separator */}
      {breakpoints.length > 0 && (
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
      )}

      {/* Defined breakpoints */}
      {breakpoints.map((bp) => {
        const isActive = activeBreakpointId === bp.id;
        return (
          <div key={bp.id} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <button
              onClick={() => onSetActive(isActive ? null : bp.id)}
              title={bp.description ?? `${bp.canvas.width}×${bp.canvas.height}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 8px 3px 10px",
                paddingRight: 26,
                borderRadius: 6,
                border: isActive
                  ? "1px solid rgba(124,111,255,0.5)"
                  : "1px solid rgba(255,255,255,0.06)",
                background: isActive
                  ? "rgba(124,111,255,0.12)"
                  : "rgba(255,255,255,0.03)",
                color: isActive ? "#A78BFA" : "#6B7280",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "inherit",
                position: "relative",
              }}
            >
              {bpIcon(bp.label)}
              <span>{bp.label}</span>
              <span style={{ fontSize: 9, opacity: 0.55 }}>
                {bp.canvas.width}×{bp.canvas.height}
              </span>
            </button>
            {/* Remove × */}
            <button
              onClick={(e) => handleRemove(bp.id, e)}
              title={`Remove ${bp.label} breakpoint`}
              style={{
                position: "absolute",
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 14,
                height: 14,
                borderRadius: 3,
                border: "none",
                background: "transparent",
                color: "#4B5563",
                cursor: "pointer",
                padding: 0,
                transition: "color 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4B5563")}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}

      {/* Add breakpoint button */}
      <div ref={addRef} style={{ position: "relative" }}>
        <button
          onClick={() => setShowAdd((v) => !v)}
          title="Add breakpoint"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 6,
            border: "1px dashed rgba(255,255,255,0.12)",
            background: "transparent",
            color: "#4B5563",
            cursor: "pointer",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#A78BFA";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,111,255,0.4)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#4B5563";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
          }}
        >
          <Plus size={12} />
        </button>

        {showAdd && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              width: 240,
              background: "#151519",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              padding: "10px 0",
              zIndex: 1000,
            }}
          >
            {/* Presets */}
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#4B5563",
                padding: "0 12px 6px",
              }}
            >
              Presets
            </div>
            {PRESET_BREAKPOINTS.map((preset, i) => (
              <button
                key={i}
                onClick={() => handleAddPreset(preset)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 12px",
                  background: "transparent",
                  border: "none",
                  color: "#D1D5DB",
                  fontSize: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {bpIcon(preset.label)}
                <span style={{ flex: 1 }}>{preset.label}</span>
                <span style={{ fontSize: 10, color: "#6B7280" }}>
                  {preset.canvas.width}×{preset.canvas.height}
                </span>
              </button>
            ))}

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />

            {/* Custom */}
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#4B5563",
                padding: "0 12px 6px",
              }}
            >
              Custom
            </div>
            <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              <input
                placeholder="Label (e.g. Tablet)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                style={{
                  background: "#0F0F14",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "5px 8px",
                  color: "#E5E7EB",
                  fontSize: 11,
                  outline: "none",
                  fontFamily: "inherit",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  placeholder="Width"
                  value={newWidth}
                  onChange={(e) => setNewWidth(e.target.value)}
                  type="number"
                  min={1}
                  style={{
                    flex: 1,
                    background: "#0F0F14",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    padding: "5px 8px",
                    color: "#E5E7EB",
                    fontSize: 11,
                    outline: "none",
                    fontFamily: "inherit",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ color: "#4B5563", lineHeight: "28px", fontSize: 11 }}>×</span>
                <input
                  placeholder="Height"
                  value={newHeight}
                  onChange={(e) => setNewHeight(e.target.value)}
                  type="number"
                  min={1}
                  style={{
                    flex: 1,
                    background: "#0F0F14",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6,
                    padding: "5px 8px",
                    color: "#E5E7EB",
                    fontSize: 11,
                    outline: "none",
                    fontFamily: "inherit",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                onClick={handleAddCustom}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: "6px",
                  background: "rgba(124,111,255,0.15)",
                  border: "1px solid rgba(124,111,255,0.35)",
                  borderRadius: 6,
                  color: "#A78BFA",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,111,255,0.25)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(124,111,255,0.15)")}
              >
                <Check size={11} />
                Add Breakpoint
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active breakpoint badge */}
      {activeBreakpointId && (() => {
        const bp = breakpoints.find((b) => b.id === activeBreakpointId);
        if (!bp) return null;
        return (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(234,179,8,0.08)",
              border: "1px solid rgba(234,179,8,0.2)",
              color: "#CA8A04",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {bpIcon(bp.label, 10)}
            <span>Viewing: {bp.label} {bp.canvas.width}×{bp.canvas.height}</span>
          </div>
        );
      })()}
    </div>
  );
};
