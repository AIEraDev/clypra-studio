/**
 * Body Effect Lab — Modular Component Edition
 *
 * Coordinates states and render loops across:
 *  - TopNavBar
 *  - SidebarLeft (media loading, providers selection, body effects list)
 *  - CanvasPreview (silhouette tracking rendering, playback controls, timelines)
 *  - SidebarRight (parameters inspector, nodes compiler output, console)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { initializeFontSystem } from "@clypra-studio/engine";

import { TopNavBar } from "./components/TopNavBar";
import { SidebarLeft } from "./components/SidebarLeft";
import { CanvasPreview } from "./components/CanvasPreview";
import { SidebarRight } from "./components/SidebarRight";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
}

const DEFAULT_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export function BodyLabView() {
  // Initialization of Lottie web fonts
  useEffect(() => {
    try {
      initializeFontSystem();
    } catch (e) {
      console.warn("Font system initialization bypassed or already run", e);
    }
  }, []);

  // State Management
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>(DEFAULT_VIDEO_URL);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15.02);
  const [selectedEffect, setSelectedEffect] = useState<string>("neon-outline");
  const [fitMode, setFitMode] = useState<"stretch" | "crop">("stretch");
  const [activeTab, setActiveTab] = useState<"inspector" | "nodes" | "stats">("inspector");

  const [logs, setLogs] = useState<string[]>([
    "[INIT] Body segmentation console starting...",
    "[OK] Feature maps channel 0 (BODY_MASK) active.",
    "[INFO] Ready. Load video containing human subjects.",
  ]);

  const [providers] = useState([
    { id: "mediapipe-body", name: "MediaPipe Body Mask", status: "ACTIVE" },
    { id: "webgpu-segmenter", name: "WebGPU Segmenter v2", status: "STANDBY" },
  ]);
  const [activeProvider, setActiveProvider] = useState("mediapipe-body");

  const [parameters, setParameters] = useState<Record<string, any>>({
    color: "#00FFFF",
    thickness: 4,
    intensity: 1.0,
    softness: 0.5,
    blurAmount: 20,
    edgeSoftness: 0.2,
    darkness: 0.7,
    falloff: 1.0,
    tint: "#000000",
    warmth: 0.0,
    particleCount: 50,
    particleSize: 3,
    speed: 0.5,
    particleColor: "#FFFFFF",
    spread: 10,
    glow: 0.3,
    desaturation: 1.0,
    edgeBlend: 0.3,
    colorBoost: 0.0,
  });

  const [latency, setLatency] = useState(0.02);
  const [cpuUsage, setCpuUsage] = useState(15);
  const [gpuUsage, setGpuUsage] = useState(48);
  const [memUsage, setMemUsage] = useState("1.3GB/16GB");

  const [redHeight, setRedHeight] = useState(55);
  const [greenHeight, setGreenHeight] = useState(60);
  const [blueHeight, setBlueHeight] = useState(80);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const particlesRef = useRef<Particle[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => {
      const next = [...prev, msg];
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
  }, []);

  const handleVideoImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(`[IMPORT] Loading video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      setVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setVideoUrl(objectUrl);
      setPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const newDur = videoRef.current.duration;
      setDuration(newDur);
      addLog(
        `[MEDIA] Source ready. Resolution: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
      );
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.play().catch((err) => {
        addLog(`[WARN] Playback blocked: ${err.message}`);
        setPlaying(false);
      });
      addLog("[OK] Playback sequencer active");
    } else {
      video.pause();
      addLog("[OK] Playback sequencer paused");
    }
  }, [playing, addLog]);

  const handleTimeUpdate = () => {
    if (videoRef.current && !isScrubbing) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSkipPrev = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleSkipNext = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = duration;
      setCurrentTime(duration);
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      const targetTime = Math.max(0, videoRef.current.currentTime - 2);
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleFastForward = () => {
    if (videoRef.current) {
      const targetTime = Math.min(duration, videoRef.current.currentTime + 2);
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const handleParamChange = (key: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTimelineScrub = useCallback(
    (clientX: number) => {
      if (!timelineRef.current || duration <= 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const newTime = pct * duration;
      setCurrentTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    },
    [duration]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleTimelineScrub(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing) handleTimelineScrub(e.clientX);
    };
    const handleMouseUp = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
      }
    };
    if (isScrubbing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, handleTimelineScrub]);

  const handleJogWheelMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const handleMouseMove = (mvEvent: MouseEvent) => {
      const delta = (mvEvent.clientX - startX) * 0.05;
      if (videoRef.current) {
        const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
        videoRef.current.currentTime = target;
        setCurrentTime(target);
      }
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const drawSMPTEBars = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#0c101a";
    ctx.fillRect(0, 0, w, h);
    const colors = ["#c0c0c0", "#ffff00", "#00ffff", "#00ff00", "#ff00ff", "#ff0000", "#0000ff"];
    const barW = w / 7;
    const topH = h * 0.7;
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(i * barW, 0, barW, topH);
    }
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, topH, w, h - topH);
    ctx.fillStyle = "#adc6ff";
    ctx.font = "bold 14px 'Geist', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SMPTE_TEST_PATTERN (SIGNAL PENDING)", w / 2, topH + (h - topH) / 2);
  };

  const drawHumanSilhouette = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number
  ) => {
    ctx.beginPath();
    ctx.arc(cx, cy - 80 * scale, 24 * scale, 0, Math.PI * 2);
    ctx.moveTo(cx - 6 * scale, cy - 56 * scale);
    ctx.lineTo(cx - 6 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 6 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 6 * scale, cy - 56 * scale);
    ctx.moveTo(cx - 45 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 45 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 35 * scale, cy + 50 * scale);
    ctx.lineTo(cx - 35 * scale, cy + 50 * scale);
    ctx.closePath();
    ctx.moveTo(cx - 45 * scale, cy - 48 * scale);
    ctx.lineTo(cx - 75 * scale, cy + 20 * scale);
    ctx.lineTo(cx - 65 * scale, cy + 80 * scale);
    ctx.lineTo(cx - 52 * scale, cy + 80 * scale);
    ctx.lineTo(cx - 60 * scale, cy + 25 * scale);
    ctx.lineTo(cx - 35 * scale, cy - 20 * scale);
    ctx.moveTo(cx + 45 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 75 * scale, cy + 20 * scale);
    ctx.lineTo(cx + 65 * scale, cy + 80 * scale);
    ctx.lineTo(cx + 52 * scale, cy + 80 * scale);
    ctx.lineTo(cx + 60 * scale, cy + 25 * scale);
    ctx.lineTo(cx + 35 * scale, cy - 20 * scale);
    ctx.moveTo(cx - 30 * scale, cy + 50 * scale);
    ctx.lineTo(cx - 35 * scale, cy + 130 * scale);
    ctx.lineTo(cx - 40 * scale, cy + 220 * scale);
    ctx.lineTo(cx - 20 * scale, cy + 220 * scale);
    ctx.lineTo(cx - 18 * scale, cy + 130 * scale);
    ctx.lineTo(cx - 5 * scale, cy + 50 * scale);
    ctx.moveTo(cx + 30 * scale, cy + 50 * scale);
    ctx.lineTo(cx + 35 * scale, cy + 130 * scale);
    ctx.lineTo(cx + 40 * scale, cy + 220 * scale);
    ctx.lineTo(cx + 20 * scale, cy + 220 * scale);
    ctx.lineTo(cx + 18 * scale, cy + 130 * scale);
    ctx.lineTo(cx + 5 * scale, cy + 50 * scale);
  };

  const hexToRgb = (hex: string): string => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  useEffect(() => {
    let animId: number;
    let statsTimer = performance.now();

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const startGpuTime = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hasVideo = video && video.readyState >= 2;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 - 20;
      const scalePulsate = 1.0 + (playing ? Math.sin(performance.now() / 200) * 0.02 : 0);

      ctx.save();

      if (hasVideo) {
        if (selectedEffect === "neon-outline") {
          ctx.drawImage(video!, 0, 0, canvas.width, canvas.height);
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.strokeStyle = parameters.color ?? "#00FFFF";
          ctx.lineWidth = parameters.thickness ?? 4;
          ctx.shadowColor = parameters.color ?? "#00FFFF";
          ctx.shadowBlur = (parameters.intensity ?? 1.0) * 16;
          ctx.stroke();
          ctx.restore();
        } else if (selectedEffect === "background-blur") {
          const blurAmount = parameters.blurAmount ?? 20;
          ctx.save();
          ctx.filter = `blur(${blurAmount}px) brightness(0.8)`;
          ctx.drawImage(video!, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          ctx.drawImage(video!, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        } else if (selectedEffect === "spotlight") {
          const darkness = parameters.darkness ?? 0.7;
          const falloff = parameters.falloff ?? 1.0;
          const tint = parameters.tint ?? "#000000";
          ctx.drawImage(video!, 0, 0, canvas.width, canvas.height);
          ctx.save();
          const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 280 * falloff);
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, `rgba(${hexToRgb(tint)}, ${darkness})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
        } else if (selectedEffect === "particle-aura") {
          ctx.drawImage(video!, 0, 0, canvas.width, canvas.height);
          const pColor = parameters.particleColor ?? "#FFFFFF";
          const pSize = parameters.particleSize ?? 3;
          const pSpeed = parameters.speed ?? 0.5;
          const pSpread = parameters.spread ?? 10;
          const glow = parameters.glow ?? 0.3;

          if (particlesRef.current.length < (parameters.particleCount ?? 50)) {
            particlesRef.current.push({
              x: cx + (Math.random() - 0.5) * 150,
              y: cy + (Math.random() - 0.5) * 350,
              vx: (Math.random() - 0.5) * pSpeed * 5,
              vy: -Math.random() * pSpeed * 4 - 1,
              size: Math.random() * pSize + 1,
              alpha: Math.random(),
              life: 1.0,
            });
          }

          ctx.save();
          ctx.shadowColor = pColor;
          ctx.shadowBlur = glow * 12;

          particlesRef.current.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.01;
            ctx.fillStyle = pColor;
            ctx.globalAlpha = p.alpha * p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            if (p.life <= 0) {
              particlesRef.current[idx] = {
                x: cx + (Math.random() - 0.5) * (100 + pSpread * 5),
                y: cy + 180,
                vx: (Math.random() - 0.5) * pSpeed * 4,
                vy: -Math.random() * pSpeed * 5 - 1.5,
                size: Math.random() * pSize + 1,
                alpha: Math.random(),
                life: 1.0,
              };
            }
          });
          ctx.restore();
        } else if (selectedEffect === "color-isolation") {
          const desat = parameters.desaturation ?? 1.0;
          ctx.save();
          ctx.filter = `grayscale(${desat * 100}%) contrast(1.1)`;
          ctx.drawImage(video!, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          if (parameters.colorBoost > 0) {
            ctx.filter = `saturate(${1.0 + parameters.colorBoost * 2})`;
          }
          ctx.drawImage(video!, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
      } else {
        drawSMPTEBars(ctx, canvas.width, canvas.height);
      }

      ctx.restore();

      const now = performance.now();
      const frameDelta = now - startGpuTime;

      if (now - statsTimer >= 500) {
        setLatency(parseFloat(frameDelta.toFixed(2)));
        setCpuUsage(Math.round(11 + Math.random() * 8));
        setGpuUsage(
          Math.round(
            selectedEffect === "background-blur" ? 45 + Math.random() * 10 : 30 + Math.random() * 15
          )
        );
        if (playing) {
          setRedHeight(Math.round(40 + Math.random() * 40));
          setGreenHeight(Math.round(50 + Math.random() * 45));
          setBlueHeight(Math.round(30 + Math.random() * 60));
        }
        statsTimer = now;
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedEffect, fitMode, parameters, playing, duration]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const handleResetContext = () => {
    setParameters({
      color: "#00FFFF",
      thickness: 4,
      intensity: 1.0,
      softness: 0.5,
      blurAmount: 20,
      edgeSoftness: 0.2,
      darkness: 0.7,
      falloff: 1.0,
      tint: "#000000",
      warmth: 0.0,
      particleCount: 50,
      particleSize: 3,
      speed: 0.5,
      particleColor: "#FFFFFF",
      spread: 10,
      glow: 0.3,
      desaturation: 1.0,
      edgeBlend: 0.3,
      colorBoost: 0.0,
    });
    setSelectedEffect("neon-outline");
    addLog("[SYSTEM] Reset render context to baseline settings.");
  };

  const handleDumpLog = () => {
    const logsTxt = logs.join("\n");
    const blob = new Blob([logsTxt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `body_lab_logs_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col selection:bg-[#adc6ff] selection:text-[#002e6a]">
      {/* Dynamic layout/tokens injection */}
      <style>{`
        body {
          background-color: #060a14;
          color: #dae2fd;
          overflow: hidden;
          font-family: 'Hanken Grotesk', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
          vertical-align: middle;
          font-size: 18px;
        }
        .timeline-trough {
          background: linear-gradient(90deg, #111827 1px, transparent 1px);
          background-size: 10px 100%;
        }
        .property-grid {
          display: grid;
          grid-template-columns: 80px 1fr;
          font-size: 10px;
        }
        .property-grid > div {
          padding: 6px 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .bg-inverse-surface { background-color: #dae2fd; }
        .bg-outline-variant { background-color: #424754; }
        .border-outline-variant { border-color: #424754; }
        .bg-primary-container { background-color: #4d8eff; }
        .bg-on-surface { background-color: #dae2fd; }
        .bg-primary { background-color: #adc6ff; }
        .bg-secondary-container { background-color: #00a572; }
        .bg-outline { background-color: #8c909f; }
        .bg-primary-fixed { background-color: #d8e2ff; }
        .bg-on-primary-container { background-color: #00285d; }
        .bg-background { background-color: #060a14; }
        .bg-surface-container-highest { background-color: #2d3449; }
        .bg-on-surface-variant { background-color: #c2c6d6; }
        .bg-surface-container-low { background-color: #0d1424; }
        .bg-surface { background-color: #0b1326; }
        .bg-surface-container-lowest { background-color: #03070f; }
        .bg-surface-variant { background-color: #2d3449; }
        .bg-surface-container-high { background-color: #1a2336; }
        .bg-surface-container { background-color: #111827; }
        .bg-surface-bright { background-color: #31394d; }
        .bg-surface-dim { background-color: #0b1326; }
        .bg-tertiary { background-color: #ffb786; }
        .bg-secondary { background-color: #4edea3; }
        .bg-on-primary { background-color: #002e6a; }
        .bg-on-secondary { background-color: #003824; }
        .bg-on-tertiary { background-color: #502400; }
        .bg-error { background-color: #ffb4ab; }
        .bg-error-container { background-color: #93000a; }
        .bg-tertiary-container { background-color: #df7412; }
      `}</style>

      {/* Top Header */}
      <TopNavBar />

      {/* Main Layout Workspace */}
      <main className="flex-1 flex overflow-hidden">
        <SidebarLeft
          videoFile={videoFile}
          fitMode={fitMode}
          selectedEffect={selectedEffect}
          providers={providers}
          activeProvider={activeProvider}
          onVideoImport={handleVideoImport}
          onSetFitMode={setFitMode}
          onSetActiveProvider={setActiveProvider}
          onSelectEffect={setSelectedEffect}
        />

        <CanvasPreview
          videoRef={videoRef}
          canvasRef={canvasRef}
          timelineRef={timelineRef}
          videoUrl={videoUrl}
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          activeProvider={activeProvider}
          latency={latency}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          redHeight={redHeight}
          greenHeight={greenHeight}
          blueHeight={blueHeight}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onSetPlaying={setPlaying}
          onSkipPrev={handleSkipPrev}
          onSkipNext={handleSkipNext}
          onRewind={handleRewind}
          onFastForward={handleFastForward}
          onMouseDown={handleMouseDown}
          onJogWheelMouseDown={handleJogWheelMouseDown}
        />

        <SidebarRight
          activeTab={activeTab}
          selectedEffect={selectedEffect}
          parameters={parameters}
          activeProvider={activeProvider}
          latency={latency}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          logs={logs}
          terminalEndRef={terminalEndRef}
          onSetActiveTab={setActiveTab}
          onParamChange={handleParamChange}
          onDumpLog={handleDumpLog}
          onResetContext={handleResetContext}
        />
      </main>
    </div>
  );
}

export default BodyLabView;
