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
  const [selectedEffect, setSelectedEffect] = useState<string>("subject-cutout");
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
    cutoutText: "CLYPRA",
    textColor: "#FFFFFF",
    textSize: 120,
    textOffsetY: 0,
    feather: 4,
    choke: 0.2,
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

  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cutoutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const featherCanvasRef = useRef<HTMLCanvasElement | null>(null);
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
            // Maintain video aspect ratio for the segmentation input
            const aspect = videoWidth / Math.max(1, videoHeight);
            const targetDim = 384;
            const segWidth = aspect >= 1 ? targetDim : Math.max(1, Math.round(targetDim * aspect));
            const segHeight = aspect >= 1 ? Math.max(1, Math.round(targetDim / aspect)) : targetDim;

            // Map choke slider (0.0 to 1.0, default 0.2) to minConfidence.
            // The selfie_multiclass model outputs lower per-class confidence values
            // compared to the old single-class selfie_segmenter, so we use a lower
            // base range (0.30–0.70) to avoid under-masking hair and body regions.
            const chokeVal = typeof parameters.choke === "number" ? parameters.choke : 0.2;
            const effectiveMinConf = Math.min(0.70, Math.max(0.30, 0.35 + chokeVal * 0.35));

            segmentBodyMask(video!, {
              clipId: "body-lab-preview",
              effectId: selectedEffect,
              renderer: "canvas2d",
              time: cTime,
              width: segWidth,
              height: segHeight,
              minConfidence: effectiveMinConf,
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

        // Update offscreen cutout canvas buffers when mask is available.
        // Two-pass feather strategy:
        //   Pass 1: Render the mask onto a temp canvas with CSS blur — this creates
        //           a soft edge that feathers OUTWARD from the mask boundary.
        //   Pass 2: Use that blurred mask as destination-in alpha source.
        // This prevents feather blur from eroding the interior of the subject
        // (which would allow the text behind to bleed through the face/body).
        if (maskCanvasRef.current) {
          if (!cutoutCanvasRef.current) {
            cutoutCanvasRef.current = document.createElement("canvas");
          }
          const cutoutCanvas = cutoutCanvasRef.current;
          const targetW = Math.max(1, Math.round(drawW));
          const targetH = Math.max(1, Math.round(drawH));
          if (cutoutCanvas.width !== targetW || cutoutCanvas.height !== targetH) {
            cutoutCanvas.width = targetW;
            cutoutCanvas.height = targetH;
          }
          const cCtx = cutoutCanvas.getContext("2d");
          if (cCtx) {
            const feather = typeof parameters.feather === "number" ? parameters.feather : 4;

            // Pass 1: Build the precision alpha mask for compositing.
            //
            // The mask arrives at 256×256 from the worker and is drawn into the
            // display-resolution feather canvas via drawImage(). The browser's
            // bilinear interpolation already creates smooth, anti-aliased edges —
            // NO additional blur filter is applied here, because that would expand
            // the mask boundary beyond the actual person silhouette and eat adjacent
            // text characters (e.g. the "u" in "Musa" sitting right of the face edge).
            //
            // The feather slider controls edge softness via the solidification
            // threshold: higher feather → lower threshold → wider soft-edge band.
            if (!featherCanvasRef.current) {
              featherCanvasRef.current = document.createElement("canvas");
            }
            const featherCanvas = featherCanvasRef.current;
            if (featherCanvas.width !== targetW || featherCanvas.height !== targetH) {
              featherCanvas.width = targetW;
              featherCanvas.height = targetH;
            }
            const fCtx = featherCanvas.getContext("2d");
            if (fCtx) {
              fCtx.clearRect(0, 0, targetW, targetH);
              // Draw mask — bilinear upscaling gives smooth edge, no blur needed
              fCtx.imageSmoothingEnabled = true;
              fCtx.imageSmoothingQuality = "high";
              fCtx.drawImage(maskCanvasRef.current, 0, 0, targetW, targetH);

              // Interior solidification: pixels clearly inside the subject become
              // fully opaque so text cannot bleed through face/hair/body.
              // feather=0 → threshold=230 (very tight edge), feather=20 → threshold=140
              // (wider soft transition). This is the ONLY expansion mechanism, and it
              // operates on already-upscaled bilinear values so boundary accuracy is
              // preserved — we're just hardening the high-confidence interior.
              const solidifyThreshold = Math.round(230 - feather * 4.5);
              const fImageData = fCtx.getImageData(0, 0, targetW, targetH);
              const fd = fImageData.data;
              for (let pi = 3; pi < fd.length; pi += 4) {
                const a = fd[pi];
                if (a >= solidifyThreshold) {
                  fd[pi] = 255; // solid interior — text cannot bleed through
                } else if (a > 0) {
                  // Smoothstep the edge transition for a clean anti-aliased boundary
                  const t = a / solidifyThreshold;
                  fd[pi] = Math.round(t * t * (3 - 2 * t) * a);
                }
              }
              fCtx.putImageData(fImageData, 0, 0);
            }

            // Pass 2: Draw the video frame, then cut out using the feathered mask.
            cCtx.clearRect(0, 0, targetW, targetH);
            cCtx.imageSmoothingEnabled = true;
            cCtx.imageSmoothingQuality = "high";
            cCtx.drawImage(video!, 0, 0, targetW, targetH);
            cCtx.globalCompositeOperation = "destination-in";
            cCtx.drawImage(featherCanvas, 0, 0, targetW, targetH);
            cCtx.globalCompositeOperation = "source-over";
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

        // Typography layer placed BEHIND the human subject.
        // We pin the text to the full canvas center (not the video sub-rect) so
        // it bleeds edge-to-edge, matching the professional "text behind subject" look.
        ctx.save();
        const text = parameters.cutoutText ?? "CLYPRA";
        // Base font size is relative to canvas width so long names auto-scale.
        const baseFontSize = (parameters.textSize ?? 120) * scaleFactor;
        ctx.font = `900 ${baseFontSize}px 'Geist', 'Bebas Neue', Impact, sans-serif`;

        // Auto-shrink only if text is EXTREMELY wide (> 115% canvas width).
        // At 96% (the old cap), "CLYPRA" at 120px was shrunk so much that C and A
        // landed right at the canvas edges where the person's beard/shoulder mask
        // could slice through them, creating the "C cut into two vertically" artifact.
        //
        // At 115%, the natural text size is preserved and bleeds ~7-8% off each edge.
        // The canvas boundary clips the outer arc tips of C and A — this is the
        // INTENDED full-bleed aesthetic (like professional music video/reel text effects).
        // The person's body only covers the MIDDLE characters (L Y P R in "CLYPRA").
        const maxTextW = canvas.width * 1.15;
        const measuredW = ctx.measureText(text).width;
        const autoFontSize = measuredW > maxTextW
          ? baseFontSize * (maxTextW / measuredW)
          : baseFontSize;
        ctx.font = `900 ${autoFontSize}px 'Geist', 'Bebas Neue', Impact, sans-serif`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // textY is anchored to canvas center (full-bleed layout).
        // textOffsetY lets the user nudge up/down in canvas-height units.
        const textCanvasCX = canvas.width / 2;
        const textCanvasCY = canvas.height / 2;
        const textY = textCanvasCY + (parameters.textOffsetY ?? 0) * scaleFactor;

        // Dynamic text drop shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 24 * scaleFactor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8 * scaleFactor;

        ctx.fillStyle = parameters.textColor ?? "#FFFFFF";
        ctx.fillText(text, textCanvasCX, textY);
        ctx.restore();

        // Foreground Human Subject Layer (ON TOP of text).
        // IMPORTANT: we must NEVER draw the raw full-frame video on top of the text
        // in the subject-cutout effect — doing so completely buries the text layer.
        // While the segmentation mask is warming up we show a ghost (semi-transparent)
        // video so the text remains visible, and we overlay a status chip.
        if (hasVideo) {
          if (cutoutCanvasRef.current && maskCanvasRef.current) {
            // Mask is ready — draw the clean cutout (subject only, transparent bg)
            ctx.drawImage(cutoutCanvasRef.current, drawX, drawY, drawW, drawH);
          } else {
            // Mask is still loading — draw a 40% opacity ghost of the video so
            // the typography behind is clearly visible.
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.drawImage(video!, drawX, drawY, drawW, drawH);
            ctx.globalAlpha = 1;

            // "Segmenting…" status chip
            const chipText = "⏳ Segmenting…";
            const chipFontSize = Math.max(10, 13 * scaleFactor);
            ctx.font = `600 ${chipFontSize}px 'Geist', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const chipW = ctx.measureText(chipText).width + 24 * scaleFactor;
            const chipH = chipFontSize * 1.8;
            const chipX = cx - chipW / 2;
            const chipY = drawY + drawH - chipH - 12 * scaleFactor;
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.beginPath();
            ctx.roundRect(chipX, chipY, chipW, chipH, chipH / 2);
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.fillText(chipText, cx, chipY + chipH / 2);
            ctx.restore();
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
          ctx.stroke();
          ctx.restore();
        }
      } else {
        drawBaseBackground();
      }

      ctx.restore();

      const now = performance.now();
      const frameDelta = now - startGpuTime;

      if (now - statsTimer >= 500) {
        setLatency(parseFloat(frameDelta.toFixed(2)));
        setCpuUsage(Math.round(11 + Math.random() * 8));
        setGpuUsage(Math.round(30 + Math.random() * 15));
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
      cutoutText: "CLYPRA",
      textColor: "#FFFFFF",
      textSize: 120,
      textOffsetY: 0,
      feather: 4,
      choke: 0.2,
    });
    setSelectedEffect("subject-cutout");
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
