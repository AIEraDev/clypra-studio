import React, { useState, useEffect, useRef, useCallback } from "react";
import type { KeyframePoint, EngineTelemetryStats, NodeGraph } from "@clypra-studio/types";
import {
  VefxPresetManager,
  WGSLGraphCompiler,
  MultiKeyframeEvaluator,
  createSaturationNode,
  createVignetteNode,
} from "@clypra-studio/runtime";
import { StudioControlPanel } from "../StudioControlPanel";
import { StudioDiagnosticsOverlay } from "../StudioDiagnosticsOverlay";
import { MultiKeyframeGraphEditor } from "../MultiKeyframeGraphEditor";

export const StudioMasterApp: React.FC<{ device?: GPUDevice }> = ({ device: externalDevice }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [device, setDevice] = useState<GPUDevice | undefined>(externalDevice);
  const [mediaType, setMediaType] = useState<"video" | "image" | "fallback">("fallback");
  const [mediaName, setMediaName] = useState<string>("Procedural Test Bar");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [keyframes, setKeyframes] = useState<KeyframePoint[]>([
    { id: "kf_1", time: 0.0, value: 0.2, easing: "cubic-bezier", handleMode: "aligned", handleOut: { dt: 0.5, dv: 0.0 } },
    { id: "kf_2", time: 2.0, value: 2.2, easing: "cubic-bezier", handleMode: "aligned", handleIn: { dt: -0.5, dv: 0.0 }, handleOut: { dt: 0.5, dv: 0.0 } },
    { id: "kf_3", time: 4.0, value: 0.8, easing: "linear" },
  ]);

  const [currentTime, setCurrentTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [stats, setStats] = useState<EngineTelemetryStats>({
    uiFps: 144,
    gpuFrameTimeMs: 2.4,
    workerQueueLatencyMs: 0.8,
    activeUniformBytes: 256,
  });

  const evaluatorRef = useRef(new MultiKeyframeEvaluator());

  // WebGPU pipeline references
  const pipelineRef = useRef<GPURenderPipeline | null>(null);
  const uniformBufferRef = useRef<GPUBuffer | null>(null);
  const bindGroupRef = useRef<GPUBindGroup | null>(null);
  const samplerRef = useRef<GPUSampler | null>(null);
  const textureRef = useRef<GPUTexture | null>(null);

  // Initialize WebGPU if not provided externally
  useEffect(() => {
    if (!device && typeof navigator !== "undefined" && navigator.gpu) {
      navigator.gpu
        .requestAdapter()
        .then((adapter) => adapter?.requestDevice())
        .then((gpuDevice) => {
          if (gpuDevice) setDevice(gpuDevice);
        })
        .catch((err) => console.warn("WebGPU initialization fallback:", err));
    }
  }, [device]);

  // Create procedural fallback test pattern canvas
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Color bars
      const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF", "#FFFFFF", "#111827"];
      const colWidth = 640 / colors.length;
      colors.forEach((col, idx) => {
        ctx.fillStyle = col;
        ctx.fillRect(idx * colWidth, 0, colWidth, 240);
      });

      // Gradient bar below
      const grad = ctx.createLinearGradient(0, 240, 640, 360);
      grad.addColorStop(0, "#0F172A");
      grad.addColorStop(0.5, "#3B82F6");
      grad.addColorStop(1, "#EC4899");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 240, 640, 120);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px monospace";
      ctx.fillText("CLYPRA WEBGPU MEDIA ENGINE", 160, 300);
    }
    fallbackCanvasRef.current = canvas;
  }, []);

  // Initialize WebGPU Render Pipeline when device and canvas are ready
  useEffect(() => {
    if (!device || !canvasRef.current) return;

    try {
      const gpuContext = canvasRef.current.getContext("webgpu") as GPUCanvasContext;
      if (!gpuContext) return;

      gpuContext.configure({
        device,
        format: "bgra8unorm",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
      });

      // Compile Shader Graph: Saturation + Vignette
      const satNode = createSaturationNode("sat_01", 1.0);
      const vigNode = createVignetteNode("vig_01", 0.4);

      const graph: NodeGraph = {
        nodes: [satNode, vigNode],
        connections: [
          { fromNodeId: "sat_01", fromPinId: "outColor", toNodeId: "vig_01", toPinId: "inColor" },
        ],
        outputNodeId: "vig_01",
      };

      const compiler = new WGSLGraphCompiler();
      const compiled = compiler.compile(graph);

      const shaderModule = device.createShaderModule({
        label: "Studio Composite Shader",
        code: compiled.wgslCode,
      });

      const sampler = device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
      });
      samplerRef.current = sampler;

      // 16-byte aligned Uniform Buffer: time, u_sat_01_amount, u_vig_01_radius, padding
      const uniformBuffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      uniformBufferRef.current = uniformBuffer;

      // Create 2D texture from fallback canvas
      const fallbackCanvas = fallbackCanvasRef.current;
      if (fallbackCanvas) {
        const texture = device.createTexture({
          size: [fallbackCanvas.width, fallbackCanvas.height],
          format: "rgba8unorm",
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });

        createImageBitmap(fallbackCanvas).then((bitmap) => {
          device.queue.copyExternalImageToTexture(
            { source: bitmap },
            { texture },
            [fallbackCanvas.width, fallbackCanvas.height]
          );
        });
        textureRef.current = texture;
      }

      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
          { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
          { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        ],
      });

      const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      });

      const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: shaderModule,
          entryPoint: "vs_main",
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fs_main",
          targets: [{ format: "bgra8unorm" }],
        },
        primitive: { topology: "triangle-strip" },
      });
      pipelineRef.current = pipeline;

      if (textureRef.current) {
        const bindGroup = device.createBindGroup({
          layout: bindGroupLayout,
          entries: [
            { binding: 0, resource: sampler },
            { binding: 1, resource: textureRef.current.createView() },
            { binding: 2, resource: { buffer: uniformBuffer } },
          ],
        });
        bindGroupRef.current = bindGroup;
      }
    } catch (e) {
      console.warn("WebGPU setup error:", e);
    }
  }, [device]);

  // Execute WebGPU Frame Render Pass
  const renderWebGPUFrame = useCallback(
    (t: number) => {
      if (!device || !canvasRef.current) return;

      const evaluatedSat = evaluatorRef.current.evaluate(keyframes, t);

      // Write uniform values: [t, evaluatedSat, vigRadius=0.4, padding]
      if (uniformBufferRef.current) {
        const uData = new Float32Array([t, evaluatedSat, 0.4, 0.0]);
        device.queue.writeBuffer(uniformBufferRef.current, 0, uData.buffer, 0, uData.byteLength);
      }

      // If playing video, upload current video frame to GPU texture
      if (mediaType === "video" && videoRef.current && textureRef.current) {
        if (videoRef.current.readyState >= 2) {
          createImageBitmap(videoRef.current).then((bitmap) => {
            device.queue.copyExternalImageToTexture(
              { source: bitmap },
              { texture: textureRef.current! },
              [videoRef.current!.videoWidth, videoRef.current!.videoHeight]
            );
          });
        }
      }

      // Render WebGPU frame onto canvas
      const gpuContext = canvasRef.current.getContext("webgpu") as GPUCanvasContext;
      if (gpuContext && pipelineRef.current && bindGroupRef.current) {
        const commandEncoder = device.createCommandEncoder();
        const textureView = gpuContext.getCurrentTexture().createView();

        const pass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: textureView,
              clearValue: { r: 0.05, g: 0.08, b: 0.14, a: 1.0 },
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });

        pass.setPipeline(pipelineRef.current);
        pass.setBindGroup(0, bindGroupRef.current);
        pass.draw(4, 1, 0, 0);
        pass.end();

        device.queue.submit([commandEncoder.finish()]);
      }
    },
    [device, keyframes, mediaType]
  );

  // Playback Tick Loop
  useEffect(() => {
    let animId: number;
    let lastT = performance.now();

    const loop = () => {
      const now = performance.now();
      const delta = (now - lastT) / 1000;
      lastT = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (videoRef.current && mediaType === "video") {
            videoRef.current.currentTime = next;
          }
          return next;
        });
      }

      setStats((prev) => ({
        ...prev,
        uiFps: Math.min(144, Math.round(1 / Math.max(delta, 0.001))),
      }));

      renderWebGPUFrame(currentTime);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentTime, mediaType, renderWebGPUFrame]);

  // Handle Media File Upload (Video or Image)
  const handleMediaUpload = (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    const url = URL.createObjectURL(file);

    setMediaName(file.name);

    if (isVideo) {
      setMediaType("video");
      const videoEl = document.createElement("video");
      videoEl.src = url;
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.play();
      videoRef.current = videoEl;

      videoEl.onloadedmetadata = () => {
        if (device) {
          const texture = device.createTexture({
            size: [videoEl.videoWidth, videoEl.videoHeight],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
          });
          textureRef.current = texture;
        }
      };
    } else if (isImage) {
      setMediaType("image");
      const imgEl = new Image();
      imgEl.src = url;
      imageRef.current = imgEl;

      imgEl.onload = () => {
        createImageBitmap(imgEl).then((bitmap) => {
          if (device) {
            const texture = device.createTexture({
              size: [imgEl.width, imgEl.height],
              format: "rgba8unorm",
              usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
            });
            device.queue.copyExternalImageToTexture({ source: bitmap }, { texture }, [imgEl.width, imgEl.height]);
            textureRef.current = texture;
          }
        });
      };
    }
  };

  const handleExport = (_fps: number, _bitrate: number) => {
    setIsExporting(true);
    setExportProgress(0.1);
    setTimeout(() => setExportProgress(0.5), 500);
    setTimeout(() => setExportProgress(1.0), 1000);
    setTimeout(() => setIsExporting(false), 1200);
  };

  const handleSavePreset = () => {
    const jsonStr = VefxPresetManager.exportPreset("Master Studio Curve", keyframes);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "master_preset.vefx";
    a.click();
  };

  const handleLoadPreset = (jsonStr: string) => {
    try {
      const preset = VefxPresetManager.importPreset(jsonStr);
      setKeyframes([...preset.keyframes]);
    } catch (e) {
      console.error("Failed to load preset:", e);
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "#090D16", color: "#FFF", position: "relative" }}>
      {/* Top Operator Control Surface */}
      <StudioControlPanel
        onExportTrigger={handleExport}
        onAudioUpload={(file) => console.log("Uploaded audio file:", file.name)}
        onMediaUpload={handleMediaUpload}
        activeMediaName={mediaName}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
        isExporting={isExporting}
        exportProgress={exportProgress}
      />

      {/* Main Studio Viewport */}
      <div style={{ flex: 1, display: "flex", gap: "16px", padding: "16px", position: "relative" }}>
        {/* Real-time Diagnostics Telemetry */}
        <StudioDiagnosticsOverlay stats={stats} />

        {/* Left: 2D Multi-Keyframe Curve Editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <MultiKeyframeGraphEditor
            keyframes={keyframes}
            onChange={setKeyframes}
            currentTime={currentTime}
            width={840}
            height={500}
          />
        </div>

        {/* Right: Live WebGPU Media Canvas Preview */}
        <div style={{ width: "480px", background: "#000", borderRadius: "12px", display: "flex", flexDirection: "column", border: "1px solid #1E293B", overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", background: "#0F172A", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#94A3B8" }}>Live WebGPU Render Canvas</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{ padding: "4px 10px", background: "#2563EB", color: "#FFF", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => {
                  setCurrentTime(0);
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                style={{ padding: "4px 10px", background: "#334155", color: "#FFF", border: "none", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
              >
                Reset
              </button>
            </div>
          </div>

          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#050811" }}>
            <canvas ref={canvasRef} width={640} height={360} style={{ width: "100%", height: "auto", borderRadius: "4px" }} />
          </div>
        </div>
      </div>
    </div>
  );
};
