import React, { useState, useRef, useEffect, useCallback } from "react";
import { EffectRenderer, type EffectRendererType, type EffectParameters } from "@clypra-studio/engine";
import { VideoPlayer, EffectParameterEditor } from "../common";
import { exportStaticImageWithEffect } from "../video/EffectVideoExporter";
import { Download, Upload, Info, Image as ImageIcon, Film, Sparkles, Loader2, Send, CloudUpload } from "lucide-react";
import { useR2Publish } from "../../../hooks/useR2Publish";
import { generateVideoOrBodyEffectPresetSuggestion } from "../../../services/geminiService";
import { segmentBodyMask, makeBodyMaskCacheKey } from "../../../services/bodySegmentation/bodySegmentationWorkerClient";
import { bodyMaskCache } from "../../../services/bodySegmentation/maskCache";
import type { BodySegmentationOptions } from "@clypra-studio/engine";
import { Filter } from "pixi.js";

const imageDataToCanvas = (imgData: ImageData): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.putImageData(imgData, 0, 0);
  }
  return canvas;
};

const BODY_EFFECT_VERTEX_SHADER = `
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

const BODY_EFFECT_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uSampler;       // Base video texture
  uniform sampler2D uMaskTexture;   // Segmentation body mask
  uniform int uEffectType;          // 0: Glow, 1: Outline, 2: Particles, 3: SegGlow
  uniform vec3 uColor;              // Glowing color
  uniform float uRadius;            // Blur/thickness radius
  uniform float uIntensity;         // Strength
  uniform float uTime;              // Ticker time

  float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Generate animated floaters on GPU
  float drawGPUParticles(vec2 uv, float time) {
      vec2 p = uv;
      p.y += time * 0.15; // float up
      vec2 grid = floor(p * 60.0);
      vec2 subUv = fract(p * 60.0) - 0.5;
      float h = hash(grid);
      float size = 0.04 + 0.14 * h;
      float dist = length(subUv);
      float alpha = smoothstep(size, size - 0.03, dist);
      // Flickering overlay
      float flicker = 0.3 + 0.7 * sin(time * 5.0 + h * 12.0);
      return alpha * step(0.72, h) * flicker;
  }

  void main() {
      vec4 baseColor = texture(uSampler, vTextureCoord);
      
      // Sample mask alpha channel (binary body shape)
      float maskVal = texture(uMaskTexture, vTextureCoord).a;
      
      vec3 resultRgb = baseColor.rgb;
      
      if (uEffectType == 0 || uEffectType == 3) {
          // Glow / Segmentation Glow
          // Edge transition expansion to draw neon shadow
          vec2 texelSize = vec2(uRadius) / vec2(textureSize(uMaskTexture, 0));
          float totalMask = 0.0;
          
          // simple 9-tap blur box to blur mask
          for (int x = -2; x <= 2; x++) {
              for (int y = -2; y <= 2; y++) {
                  vec2 offset = vec2(float(x), float(y)) * texelSize;
                  totalMask += texture(uMaskTexture, vTextureCoord + offset).a;
              }
          }
          float blurredMask = totalMask / 25.0;
          
          // Add neon halo around the mask edges (blur minus core mask)
          float glowAmount = max(0.0, blurredMask - maskVal) * uIntensity;
          resultRgb = mix(resultRgb, uColor, glowAmount);
          
          // If type 3 (segmentation glow overlay), add soft inner tint
          if (uEffectType == 3) {
              resultRgb = mix(resultRgb, uColor, maskVal * 0.18 * uIntensity);
          }
          
      } else if (uEffectType == 1) {
          // Outline
          vec2 offset = vec2(uRadius) / vec2(textureSize(uMaskTexture, 0));
          float mLeft  = texture(uMaskTexture, vTextureCoord - vec2(offset.x, 0.0)).a;
          float mRight = texture(uMaskTexture, vTextureCoord + vec2(offset.x, 0.0)).a;
          float mUp    = texture(uMaskTexture, vTextureCoord - vec2(0.0, offset.y)).a;
          float mDown  = texture(uMaskTexture, vTextureCoord + vec2(0.0, offset.y)).a;
          
          float border = max(max(mLeft, mRight), max(mUp, mDown)) - maskVal;
          resultRgb = mix(resultRgb, uColor, border * uIntensity);
          
      } else if (uEffectType == 2) {
          // Particles
          float particles = drawGPUParticles(vTextureCoord, uTime);
          // Mask particles to the body silhouette
          float activeParticles = particles * maskVal * uIntensity;
          resultRgb = mix(resultRgb, uColor, activeParticles);
      }
      
      finalColor = vec4(resultRgb, baseColor.a);
  }
`;

export function BodyEffectWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // PixiJS references
  const pixiAppRef = useRef<any>(null);
  const bodyEffectFilterRef = useRef<any>(null);
  const baseSpriteRef = useRef<any>(null);
  const filteredSpriteRef = useRef<any>(null);

  const [videoUrl, setVideoUrl] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [isImage, setIsImage] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<EffectRendererType | null>(null);
  const [intensity, setIntensity] = useState(0.8);
  const [parameters, setParameters] = useState<EffectParameters>({ intensity: 50, frequency: 10 });
  const [currentTime, setCurrentTime] = useState(0);
  const [videoMetadata, setVideoMetadata] = useState<{ duration: number; width: number; height: number } | null>(null);


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
      const result = await publishVideoEffectPreset({
        id: publishName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        kind: "body",
        metadata: {
          name: publishName,
          description: publishDescription,
          renderer: selectedEffect,
          params: parameters,
          intensity: {
            min: 0,
            max: 100,
            default: intensity * 100,
            step: 1
          },
          tags: publishTags.split(",").map(t => t.trim()).filter(Boolean),
          published: true, // Assuming auto-publish for now
        }
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

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateEffect = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const suggestion = await generateVideoOrBodyEffectPresetSuggestion({
        kind: "body",
        prompt: aiPrompt,
      });
      setSelectedEffect(suggestion.renderer as EffectRendererType);
      setParameters(suggestion.params);
      setIntensity(suggestion.defaultIntensity / 100);
      setAiPrompt("");
    } catch (error) {
      console.error("AI Generation failed:", error);
      alert(error instanceof Error ? error.message : "Failed to generate effect");
    } finally {
      setIsGenerating(false);
    }
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [imageMask, setImageMask] = useState<ImageData | null>(null);

  // Load body effects from registry
  const [effectCategories, setEffectCategories] = useState<Record<string, EffectRendererType[]>>({});

  useEffect(() => {
    // Dynamically load body effects from @clypra-studio/engine
    const loadEffects = async () => {
      const { getEffectsByCategory } = await import("@clypra-studio/engine");

      const categories: Record<string, EffectRendererType[]> = {};

      // Load Body effects
      const bodyEffects = getEffectsByCategory("body");
      if (bodyEffects && Array.isArray(bodyEffects) && bodyEffects.length > 0) {
        categories["Body Effects"] = bodyEffects.map((e: any) => e.id as EffectRendererType);
      }

      setEffectCategories(categories);
    };

    loadEffects();
  }, []);

  // Handle video upload
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setImageUrl(undefined);
    setIsImage(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setImageMask(null);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setVideoUrl(undefined);
    setIsImage(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setImageMask(null);

    // Load image and render to canvas
    const img = new Image();
    img.onload = () => {
      setVideoMetadata({
        duration: 3, // Default duration for effect
        width: img.width,
        height: img.height,
      });
    };
    img.src = url;
  }, []);

  // Reset workspace
  const handleReset = useCallback(() => {
    setVideoUrl(undefined);
    setImageUrl(undefined);
    setIsImage(false);
    setSelectedEffect(null);
    setIntensity(0.8);
    setParameters({ intensity: 50, frequency: 10 });
    setCurrentTime(0);
    setVideoMetadata(null);
    setIsPlaying(false);
    setImageMask(null);
  }, []);

  // Segment static image once when image or selectedEffect changes
  useEffect(() => {
    if (!isImage || !imageUrl || !selectedEffect) {
      setImageMask(null);
      return;
    }

    const img = new Image();
    img.onload = async () => {
      const options: BodySegmentationOptions = {
        effectId: selectedEffect,
        renderer: selectedEffect,
        time: 0,
        width: img.width,
        height: img.height,
        minConfidence: 0.7,
      };
      try {
        const mask = await segmentBodyMask(img, options);
        setImageMask(mask);
      } catch (error) {
        console.error("Static image segmentation error:", error);
      }
    };
    img.src = imageUrl;
  }, [isImage, imageUrl, selectedEffect]);

  // Sync parameters to PixiJS WebGL body shader uniforms
  const syncBodyEffectUniforms = useCallback((timeVal: number, maskCanvas: HTMLCanvasElement | null) => {
    const filter = bodyEffectFilterRef.current;
    if (!filter) return;

    let typeVal = 0;
    if (selectedEffect === "body_glow") typeVal = 0;
    else if (selectedEffect === "body_outline") typeVal = 1;
    else if (selectedEffect === "body_particles") typeVal = 2;
    else if (selectedEffect === "body-segmentation-glow") typeVal = 3;

    // Resolve color
    let colorHex = "#7C6FFF";
    if (selectedEffect === "body_glow" || selectedEffect === "body-segmentation-glow") {
      colorHex = parameters.glowColor as string || "#7C6FFF";
    } else if (selectedEffect === "body_outline") {
      colorHex = parameters.outlineColor as string || "#00E5FF";
    } else if (selectedEffect === "body_particles") {
      colorHex = parameters.particleColor as string || "#FF2A85";
    }

    const hex = colorHex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    let radiusVal = 20.0;
    if (selectedEffect === "body_glow" || selectedEffect === "body-segmentation-glow") {
      radiusVal = typeof parameters.glowRadius === "number" ? parameters.glowRadius : 20.0;
    } else if (selectedEffect === "body_outline") {
      radiusVal = typeof parameters.outlineWidth === "number" ? parameters.outlineWidth : 6.0;
    }

    const u = filter.resources.uniforms.uniforms;
    u.uEffectType = typeVal;
    u.uColor = [r, g, b];
    u.uRadius = radiusVal;
    u.uIntensity = intensity;
    u.uTime = timeVal;

    if (maskCanvas && pixiAppRef.current) {
      const { Texture } = require("pixi.js");
      const maskTex = Texture.from(maskCanvas);
      u.uMaskTexture = maskTex;
    }
  }, [selectedEffect, parameters, intensity]);

  // Initialize Pixi Application for Body Effect Workspace
  useEffect(() => {
    const canvas = pixiCanvasRef.current;
    if (!canvas || (!videoUrl && !imageUrl) || !videoMetadata) return;

    let active = true;

    const initPixi = async () => {
      const { Application, Sprite } = await import("pixi.js");
      const app = new Application();
      await app.init({
        canvas,
        width: videoMetadata?.width || 1280,
        height: videoMetadata?.height || 720,
        backgroundAlpha: 0,
        antialias: true,
        preference: "webgl",
        preserveDrawingBuffer: true,
      });

      if (!active) {
        app.destroy(true);
        return;
      }

      pixiAppRef.current = app;
      const stage = app.stage;
      stage.removeChildren();

      // Base Sprite
      const baseSprite = new Sprite();
      baseSprite.width = app.screen.width;
      baseSprite.height = app.screen.height;
      stage.addChild(baseSprite);
      baseSpriteRef.current = baseSprite;

      // Filtered Sprite
      const filteredSprite = new Sprite();
      filteredSprite.width = app.screen.width;
      filteredSprite.height = app.screen.height;
      stage.addChild(filteredSprite);
      filteredSpriteRef.current = filteredSprite;

      // Compile the Custom Body Effect filter
      const bodyFilter = Filter.from({
        gl: { vertex: BODY_EFFECT_VERTEX_SHADER, fragment: BODY_EFFECT_FRAGMENT_SHADER },
        resources: {
          uniforms: {
            uEffectType: { value: 0, type: 'i32' },
            uColor: { value: [0.49, 0.43, 1.0], type: 'vec3<f32>' },
            uRadius: { value: 20.0, type: 'f32' },
            uIntensity: { value: 0.8, type: 'f32' },
            uTime: { value: 0.0, type: 'f32' },
            uMaskTexture: { value: null, type: 'sampler2D' }
          }
        }
      });
      filteredSprite.filters = [bodyFilter];
      bodyEffectFilterRef.current = bodyFilter;

      // Setup textures
      if (!isImage && videoElementRef.current) {
        const { VideoSource, Texture } = await import("pixi.js");
        const source = new VideoSource({ resource: videoElementRef.current, autoPlay: false });
        const tex = new Texture({ source });
        baseSprite.texture = tex;
        filteredSprite.texture = tex;
      } else if (isImage && imageUrl) {
        const { Texture } = await import("pixi.js");
        const tex = await Texture.from(imageUrl);
        if (active) {
          baseSprite.texture = tex;
          filteredSprite.texture = tex;
        }
      }

      // Sync uniforms
      syncBodyEffectUniforms(0, null);

      // Ticker loop
      let startTime = performance.now();
      app.ticker.add(() => {
        if (!active) return;

        const timeVal = isImage 
          ? ((performance.now() - startTime) / 1000) % 3 
          : (videoElementRef.current?.currentTime || 0);

        if (isImage) {
          if (imageMask) {
            const maskCanvas = imageDataToCanvas(imageMask);
            syncBodyEffectUniforms(timeVal, maskCanvas);
          } else {
            syncBodyEffectUniforms(timeVal, null);
          }
        } else {
          const video = videoElementRef.current;
          if (video && selectedEffect) {
            const options: BodySegmentationOptions = {
              effectId: selectedEffect,
              renderer: selectedEffect,
              time: video.currentTime,
              width: app.screen.width,
              height: app.screen.height,
              minConfidence: 0.7,
            };
            const cacheKey = makeBodyMaskCacheKey(options);
            const cachedMask = bodyMaskCache.get(cacheKey);

            if (cachedMask) {
              const maskCanvas = imageDataToCanvas(cachedMask);
              syncBodyEffectUniforms(timeVal, maskCanvas);
            } else {
              segmentBodyMask(video, options).catch(() => {});
              syncBodyEffectUniforms(timeVal, null);
            }
          }
        }
      });
    };

    initPixi();

    return () => {
      active = false;
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true);
        pixiAppRef.current = null;
      }
      bodyEffectFilterRef.current = null;
      baseSpriteRef.current = null;
      filteredSpriteRef.current = null;
    };
  }, [videoUrl, imageUrl, isImage, selectedEffect, imageMask, videoMetadata]);

  // Keep uniforms sync'ed when parameters change
  useEffect(() => {
    syncBodyEffectUniforms(currentTime, null);
  }, [syncBodyEffectUniforms, currentTime]);

  // Traditional canvas rendering fallback placeholder
  const renderEffect = useCallback((video: HTMLVideoElement) => {}, []);

  // Smooth animation loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || !videoElementRef.current) return;

    const video = videoElementRef.current;
    let rafId: number;

    const animate = () => {
      if (video && !video.paused && !video.ended) {
        setCurrentTime(video.currentTime);
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaying]);

  // Update canvas dimensions when metadata loads
  useEffect(() => {
    if (videoMetadata && canvasRef.current && videoElementRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoMetadata.width;
      canvas.height = videoMetadata.height;
    }
    if (videoMetadata && pixiCanvasRef.current) {
      const canvas = pixiCanvasRef.current;
      canvas.width = videoMetadata.width;
      canvas.height = videoMetadata.height;
    }
  }, [videoMetadata]);

  // Export frame
  const exportFrame = useCallback(() => {
    const canvas = pixiCanvasRef.current || canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedEffect || "body-effect"}-frame-${currentTime.toFixed(2)}s.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [selectedEffect, currentTime]);

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
    <div className="flex h-full bg-[#0E0E12]">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#1E1E26] border-r border-[#2A2A38] overflow-y-auto shrink-0">
        <div className="p-4 border-b border-[#2A2A38]">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-[#7C6FFF]" />
            Body Effects
          </h1>
          <p className="text-xs text-gray-400 mt-1">Real-time body tracking & silhouette overlays</p>
        </div>

        {/* Video/Image Upload */}
        <div className="p-4 border-b border-[#2A2A38]">
          <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white text-sm rounded-lg cursor-pointer transition-colors">
            <Film size={18} />
            <span className="font-medium">Import Video</span>
            <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          <label className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2A2A38] hover:bg-[#3A3A48] text-white text-sm rounded-lg cursor-pointer transition-colors">
            <ImageIcon size={18} />
            <span className="font-medium">Import Image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          {videoMetadata && (
            <div className="mt-3 p-2 bg-[#0E0E12] rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="font-medium">{isImage ? "Image" : "Video"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Resolution:</span>
                <span className="font-medium">
                  {videoMetadata.width}x{videoMetadata.height}
                </span>
              </div>
              {!isImage && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium">{videoMetadata.duration.toFixed(1)}s</span>
                </div>
              )}
            </div>
          )}
        </div>


        {/* AI Generation */}
        <div className="p-4 border-b border-[#2A2A38]">
          <h3 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-[#7C6FFF]" />
            Generate Effect
          </h3>
          <div className="flex flex-col gap-2">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe an effect (e.g. glowing neon red outline with particles)..."
              className="w-full h-20 bg-[#0E0E12] border border-[#2A2A38] rounded p-2 text-sm text-white resize-none"
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerateEffect}
              disabled={isGenerating || !aiPrompt.trim()}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isGenerating || !aiPrompt.trim()
                  ? "bg-[#2A2A38] text-gray-500 cursor-not-allowed"
                  : "bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white"
              }`}
            >
              {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Effect Categories */}
        <div className="p-4 space-y-4">
          {Object.keys(effectCategories).length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">No body effects loaded</p>
              <p className="text-xs mt-1">Effects will appear here</p>
            </div>
          ) : (
            Object.entries(effectCategories).map(([category, effects]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{category}</h3>
                <div className="space-y-1">
                  {(effects as any[]).map((effect) => (
                    <button key={effect} onClick={() => setSelectedEffect(effect)} className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${selectedEffect === effect ? "bg-[#7C6FFF] text-white font-medium" : "text-gray-300 hover:bg-[#2A2A38]"}`}>
                      {effect.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Preview */}
        <div className="flex items-center justify-center bg-gray-900 p-4" style={{ height: "calc(100vh - 56px - 180px)" }}>
          {videoUrl || imageUrl ? (
            <div className="relative h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={videoMetadata?.width || 1280}
                height={videoMetadata?.height || 720}
                style={{
                  display: "none",
                }}
              />
              <canvas
                ref={pixiCanvasRef}
                width={videoMetadata?.width || 1280}
                height={videoMetadata?.height || 720}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                }}
                className="rounded-lg shadow-2xl"
              />

              {selectedEffect && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm backdrop-blur">
                  <div className="font-semibold">{selectedEffect.replace(/_/g, " ").toUpperCase()}</div>
                  <div className="text-gray-300 text-xs">Intensity: {(intensity * 100).toFixed(0)}%</div>
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2">

                <button onClick={() => setShowPublishModal(true)} disabled={!selectedEffect} className="flex items-center gap-2 px-3 py-2 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white rounded-lg text-sm backdrop-blur transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <CloudUpload size={16} />
                  Publish
                </button>

                <button onClick={exportFrame} className="flex items-center gap-2 px-3 py-2 bg-black/70 hover:bg-black/80 text-white rounded-lg text-sm backdrop-blur transition-colors">
                  <Download size={16} />
                  Export Frame
                </button>

                {isImage && selectedEffect && (
                  <button onClick={exportImageAsVideo} disabled={isExporting} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm backdrop-blur transition-colors ${isExporting ? "bg-gray-700 cursor-not-allowed" : "bg-[#7C6FFF] hover:bg-[#6B5EEE]"} text-white`}>
                    <Film size={16} />
                    {isExporting ? "Exporting..." : "Export as Video"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Upload size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Import a video or image to start</p>
              <p className="text-sm mt-2">Videos for body segmentation • Images for effect testing</p>
            </div>
          )}
        </div>

        {/* Video Player Controls */}
        {videoUrl && (
          <div className="border-t border-[#2A2A38] shrink-0">
            <VideoPlayer
              videoUrl={videoUrl}
              onTimeUpdate={(time) => {
                setCurrentTime(time);
                // Only render on time update when paused (for scrubbing)
                if (videoElementRef.current?.paused) {
                  renderEffect(videoElementRef.current);
                }
              }}
              onFrameReady={(video) => {
                videoElementRef.current = video;
                setIsPlaying(!video.paused);
                // Initial render when video loads
                if (video.paused) {
                  renderEffect(video);
                }
              }}
              onMetadataLoad={setVideoMetadata}
              className="bg-[#1E1E26]"
            />
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-72 bg-[#1E1E26] border-l border-[#2A2A38] overflow-y-auto shrink-0">
        <div className="p-4 border-b border-[#2A2A38]">
          <h2 className="text-base font-semibold text-white">Body Effect Settings</h2>
        </div>

        {selectedEffect ? (
          <div className="p-4 space-y-6">
            {/* Intensity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Intensity</h3>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">Master</span>
                <span className="font-medium">{(intensity * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.01" value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))} className="w-full" />
            </div>

            {/* Effect Parameters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Parameters</h3>
              <EffectParameterEditor effectType={selectedEffect} parameters={parameters} onChange={setParameters} />
            </div>

            {/* Tips */}
            <div className="p-3 bg-[#7C6FFF]/10 rounded-lg border border-[#7C6FFF]/20">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-[#7C6FFF] mt-0.5 shrink-0" />
                <div className="text-xs text-white min-w-0">
                  <p className="font-medium mb-1">Body Effect Tips</p>
                  <ul className="space-y-0.5 text-gray-300">
                    <li>• Best results with clear human figures</li>
                    <li>• Adjust feathering and outline width</li>
                    <li>• Emitters trace matching outline bounds</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-400">
            <p className="text-sm">Select a body effect to adjust parameters</p>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1E1E26] rounded-xl border border-[#2A2A38] w-[400px] overflow-hidden">
            <div className="p-4 border-b border-[#2A2A38] flex justify-between items-center">
              <h2 className="text-white font-bold">Publish Body Effect</h2>
              <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Effect Name</label>
                <input type="text" value={publishName} onChange={e => setPublishName(e.target.value)} placeholder="e.g. Glowing Silhouette" className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Description</label>
                <textarea value={publishDescription} onChange={e => setPublishDescription(e.target.value)} placeholder="Describe this effect..." className="w-full h-20 bg-[#0E0E12] border border-[#2A2A38] rounded px-3 py-2 text-sm text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Tags (comma separated)</label>
                <input type="text" value={publishTags} onChange={e => setPublishTags(e.target.value)} placeholder="body, tracking, glow" className="w-full bg-[#0E0E12] border border-[#2A2A38] rounded px-3 py-2 text-sm text-white" />
              </div>
            </div>
            <div className="p-4 border-t border-[#2A2A38] flex justify-end gap-2">
              <button onClick={() => setShowPublishModal(false)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancel</button>
              <button onClick={handlePublish} disabled={isPublishing || !publishName.trim()} className="flex items-center gap-2 px-4 py-2 bg-[#7C6FFF] hover:bg-[#6B5EEE] text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isPublishing ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
                {isPublishing ? "Publishing..." : "Publish to R2"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
