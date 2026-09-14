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
import { segmentBodyMask } from "../../services/bodySegmentation/bodySegmentationWorkerClient";

import { TopNavBar } from "./components/TopNavBar";
import { SidebarLeft } from "./components/SidebarLeft";
import { CanvasPreview } from "./components/CanvasPreview";
import { SidebarRight } from "./components/SidebarRight";
import { ManifestExportModal } from "./components/ManifestExportModal";

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
  const [fitMode, setFitMode] = useState<"stretch" | "fit" | "crop">("fit");
  const [activeTab, setActiveTab] = useState<"inspector" | "nodes" | "stats">("inspector");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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
    // Subject Cutout / Text Behind Subject
    cutoutText: "CLYPRA",
    textColor: "#FFFFFF",
    textSize: 120,
    textOffsetY: 0,
    feather: 4,
    choke: 0.2,
    // Cyber Glow / Masked Glow
    radius: 18,
    // Angel Wings
    scaleX: 1.5,
    scaleY: 1.5,
    offsetX: 0.0,
    offsetY: -0.05,
    rotationDeg: 0,
    anchorKeypoint: "spineCenter",
    depthMode: "behind-subject",
    followTorsoOrientation: true,
    // Electro Contour
    arcColor: "#00E5FF",
    arcJitter: 15,
    arcBranches: 4,
    arcGlow: 1.8,
    arcWidth: 2.5,
    // Body Ghost
    ghostCount: 3,
    ghostOffset: 25,
    ghostOpacity: 0.6,
    ghostColor: "#FF007F",
    ghostBlendMode: "screen",
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
      if (videoRef.current) {
        videoRef.current.src = objectUrl;
        videoRef.current.load();
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video && videoUrl) {
      video.src = videoUrl;
      video.load();
    }
  }, [videoUrl]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const newDur = videoRef.current.duration || 15;
      setDuration(newDur);
      addLog(
        `[MEDIA] Source ready. Resolution: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
      );
      if (videoRef.current.currentTime === 0) {
        videoRef.current.currentTime = 0.001;
      }
    }
  };

  useEffect(() => {
    particlesRef.current = [];
  }, [fitMode, selectedEffect]);

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

  const drawSimulatedBackdrop = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    _time: number
  ) => {
    // Dynamic cinematic gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#0a0e17");
    bgGrad.addColorStop(0.5, "#141c2e");
    bgGrad.addColorStop(1, "#070a10");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle perspective floor grid
    ctx.save();
    ctx.strokeStyle = "rgba(77, 142, 255, 0.12)";
    ctx.lineWidth = 1;
    const horizon = h * 0.62;
    for (let x = -w * 0.5; x <= w * 1.5; x += 80) {
      ctx.beginPath();
      ctx.moveTo(w / 2, horizon);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = horizon; y <= h; y += Math.max(8, (y - horizon) * 0.35)) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    // Studio rim lighting ambiance
    const lightGrad = ctx.createRadialGradient(w / 2, h * 0.35, 20, w / 2, h * 0.35, w * 0.45);
    lightGrad.addColorStop(0, "rgba(0, 240, 255, 0.12)");
    lightGrad.addColorStop(0.6, "rgba(99, 102, 241, 0.06)");
    lightGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, w, h);
  };

  const drawHumanSilhouette = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number
  ) => {
    ctx.beginPath();
    // Head
    ctx.arc(cx, cy - 80 * scale, 24 * scale, 0, Math.PI * 2);
    // Neck
    ctx.moveTo(cx - 6 * scale, cy - 56 * scale);
    ctx.lineTo(cx - 6 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 6 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 6 * scale, cy - 56 * scale);
    // Torso
    ctx.moveTo(cx - 45 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 45 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 35 * scale, cy + 50 * scale);
    ctx.lineTo(cx - 35 * scale, cy + 50 * scale);
    ctx.closePath();
    // Left Arm
    ctx.moveTo(cx - 45 * scale, cy - 48 * scale);
    ctx.lineTo(cx - 75 * scale, cy + 20 * scale);
    ctx.lineTo(cx - 65 * scale, cy + 80 * scale);
    ctx.lineTo(cx - 52 * scale, cy + 80 * scale);
    ctx.lineTo(cx - 60 * scale, cy + 25 * scale);
    ctx.lineTo(cx - 35 * scale, cy - 20 * scale);
    // Right Arm
    ctx.moveTo(cx + 45 * scale, cy - 48 * scale);
    ctx.lineTo(cx + 75 * scale, cy + 20 * scale);
    ctx.lineTo(cx + 65 * scale, cy + 80 * scale);
    ctx.lineTo(cx + 52 * scale, cy + 80 * scale);
    ctx.lineTo(cx + 60 * scale, cy + 25 * scale);
    ctx.lineTo(cx + 35 * scale, cy - 20 * scale);
    // Left Leg
    ctx.moveTo(cx - 30 * scale, cy + 50 * scale);
    ctx.lineTo(cx - 35 * scale, cy + 130 * scale);
    ctx.lineTo(cx - 40 * scale, cy + 220 * scale);
    ctx.lineTo(cx - 20 * scale, cy + 220 * scale);
    ctx.lineTo(cx - 18 * scale, cy + 130 * scale);
    ctx.lineTo(cx - 5 * scale, cy + 50 * scale);
    // Right Leg
    ctx.moveTo(cx + 30 * scale, cy + 50 * scale);
    ctx.lineTo(cx + 35 * scale, cy + 130 * scale);
    ctx.lineTo(cx + 40 * scale, cy + 220 * scale);
    ctx.lineTo(cx + 20 * scale, cy + 220 * scale);
    ctx.lineTo(cx + 18 * scale, cy + 130 * scale);
    ctx.lineTo(cx + 5 * scale, cy + 50 * scale);
  };

  const drawLightningSegment = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    jitter: number,
    branches: number
  ) => {
    const steps = 6;
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;
    const nx = -dy;
    const ny = dx;
    const len = Math.hypot(nx, ny) || 1;
    const unx = nx / len;
    const uny = ny / len;

    const points: Array<[number, number]> = [[x1, y1]];
    for (let i = 1; i < steps; i++) {
      const px = x1 + dx * i + unx * (Math.random() - 0.5) * jitter;
      const py = y1 + dy * i + uny * (Math.random() - 0.5) * jitter;
      points.push([px, py]);
    }
    points.push([x2, y2]);

    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();

    if (branches > 0) {
      const bIdx = Math.floor(1 + Math.random() * (points.length - 2));
      const [bx, by] = points[bIdx];
      const angle = Math.random() * Math.PI * 2;
      const bLen = 15 + Math.random() * 25;
      const ex = bx + Math.cos(angle) * bLen;
      const ey = by + Math.sin(angle) * bLen;

      ctx.save();
      ctx.lineWidth = Math.max(0.8, ctx.lineWidth * 0.6);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(
        (bx + ex) / 2 + (Math.random() - 0.5) * jitter * 0.5,
        (by + ey) / 2 + (Math.random() - 0.5) * jitter * 0.5
      );
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawLightningContour = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale: number,
    jitter: number,
    branches: number
  ) => {
    const nodes: Array<[number, number]> = [
      [cx, cy - 104 * scale],
      [cx - 24 * scale, cy - 80 * scale],
      [cx - 10 * scale, cy - 56 * scale],
      [cx - 45 * scale, cy - 48 * scale],
      [cx - 75 * scale, cy + 20 * scale],
      [cx - 65 * scale, cy + 80 * scale],
      [cx - 40 * scale, cy + 40 * scale],
      [cx - 35 * scale, cy + 50 * scale],
      [cx - 35 * scale, cy + 130 * scale],
      [cx - 40 * scale, cy + 220 * scale],
      [cx - 20 * scale, cy + 220 * scale],
      [cx - 10 * scale, cy + 70 * scale],
      [cx, cy + 50 * scale],
      [cx + 10 * scale, cy + 70 * scale],
      [cx + 20 * scale, cy + 220 * scale],
      [cx + 40 * scale, cy + 220 * scale],
      [cx + 35 * scale, cy + 130 * scale],
      [cx + 35 * scale, cy + 50 * scale],
      [cx + 40 * scale, cy + 40 * scale],
      [cx + 65 * scale, cy + 80 * scale],
      [cx + 75 * scale, cy + 20 * scale],
      [cx + 45 * scale, cy - 48 * scale],
      [cx + 10 * scale, cy - 56 * scale],
      [cx + 24 * scale, cy - 80 * scale],
    ];

    for (let i = 0; i < nodes.length; i++) {
      const nextIdx = (i + 1) % nodes.length;
      drawLightningSegment(
        ctx,
        nodes[i][0],
        nodes[i][1],
        nodes[nextIdx][0],
        nodes[nextIdx][1],
        jitter,
        Math.random() < 0.35 ? branches : 0
      );
    }
  };

  const drawAngelWings = (
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    scaleX: number,
    scaleY: number,
    rotationDeg: number,
    scaleFactor: number,
    wingColor: string = "#00F0FF",
    glowIntensity: number = 1.0,
    flapPhase: number = 0
  ) => {
    ctx.save();
    ctx.translate(anchorX, anchorY);
    ctx.rotate((rotationDeg * Math.PI) / 180);

    const flapAngle = Math.sin(flapPhase) * 0.12;
    const wingLength = 160 * scaleX * scaleFactor;
    const wingHeight = 120 * scaleY * scaleFactor;

    // Draw Left Wing
    ctx.save();
    ctx.rotate(flapAngle);
    drawSingleWing(ctx, -1, wingLength, wingHeight, wingColor, glowIntensity);
    ctx.restore();

    // Draw Right Wing
    ctx.save();
    ctx.rotate(-flapAngle);
    drawSingleWing(ctx, 1, wingLength, wingHeight, wingColor, glowIntensity);
    ctx.restore();

    ctx.restore();
  };

  const drawSingleWing = (
    ctx: CanvasRenderingContext2D,
    direction: 1 | -1,
    w: number,
    h: number,
    color: string,
    intensity: number
  ) => {
    ctx.save();
    ctx.scale(direction, 1);

    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * intensity;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    const grad = ctx.createLinearGradient(0, 0, w, -h);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, "rgba(0, 240, 255, 0)");

    const feathers = [
      { cp1x: w * 0.2, cp1y: -h * 0.6, cp2x: w * 0.7, cp2y: -h * 0.9, ex: w, ey: -h * 0.7 },
      { cp1x: w * 0.3, cp1y: -h * 0.4, cp2x: w * 0.8, cp2y: -h * 0.6, ex: w * 0.95, ey: -h * 0.4 },
      { cp1x: w * 0.3, cp1y: -h * 0.2, cp2x: w * 0.75, cp2y: -h * 0.3, ex: w * 0.85, ey: -h * 0.1 },
      { cp1x: w * 0.2, cp1y: 0, cp2x: w * 0.6, cp2y: 0, ex: w * 0.7, ey: h * 0.2 },
      { cp1x: w * 0.1, cp1y: h * 0.2, cp2x: w * 0.4, cp2y: h * 0.3, ex: w * 0.45, ey: h * 0.4 },
    ];

    feathers.forEach((f, idx) => {
      ctx.beginPath();
      ctx.moveTo(10, -10 + idx * 8);
      ctx.bezierCurveTo(f.cp1x, f.cp1y, f.cp2x, f.cp2y, f.ex, f.ey);
      ctx.bezierCurveTo(f.cp2x * 0.8, f.cp2y + 20, f.cp1x, f.cp1y + 20, 10, 10 + idx * 12);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.85 - idx * 0.12;
      ctx.fill();
      ctx.stroke();
    });

    // Central bone/spine luminesce
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(w * 0.4, -h * 0.5, w * 0.85, -h * 0.6);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#FFFFFF";
    ctx.shadowColor = "#FFFFFF";
    ctx.shadowBlur = 15;
    ctx.stroke();

    ctx.restore();
  };

  const hexToRgb = (hex: string): string => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cutoutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isSegmentingRef = useRef<boolean>(false);
  const lastSegmentedTimeRef = useRef<number>(-1);

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

      try {
        const startGpuTime = performance.now();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const videoWidth = video?.videoWidth || 0;
        const videoHeight = video?.videoHeight || 0;
        const hasVideo = !!video && video.readyState >= 2 && videoWidth > 0 && videoHeight > 0;

      let drawW = canvas.width,
        drawH = canvas.height,
        drawX = 0,
        drawY = 0;
      if (hasVideo) {
        const videoRatio = videoWidth / videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        if (fitMode === "crop") {
          if (videoRatio > canvasRatio) {
            drawW = canvas.height * videoRatio;
            drawH = canvas.height;
            drawX = (canvas.width - drawW) / 2;
            drawY = 0;
          } else {
            drawW = canvas.width;
            drawH = canvas.width / videoRatio;
            drawX = 0;
            drawY = (canvas.height - drawH) / 2;
          }
        } else if (fitMode === "fit") {
          if (videoRatio > canvasRatio) {
            drawW = canvas.width;
            drawH = canvas.width / videoRatio;
            drawX = 0;
            drawY = (canvas.height - drawH) / 2;
          } else {
            drawW = canvas.height * videoRatio;
            drawH = canvas.height;
            drawX = (canvas.width - drawW) / 2;
            drawY = 0;
          }
        } else {
          drawW = canvas.width;
          drawH = canvas.height;
          drawX = 0;
          drawY = 0;
        }

        // Trigger asynchronous real-time segmentation worker
        if (!isSegmentingRef.current) {
          const cTime = video!.currentTime;
          if (Math.abs(cTime - lastSegmentedTimeRef.current) >= 0.03 || !maskCanvasRef.current) {
            isSegmentingRef.current = true;
            segmentBodyMask(video!, {
              clipId: "body-lab-preview",
              effectId: selectedEffect,
              renderer: "canvas2d",
              time: cTime,
              width: 256,
              height: 256,
              minConfidence: 0.55,
            })
              .then((maskData) => {
                isSegmentingRef.current = false;
                lastSegmentedTimeRef.current = cTime;
                if (maskData) {
                  if (!maskCanvasRef.current) {
                    maskCanvasRef.current = document.createElement("canvas");
                  }
                  maskCanvasRef.current.width = maskData.width;
                  maskCanvasRef.current.height = maskData.height;
                  const mCtx = maskCanvasRef.current.getContext("2d");
                  if (mCtx) {
                    mCtx.putImageData(maskData, 0, 0);
                  }
                }
              })
              .catch(() => {
                isSegmentingRef.current = false;
              });
          }
        }

        // Update offscreen cutout & glow canvas buffers when mask is available
        if (maskCanvasRef.current) {
          if (!cutoutCanvasRef.current) {
            cutoutCanvasRef.current = document.createElement("canvas");
          }
          const cutoutCanvas = cutoutCanvasRef.current;
          if (cutoutCanvas.width !== Math.round(drawW) || cutoutCanvas.height !== Math.round(drawH)) {
            cutoutCanvas.width = Math.max(1, Math.round(drawW));
            cutoutCanvas.height = Math.max(1, Math.round(drawH));
          }
          const cCtx = cutoutCanvas.getContext("2d");
          if (cCtx) {
            cCtx.clearRect(0, 0, cutoutCanvas.width, cutoutCanvas.height);
            cCtx.drawImage(video!, 0, 0, cutoutCanvas.width, cutoutCanvas.height);
            cCtx.globalCompositeOperation = "destination-in";
            cCtx.imageSmoothingEnabled = true;
            cCtx.imageSmoothingQuality = "high";
            cCtx.drawImage(maskCanvasRef.current, 0, 0, cutoutCanvas.width, cutoutCanvas.height);
            cCtx.globalCompositeOperation = "source-over";
          }

          if (!glowCanvasRef.current) {
            glowCanvasRef.current = document.createElement("canvas");
          }
          const glowCanvas = glowCanvasRef.current;
          if (glowCanvas.width !== Math.round(drawW) || glowCanvas.height !== Math.round(drawH)) {
            glowCanvas.width = Math.max(1, Math.round(drawW));
            glowCanvas.height = Math.max(1, Math.round(drawH));
          }
          const gCtx = glowCanvas.getContext("2d");
          if (gCtx) {
            gCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);
            gCtx.fillStyle = parameters.color ?? "#00FFFF";
            gCtx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
            gCtx.globalCompositeOperation = "destination-in";
            gCtx.drawImage(maskCanvasRef.current, 0, 0, glowCanvas.width, glowCanvas.height);
            gCtx.globalCompositeOperation = "source-over";
          }
        }
      }

      const scaleFactor = drawH / canvas.height;
      const cx = drawX + drawW / 2;
      const cy = drawY + drawH / 2 - 20 * scaleFactor;
      const scalePulsate = (1.0 + (playing ? Math.sin(performance.now() / 200) * 0.02 : 0)) * scaleFactor;

      const effectId = (selectedEffect || "").toLowerCase().replace(/_/g, "-");

      ctx.save();

      // Base Background Pass
      const drawBaseBackground = () => {
        if (hasVideo) {
          ctx.drawImage(video!, drawX, drawY, drawW, drawH);
        } else {
          drawSimulatedBackdrop(ctx, canvas.width, canvas.height, performance.now() / 1000);
        }
      };

      // Base Subject Fill (used when simulated scene has no video)
      const drawBaseSubjectFill = () => {
        if (hasVideo) {
          ctx.drawImage(video!, drawX, drawY, drawW, drawH);
        } else {
          const subjGrad = ctx.createLinearGradient(
            cx - 50 * scalePulsate,
            cy - 100 * scalePulsate,
            cx + 50 * scalePulsate,
            cy + 150 * scalePulsate
          );
          subjGrad.addColorStop(0, "#3b82f6");
          subjGrad.addColorStop(0.5, "#1e293b");
          subjGrad.addColorStop(1, "#0f172a");
          ctx.fillStyle = subjGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      };

      // ─────────────────────────────────────────────────────────────────────────
      // 1. SUBJECT_CUTOUT (Text Behind Subject / Layer Synthesis)
      // ─────────────────────────────────────────────────────────────────────────
      if (effectId === "subject-cutout" || effectId === "alpha-cutout") {
        drawBaseBackground();

        // Typography layer placed BEHIND the human subject
        ctx.save();
        const text = parameters.cutoutText ?? "CLYPRA";
        const fontSize = (parameters.textSize ?? 120) * scaleFactor;
        ctx.font = `900 ${fontSize}px 'Geist', 'Bebas Neue', Impact, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textY = cy + (parameters.textOffsetY ?? 0) * scaleFactor;

        // Dynamic text drop shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 24 * scaleFactor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8 * scaleFactor;

        ctx.fillStyle = parameters.textColor ?? "#FFFFFF";
        ctx.fillText(text, cx, textY);
        ctx.restore();

        // Foreground Human Subject Layer (ON TOP of text)
        if (hasVideo) {
          if (cutoutCanvasRef.current) {
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          } else {
            ctx.drawImage(video!, drawX, drawY, drawW, drawH);
          }
        } else {
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          drawBaseSubjectFill();
          ctx.restore();

          // Edge Feather & Outline contour
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
          ctx.lineWidth = Math.max(1, (parameters.feather ?? 4) * 0.5 * scaleFactor);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 2. CYBER_NEON_GLOW (MaskedGlow Primitive)
      // ─────────────────────────────────────────────────────────────────────────
      else if (effectId === "cyber-glow" || effectId === "masked-glow") {
        drawBaseBackground();

        const glowColor = parameters.color ?? "#00FFCC";
        const radius = (parameters.radius ?? 15) * scaleFactor;
        const intensity = parameters.intensity ?? 1.5;

        if (hasVideo) {
          // Multi-pass contour glow around segmented subject
          if (glowCanvasRef.current) {
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            for (let pass = 3; pass >= 1; pass--) {
              ctx.save();
              ctx.shadowColor = glowColor;
              ctx.shadowBlur = pass * radius * intensity;
              ctx.drawImage(glowCanvasRef.current, drawX, drawY, drawW, drawH);
              ctx.restore();
            }
            ctx.restore();
          }

          // Foreground crisp subject
          if (cutoutCanvasRef.current) {
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          }
        } else {
          // Multi-pass contour glow around synthetic silhouette
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          for (let pass = 3; pass >= 1; pass--) {
            ctx.save();
            drawHumanSilhouette(ctx, cx, cy, scalePulsate);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = (pass * 5 + 2) * scaleFactor;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = pass * radius * intensity;
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();

          // Foreground crisp subject
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          drawBaseSubjectFill();
          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 3. ANGEL_WINGS (SkeletalSpriteAnchor Primitive)
      // ─────────────────────────────────────────────────────────────────────────
      else if (effectId === "angel-wings" || effectId === "skeletal-sprite") {
        drawBaseBackground();

        const anchorX = cx + (parameters.offsetX ?? 0) * drawW;
        const anchorY = cy - 25 * scaleFactor + (parameters.offsetY ?? 0) * drawH;
        const depthMode = parameters.depthMode ?? "behind-subject";
        const wingColor = parameters.color ?? "#00F0FF";
        const flapPhase = performance.now() / 250;

        if (depthMode === "behind-subject") {
          // Draw wings behind subject
          drawAngelWings(
            ctx,
            anchorX,
            anchorY,
            parameters.scaleX ?? 1.5,
            parameters.scaleY ?? 1.5,
            parameters.rotationDeg ?? 0,
            scaleFactor,
            wingColor,
            parameters.intensity ?? 1.2,
            flapPhase
          );

          // Draw foreground subject on top
          if (hasVideo) {
            if (cutoutCanvasRef.current) {
              ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
            }
          } else {
            ctx.save();
            drawHumanSilhouette(ctx, cx, cy, scalePulsate);
            ctx.clip();
            drawBaseSubjectFill();
            ctx.restore();
          }
        } else {
          // Draw subject first
          if (hasVideo) {
            if (cutoutCanvasRef.current) {
              ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
            }
          } else {
            ctx.save();
            drawHumanSilhouette(ctx, cx, cy, scalePulsate);
            ctx.clip();
            drawBaseSubjectFill();
            ctx.restore();
          }

          // Draw wings in front
          drawAngelWings(
            ctx,
            anchorX,
            anchorY,
            parameters.scaleX ?? 1.5,
            parameters.scaleY ?? 1.5,
            parameters.rotationDeg ?? 0,
            scaleFactor,
            wingColor,
            parameters.intensity ?? 1.2,
            flapPhase
          );
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 4. NEON_OUTLINE (MaskedStroke Primitive)
      // ─────────────────────────────────────────────────────────────────────────
      else if (effectId === "neon-outline") {
        drawBaseBackground();

        if (hasVideo) {
          if (glowCanvasRef.current) {
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.shadowColor = parameters.color ?? "#00FFFF";
            ctx.shadowBlur = (parameters.intensity ?? 1.0) * (parameters.thickness ?? 4) * 4 * scaleFactor;
            ctx.drawImage(glowCanvasRef.current, drawX, drawY, drawW, drawH);
            ctx.restore();
          }
          if (cutoutCanvasRef.current) {
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          }
        } else {
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.strokeStyle = parameters.color ?? "#00FFFF";
          ctx.lineWidth = (parameters.thickness ?? 4) * scaleFactor;
          ctx.shadowColor = parameters.color ?? "#00FFFF";
          ctx.shadowBlur = (parameters.intensity ?? 1.0) * 16 * scaleFactor;
          ctx.stroke();
          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 5. BACKGROUND_BLUR (Depth of Field Isolation)
      // ─────────────────────────────────────────────────────────────────────────
      else if (effectId === "background-blur") {
        const blurAmount = (parameters.blurAmount ?? 20) * scaleFactor;
        const darkness = parameters.darkness ?? 0.85;

        // Pass 1: Blurred background
        ctx.save();
        ctx.filter = `blur(${Math.max(1, blurAmount)}px) brightness(${darkness})`;
        drawBaseBackground();
        ctx.restore();

        // Pass 2: In-focus foreground subject (sharp, zero blur)
        if (hasVideo) {
          if (cutoutCanvasRef.current) {
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          }
        } else {
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          drawBaseSubjectFill();
          ctx.restore();

          // Subtle soft rim lighting on in-focus subject
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1.5 * scaleFactor;
          ctx.stroke();
          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 6. ELECTRO_CONTOUR (High-Voltage Lightning Arcs Hugging Silhouette)
      // ─────────────────────────────────────────────────────────────────────────
      else if (effectId === "electro-contour" || effectId === "lightning-contour") {
        drawBaseBackground();

        const arcColor = parameters.arcColor ?? "#00E5FF";
        const arcJitter = (parameters.arcJitter ?? 15) * scaleFactor;
        const arcBranches = parameters.arcBranches ?? 4;
        const arcGlow = parameters.arcGlow ?? 1.8;
        const arcWidth = (parameters.arcWidth ?? 2.5) * scaleFactor;

        if (hasVideo) {
          // Pass 1: Radiating electrical ionization aura from segmentation mask
          if (glowCanvasRef.current) {
            ctx.save();
            ctx.globalCompositeOperation = "screen";
            ctx.shadowColor = arcColor;
            ctx.shadowBlur = 24 * arcGlow * scaleFactor;
            ctx.drawImage(glowCanvasRef.current, drawX, drawY, drawW, drawH);
            ctx.restore();
          }

          // Pass 2: High-voltage lightning crackles along subject perimeter
          ctx.save();
          ctx.globalCompositeOperation = "screen";

          // Outer colored glow stroke
          ctx.strokeStyle = arcColor;
          ctx.lineWidth = arcWidth * 2;
          ctx.shadowColor = arcColor;
          ctx.shadowBlur = 20 * arcGlow * scaleFactor;
          drawLightningContour(ctx, cx, cy, scalePulsate, arcJitter, arcBranches);

          // Inner high-heat white discharge core
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = Math.max(1, arcWidth * 0.8);
          ctx.shadowColor = "#FFFFFF";
          ctx.shadowBlur = 8 * scaleFactor;
          drawLightningContour(ctx, cx, cy, scalePulsate, arcJitter * 0.8, 0);

          ctx.restore();

          // Foreground subject
          if (cutoutCanvasRef.current) {
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          }
        } else {
          // Synthetic Mode
          ctx.save();
          ctx.globalCompositeOperation = "screen";

          // Outer colored glow arc stroke
          ctx.strokeStyle = arcColor;
          ctx.lineWidth = arcWidth * 2;
          ctx.shadowColor = arcColor;
          ctx.shadowBlur = 22 * arcGlow * scaleFactor;
          drawLightningContour(ctx, cx, cy, scalePulsate, arcJitter, arcBranches);

          // Inner white core
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = Math.max(1, arcWidth * 0.8);
          ctx.shadowColor = "#FFFFFF";
          ctx.shadowBlur = 8 * scaleFactor;
          drawLightningContour(ctx, cx, cy, scalePulsate, arcJitter * 0.8, 0);
          ctx.restore();

          // Foreground crisp human subject
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          drawBaseSubjectFill();
          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 7. PARTICLE_AURA (Procedural Orbiting Particle Swarms)
      // ─────────────────────────────────────────────────────────────────────────
      else if (effectId === "particle-aura" || effectId === "flame-trail") {
        drawBaseBackground();

        const pColor = parameters.particleColor ?? parameters.colorStart ?? "#FFFFFF";
        const pSize = parameters.particleSize ?? 3;
        const pSpeed = parameters.speed ?? 0.5;
        const pSpread = parameters.spread ?? 10;
        const glow = parameters.glow ?? 0.3;

        if (particlesRef.current.length < (parameters.particleCount ?? 50)) {
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * 150 * scaleFactor,
            y: cy + (Math.random() - 0.5) * 350 * scaleFactor,
            vx: (Math.random() - 0.5) * pSpeed * 5 * scaleFactor,
            vy: (-Math.random() * pSpeed * 4 - 1) * scaleFactor,
            size: (Math.random() * pSize + 1) * scaleFactor,
            alpha: Math.random(),
            life: 1.0,
          });
        }

        ctx.save();
        ctx.shadowColor = pColor;
        ctx.shadowBlur = glow * 12 * scaleFactor;

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
              x: cx + (Math.random() - 0.5) * (100 + pSpread * 5) * scaleFactor,
              y: cy + 180 * scaleFactor,
              vx: (Math.random() - 0.5) * pSpeed * 4 * scaleFactor,
              vy: (-Math.random() * pSpeed * 5 - 1.5) * scaleFactor,
              size: (Math.random() * pSize + 1) * scaleFactor,
              alpha: Math.random(),
              life: 1.0,
            };
          }
        });
        ctx.restore();

        // Draw subject on top
        if (hasVideo) {
          if (cutoutCanvasRef.current) {
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          }
        } else {
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          drawBaseSubjectFill();
          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 8. COLOR_ISOLATION (Luma-Desat Background, Full Color Subject)
      // ─────────────────────────────────────────────────────────────────────────
      else if (effectId === "color-isolation") {
        const desat = parameters.desaturation ?? 1.0;

        // Pass 1: Grayscale / Desaturated Background
        ctx.save();
        ctx.filter = `grayscale(${desat * 100}%) contrast(1.1)`;
        drawBaseBackground();
        ctx.restore();

        // Pass 2: Vivid Full-Color Subject
        if (hasVideo) {
          ctx.save();
          if (parameters.colorBoost > 0) {
            ctx.filter = `saturate(${1.0 + parameters.colorBoost * 2})`;
          }
          if (cutoutCanvasRef.current) {
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          }
          ctx.restore();
        } else {
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          if (parameters.colorBoost > 0) {
            ctx.filter = `saturate(${1.0 + parameters.colorBoost * 2})`;
          }
          drawBaseSubjectFill();
          ctx.restore();
        }
      }

      // ─────────────────────────────────────────────────────────────────────────
      // 9. BODY_GHOST_CLONE (Chromatic Motion Trailing Ghost Clones)
      // ─────────────────────────────────────────────────────────────────────────
      else if (effectId === "body-ghost" || effectId === "ghost-clone") {
        drawBaseBackground();

        const ghostCount = Math.min(6, Math.max(1, parameters.ghostCount ?? 3));
        const spacing = (parameters.ghostOffset ?? 25) * scaleFactor;
        const baseOpacity = parameters.ghostOpacity ?? 0.6;
        const ghostColor = parameters.ghostColor ?? "#FF007F";
        const blendMode = (parameters.ghostBlendMode ?? "screen") as GlobalCompositeOperation;
        const timeFactor = playing ? performance.now() / 300 : 0;

        if (hasVideo) {
          // Render lagging motion clones behind main subject
          if (cutoutCanvasRef.current) {
            for (let i = ghostCount; i >= 1; i--) {
              const dx = -i * spacing;
              const dy = Math.sin(timeFactor + i * 0.8) * 6 * scaleFactor;
              const echoAlpha = baseOpacity * (1 - (i - 1) / (ghostCount + 0.5));

              ctx.save();
              ctx.globalAlpha = Math.max(0.05, Math.min(1.0, echoAlpha));
              ctx.globalCompositeOperation = blendMode;

              // Alternating chromatic tinting (Cyan / Magenta or Custom Ghost Color)
              if (i % 2 === 1) {
                ctx.shadowColor = "#00FFFF";
                ctx.shadowBlur = 12 * scaleFactor;
              } else {
                ctx.shadowColor = ghostColor;
                ctx.shadowBlur = 12 * scaleFactor;
              }

              ctx.drawImage(cutoutCanvasRef.current, drawX + dx, drawY + dy, drawW, drawH);
              ctx.restore();
            }
          }

          // Foreground main subject
          if (cutoutCanvasRef.current) {
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          }
        } else {
          // Synthetic Mode
          for (let i = ghostCount; i >= 1; i--) {
            const dx = -i * spacing;
            const dy = Math.sin(timeFactor + i * 0.8) * 6 * scaleFactor;
            const echoAlpha = baseOpacity * (1 - (i - 1) / (ghostCount + 0.5));
            const tint = i % 2 === 1 ? "#00FFFF" : ghostColor;

            ctx.save();
            ctx.globalAlpha = Math.max(0.05, Math.min(1.0, echoAlpha));
            ctx.globalCompositeOperation = blendMode;

            drawHumanSilhouette(ctx, cx + dx, cy + dy, scalePulsate);
            ctx.strokeStyle = tint;
            ctx.lineWidth = 2 * scaleFactor;
            ctx.shadowColor = tint;
            ctx.shadowBlur = 14 * scaleFactor;
            ctx.stroke();

            ctx.fillStyle = `rgba(${hexToRgb(tint)}, 0.35)`;
            ctx.fill();
            ctx.restore();
          }

          // Foreground crisp human subject
          ctx.save();
          drawHumanSilhouette(ctx, cx, cy, scalePulsate);
          ctx.clip();
          drawBaseSubjectFill();
          ctx.restore();
        }
      }

      // Fallback
      else {
        drawBaseBackground();
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
    } catch (err) {
      console.warn("[BodyLabView] Frame render error:", err);
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
      particleCount: 50,
      particleSize: 3,
      speed: 0.5,
      particleColor: "#FFFFFF",
      spread: 10,
      glow: 0.3,
      desaturation: 1.0,
      edgeBlend: 0.3,
      colorBoost: 0.0,
      cutoutText: "CLYPRA",
      textColor: "#FFFFFF",
      textSize: 120,
      textOffsetY: 0,
      feather: 4,
      choke: 0.2,
      radius: 18,
      scaleX: 1.5,
      scaleY: 1.5,
      offsetX: 0.0,
      offsetY: -0.05,
      rotationDeg: 0,
      anchorKeypoint: "spineCenter",
      depthMode: "behind-subject",
      followTorsoOrientation: true,
      arcColor: "#00E5FF",
      arcJitter: 15,
      arcBranches: 4,
      arcGlow: 1.8,
      arcWidth: 2.5,
      ghostCount: 3,
      ghostOffset: 25,
      ghostOpacity: 0.6,
      ghostColor: "#FF007F",
      ghostBlendMode: "screen",
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
      <TopNavBar onExportManifest={() => setIsExportModalOpen(true)} />

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

      <ManifestExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedEffect={selectedEffect}
        parameters={parameters}
      />
    </div>
  );
}

export default BodyLabView;
