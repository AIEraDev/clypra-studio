import React, { useState } from "react";

export interface StudioControlPanelProps {
  onExportTrigger: (fps: number, bitrate: number) => void;
  onAudioUpload: (file: File) => void;
  onSavePreset?: () => void;
  onLoadPreset?: (jsonStr: string) => void;
  isExporting: boolean;
  exportProgress: number;
}

export const StudioControlPanel: React.FC<StudioControlPanelProps> = ({
  onExportTrigger,
  onAudioUpload,
  onSavePreset,
  onLoadPreset,
  isExporting,
  exportProgress,
}) => {
  const [fps, setFps] = useState<number>(60);
  const [bitrate, setBitrate] = useState<number>(15000000);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 18px",
        background: "#0F172A",
        borderBottom: "1px solid #1E293B",
        userSelect: "none",
      }}
    >
      {/* Audio Ingestion & Preset Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <label
          style={{
            padding: "6px 12px",
            background: "#334155",
            color: "#F8FAFC",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          Load Audio Track
          <input
            type="file"
            accept="audio/*"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && onAudioUpload(e.target.files[0])}
          />
        </label>

        {onSavePreset && (
          <button
            onClick={onSavePreset}
            style={{
              padding: "6px 12px",
              background: "#1E293B",
              color: "#94A3B8",
              border: "1px solid #334155",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Export .VEFX Preset
          </button>
        )}

        {onLoadPreset && (
          <label
            style={{
              padding: "6px 12px",
              background: "#1E293B",
              color: "#94A3B8",
              border: "1px solid #334155",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Import .VEFX
            <input
              type="file"
              accept=".vefx,.json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    if (evt.target?.result) onLoadPreset(evt.target.result as string);
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>
        )}
      </div>

      {/* Render & Export Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <select
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
          style={{ background: "#1E293B", color: "#FFF", border: "1px solid #334155", padding: "6px", borderRadius: "4px", fontSize: "12px" }}
        >
          <option value={30}>30 FPS</option>
          <option value={60}>60 FPS</option>
          <option value={120}>120 FPS</option>
          <option value={144}>144 FPS</option>
        </select>

        <select
          value={bitrate}
          onChange={(e) => setBitrate(Number(e.target.value))}
          style={{ background: "#1E293B", color: "#FFF", border: "1px solid #334155", padding: "6px", borderRadius: "4px", fontSize: "12px" }}
        >
          <option value={8000000}>8 Mbps (Standard)</option>
          <option value={15000000}>15 Mbps (High Quality)</option>
          <option value={50000000}>50 Mbps (Mastering)</option>
        </select>

        <button
          onClick={() => onExportTrigger(fps, bitrate)}
          disabled={isExporting}
          style={{
            padding: "6px 16px",
            background: isExporting ? "#475569" : "#2563EB",
            color: "#FFF",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "12px",
            cursor: isExporting ? "not-allowed" : "pointer",
          }}
        >
          {isExporting ? `Exporting (${(exportProgress * 100).toFixed(0)}%)` : "Render MP4"}
        </button>
      </div>
    </div>
  );
};
