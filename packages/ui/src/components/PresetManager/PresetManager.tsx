/**
 * PresetManager Component
 *
 * Create, load, save, and manage effect presets.
 * Supports preset library, export/import JSON.
 */

import React, { useState } from "react";

export interface Preset {
  id: string;
  name: string;
  description?: string;
  effectId: string;
  parameters: Record<string, any>;
  version: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface PresetManagerProps {
  /** Current effect being edited */
  effect: {
    id: string;
    name: string;
    version: string;
  };
  /** Current parameter values */
  parameters: Record<string, any>;
  /** Available presets for this effect */
  presets?: Preset[];
  /** Callback when preset is loaded */
  onLoadPreset?: (preset: Preset) => void;
  /** Callback when preset is saved */
  onSavePreset?: (preset: Preset) => void;
  /** Callback when preset is deleted */
  onDeletePreset?: (presetId: string) => void;
  /** Callback when preset is exported */
  onExportPreset?: (preset: Preset) => void;
  /** Callback when preset is imported */
  onImportPreset?: (preset: Preset) => void;
}

export function PresetManager({ effect, parameters, presets = [], onLoadPreset, onSavePreset, onDeletePreset, onExportPreset, onImportPreset }: PresetManagerProps) {
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Get all unique tags from presets
  const allTags = Array.from(new Set(presets.flatMap((p) => p.tags || []))).sort();

  // Filter presets by search query and tag
  const filteredPresets = presets.filter((preset) => {
    const matchesSearch = searchQuery === "" || preset.name.toLowerCase().includes(searchQuery.toLowerCase()) || preset.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = filterTag === null || (preset.tags && preset.tags.includes(filterTag));

    return matchesSearch && matchesTag;
  });

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) return;

    const newPreset: Preset = {
      id: `preset-${Date.now()}`,
      name: newPresetName,
      description: newPresetDescription,
      effectId: effect.id,
      parameters: { ...parameters },
      version: effect.version,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };

    onSavePreset?.(newPreset);
    setIsCreating(false);
    setNewPresetName("");
    setNewPresetDescription("");
  };

  const handleLoadPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    onLoadPreset?.(preset);
  };

  const handleExportJSON = (preset: Preset) => {
    const json = JSON.stringify(preset, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onExportPreset?.(preset);
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      try {
        const preset = JSON.parse(text) as Preset;
        onImportPreset?.(preset);
      } catch (error) {
        console.error("Failed to import preset:", error);
        alert("Invalid preset file");
      }
    };
    input.click();
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "#0f172a",
        borderRadius: "8px",
        border: "1px solid #334155",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "16px" }}>Preset Manager</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: "6px 12px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            + New Preset
          </button>
          <button
            onClick={handleImportJSON}
            style={{
              padding: "6px 12px",
              background: "#475569",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Import
          </button>
        </div>
      </div>

      {/* Effect info */}
      <div
        style={{
          marginBottom: "16px",
          padding: "12px",
          background: "#1e293b",
          borderRadius: "6px",
          fontSize: "14px",
          color: "#94a3b8",
        }}
      >
        <div>
          <strong style={{ color: "#f1f5f9" }}>Effect:</strong> {effect.name}
        </div>
        <div>
          <strong style={{ color: "#f1f5f9" }}>Version:</strong> {effect.version}
        </div>
      </div>

      {/* Create preset form */}
      {isCreating && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            background: "#1e293b",
            borderRadius: "6px",
            border: "2px solid #3b82f6",
          }}
        >
          <input
            type="text"
            placeholder="Preset name"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "4px",
              color: "#f1f5f9",
              fontSize: "14px",
            }}
          />
          <textarea
            placeholder="Description (optional)"
            value={newPresetDescription}
            onChange={(e) => setNewPresetDescription(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "4px",
              color: "#f1f5f9",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleCreatePreset}
              disabled={!newPresetName.trim()}
              style={{
                flex: 1,
                padding: "8px",
                background: newPresetName.trim() ? "#10b981" : "#334155",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: newPresetName.trim() ? "pointer" : "not-allowed",
                fontSize: "14px",
              }}
            >
              Save Preset
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewPresetName("");
                setNewPresetDescription("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                background: "#475569",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search and filter */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search presets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "8px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            color: "#f1f5f9",
            fontSize: "14px",
          }}
        />
        {allTags.length > 0 && (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button
              onClick={() => setFilterTag(null)}
              style={{
                padding: "4px 10px",
                background: filterTag === null ? "#3b82f6" : "#334155",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                style={{
                  padding: "4px 10px",
                  background: filterTag === tag ? "#3b82f6" : "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preset library */}
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        {filteredPresets.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {presets.length === 0 ? "No presets yet. Create your first preset!" : "No presets match your search"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                style={{
                  padding: "12px",
                  background: selectedPreset?.id === preset.id ? "#1e40af" : "#1e293b",
                  border: selectedPreset?.id === preset.id ? "2px solid #3b82f6" : "1px solid #334155",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={() => handleLoadPreset(preset)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    marginBottom: "6px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#f1f5f9",
                        marginBottom: "4px",
                      }}
                    >
                      {preset.name}
                    </div>
                    {preset.description && <div style={{ fontSize: "13px", color: "#94a3b8" }}>{preset.description}</div>}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleExportJSON(preset)}
                      title="Export as JSON"
                      style={{
                        padding: "4px 8px",
                        background: "#475569",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => onDeletePreset?.(preset.id)}
                      title="Delete preset"
                      style={{
                        padding: "4px 8px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Updated: {new Date(preset.updatedAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
