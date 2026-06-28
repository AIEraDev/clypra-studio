import React, { useState, useEffect, useRef } from "react";
import { EffectGraph, EffectEngine, GraphDefinition } from "@clypra/engine/videoEffects";

export const EffectGraphSandbox: React.FC = () => {
  const [activePreset, setActivePreset] = useState<string>("glitch-split");
  const [playhead, setPlayhead] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [execOrder, setExecOrder] = useState<string[]>([]);
  const [renderTime, setRenderTime] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const engineRef = useRef<EffectEngine>(new EffectEngine());

  // Define Preset Graph definitions
  const PRESET_GRAPHS: Record<string, GraphDefinition> = {
    "glitch-split": {
      schemaVersion: "2.0.0",
      graphId: "graph-glitch-split",
      name: "Glitch & RGB Split Distortion",
      nodes: [
        { id: "node-1", type: "source", params: {} },
        { id: "node-2", type: "glitch", params: { glitchIntensity: 45, sliceCount: 12 } },
        { id: "node-3", type: "vignette", params: { radius: 0.75 } }
      ],
      connections: [
        { fromNode: "node-1", fromOutput: "output", toNode: "node-2", toInput: "input" },
        { fromNode: "node-2", fromOutput: "output", toNode: "node-3", toInput: "input" }
      ]
    },
    "grain-vignette": {
      schemaVersion: "2.0.0",
      graphId: "graph-grain-vignette",
      name: "Film Grain & Vignette Retro",
      nodes: [
        { id: "node-a", type: "source", params: {} },
        { id: "node-b", type: "film_grain", params: { grainIntensity: 0.8, grainSize: 2 } },
        { id: "node-c", type: "vignette", params: { radius: 0.6 } }
      ],
      connections: [
        { fromNode: "node-a", fromOutput: "output", toNode: "node-b", toInput: "input" },
        { fromNode: "node-b", fromOutput: "output", toNode: "node-c", toInput: "input" }
      ]
    },
    "pixelate-glow": {
      schemaVersion: "2.0.0",
      graphId: "graph-pixelate-glow",
      name: "Pixelate & Bloom Glow",
      nodes: [
        { id: "node-x", type: "source", params: {} },
        { id: "node-y", type: "pixelate", params: { pixelSize: 12 } },
        { id: "node-z", type: "glow", params: { glowAmount: 15, glowColor: "#7C6FFF" } }
      ],
      connections: [
        { fromNode: "node-x", fromOutput: "output", toNode: "node-y", toInput: "input" },
        { fromNode: "node-y", fromOutput: "output", toNode: "node-z", toInput: "input" }
      ]
    }
  };

  // Compile and draw frame
  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Create a mock media input (colored bars with text)
    const mockSource = document.createElement("canvas");
    mockSource.width = w;
    mockSource.height = h;
    const mockCtx = mockSource.getContext("2d")!;
    
    // Draw background grid
    const gradient = mockCtx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#1F1F2E");
    gradient.addColorStop(0.5, "#0D0D14");
    gradient.addColorStop(1, "#181824");
    mockCtx.fillStyle = gradient;
    mockCtx.fillRect(0, 0, w, h);

    // Draw reference shapes
    mockCtx.fillStyle = "#FF3366";
    mockCtx.beginPath();
    mockCtx.arc(w / 3, h / 2, 70, 0, Math.PI * 2);
    mockCtx.fill();

    mockCtx.fillStyle = "#33CC99";
    mockCtx.fillRect(w * 0.55, h / 3, 130, 130);

    // Draw moving reference shape (time dependent)
    const pulse = Math.sin(playhead * Math.PI) * 50 + 80;
    mockCtx.fillStyle = "#7C6FFF";
    mockCtx.beginPath();
    mockCtx.arc(w / 2 + Math.cos(playhead * 2) * 100, h / 2 + Math.sin(playhead * 2) * 50, pulse / 2, 0, Math.PI * 2);
    mockCtx.fill();

    // Text label
    mockCtx.fillStyle = "#FFFFFF";
    mockCtx.font = "900 48px Inter, sans-serif";
    mockCtx.textAlign = "center";
    mockCtx.fillText("CLYPRA GRAPH ENGINE", w / 2, h / 2 + 15);

    // Render using new Effect Engine
    const startTime = performance.now();
    try {
      engineRef.current.render(ctx, playhead, mockSource);
    } catch (e) {
      console.error(e);
    }
    const duration = performance.now() - startTime;
    setRenderTime(duration);
  };

  // Track state and reload graph when preset changes
  useEffect(() => {
    const definition = PRESET_GRAPHS[activePreset];
    const graph = new EffectGraph(definition);
    engineRef.current.loadGraph(graph);
    setExecOrder(graph.getExecutionOrder());
    drawFrame();
  }, [activePreset]);

  // Redraw when playhead/timeline moves
  useEffect(() => {
    drawFrame();
  }, [playhead]);

  // Timeline loop playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();
    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      setPlayhead((prev) => (prev + delta) % 5.0);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-screen bg-[#0E0E12] text-[#F3F4F6]">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-[#14141A] border-b md:border-b-0 md:border-r border-[#22222E] p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white mb-1">Effect Graph Sandbox</h2>
          <p className="text-xs text-gray-400">Visually test node graph composition directly in the web browser.</p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Select Graph Preset</label>
          <div className="flex flex-col gap-1.5">
            {Object.entries(PRESET_GRAPHS).map(([key, def]) => (
              <button
                key={key}
                onClick={() => setActivePreset(key)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  activePreset === key
                    ? "bg-[#7C6FFF]/15 border-[#7C6FFF] text-white"
                    : "bg-[#1E1E24]/40 border-[#22222E] text-gray-400 hover:text-white hover:border-[#3A3A4A]"
                }`}
              >
                {def.name}
              </button>
            ))}
          </div>
        </div>

        {/* Execution Order Trace */}
        <div className="flex flex-col gap-2 bg-[#1E1E24]/60 rounded-xl p-4 border border-[#22222E]">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Graph Execution Order</label>
          <div className="flex flex-col gap-2">
            {execOrder.map((nodeId, idx) => {
              const node = PRESET_GRAPHS[activePreset].nodes.find((n) => n.id === nodeId);
              return (
                <div key={nodeId} className="flex items-center gap-2.5 text-xs text-gray-300">
                  <span className="w-5 h-5 rounded-full bg-[#2E2E3E] text-gray-400 font-semibold flex items-center justify-center border border-[#3A3A4A]">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">{nodeId}</span>
                    <span className="text-[10px] text-[#7C6FFF] uppercase font-bold">{node?.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetry */}
        <div className="flex flex-col gap-1 bg-[#1E1E24]/60 rounded-xl p-4 border border-[#22222E] text-xs">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Metrics</label>
          <div className="flex justify-between py-1 border-b border-[#22222E]">
            <span className="text-gray-400">Node Count</span>
            <span className="font-semibold text-white">{PRESET_GRAPHS[activePreset].nodes.length}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#22222E]">
            <span className="text-gray-400">Connections</span>
            <span className="font-semibold text-white">{PRESET_GRAPHS[activePreset].connections.length}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-400">Render (GPU/CPU)</span>
            <span className="font-semibold text-[#33CC99]">{renderTime.toFixed(2)} ms</span>
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#09090D] overflow-hidden">
        {/* Canvas frame */}
        <div className="relative aspect-video w-full max-w-3xl bg-[#14141A] rounded-2xl overflow-hidden border border-[#22222E] shadow-2xl flex items-center justify-center mb-6">
          <canvas ref={canvasRef} width={854} height={480} className="w-full h-full object-contain" />
        </div>

        {/* Controls Bar */}
        <div className="w-full max-w-3xl bg-[#14141A] rounded-xl border border-[#22222E] p-4 flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-lg bg-[#7C6FFF] hover:bg-[#685AE6] text-white flex items-center justify-center transition-colors focus:outline-none"
          >
            {isPlaying ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
              <span>Timeline (t)</span>
              <span className="text-white">{playhead.toFixed(2)}s / 5.00s</span>
            </div>
            <input
              type="range"
              min={0}
              max={5.0}
              step={0.01}
              value={playhead}
              onChange={(e) => {
                setIsPlaying(false);
                setPlayhead(parseFloat(e.target.value));
              }}
              className="w-full accent-[#7C6FFF] bg-[#22222E] rounded-lg h-2 appearance-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => window.location.href = "/studio"}
            className="px-4 py-2 bg-[#22222E] hover:bg-[#2C2C3A] text-xs font-semibold uppercase tracking-wider text-white rounded-lg transition-colors border border-[#3A3A4A]"
          >
            Exit to Editor
          </button>
        </div>
      </div>
    </div>
  );
};
