/**
 * Transition Lab — Modular Component Edition
 *
 * Coordinates states and render loops across:
 *  - TopNavBar
 *  - SidebarLeft (outgoing clip A, incoming clip B, mix transitions library)
 *  - CanvasPreview (transition mixer canvas, sequencer timelines, progress sliders)
 *  - SidebarRight (parameters inspector, mix nodes compiler, debugger logs monitor)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { initializeFontSystem } from "@clypra-studio/engine";

import { TopNavBar } from "./components/TopNavBar";
import { SidebarLeft } from "./components/SidebarLeft";
import { CanvasPreview } from "./components/CanvasPreview";
import { SidebarRight } from "./components/SidebarRight";

const DEFAULT_CLIP_A =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const DEFAULT_CLIP_B =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

export function TransitionLabView() {
  // Initialization of Lottie web fonts
  useEffect(() => {
    try {
      initializeFontSystem();
    } catch (e) {
      console.warn("Font system initialization bypassed or already run", e);
    }
  }, []);

  // State Management
  const [clipAFile, setClipAFile] = useState<File | null>(null);
  const [clipBFile, setClipBFile] = useState<File | null>(null);
  const [clipAUrl, setClipAUrl] = useState<string>(DEFAULT_CLIP_A);
  const [clipBUrl, setClipBUrl] = useState<string>(DEFAULT_CLIP_B);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.5); // 0.0 = Clip A, 1.0 = Clip B
  const [duration, setDuration] = useState(2.0); // Transition duration in seconds
  const [selectedTransition, setSelectedTransition] = useState<string>("cross-dissolve");
  const [activeTab, setActiveTab] = useState<"inspector" | "nodes" | "stats">("inspector");

  const [logs, setLogs] = useState<string[]>([
    "[INIT] Transition console starting...",
    "[OK] Dual-channel video mixers ready.",
    "[INFO] Ready. Load outgoing/incoming clips or adjust parameters.",
  ]);

  const [parameters, setParameters] = useState<Record<string, any>>({
    easing: "linear",
    colorOverlay: "#000000",
    blurAmount: 10,
    slideDirection: "left",
  });

  const [latency, setLatency] = useState(0.02);
  const [cpuUsage, setCpuUsage] = useState(14);
  const [gpuUsage, setGpuUsage] = useState(38);
  const [memUsage, setMemUsage] = useState("1.4GB/16GB");

  const [redHeight, setRedHeight] = useState(45);
  const [greenHeight, setGreenHeight] = useState(70);
  const [blueHeight, setBlueHeight] = useState(65);

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => {
      const next = [...prev, msg];
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
  }, []);

  const handleClipAImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(`[IMPORT] Outgoing Clip A loaded: ${file.name}`);
      setClipAFile(file);
      const objectUrl = URL.createObjectURL(file);
      setClipAUrl(objectUrl);
      setProgress(0);
      setPlaying(false);
    }
  };

  const handleClipBImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addLog(`[IMPORT] Incoming Clip B loaded: ${file.name}`);
      setClipBFile(file);
      const objectUrl = URL.createObjectURL(file);
      setClipBUrl(objectUrl);
      setProgress(0);
      setPlaying(false);
    }
  };

  const handleRewind = () => {
    setProgress((prev) => Math.max(0, prev - 0.1));
    addLog("[SEEK] Step rewind -10% progress");
  };

  const handleFastForward = () => {
    setProgress((prev) => Math.min(1.0, prev + 0.1));
    addLog("[SEEK] Step forward +10% progress");
  };

  const handleParamChange = (key: string, value: any) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTimelineScrub = useCallback((clientX: number) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    setProgress(pct);
  }, []);

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
        addLog(`[SEEK] Seek progress set to: ${(progress * 100).toFixed(0)}%`);
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
  }, [isScrubbing, handleTimelineScrub, progress, addLog]);

  const getProgressVal = (p: number) => {
    const easingType = parameters.easing ?? "linear";
    if (easingType === "ease-in-out") {
      return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    }
    if (easingType === "ease-in") {
      return p * p;
    }
    if (easingType === "ease-out") {
      return 1 - (1 - p) * (1 - p);
    }
    return p;
  };

  const drawSMPTEBars = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    label: string
  ) => {
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
    ctx.fillText(label, w / 2, topH + (h - topH) / 2);
  };

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let statsTimer = performance.now();

    const render = (time: number) => {
      const videoA = videoARef.current;
      const videoB = videoBRef.current;
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
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      let currentProg = progress;
      if (playing && !isScrubbing) {
        currentProg += delta / duration;
        if (currentProg >= 1.0) {
          currentProg = 0.0;
        }
        setProgress(currentProg);
      }

      if (videoA && videoA.readyState >= 1) {
        const targetA = (1.0 - currentProg) * videoA.duration;
        if (Math.abs(videoA.currentTime - targetA) > 0.1) {
          videoA.currentTime = isNaN(targetA) ? 0 : targetA;
        }
      }
      if (videoB && videoB.readyState >= 1) {
        const targetB = currentProg * videoB.duration;
        if (Math.abs(videoB.currentTime - targetB) > 0.1) {
          videoB.currentTime = isNaN(targetB) ? 0 : targetB;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const easedP = getProgressVal(currentProg);

      const hasVideoA = videoA && videoA.readyState >= 2;
      const hasVideoB = videoB && videoB.readyState >= 2;

      ctx.save();

      if (selectedTransition === "cross-dissolve") {
        if (hasVideoA) ctx.drawImage(videoA!, 0, 0, canvas.width, canvas.height);
        else drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP_A (OUTGOING)");

        ctx.globalAlpha = easedP;
        if (hasVideoB) ctx.drawImage(videoB!, 0, 0, canvas.width, canvas.height);
        else {
          ctx.fillStyle = "rgba(0,0,0," + easedP + ")";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(255,255,255," + easedP + ")";
          ctx.font = "bold 24px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("CLIP B (INCOMING)", canvas.width / 2, canvas.height / 2);
        }
      } else if (selectedTransition === "fade-to-black") {
        const color = parameters.colorOverlay ?? "#000000";
        if (easedP < 0.5) {
          const alpha = easedP * 2;
          if (hasVideoA) ctx.drawImage(videoA!, 0, 0, canvas.width, canvas.height);
          else drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP A");
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          const alpha = (1.0 - easedP) * 2;
          if (hasVideoB) ctx.drawImage(videoB!, 0, 0, canvas.width, canvas.height);
          else drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP B");
          ctx.fillStyle = color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (selectedTransition === "slide-left") {
        const dir = parameters.slideDirection ?? "left";
        ctx.save();
        if (dir === "left") {
          const offsetA = -easedP * canvas.width;
          const offsetB = (1.0 - easedP) * canvas.width;
          ctx.translate(offsetA, 0);
          if (hasVideoA) ctx.drawImage(videoA!, 0, 0, canvas.width, canvas.height);
          else drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP A");
          ctx.translate(offsetB - offsetA, 0);
          if (hasVideoB) ctx.drawImage(videoB!, 0, 0, canvas.width, canvas.height);
          else drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP B");
        } else {
          const offsetA = easedP * canvas.width;
          const offsetB = -(1.0 - easedP) * canvas.width;
          ctx.translate(offsetA, 0);
          if (hasVideoA) ctx.drawImage(videoA!, 0, 0, canvas.width, canvas.height);
          else drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP A");
          ctx.translate(offsetB - offsetA, 0);
          if (hasVideoB) ctx.drawImage(videoB!, 0, 0, canvas.width, canvas.height);
          else drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP B");
        }
        ctx.restore();
      } else if (selectedTransition === "zoom-blur") {
        const blurAmount = parameters.blurAmount ?? 10;
        if (easedP < 0.5) {
          const zoom = 1.0 + easedP * 0.4;
          const localAlpha = easedP * 2;
          ctx.save();
          if (hasVideoA) {
            ctx.drawImage(videoA!, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = localAlpha;
            ctx.filter = `blur(${easedP * blurAmount}px)`;
            const w = canvas.width * zoom;
            const h = canvas.height * zoom;
            ctx.drawImage(videoA!, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
          } else {
            drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP A");
          }
          ctx.restore();
        } else {
          const zoom = 1.4 - (easedP - 0.5) * 0.8;
          const localAlpha = (1.0 - easedP) * 2;
          ctx.save();
          if (hasVideoB) {
            ctx.drawImage(videoB!, 0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = localAlpha;
            ctx.filter = `blur(${(1.0 - easedP) * blurAmount}px)`;
            const w = canvas.width * zoom;
            const h = canvas.height * zoom;
            ctx.drawImage(videoB!, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
          } else {
            drawSMPTEBars(ctx, canvas.width, canvas.height, "CLIP B");
          }
          ctx.restore();
        }
      }

      ctx.restore();

      const now = performance.now();
      const frameDelta = now - startGpuTime;

      if (now - statsTimer >= 500) {
        setLatency(parseFloat(frameDelta.toFixed(2)));
        setCpuUsage(Math.round(9 + Math.random() * 8));
        setGpuUsage(Math.round(20 + Math.random() * 15));
        if (playing) {
          setRedHeight(Math.round(20 + Math.random() * 70));
          setGreenHeight(Math.round(30 + Math.random() * 60));
          setBlueHeight(Math.round(40 + Math.random() * 50));
        }
        statsTimer = now;
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedTransition, progress, playing, duration, parameters, isScrubbing]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const handleResetContext = () => {
    setParameters({
      easing: "linear",
      colorOverlay: "#000000",
      blurAmount: 10,
      slideDirection: "left",
    });
    setSelectedTransition("cross-dissolve");
    setProgress(0.5);
    addLog("[SYSTEM] Sequencer buffer reset to factory defaults.");
  };

  const handleDumpLog = () => {
    const logsTxt = logs.join("\n");
    const blob = new Blob([logsTxt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transition_lab_logs_${Date.now()}.txt`;
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

      {/* Header bar */}
      <TopNavBar />

      {/* Main Layout mixer workspace */}
      <main className="flex-1 flex overflow-hidden">
        <SidebarLeft
          clipAFile={clipAFile}
          clipBFile={clipBFile}
          selectedTransition={selectedTransition}
          onClipAImport={handleClipAImport}
          onClipBImport={handleClipBImport}
          onSelectTransition={setSelectedTransition}
        />

        <CanvasPreview
          videoARef={videoARef}
          videoBRef={videoBRef}
          canvasRef={canvasRef}
          timelineRef={timelineRef}
          clipAUrl={clipAUrl}
          clipBUrl={clipBUrl}
          playing={playing}
          progress={progress}
          duration={duration}
          latency={latency}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          redHeight={redHeight}
          greenHeight={greenHeight}
          blueHeight={blueHeight}
          onSetPlaying={setPlaying}
          onSkipStart={() => {
            setProgress(0);
            addLog("[SEEK] Set timeline to head (0.0)");
          }}
          onSkipEnd={() => {
            setProgress(1.0);
            addLog("[SEEK] Set timeline to tail (1.0)");
          }}
          onRewind={handleRewind}
          onFastForward={handleFastForward}
          onMouseDown={handleMouseDown}
          onProgressSliderChange={(e) => setProgress(parseFloat(e.target.value))}
        />

        <SidebarRight
          activeTab={activeTab}
          selectedTransition={selectedTransition}
          parameters={parameters}
          latency={latency}
          cpuUsage={cpuUsage}
          gpuUsage={gpuUsage}
          memUsage={memUsage}
          duration={duration}
          progress={progress}
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

export default TransitionLabView;
