import React, { useEffect, useRef, useState, useCallback } from "react";
import type { KeyframePoint } from "@clypra-studio/types";
import { PlaybackEngine } from "@clypra-studio/runtime";
import { MultiKeyframeGraphEditor } from "./MultiKeyframeGraphEditor";

interface VideoEditorInspectorProps {
  device?: GPUDevice;
}

export const VideoEditorInspector: React.FC<VideoEditorInspectorProps> = ({ device }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PlaybackEngine | null>(null);

  const [keyframes, setKeyframes] = useState<KeyframePoint[]>([
    {
      id: "kf_1",
      time: 0.0,
      value: 0.0,
      easing: "cubic-bezier",
      handleMode: "aligned",
      handleOut: { dt: 0.5, dv: 0.0 },
    },
    {
      id: "kf_2",
      time: 2.0,
      value: 1.5,
      easing: "cubic-bezier",
      handleMode: "aligned",
      handleIn: { dt: -0.5, dv: 0.0 },
      handleOut: { dt: 0.5, dv: 0.0 },
    },
    {
      id: "kf_3",
      time: 4.0,
      value: 0.5,
      easing: "linear",
    },
  ]);

  const [currentTimeDisplay, setCurrentTimeDisplay] = useState(0);

  useEffect(() => {
    if (!device) return;

    const engine = new PlaybackEngine(device);
    engine.updateTrackKeyframes("u_saturation", keyframes);

    engine.setRenderCallback((time) => {
      setCurrentTimeDisplay(time);
    });

    engineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, [device]);

  const handleCurveChange = useCallback((updatedKeyframes: KeyframePoint[]) => {
    setKeyframes(updatedKeyframes);
    if (engineRef.current) {
      engineRef.current.updateTrackKeyframes("u_saturation", updatedKeyframes);
    }
  }, []);

  return (
    <div style={{ display: "flex", gap: "24px", background: "#090D16", padding: "24px", color: "#FFF" }}>
      <div style={{ flex: 1 }}>
        <MultiKeyframeGraphEditor
          keyframes={keyframes}
          onChange={handleCurveChange}
          currentTime={currentTimeDisplay}
          width={720}
          height={360}
        />

        <div style={{ marginTop: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => engineRef.current?.start()}
            style={{ padding: "8px 16px", background: "#2563EB", color: "#FFF", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Play
          </button>
          <button
            onClick={() => engineRef.current?.stop()}
            style={{ padding: "8px 16px", background: "#374151", color: "#FFF", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Pause
          </button>
          <button
            onClick={() => engineRef.current?.seek(0)}
            style={{ padding: "8px 16px", background: "#374151", color: "#FFF", border: "none", borderRadius: "6px", cursor: "pointer" }}
          >
            Reset
          </button>
          <span style={{ fontFamily: "monospace", fontSize: "12px", marginLeft: "auto" }}>
            {currentTimeDisplay.toFixed(2)}s
          </span>
        </div>
      </div>

      <div style={{ width: "320px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#000", borderRadius: "12px" }}>
        <canvas ref={canvasRef} width={320} height={180} style={{ width: "100%", height: "auto", borderRadius: "8px" }} />
      </div>
    </div>
  );
};
