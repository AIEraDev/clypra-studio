/**
 * Video Effect Workspace
 * Clean, optimized version for smooth playback
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  EffectRenderer,
  type EffectRendererType,
  type EffectParameters,
  EffectGraph,
  EffectEngine,
  PixiRenderer,
  ExamplePixiEffects,
  getEffectMetadata,

  // PixiJS Effects
  GlowEffect,
  LightLeakEffect,
  VignetteEffect,
  LensFlareEffect,
  RGBSplitEffect,
  VHSEffect,
  GlitchBandEffect,
  CRTEffect,
  FilmGrainEffect,
  TiltShiftEffect,
  CinematicLUTEffect,
  MotionBlurEffect,
  ShockwaveEffect,
  BulgePinchEffect,
  TwistEffect,
  ReflectionEffect,
  ColorGradientEffect,
  ColorOverlayEffect,
  HslAdjustmentEffect,
  AlphaEffect,
  ColorMatrixEffect,
  NeonGlowEffect,
  GaussianBlurEffect,
  KawaseBlurEffect,
  ZoomBlurEffect,
  RadialBlurEffect,
  DropShadowEffect,
  StaticNoiseEffect,
  OldFilmEffect,
  DisplacementEffect,
  OutlineEffect,
  GrayscaleEffect,
  DotEffect,
  EmbossEffect,
  CrossHatchEffect,
  PixelateEffect,
  AsciiEffect,
} from "@clypra/engine";
import { Filter } from "pixi.js";
import { VideoPlayer, EffectParameterEditor } from "../common";
import { exportStaticImageWithEffect } from "./EffectVideoExporter";
import { Download, Upload, Info, Image as ImageIcon, Film, Sparkles, Loader2, Send, CloudUpload } from "lucide-react";
import { useR2Publish } from "../../../hooks/useR2Publish";
import { AIEffectGenerator } from "./AIEffectGenerator";

export function VideoEffectWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const effectEngineRef = useRef<EffectEngine>(new EffectEngine());
  const pixiRendererRef = useRef<PixiRenderer | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [isImage, setIsImage] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<EffectRendererType | null>(null);
  const [intensity, setIntensity] = useState(0.8);
  const [parameters, setParameters] = useState<EffectParameters>({ intensity: 50, frequency: 10 });
  const [currentTime, setCurrentTime] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<{ duration: number; width: number; height: number } | null>(null);

  // AI Generation State
  const [customAIEffect, setCustomAIEffect] = useState<{
    id: string;
    name: string;
    description: string;
    backend: string;
    code?: string;
    glsl?: string;
    params: any;
  } | null>(null);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiLoadingStep, setAiLoadingStep] = useState("");
  const [approvedAIEffects, setApprovedAIEffects] = useState<any[]>([]);

  // PixiJS Preset effects mapping
  const PIXI_PRESETS = useRef<Record<string, any>>({
    "neon-glow": ExamplePixiEffects.NeonGlowEffect,
    "particle-burst": ExamplePixiEffects.ParticleBurstEffect,
    "vhs-composite": ExamplePixiEffects.VHSCompositeEffect,

    // New batch of PixiJS effects
    glow: GlowEffect,
    "light-leak": LightLeakEffect,
    vignette: VignetteEffect,
    "lens-flare": LensFlareEffect,
    "rgb-split": RGBSplitEffect,
    vhs: VHSEffect,
    "glitch-band": GlitchBandEffect,
    crt: CRTEffect,
    "film-grain": FilmGrainEffect,
    "tilt-shift": TiltShiftEffect,
    "cinematic-lut": CinematicLUTEffect,
    "motion-blur": MotionBlurEffect,
    shockwave: ShockwaveEffect,
    "bulge-pinch": BulgePinchEffect,
    twist: TwistEffect,
    reflection: ReflectionEffect,
    "color-gradient": ColorGradientEffect,
    "color-overlay": ColorOverlayEffect,
    "hsl-adjustment": HslAdjustmentEffect,
    alpha: AlphaEffect,
    "color-matrix": ColorMatrixEffect,
    "gaussian-blur": GaussianBlurEffect,
    "kawase-blur": KawaseBlurEffect,
    "zoom-blur": ZoomBlurEffect,
    "radial-blur": RadialBlurEffect,
    "drop-shadow": DropShadowEffect,
    "static-noise": StaticNoiseEffect,
    "old-film": OldFilmEffect,
    displacement: DisplacementEffect,
    outline: OutlineEffect,
    grayscale: GrayscaleEffect,
    dot: DotEffect,
    emboss: EmbossEffect,
    "cross-hatch": CrossHatchEffect,
    pixelate: PixelateEffect,
    ascii: AsciiEffect,
  }).current;

  const isPixiBackend = (selectedEffect && selectedEffect in PIXI_PRESETS) || (selectedEffect === "custom" && customAIEffect && customAIEffect.backend === "pixi");

  // R2 Publishing State
  const { publishVideoEffectPreset } = useR2Publish();
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishName, setPublishName] = useState("");
  const [publishDescription, setPublishDescription] = useState("");
  const [publishTags, setPublishTags] = useState("");

  const handlePublish = async () => {
    if (!publishName.trim() || !selectedEffect) return;
    setIsPublishing(true);
    try {
      if (selectedEffect === ("custom" as any) && customAIEffect) {
        const host = window.location.hostname;
        const base = host === "localhost" || host === "127.0.0.1" ? "http://localhost:8787" : "https://clypra-worker-api.abdulkabirmusa.com";

        const token = localStorage.getItem("clypra_auth_token");
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(`${base}/ai/publish-pending`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            id: customAIEffect.id,
            name: publishName,
            description: publishDescription,
            tags: publishTags,
            params: parameters,
          }),
        });

        if (!res.ok) throw new Error("Failed to publish pending effect");
        const data = await res.json();
        alert(data.message || "Effect submitted for moderator review!");
        setShowPublishModal(false);
        return;
      }

      const result = await publishVideoEffectPreset({
        id: publishName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        kind: "video",
        metadata: {
          name: publishName,
          description: publishDescription,
          renderer: selectedEffect,
          params: parameters,
          intensity: {
            min: 0,
            max: 100,
            default: intensity * 100,
            step: 1,
          },
          tags: publishTags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          published: true, // Assuming auto-publish for now
        },
      });
      alert(result.message);
      setShowPublishModal(false);
    } catch (error) {
      console.error("Publishing failed:", error);
      alert(error instanceof Error ? error.message : "Failed to publish effect");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAIEffectGenerated = (effect: any) => {
    setCustomAIEffect(effect);
    setSelectedEffect("custom" as any);

    // Extract default values for parameters
    const defaultParams: Record<string, any> = {};
    if (effect.params) {
      Object.entries(effect.params).forEach(([k, def]: [string, any]) => {
        defaultParams[k] = def.value;
      });
    }
    setParameters(defaultParams);
    setIntensity(0.85); // Set master intensity to 85%
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load effects from registry
  const [effectCategories, setEffectCategories] = useState<Record<string, EffectRendererType[]>>({});

  useEffect(() => {
    // Dynamically load effects from @clypra/engine
    const loadEffects = async () => {
      const { getEffectsByCategory } = await import("@clypra/engine");

      const categories: Record<string, EffectRendererType[]> = {};

      // Load Camera effects
      const cameraEffects = getEffectsByCategory("camera" as any);
      if (cameraEffects && Array.isArray(cameraEffects) && cameraEffects.length > 0) {
        categories.Camera = cameraEffects.map((e: any) => e.id as EffectRendererType);
      }

      // Load Light effects
      const lightEffects = getEffectsByCategory("light");
      if (lightEffects && Array.isArray(lightEffects) && lightEffects.length > 0) {
        categories.Light = lightEffects.map((e: any) => e.id as EffectRendererType);
      }

      // Load PixiJS GPU effects
      categories["GPU PixiJS"] = ["neon-glow", "particle-burst", "vhs-composite", "glow", "light-leak", "vignette", "lens-flare", "rgb-split", "vhs", "glitch-band", "crt", "film-grain", "tilt-shift", "cinematic-lut", "motion-blur", "shockwave", "bulge-pinch", "twist", "reflection", "color-gradient", "color-overlay", "hsl-adjustment", "alpha", "color-matrix", "gaussian-blur", "kawase-blur", "zoom-blur", "radial-blur", "drop-shadow", "static-noise", "old-film", "displacement", "outline", "grayscale", "dot", "emboss", "cross-hatch", "pixelate", "ascii"] as any[];

      setEffectCategories(categories);

      // Load approved AI Generated effects from API
      try {
        const host = window.location.hostname;
        const base = host === "localhost" || host === "127.0.0.1" ? "http://localhost:8787" : "https://clypra-worker-api.abdulkabirmusa.com";

        const res = await fetch(`${base}/video-effects/ai-generated`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setApprovedAIEffects(list);
          }
        }
      } catch (err) {
        console.error("Failed to load approved AI effects:", err);
      }
    };

    loadEffects();
  }, []);

  // Initialize PixiRenderer dynamically on the target canvas DOM element
  useEffect(() => {
    if (!isPixiBackend) {
      if (pixiRendererRef.current) {
        pixiRendererRef.current.destroy();
        pixiRendererRef.current = null;
      }
      return;
    }

    const canvas = pixiCanvasRef.current;
    if (!canvas) return;

    let active = true;

    const initPixi = async () => {
      const renderer = new PixiRenderer();
      await renderer.init(canvas, canvas.width || 1280, canvas.height || 720);
      if (active) {
        pixiRendererRef.current = renderer;
        // Bind media source
        if (isImage && imageUrl) {
          import("pixi.js").then(async ({ Texture }) => {
            const tex = await Texture.from(imageUrl);
            if (active && pixiRendererRef.current) {
              const sprite = (pixiRendererRef.current as any).videoSprite;
              if (sprite) sprite.texture = tex;
            }
          });
        } else if (videoElementRef.current) {
          renderer.setVideoSource(videoElementRef.current);
        }
        applyPixiEffect();
      } else {
        renderer.destroy();
      }
    };

    initPixi();

    return () => {
      active = false;
      if (pixiRendererRef.current) {
        pixiRendererRef.current.destroy();
        pixiRendererRef.current = null;
      }
    };
  }, [isPixiBackend, imageUrl, isImage]);

  // Apply parameters to PixiRenderer
  const applyPixiEffect = useCallback(() => {
    const renderer = pixiRendererRef.current;
    if (!renderer) return;

    let effectDef: any = null;

    if (selectedEffect === "custom" && customAIEffect) {
      if (customAIEffect.backend === "pixi" && customAIEffect.glsl) {
        // Reconstruct dynamic uniforms schema
        const uniforms: Record<string, any> = {
          uTime: { value: 0, type: "f32" },
          uIntensity: { value: intensity, type: "f32" },
        };
        const paramsMap = Array.isArray(customAIEffect.params)
          ? customAIEffect.params.reduce((acc: any, p: any) => {
              acc[p.key] = p;
              return acc;
            }, {})
          : customAIEffect.params;

        if (paramsMap) {
          Object.entries(paramsMap).forEach(([key, schema]: [string, any]) => {
            const val = parameters[key] !== undefined ? parameters[key] : schema.value;
            const uniformKey = `u${key.charAt(0).toUpperCase() + key.slice(1)}`;
            if (schema.type === "color") {
              const r = parseInt((val as string).slice(1, 3), 16) / 255;
              const g = parseInt((val as string).slice(3, 5), 16) / 255;
              const b = parseInt((val as string).slice(5, 7), 16) / 255;
              uniforms[uniformKey] = { value: [r, g, b], type: "vec3<f32>" };
            } else if (schema.type === "toggle") {
              uniforms[uniformKey] = { value: val, type: "bool" };
            } else {
              uniforms[uniformKey] = { value: val, type: "f32" };
            }
          });
        }

        const DEFAULT_VERTEX_SHADER = `
          in vec2 aPosition;
          out vec2 vTextureCoord;
          uniform vec4 uInputSize;
          uniform vec4 uOutputFrame;
          vec4 filterVertexPosition(void) {
            vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
            return vec4(position * uInputSize.zw * 2.0 - 1.0, 0.0, 1.0);
          }
          vec2 filterTextureCoord(void) {
            return aPosition * (uOutputFrame.zw * uInputSize.xy);
          }
          void main(void) {
            gl_Position = filterVertexPosition();
            vTextureCoord = filterTextureCoord();
          }
        `;

        const filterSpec = {
          create: () => {
            return Filter.from({
              gl: { vertex: DEFAULT_VERTEX_SHADER, fragment: customAIEffect.glsl! },
              resources: { uniforms },
            });
          },
          updateUniforms: (filter: any, paramVals: any, elapsed: number) => {
            const u = filter.resources?.uniforms?.uniforms;
            if (!u) return;
            u.uTime = elapsed / 1000;
            u.uIntensity = intensity;

            const pMap = Array.isArray(customAIEffect.params)
              ? customAIEffect.params.reduce((acc: any, p: any) => {
                  acc[p.key] = p;
                  return acc;
                }, {})
              : customAIEffect.params;

            if (pMap) {
              Object.entries(pMap).forEach(([key, schema]: [string, any]) => {
                const val = paramVals[key] !== undefined ? paramVals[key] : schema.value;
                const uniformKey = `u${key.charAt(0).toUpperCase() + key.slice(1)}`;
                if (schema.type === "color") {
                  const hex = val as string;
                  u[uniformKey] = [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
                } else {
                  u[uniformKey] = val;
                }
              });
            }
          },
        };

        effectDef = {
          backend: "pixi",
          subtype: "filter",
          id: customAIEffect.id,
          name: customAIEffect.name,
          category: "custom",
          description: customAIEffect.description,
          tags: [],
          params: Array.isArray(customAIEffect.params)
            ? customAIEffect.params
            : Object.entries(customAIEffect.params).map(([k, v]: [string, any]) => ({
                key: k,
                label: v.label,
                type: v.type,
                value: v.value,
                min: v.min,
                max: v.max,
                step: v.step,
              })),
          filterSpec,
        };
      }
    } else if (selectedEffect && selectedEffect in PIXI_PRESETS) {
      effectDef = (PIXI_PRESETS as any)[selectedEffect];
    }

    if (effectDef) {
      const graph = new EffectGraph();
      graph.addNode({
        id: "effect-node",
        effect: effectDef,
        dependencies: [],
      });

      const paramMap = new Map();
      paramMap.set("effect-node", { ...parameters });

      renderer.applyNodes(graph.resolvePixi(), paramMap);
    }
  }, [selectedEffect, customAIEffect, parameters, intensity]);

  // Keep uniforms sync'ed when properties change
  useEffect(() => {
    if (isPixiBackend && pixiRendererRef.current) {
      applyPixiEffect();
    }
  }, [isPixiBackend, selectedEffect, parameters, intensity, applyPixiEffect]);

  const handleParamChange = useCallback(
    (newParams: EffectParameters) => {
      setParameters(newParams);
      const renderer = pixiRendererRef.current;
      if (renderer && isPixiBackend) {
        Object.entries(newParams).forEach(([key, value]) => {
          if (parameters[key] !== value) {
            renderer.updateParam("effect-node", key, value);
          }
        });
      }
    },
    [parameters, isPixiBackend],
  );

  // Handle video upload
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setImageUrl(undefined);
    setIsImage(false);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setVideoUrl(undefined);
    setIsImage(true);

    // Load image and render to canvas
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      setVideoMetadata({
        duration: 3, // Default duration for effect
        width: img.width,
        height: img.height,
      });
    };
    img.src = url;
  }, []);

  // Render effect on canvas (optimized)
  const renderEffect = useCallback(
    (video: HTMLVideoElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Apply effect if selected
      if (selectedEffect === ("custom" as any)) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (customAIEffect) {
          try {
            const ClassConstructor = new Function(`return ${customAIEffect.code}`)();
            const instance = new ClassConstructor();
            if (instance && typeof instance.drawFrame === "function") {
              instance.drawFrame(ctx, canvas.width, canvas.height, video.currentTime, {
                ...parameters,
                intensity: intensity * 100,
              });
            }
          } catch (e) {
            console.error("Custom AI Effect error:", e);
          }
        }
        return;
      }

      // Apply effect if selected
      if (selectedEffect) {
        try {
          const graphDef = {
            schemaVersion: "2.0.0",
            graphId: "studio-video-graph",
            name: "Studio Video Sandbox Graph",
            nodes: [
              { id: "input-node", type: "source", params: {} },
              { id: "effect-node", type: selectedEffect, params: { ...parameters, intensity: intensity * 100 } },
            ],
            connections: [{ fromNode: "input-node", fromOutput: "output", toNode: "effect-node", toInput: "input" }],
          };

          const graph = new EffectGraph(graphDef);
          effectEngineRef.current.loadGraph(graph);
          effectEngineRef.current.render(ctx, video.currentTime, video);
        } catch (error) {
          console.error("Effect graph engine error:", error);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          EffectRenderer.apply(ctx, selectedEffect, parameters, intensity, video.currentTime);
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    },
    [selectedEffect, parameters, intensity],
  );

  // Smooth animation loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !videoElementRef.current) return;

    const video = videoElementRef.current;
    let rafId: number;

    const animate = () => {
      if (video && !video.paused && !video.ended) {
        if (!isPixiBackend) {
          renderEffect(video);
        }
        setCurrentTime(video.currentTime);
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying, renderEffect, isPixiBackend]);

  // Animation loop for static images
  useEffect(() => {
    if (!isImage || !imageUrl || !selectedEffect || isPixiBackend) return;

    let rafId: number;
    let startTime = performance.now();

    const animateImage = (timestamp: number) => {
      const elapsed = (timestamp - startTime) / 1000; // Convert to seconds
      const time = elapsed % 3; // Loop every 3 seconds

      setCurrentTime(time);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Load and draw image
      const img = new Image();
      img.onload = () => {
        // Apply effect
        if (selectedEffect === ("custom" as any)) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          if (customAIEffect) {
            try {
              const ClassConstructor = new Function(`return ${customAIEffect.code}`)();
              const instance = new ClassConstructor();
              if (instance && typeof instance.drawFrame === "function") {
                instance.drawFrame(ctx, canvas.width, canvas.height, time, {
                  ...parameters,
                  intensity: intensity * 100,
                });
              }
            } catch (e) {
              console.error("Custom AI Effect error:", e);
            }
          }
          return;
        }

        try {
          const graphDef = {
            schemaVersion: "2.0.0",
            graphId: "studio-image-graph",
            name: "Studio Image Sandbox Graph",
            nodes: [
              { id: "input-node", type: "source", params: {} },
              { id: "effect-node", type: selectedEffect, params: { ...parameters, intensity: intensity * 100 } },
            ],
            connections: [{ fromNode: "input-node", fromOutput: "output", toNode: "effect-node", toInput: "input" }],
          };

          const graph = new EffectGraph(graphDef);
          effectEngineRef.current.loadGraph(graph);
          effectEngineRef.current.render(ctx, time, img);
        } catch (error) {
          console.error("Effect graph engine error:", error);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          EffectRenderer.apply(ctx, selectedEffect, parameters, intensity, time);
        }
      };
      img.src = imageUrl;

      rafId = requestAnimationFrame(animateImage);
    };

    rafId = requestAnimationFrame(animateImage);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isImage, imageUrl, selectedEffect, parameters, intensity, isPixiBackend]);

  // Update canvas dimensions when metadata loads
  useEffect(() => {
    if (videoMetadata && videoElementRef.current) {
      const canvas = isPixiBackend ? pixiCanvasRef.current : canvasRef.current;
      if (canvas) {
        canvas.width = videoMetadata.width;
        canvas.height = videoMetadata.height;
        if (!isPixiBackend) {
          renderEffect(videoElementRef.current);
        }
      }
    }
  }, [videoMetadata, renderEffect, isPixiBackend]);

  // Export frame
  const exportFrame = useCallback(() => {
    const canvas = isPixiBackend ? pixiCanvasRef.current : canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedEffect || "video"}-frame-${currentTime.toFixed(2)}s.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [selectedEffect, currentTime, isPixiBackend]);

  // Export video from static image
  const exportImageAsVideo = useCallback(async () => {
    if (!imageUrl || !selectedEffect) return;

    setIsExporting(true);

    try {
      // Fetch the image file
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: blob.type });

      // Export as video (correct parameter order: file, effect, params, intensity, duration, fps)
      const videoBlob = await exportStaticImageWithEffect(file, selectedEffect as EffectRendererType, parameters, intensity, 3, 30);

      // Download
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedEffect}-effect.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. See console for details.");
    } finally {
      setIsExporting(false);
    }
  }, [imageUrl, selectedEffect, parameters, intensity]);

  return (
    <div className="workspace">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <div className="panel-header">
          <div className="panel-title">Video Effects</div>
          <div className="panel-subtitle">Test effects in real-time</div>
        </div>

        {/* Media Import section */}
        <div className="p-3 border-b border-[#2A2A38] space-y-1.5 shrink-0">
          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white text-[11px] font-semibold rounded cursor-pointer transition-colors">
            <Film size={12} />
            <span>Import Video</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>
          <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#2A2A38] hover:bg-[#3A3A48] text-gray-300 text-[11px] font-semibold rounded cursor-pointer transition-colors">
            <ImageIcon size={12} />
            <span>Import Image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        {/* AI Generation prompt section */}
        <AIEffectGenerator
          onGenerated={handleAIEffectGenerated}
          onStateChange={(gen, step) => {
            setIsGeneratingAI(gen);
            setAiLoadingStep(step);
          }}
        />

        {/* Category List */}
        <div className="effect-list">
          {/* Active Sandbox Preview (Unapproved) */}
          {customAIEffect && !approvedAIEffects.some((e) => e.id === customAIEffect.id) && (
            <div>
              <div className="effect-category">Sandbox Preview</div>
              <div
                onClick={() => {
                  setCustomAIEffect(customAIEffect);
                  setSelectedEffect("custom" as any);

                  // Extract default values for parameters
                  const defaultParams: Record<string, any> = {};
                  const pMap = Array.isArray(customAIEffect.params)
                    ? customAIEffect.params.reduce((acc: any, p: any) => {
                        acc[p.key] = p;
                        return acc;
                      }, {})
                    : customAIEffect.params;

                  if (pMap) {
                    Object.entries(pMap).forEach(([k, def]: [string, any]) => {
                      defaultParams[k] = def.value;
                    });
                  }
                  setParameters(defaultParams);
                  setIntensity(0.85);
                }}
                className={`effect-item ${selectedEffect === "custom" && customAIEffect?.id === customAIEffect.id ? "active" : ""}`}
              >
                <span>{customAIEffect.name}</span>
                <span className="badge">Sandbox</span>
              </div>
            </div>
          )}

          {/* Approved AI Generated list */}
          {approvedAIEffects.length > 0 && (
            <div>
              <div className="effect-category">AI Generated</div>
              {approvedAIEffects.map((effect) => {
                const isActive = selectedEffect === "custom" && customAIEffect?.id === effect.id;
                return (
                  <div
                    key={effect.id}
                    onClick={() => {
                      setCustomAIEffect(effect);
                      setSelectedEffect("custom" as any);

                      // Extract default values for parameters
                      const defaultParams: Record<string, any> = {};
                      if (effect.params) {
                        Object.entries(effect.params).forEach(([k, def]: [string, any]) => {
                          defaultParams[k] = def.value;
                        });
                      }
                      setParameters(defaultParams);
                      setIntensity((effect.intensity?.default ?? 70) / 100);
                    }}
                    className={`effect-item ${isActive ? "active" : ""}`}
                  >
                    <span>{effect.name}</span>
                    <span className="badge">AI</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Predefined Categories from registry */}
          {Object.entries(effectCategories).map(([category, effects]) => (
            <div key={category}>
              <div className="effect-category">{category}</div>
              {(effects as any[]).map((effect) => (
                <div
                  key={effect}
                  onClick={() => {
                    setSelectedEffect(effect);
                    if (effect in PIXI_PRESETS) {
                      const preset = (PIXI_PRESETS as any)[effect];
                      const defaultParams = Object.fromEntries(preset.params.map((p: any) => [p.key, p.value]));
                      setParameters(defaultParams);
                      setIntensity(0.85);
                    } else {
                      const meta = getEffectMetadata(effect);
                      if (meta) {
                        const defaultParams = Object.fromEntries(Object.entries(meta.parameterSchema).map(([k, v]) => [k, v.default]));
                        setParameters(defaultParams);
                        setIntensity(0.85);
                      }
                    }
                  }}
                  className={`effect-item ${selectedEffect === effect ? "active" : ""}`}
                >
                  {effect.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: canvas area */}
      <div className="canvas-area">
        <div className="canvas-toolbar">
          <button type="button" onClick={exportFrame} disabled={!selectedEffect} className="toolbar-btn">
            <Download size={12} />
            <span>Export frame</span>
          </button>

          <button type="button" onClick={() => setShowPublishModal(true)} disabled={!selectedEffect} className="toolbar-btn primary">
            <CloudUpload size={12} />
            <span>Publish</span>
          </button>

          {isImage && selectedEffect && (
            <button type="button" onClick={exportImageAsVideo} disabled={isExporting} className="toolbar-btn">
              <Film size={12} />
              <span>{isExporting ? "Exporting..." : "Export video"}</span>
            </button>
          )}
        </div>

        <div className="canvas-wrap">
          {videoUrl || imageUrl ? (
            <div className="relative flex items-center justify-center w-full h-full max-w-[90%] max-h-[90%]">
              {isGeneratingAI && (
                <div className="generation-overlay" style={{ display: "flex" }}>
                  <div className="gen-spinner" />
                  <div className="flex flex-col gap-2.5 w-60">
                    {["Calling Worker API...", "LLM generating EffectEngine class...", "Extracting param schema...", "Compiling effect...", "Mounting on canvas..."].map((stepText, idx, arr) => {
                      const activeIdx = arr.indexOf(aiLoadingStep);
                      const isCompleted = idx < activeIdx;
                      const isActive = idx === activeIdx;

                      return (
                        <div key={stepText} className={`text-[11px] font-mono flex items-center gap-2.5 transition-colors duration-200 ${isCompleted ? "text-[#4CAF50] opacity-100" : isActive ? "text-white opacity-100 font-medium" : "text-gray-500 opacity-60"}`}>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] transition-colors duration-200 ${isCompleted ? "border-[#4CAF50] text-[#4CAF50] bg-[#4CAF50]/10" : isActive ? "border-[#7C6FFF] text-[#7C6FFF] bg-[#7C6FFF]/10 animate-pulse" : "border-gray-700 text-gray-500"}`}>{isCompleted ? "✓" : isActive ? "●" : "○"}</span>
                          <span>{stepText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isPixiBackend ? (
                <canvas
                  key="canvas-pixi"
                  ref={pixiCanvasRef}
                  width={videoMetadata?.width || 1280}
                  height={videoMetadata?.height || 720}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <canvas
                  key="canvas-2d"
                  ref={canvasRef}
                  width={videoMetadata?.width || 1280}
                  height={videoMetadata?.height || 720}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              )}

              {selectedEffect && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs backdrop-blur font-sans border border-[#2A2A38]">
                  <div className="font-semibold">{selectedEffect.replace(/_/g, " ").toUpperCase()}</div>
                  <div className="text-gray-300 mt-0.5">Intensity: {(intensity * 100).toFixed(0)}%</div>
                </div>
              )}
            </div>
          ) : (
            <div className="canvas-placeholder">
              <Upload size={32} style={{ opacity: 0.4 }} />
              <div>
                Generate or select an effect
                <br />
                to preview on canvas
              </div>
            </div>
          )}
        </div>

        {/* Video Player Timeline controls (mounted below canvas wrap) */}
        {videoUrl && (
          <div className="border-t border-[#2A2A38] shrink-0 bg-[#1E1E26]">
            <VideoPlayer
              videoUrl={videoUrl}
              onTimeUpdate={(time) => {
                setCurrentTime(time);
                if (videoElementRef.current?.paused) {
                  renderEffect(videoElementRef.current);
                }
              }}
              onFrameReady={(video) => {
                videoElementRef.current = video;
                setIsPlaying(!video.paused);
                if (video.paused) {
                  renderEffect(video);
                }
              }}
              onMetadataLoad={setVideoMetadata}
              className="bg-[#1E1E26]"
            />
          </div>
        )}

        <div className="status-bar">
          <div className={`status-dot ${videoUrl || imageUrl ? "active" : ""}`} />
          <div className="status-text">{videoUrl || imageUrl ? "Active media stream running." : "No active media stream loaded"}</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="right-header">
          <div className="panel-title">Effect Settings</div>
        </div>

        {selectedEffect ? (
          <div className="params-scroll">
            <div className="param-group">
              <div className="param-group-label">Intensity</div>
              <div className="param-row">
                <div className="param-label">
                  <span>Master</span>
                  <span className="val">{(intensity * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="divider" />

            <div className="param-group">
              <div className="param-group-label">Parameters</div>
              <EffectParameterEditor
                effectType={selectedEffect}
                parameters={parameters}
                onChange={handleParamChange}
                customParamsSchema={
                  selectedEffect === ("custom" as any)
                    ? Array.isArray(customAIEffect?.params)
                      ? (customAIEffect.params as any[]).reduce((acc: any, p: any) => {
                          acc[p.key] = p;
                          return acc;
                        }, {})
                      : customAIEffect?.params
                    : selectedEffect in PIXI_PRESETS
                      ? (PIXI_PRESETS as any)[selectedEffect].params.reduce((acc: any, p: any) => {
                          acc[p.key] = p;
                          return acc;
                        }, {})
                      : undefined
                }
              />
            </div>

            <div className="divider" />

            {/* Instruction Tips */}
            <div className="p-3 bg-[#7C6FFF]/10 rounded-lg border border-[#7C6FFF]/20">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-[#7C6FFF] mt-0.5 shrink-0" />
                <div className="text-xs text-white min-w-0">
                  <p className="font-semibold mb-1">Tips</p>
                  <ul className="space-y-0.5 text-gray-300">
                    <li>• Adjust intensity for different effects</li>
                    <li>• Scrub timeline to test at any moment</li>
                    <li>• Export frames for comparison</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-params">
            <Info size={24} style={{ opacity: 0.35 }} />
            <div>Select an effect to adjust parameters</div>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1E1E26] rounded-xl border border-[#2A2A38] w-[400px] overflow-hidden">
            <div className="p-4 border-b border-[#2A2A38] flex justify-between items-center">
              <h2 className="text-white font-bold text-sm">Publish Video Effect</h2>
              <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Effect Name</label>
                <input type="text" value={publishName} onChange={(e) => setPublishName(e.target.value)} placeholder="e.g. Neon Cyberpunk" className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded px-3 py-2 text-sm text-white outline-none focus:border-[#7C6FFF]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                <textarea value={publishDescription} onChange={(e) => setPublishDescription(e.target.value)} placeholder="Describe this effect..." className="w-full h-20 bg-[#0E0E12] border border-[#2A2A38] rounded px-3 py-2 text-sm text-white resize-none outline-none focus:border-[#7C6FFF]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Tags (comma separated)</label>
                <input type="text" value={publishTags} onChange={(e) => setPublishTags(e.target.value)} placeholder="neon, glow, cyberpunk" className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded px-3 py-2 text-sm text-white outline-none focus:border-[#7C6FFF]" />
              </div>
            </div>
            <div className="p-4 border-t border-[#2A2A38] flex justify-end gap-2">
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={handlePublish} disabled={isPublishing || !publishName.trim()} className="flex items-center gap-2 px-4 py-2 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                {isGeneratingAI ? "Submitting..." : "Submit to Moderator"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
