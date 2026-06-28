/**
 * Filter Workspace
 * Test, generate, and upload color grading filters to R2
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getR2Config } from "../../../services/r2Service";
import { useR2Publish } from "../../../hooks/useR2Publish";
import { Download, Upload, Sparkles, Zap, Image as ImageIcon, Film, Loader2, Play, Pause, RotateCcw, Search, Sliders, BarChart4, Sun, Palette, Eye, EyeOff, ChevronRight, ChevronDown, Check, Undo, SlidersHorizontal, Compass } from "lucide-react";
import { PixiRenderer, EffectGraph } from "@clypra/engine";
import { Filter, RendererType } from "pixi.js";

// Types
interface FilterPreset {
  id: string;
  name: string;
  category: "essentials" | "cinematic" | "vintage" | "vibrant" | "mono" | "aesthetic";
  description: string;
  cssFilter: string;
  intensity: number; // default strength 0-100
  usePixi?: boolean; // Flag for WebGL-based filters
  pixiFilterType?: "grayscale" | "cyberpunk" | "custom"; // PixiJS filter types
}

const FILTER_CATEGORIES = ["all", "essentials", "cinematic", "vintage", "vibrant", "mono", "aesthetic"] as const;
type CategoryType = (typeof FILTER_CATEGORIES)[number];

const API_BASE_URL = "https://clypra-worker-api.abdulkabirmusa.com";

// 18 Stunning Professional Presets
const PRESET_FILTERS: FilterPreset[] = [
  // Essentials (WebGL-powered)
  {
    id: "pixi-test-grayscale",
    name: "Pixi Test Grayscale",
    category: "essentials",
    description: "[WebGL] Deep black & white with high contrast",
    cssFilter: "grayscale(100%) contrast(120%)",
    intensity: 100,
    usePixi: true,
    pixiFilterType: "grayscale",
  },
  {
    id: "pixi-test-cyberpunk",
    name: "Pixi Test Cyberpunk",
    category: "essentials",
    description: "[WebGL] Intense futuristic purple/teal grade",
    cssFilter: "hue-rotate(45deg) saturate(180%) contrast(110%)",
    intensity: 100,
    usePixi: true,
    pixiFilterType: "cyberpunk",
  },
  { id: "clean-bright", name: "Clean & Bright", category: "essentials", description: "Luminous highlights and crisp clean whites", cssFilter: "brightness(107%) contrast(103%) saturate(106%)", intensity: 90 },
  { id: "matte-contrast", name: "Matte Contrast", category: "essentials", description: "Deep faded matte blacks and clinical details", cssFilter: "contrast(116%) brightness(96%) saturate(94%) sepia(4%)", intensity: 80 },
  { id: "cold-minimalist", name: "Cold Minimalist", category: "essentials", description: "Chilly blue hues and minimal saturation", cssFilter: "hue-rotate(12deg) saturate(78%) contrast(104%) brightness(99%)", intensity: 75 },

  // Cinematic
  { id: "teal-orange", name: "Teal & Orange", category: "cinematic", description: "Hollywood style teal shadows and warm orange midtones", cssFilter: "contrast(115%) saturate(125%) hue-rotate(-5deg) sepia(8%)", intensity: 80 },
  { id: "blockbuster", name: "Blockbuster", category: "cinematic", description: "High-contrast, cold desaturated green/cyan atmosphere", cssFilter: "contrast(122%) saturate(82%) sepia(12%) hue-rotate(-12deg)", intensity: 75 },
  { id: "moody-noir", name: "Moody Film", category: "cinematic", description: "Rich cinematic shadows with faded highlights", cssFilter: "contrast(118%) brightness(88%) saturate(75%) sepia(8%)", intensity: 80 },

  // Vintage
  { id: "polaroid", name: "Polaroid Fade", category: "vintage", description: "Muted retro blacks and warm polaroid paper tone", cssFilter: "contrast(92%) saturate(92%) sepia(22%) brightness(104%) hue-rotate(-3deg)", intensity: 70 },
  { id: "super8", name: "Super 8 Film", category: "vintage", description: "Organic vintage 8mm warmth and high saturation", cssFilter: "sepia(28%) contrast(112%) saturate(110%) brightness(97%)", intensity: 80 },
  { id: "sunset-70s", name: "1970s Sunset", category: "vintage", description: "Sun-drenched golden amber and warm tones", cssFilter: "sepia(35%) hue-rotate(-15deg) saturate(118%) contrast(94%)", intensity: 85 },
  { id: "washed-indie", name: "Washed Indie", category: "vintage", description: "Desaturated, low-contrast washed-out indie look", cssFilter: "contrast(88%) brightness(106%) saturate(72%) sepia(10%)", intensity: 75 },

  // Vibrant
  { id: "golden-hour", name: "Golden Hour", category: "vibrant", description: "Warm sunset hues and soft glowing highlights", cssFilter: "sepia(22%) saturate(120%) brightness(103%) contrast(96%) hue-rotate(-4deg)", intensity: 90 },

  // Mono
  { id: "silver-gelatin", name: "Silver Gelatin", category: "mono", description: "Classic fine-art monochrome with rich midtones", cssFilter: "grayscale(100%) contrast(112%) brightness(98%)", intensity: 100 },
  { id: "high-contrast-mono", name: "Noir Drama", category: "mono", description: "Aggressive contrast, deep blacks, and sharp whites", cssFilter: "grayscale(100%) contrast(142%) brightness(92%)", intensity: 100 },
  { id: "warm-sepia", name: "Sepia Ink", category: "mono", description: "Aesthetic warm sepia paper tint with lower contrast", cssFilter: "grayscale(100%) sepia(68%) contrast(96%) brightness(97%)", intensity: 90 },

  // Aesthetic
  { id: "cyberpunk", name: "Cyberpunk Neon", category: "aesthetic", description: "Vibrant neon purples and electric turquoise glow", cssFilter: "contrast(125%) saturate(155%) hue-rotate(15deg) brightness(96%)", intensity: 85 },
  { id: "vaporwave", name: "Vaporwave", category: "aesthetic", description: "Psychedelic pastel pinks and dreamy violet shadows", cssFilter: "hue-rotate(135deg) saturate(135%) contrast(108%) brightness(103%)", intensity: 85 },
  { id: "duotone-violet", name: "Duotone Purple", category: "aesthetic", description: "Deep purple shadows and glowing warm highlights", cssFilter: "contrast(112%) saturate(125%) sepia(18%) hue-rotate(245deg) brightness(96%)", intensity: 90 },
  { id: "acid-green", name: "Acid Glow", category: "aesthetic", description: "High-saturation radioactive neon look", cssFilter: "hue-rotate(55deg) saturate(155%) contrast(122%) brightness(96%)", intensity: 80 },
];

const PROMPT_SUGGESTIONS = [
  { label: "Teal & Orange", prompt: "cinematic Hollywood style teal and orange with warm skin tones", category: "cinematic" },
  { label: "1970s Polaroid", prompt: "warm faded 1970s polaroid film with soft contrast and yellow hues", category: "vintage" },
  { label: "Cyberpunk Glow", prompt: "futuristic neon cyberpunk style with deep blue shadows and pink highlights", category: "aesthetic" },
  { label: "Moody Noir", prompt: "highly dramatic high contrast black and white with deep crushed shadows", category: "mono" },
  { label: "Washed Indie", prompt: "retro indie film aesthetic with flat blacks and desaturated soft colors", category: "vintage" },
  { label: "Golden Hour", prompt: "dreamy sunlit golden hour glow with warm amber highlights", category: "vibrant" },
];

const INITIAL_MANUAL_ADJUSTMENTS = {
  exposure: 0, // -100 to 100
  brightness: 0, // -100 to 100
  contrast: 0, // -100 to 100
  saturation: 0, // -100 to 100
  temperature: 0, // -100 to 100 (blue to orange)
  tint: 0, // -100 to 100 (green to magenta)
  sepia: 0, // 0 to 100
  grayscale: 0, // 0 to 100
  hueRotate: 0, // 0 to 360
  blur: 0, // 0 to 15
  vignette: 0, // 0 to 100
  invert: 0, // 0 to 100
};

// Helper: Interpolate CSS filter strength
const interpolateFilter = (filterStr: string, factor: number): string => {
  return filterStr.replace(/(\d+\.?\d*)(%|deg|px)?/g, (match, value, unit) => {
    const num = parseFloat(value);
    let adjusted = num * factor;
    if (["contrast", "saturate", "brightness"].some((n) => filterStr.includes(n))) {
      adjusted = 100 + (num - 100) * factor;
    }
    return `${adjusted}${unit || ""}`;
  });
};

// Helper: Combine preset & manual filters
const getCombinedFilterString = (preset: FilterPreset | null, presetIntensity: number, manual: typeof INITIAL_MANUAL_ADJUSTMENTS) => {
  let parts: string[] = [];

  if (preset && preset.cssFilter) {
    const factor = presetIntensity / 100;
    parts.push(interpolateFilter(preset.cssFilter, factor));
  }

  if (manual.exposure !== 0) {
    parts.push(`brightness(${100 + manual.exposure}%)`);
  }
  if (manual.brightness !== 0) {
    parts.push(`brightness(${100 + manual.brightness}%)`);
  }
  if (manual.contrast !== 0) {
    parts.push(`contrast(${100 + manual.contrast}%)`);
  }
  if (manual.saturation !== 0) {
    parts.push(`saturate(${100 + manual.saturation}%)`);
  }
  if (manual.sepia !== 0) {
    parts.push(`sepia(${manual.sepia}%)`);
  }
  if (manual.grayscale !== 0) {
    parts.push(`grayscale(${manual.grayscale}%)`);
  }
  if (manual.hueRotate !== 0) {
    parts.push(`hue-rotate(${manual.hueRotate}deg)`);
  }
  if (manual.blur !== 0) {
    parts.push(`blur(${manual.blur}px)`);
  }
  if (manual.invert !== 0) {
    parts.push(`invert(${manual.invert}%)`);
  }

  return parts.join(" ") || "none";
};

const parseCSSFilter = (filterStr: string) => {
  const adjustments = {
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
    sepia: 0.0,
    grayscale: 0.0,
    hueRotate: 0.0,
    invert: 0.0,
  };

  const matches = filterStr.match(/(\w+-?\w+)\(([^)]+)\)/g) || [];
  for (const match of matches) {
    const parts = match.split("(");
    const name = parts[0].trim();
    const value = parts[1].replace(")", "").trim();

    if (name === "brightness") {
      adjustments.brightness = parseFloat(value) / 100;
    } else if (name === "contrast") {
      adjustments.contrast = parseFloat(value) / 100;
    } else if (name === "saturate") {
      adjustments.saturation = parseFloat(value) / 100;
    } else if (name === "sepia") {
      adjustments.sepia = parseFloat(value) / 100;
    } else if (name === "grayscale") {
      adjustments.grayscale = parseFloat(value) / 100;
    } else if (name === "hue-rotate") {
      adjustments.hueRotate = parseFloat(value) * (Math.PI / 180);
    } else if (name === "invert") {
      adjustments.invert = parseFloat(value) / 100;
    }
  }

  return adjustments;
};

const ADJUSTMENTS_VERTEX_SHADER = `
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

const ADJUSTMENTS_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float uExposure;          // -1.0 to 1.0
  uniform float uBrightness;        // -1.0 to 1.0
  uniform float uContrast;          // -1.0 to 1.0
  uniform float uSaturation;        // -1.0 to 1.0
  uniform vec3 uTemperatureColor;   // HSL temperature color
  uniform float uTemperatureWeight; // 0.0 to 1.0
  uniform vec3 uTintColor;          // tint color
  uniform float uTintWeight;        // 0.0 to 1.0
  uniform float uSepia;             // 0.0 to 1.0
  uniform float uGrayscale;         // 0.0 to 1.0
  uniform float uHueRotate;         // Radians (0.0 to 2*PI)
  uniform float uVignette;          // 0.0 to 1.0
  uniform float uInvert;            // 0.0 to 1.0

  vec3 hueRotate(vec3 color, float angle) {
      vec3 k = vec3(0.57735, 0.57735, 0.57735);
      float cosAngle = cos(angle);
      return color * cosAngle + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - cosAngle);
  }

  void main() {
      vec4 texColor = texture(uTexture, vTextureCoord);
      vec3 rgb = texColor.rgb;

      // Invert
      rgb = mix(rgb, 1.0 - rgb, uInvert);

      // Exposure
      rgb = rgb * pow(2.0, uExposure);

      // Brightness
      rgb = rgb + uBrightness;

      // Contrast
      rgb = (rgb - 0.5) * (1.0 + uContrast) + 0.5;

      // Saturation
      float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(vec3(luma), rgb, 1.0 + uSaturation);
      rgb = mix(rgb, vec3(luma), uGrayscale);

      // Sepia
      vec3 sepiaColor = vec3(
          dot(rgb, vec3(0.393, 0.769, 0.189)),
          dot(rgb, vec3(0.349, 0.686, 0.168)),
          dot(rgb, vec3(0.272, 0.534, 0.131))
      );
      rgb = mix(rgb, sepiaColor, uSepia);

      // Hue Rotate
      if (uHueRotate != 0.0) {
          rgb = hueRotate(rgb, uHueRotate);
      }

      // Temperature soft-light blend
      if (uTemperatureWeight > 0.0) {
          vec3 t = uTemperatureColor;
          rgb = mix(rgb, (1.0 - 2.0 * t) * rgb * rgb + 2.0 * t * rgb, uTemperatureWeight);
      }

      // Tint soft-light blend
      if (uTintWeight > 0.0) {
          vec3 t = uTintColor;
          rgb = mix(rgb, (1.0 - 2.0 * t) * rgb * rgb + 2.0 * t * rgb, uTintWeight);
      }

      // Vignette
      vec2 uv = vTextureCoord - 0.5;
      float dist = length(uv);
      float vignetteVal = smoothstep(0.45, 1.0, dist);
      rgb = mix(rgb, rgb * 0.0, vignetteVal * uVignette);

      finalColor = vec4(rgb, texColor.a);
  }
`;

// Helper: Apply vignette overlay on canvas
const applyVignette = (ctx: CanvasRenderingContext2D, width: number, height: number, value: number) => {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);

  const gradient = ctx.createRadialGradient(cx, cy, maxRadius * 0.45, cx, cy, maxRadius * 1.0);
  const maxOpacity = value / 100;

  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.5, `rgba(0, 0, 0, ${maxOpacity * 0.15})`);
  gradient.addColorStop(0.8, `rgba(0, 0, 0, ${maxOpacity * 0.55})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${maxOpacity * 0.9})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

// Helper: Apply temperature and tint overlays on canvas
const applyColorOverlays = (ctx: CanvasRenderingContext2D, width: number, height: number, manual: typeof INITIAL_MANUAL_ADJUSTMENTS) => {
  if (manual.temperature !== 0) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    if (manual.temperature > 0) {
      ctx.fillStyle = `rgba(255, 140, 40, ${manual.temperature / 400})`;
    } else {
      ctx.fillStyle = `rgba(40, 120, 255, ${-manual.temperature / 400})`;
    }
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  if (manual.tint !== 0) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    if (manual.tint > 0) {
      ctx.fillStyle = `rgba(255, 40, 180, ${manual.tint / 450})`;
    } else {
      ctx.fillStyle = `rgba(40, 255, 100, ${-manual.tint / 450})`;
    }
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
};

export function FilterWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixiCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // PixiJS references
  const pixiAppRef = useRef<any>(null);
  const adjustmentsFilterRef = useRef<any>(null);
  const maskGraphicsRef = useRef<any>(null);
  const filteredSpriteRef = useRef<any>(null);
  const baseSpriteRef = useRef<any>(null);

  const { publishFilter } = useR2Publish();

  // Media States
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();
  const [isVideo, setIsVideo] = useState(false);
  const [mediaMetadata, setMediaMetadata] = useState<{ width: number; height: number; duration?: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Filter States
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset | null>(null);
  const [intensity, setIntensity] = useState(100);
  const [manualAdjustments, setManualAdjustments] = useState(INITIAL_MANUAL_ADJUSTMENTS);

  // Before/After comparison state
  const [showSplitComparison, setShowSplitComparison] = useState(true);
  const [splitPosition, setSplitPosition] = useState(50); // percentage 0-100
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Left Sidebar Navigation
  const [leftTab, setLeftTab] = useState<"presets" | "ai">("presets");
  const [presetSearch, setPresetSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");

  // Right Sidebar Tabs
  const [rightTab, setRightTab] = useState<"adjust" | "histogram">("adjust");
  const [histogramChannel, setHistogramChannel] = useState<"all" | "r" | "g" | "b" | "l">("all");
  const [histogramData, setHistogramData] = useState<{ r: number[]; g: number[]; b: number[]; l: number[] } | null>(null);

  // AI Generation States
  const [aiPrompt, setAiPrompt] = useState("vintage film look with warm tones");
  const [aiCategory, setAiCategory] = useState<string>("vintage");
  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [aiMessage, setAiMessage] = useState("");

  // Upload States
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  // Preview Frame State
  const [previewFrameUrl, setPreviewFrameUrl] = useState<string | undefined>();
  const [creatorName, setCreatorName] = useState("");
  const [creatorSocialLink, setCreatorSocialLink] = useState("");
  const [showThumbnailLightbox, setShowThumbnailLightbox] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [publishApproved, setPublishApproved] = useState(true);

  // Parse JWT token to check if user is admin
  useEffect(() => {
    const token = localStorage.getItem("clypra_auth_token");
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setIsAdmin(!!payload.isAdmin);
    } catch (e) {
      setIsAdmin(false);
    }
  }, []);

  // Debounced effect to capture raw preview frame when scrubbing or paused
  useEffect(() => {
    if (isPlaying) return;
    if (!mediaUrl) {
      setPreviewFrameUrl(undefined);
      return;
    }

    const timer = setTimeout(() => {
      try {
        if (isVideo) {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          const tempCanvas = document.createElement("canvas");
          const aspect = video.videoWidth / video.videoHeight;
          const targetHeight = Math.min(video.videoHeight, 1080);
          tempCanvas.height = targetHeight;
          tempCanvas.width = Math.round(targetHeight * (aspect || 16 / 9));
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
            setPreviewFrameUrl(tempCanvas.toDataURL("image/jpeg", 0.9));
          }
        } else {
          const img = imageRef.current;
          if (!img) return;
          const tempCanvas = document.createElement("canvas");
          const aspect = img.width / img.height;
          const targetHeight = Math.min(img.height, 1080);
          tempCanvas.height = targetHeight;
          tempCanvas.width = Math.round(targetHeight * (aspect || 1));
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            setPreviewFrameUrl(tempCanvas.toDataURL("image/jpeg", 0.9));
          }
        }
      } catch (err) {
        console.error("Failed to capture preview frame:", err);
      }
    }, 250); // 250ms debounce

    return () => clearTimeout(timer);
  }, [currentTime, isPlaying, isVideo, mediaUrl]);

  // Collapsible Right Panel Sections
  const [expandedSections, setExpandedSections] = useState({
    light: true,
    color: true,
    effects: true,
  });

  // Calculate histogram from canvas (using fast offscreen downsampling)
  const calculateHistogram = useCallback((sourceCanvas: HTMLCanvasElement) => {
    if (!sourceCanvas) return;

    if (!histogramCanvasRef.current) {
      histogramCanvasRef.current = document.createElement("canvas");
    }

    const helper = histogramCanvasRef.current;
    const w = 150;
    const h = 90;
    helper.width = w;
    helper.height = h;

    const helperCtx = helper.getContext("2d");
    if (!helperCtx) return;

    helperCtx.drawImage(sourceCanvas, 0, 0, w, h);

    const imgData = helperCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const rHist = new Array(256).fill(0);
    const gHist = new Array(256).fill(0);
    const bHist = new Array(256).fill(0);
    const lHist = new Array(256).fill(0);

    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      rHist[r]++;
      gHist[g]++;
      bHist[b]++;
      lHist[l]++;
    }

    setHistogramData({ r: rHist, g: gHist, b: bHist, l: lHist });
  }, []);

  // Combined filter calculations
  const combinedFilterString = useMemo(() => {
    return getCombinedFilterString(selectedFilter, intensity, manualAdjustments);
  }, [selectedFilter, intensity, manualAdjustments]);

  // Sync adjustments to PixiJS WebGL shader uniforms
  const syncAdjustmentsUniforms = useCallback(() => {
    const filter = adjustmentsFilterRef.current;

    console.log("[FilterWorkspace] syncAdjustmentsUniforms called");
    console.log("[FilterWorkspace] - filter exists:", !!filter);
    console.log("[FilterWorkspace] - selectedFilter:", selectedFilter?.id, selectedFilter?.name);
    console.log("[FilterWorkspace] - intensity:", intensity);
    console.log("[FilterWorkspace] - usePixi:", selectedFilter?.usePixi);

    if (!filter) {
      console.warn("[FilterWorkspace] No adjustmentsFilter found - cannot sync uniforms");
      return;
    }

    // Parse presets
    const presetAdjust = selectedFilter && selectedFilter.cssFilter ? parseCSSFilter(selectedFilter.cssFilter) : { brightness: 1.0, contrast: 1.0, saturation: 1.0, sepia: 0.0, grayscale: 0.0, hueRotate: 0.0, invert: 0.0 };

    console.log("[FilterWorkspace] - presetAdjust parsed:", presetAdjust);

    const f = intensity / 100;

    // Combine preset & manual
    const finalBrightness = 1.0 + (presetAdjust.brightness - 1.0) * f + manualAdjustments.brightness / 100;
    const finalContrast = 1.0 + (presetAdjust.contrast - 1.0) * f + manualAdjustments.contrast / 100;
    const finalSaturation = 1.0 + (presetAdjust.saturation - 1.0) * f + manualAdjustments.saturation / 100;
    const finalSepia = presetAdjust.sepia * f + manualAdjustments.sepia / 100;
    const finalGrayscale = presetAdjust.grayscale * f + manualAdjustments.grayscale / 100;
    const finalHueRotate = presetAdjust.hueRotate * f + (manualAdjustments.hueRotate * Math.PI) / 180;
    const finalInvert = presetAdjust.invert * f + manualAdjustments.invert / 100;

    console.log("[FilterWorkspace] - finalGrayscale:", finalGrayscale);
    console.log("[FilterWorkspace] - finalContrast:", finalContrast);

    const tempWeight = Math.abs(manualAdjustments.temperature) / 400;
    const tempColor = manualAdjustments.temperature > 0 ? [1.0, 0.55, 0.16] : [0.16, 0.47, 1.0];

    const tintWeight = Math.abs(manualAdjustments.tint) / 450;
    const tintColor = manualAdjustments.tint > 0 ? [1.0, 0.16, 0.71] : [0.16, 1.0, 0.39];

    // Update filter uniforms
    const u = filter.resources.uniforms.uniforms;
    u.uExposure = manualAdjustments.exposure / 100;
    u.uBrightness = finalBrightness - 1.0;
    u.uContrast = finalContrast - 1.0;
    u.uSaturation = finalSaturation - 1.0;
    u.uSepia = finalSepia;
    u.uGrayscale = finalGrayscale;
    u.uHueRotate = finalHueRotate;
    u.uInvert = finalInvert;
    u.uVignette = manualAdjustments.vignette / 100;
    u.uTemperatureColor = tempColor;
    u.uTemperatureWeight = tempWeight;
    u.uTintColor = tintColor;
    u.uTintWeight = tintWeight;

    console.log("[FilterWorkspace] ✅ Uniforms updated:");
    console.log("[FilterWorkspace]    - uGrayscale:", u.uGrayscale);
    console.log("[FilterWorkspace]    - uContrast:", u.uContrast);
    console.log("[FilterWorkspace]    - uBrightness:", u.uBrightness);
    console.log("[FilterWorkspace]    - uSaturation:", u.uSaturation);

    // Check if filter is actually applied to sprite
    const sprite = filteredSpriteRef.current;
    if (sprite) {
      console.log("[FilterWorkspace] Sprite filters:", sprite.filters);
      console.log("[FilterWorkspace] Sprite visible:", sprite.visible);
      console.log("[FilterWorkspace] Sprite has texture:", !!sprite.texture);
    } else {
      console.warn("[FilterWorkspace] ⚠️ No filteredSprite found!");
    }

    // Update split compare mask bounding box
    const mask = maskGraphicsRef.current;
    if (mask && pixiAppRef.current) {
      const app = pixiAppRef.current;
      mask.clear();
      if (showSplitComparison) {
        const splitX = (splitPosition / 100) * app.screen.width;
        mask.rect(splitX, 0, app.screen.width - splitX, app.screen.height).fill(0xffffff);
      } else {
        mask.rect(0, 0, app.screen.width, app.screen.height).fill(0xffffff);
      }
    }
  }, [selectedFilter, intensity, manualAdjustments, showSplitComparison, splitPosition]);

  // Initialize Pixi Application for Filter Workspace
  useEffect(() => {
    const canvas = pixiCanvasRef.current;
    if (!canvas || !mediaUrl || !mediaMetadata) {
      console.log("[FilterWorkspace] PixiJS init skipped - missing requirements:", {
        canvas: !!canvas,
        mediaUrl: !!mediaUrl,
        mediaMetadata: !!mediaMetadata,
      });
      return;
    }

    console.log("[FilterWorkspace] 🚀 Initializing PixiJS...");
    console.log("[FilterWorkspace] Canvas size:", mediaMetadata?.width, "x", mediaMetadata?.height);

    let active = true;

    const initPixi = async () => {
      console.log("[FilterWorkspace] Importing PixiJS modules...");
      const { Application, Sprite, Graphics } = await import("pixi.js");

      console.log("[FilterWorkspace] Creating Application...");
      const app = new Application();
      await app.init({
        canvas,
        width: mediaMetadata?.width || 1280,
        height: mediaMetadata?.height || 720,
        backgroundAlpha: 0,
        antialias: true,
        preference: "webgl",
        preserveDrawingBuffer: true, // Allow frame readbacks for histogram
      });

      console.log("[FilterWorkspace] ✅ PixiJS Application initialized");
      console.log("[FilterWorkspace] Renderer type:", app.renderer.type);
      console.log("[FilterWorkspace] WebGL active:", app.renderer.type === RendererType.WEBGL);

      if (app.renderer.type !== RendererType.WEBGL) {
        console.warn("[FilterWorkspace] ⚠️ WebGL not available! Filters may not work. Renderer type:", app.renderer.type);
      }

      if (!active) {
        console.log("[FilterWorkspace] Component unmounted, destroying app");
        app.destroy(true);
        return;
      }

      pixiAppRef.current = app;
      const stage = app.stage;
      stage.removeChildren();

      console.log("[FilterWorkspace] Creating sprites...");

      // Base Sprite
      const baseSprite = new Sprite();
      baseSprite.width = app.screen.width;
      baseSprite.height = app.screen.height;
      stage.addChild(baseSprite);
      baseSpriteRef.current = baseSprite;

      console.log("[FilterWorkspace] Base sprite created");

      // Filtered Sprite
      const filteredSprite = new Sprite();
      filteredSprite.width = app.screen.width;
      filteredSprite.height = app.screen.height;

      console.log("[FilterWorkspace] Filtered sprite created");

      // Compile the Adjustments filter
      console.log("[FilterWorkspace] Compiling adjustments filter...");
      const adjustmentsFilter = Filter.from({
        gl: { vertex: ADJUSTMENTS_VERTEX_SHADER, fragment: ADJUSTMENTS_FRAGMENT_SHADER },
        resources: {
          uniforms: {
            uExposure: { value: 0.0, type: "f32" },
            uBrightness: { value: 0.0, type: "f32" },
            uContrast: { value: 0.0, type: "f32" },
            uSaturation: { value: 0.0, type: "f32" },
            uTemperatureColor: { value: [1.0, 0.55, 0.16], type: "vec3<f32>" },
            uTemperatureWeight: { value: 0.0, type: "f32" },
            uTintColor: { value: [1.0, 0.16, 0.71], type: "vec3<f32>" },
            uTintWeight: { value: 0.0, type: "f32" },
            uSepia: { value: 0.0, type: "f32" },
            uGrayscale: { value: 0.0, type: "f32" },
            uHueRotate: { value: 0.0, type: "f32" },
            uVignette: { value: 0.0, type: "f32" },
            uInvert: { value: 0.0, type: "f32" },
          },
        },
      });

      console.log("[FilterWorkspace] ✅ Adjustments filter compiled");
      console.log("[FilterWorkspace] Filter object:", adjustmentsFilter);

      filteredSprite.filters = [adjustmentsFilter];
      adjustmentsFilterRef.current = adjustmentsFilter;

      console.log("[FilterWorkspace] ✅ Filter applied to sprite");
      console.log("[FilterWorkspace] Sprite.filters:", filteredSprite.filters);

      // Split compare mask
      const maskGraphics = new Graphics();
      stage.addChild(filteredSprite);
      stage.addChild(maskGraphics);
      filteredSprite.mask = maskGraphics;

      console.log("[FilterWorkspace] ✅ Sprites added to stage");
      console.log("[FilterWorkspace] Stage children count:", stage.children.length);

      maskGraphicsRef.current = maskGraphics;
      filteredSpriteRef.current = filteredSprite;
      baseSpriteRef.current = baseSprite;

      // Set source textures
      console.log("[FilterWorkspace] Loading textures... isVideo:", isVideo);

      if (isVideo && videoRef.current) {
        const { VideoSource, Texture } = await import("pixi.js");
        const source = new VideoSource({ resource: videoRef.current, autoPlay: false });
        const tex = new Texture({ source });
        baseSprite.texture = tex;
        filteredSprite.texture = tex;
        console.log("[FilterWorkspace] ✅ Video texture loaded");
      } else if (!isVideo) {
        const { Texture } = await import("pixi.js");
        const tex = await Texture.from(mediaUrl);
        if (active) {
          baseSprite.texture = tex;
          filteredSprite.texture = tex;
          console.log("[FilterWorkspace] ✅ Image texture loaded:", tex.width, "x", tex.height);
        }
      }

      // Sync uniforms
      syncAdjustmentsUniforms();

      // Render loop tick to draw histogram
      app.ticker.add(() => {
        if (active) {
          calculateHistogram(canvas);
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
      adjustmentsFilterRef.current = null;
      maskGraphicsRef.current = null;
      filteredSpriteRef.current = null;
      baseSpriteRef.current = null;
    };
  }, [mediaUrl, isVideo, mediaMetadata]);

  // Keep uniforms sync'ed when parameters change
  useEffect(() => {
    syncAdjustmentsUniforms();
  }, [syncAdjustmentsUniforms]);

  // Sync histogram when scrubbing / paused
  useEffect(() => {
    if (!isPlaying && pixiCanvasRef.current) {
      calculateHistogram(pixiCanvasRef.current);
    }
  }, [currentTime, isPlaying, calculateHistogram]);

  // Render filter on image
  const renderFilterOnImage = useCallback(
    (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas || !img) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.drawImage(img, 0, 0);

      if (showSplitComparison) {
        const splitX = (splitPosition / 100) * canvas.width;

        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
        ctx.clip();

        ctx.filter = combinedFilterString;
        ctx.drawImage(img, 0, 0);

        applyColorOverlays(ctx, canvas.width, canvas.height, manualAdjustments);

        if (manualAdjustments.vignette > 0) {
          applyVignette(ctx, canvas.width, canvas.height, manualAdjustments.vignette);
        }

        ctx.restore();
      } else {
        ctx.filter = combinedFilterString;
        ctx.drawImage(img, 0, 0);

        applyColorOverlays(ctx, canvas.width, canvas.height, manualAdjustments);

        if (manualAdjustments.vignette > 0) {
          applyVignette(ctx, canvas.width, canvas.height, manualAdjustments.vignette);
        }
      }

      calculateHistogram(canvas);
    },
    [combinedFilterString, manualAdjustments, showSplitComparison, splitPosition, calculateHistogram],
  );

  // Render filter on video frame (traditional canvas rendering fallback)
  const renderFilterOnVideo = useCallback(
    (video: HTMLVideoElement) => {
      const canvas = canvasRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (showSplitComparison) {
        const splitX = (splitPosition / 100) * canvas.width;

        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, canvas.width - splitX, canvas.height);
        ctx.clip();

        ctx.filter = combinedFilterString;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        applyColorOverlays(ctx, canvas.width, canvas.height, manualAdjustments);

        if (manualAdjustments.vignette > 0) {
          applyVignette(ctx, canvas.width, canvas.height, manualAdjustments.vignette);
        }

        ctx.restore();
      } else {
        ctx.filter = combinedFilterString;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        applyColorOverlays(ctx, canvas.width, canvas.height, manualAdjustments);

        if (manualAdjustments.vignette > 0) {
          applyVignette(ctx, canvas.width, canvas.height, manualAdjustments.vignette);
        }
      }

      calculateHistogram(canvas);
    },
    [combinedFilterString, manualAdjustments, showSplitComparison, splitPosition, calculateHistogram],
  );

  // Re-render Canvas 2D fallback when filters or intensity changes (only when Pixi is not mounted)
  useEffect(() => {
    if (!isVideo && imageRef.current) {
      renderFilterOnImage(imageRef.current);
    } else if (isVideo && videoRef.current && !isPlaying) {
      renderFilterOnVideo(videoRef.current);
    }
  }, [isVideo, selectedFilter, intensity, manualAdjustments, showSplitComparison, splitPosition, isPlaying, renderFilterOnImage, renderFilterOnVideo]);

  // Video playback loop (simply updates currentTime - Pixi handles frame ticks automatically)
  useEffect(() => {
    if (!isVideo || !videoRef.current || !isPlaying) return;

    const video = videoRef.current;
    let rafId: number;

    const animate = () => {
      if (video && !video.paused && !video.ended) {
        setCurrentTime(video.currentTime);
        rafId = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isVideo, isPlaying]);

  // Clean up object URLs to prevent leaks
  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  // Handle image upload
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setIsVideo(false);

      const img = new Image();
      img.onload = () => {
        setMediaMetadata({ width: img.width, height: img.height });
        imageRef.current = img;
        renderFilterOnImage(img);

        // Capture initial preview frame for presets
        try {
          const tempCanvas = document.createElement("canvas");
          const aspect = img.width / img.height;
          const targetHeight = Math.min(img.height, 1080);
          tempCanvas.height = targetHeight;
          tempCanvas.width = Math.round(targetHeight * (aspect || 1));
          const tempCtx = tempCanvas.getContext("2d");
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            setPreviewFrameUrl(tempCanvas.toDataURL("image/jpeg", 0.9));
          }
        } catch (err) {
          console.error("Failed to capture initial image preview:", err);
        }
      };
      img.src = url;
    },
    [renderFilterOnImage],
  );

  // Handle video upload
  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    setIsVideo(true);
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleVideoMetadataLoaded = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setMediaMetadata({
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
    });
    if (canvasRef.current) {
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
    }
    if (pixiCanvasRef.current) {
      pixiCanvasRef.current.width = video.videoWidth;
      pixiCanvasRef.current.height = video.videoHeight;
    }
    video.currentTime = 0;
  }, []);

  const handleVideoSeeked = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      renderFilterOnVideo(video);
    },
    [renderFilterOnVideo],
  );

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setCurrentTime(video.currentTime);
    } else {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error("Playback failed:", err);
        });
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Split-screen drag handlers
  const handleMouseDown = useCallback(() => {
    setIsDraggingSplit(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPosition(pct);
    },
    [isDraggingSplit],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSplitPosition(pct);
    },
    [isDraggingSplit],
  );

  // Reset all adjustments
  const handleResetAll = useCallback(() => {
    setManualAdjustments(INITIAL_MANUAL_ADJUSTMENTS);
    setSelectedFilter(null);
    setIntensity(100);
  }, []);

  // Reset a single slider adjustment
  const handleResetSlider = useCallback((key: keyof typeof INITIAL_MANUAL_ADJUSTMENTS) => {
    setManualAdjustments((prev) => ({
      ...prev,
      [key]: INITIAL_MANUAL_ADJUSTMENTS[key],
    }));
  }, []);

  // Update a slider adjustment
  const handleAdjustmentChange = useCallback((key: keyof typeof INITIAL_MANUAL_ADJUSTMENTS, val: number) => {
    setManualAdjustments((prev) => ({
      ...prev,
      [key]: val,
    }));
  }, []);

  // Toggle sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Generate filter with AI
  const handleGenerateFilter = async () => {
    if (!aiPrompt.trim()) {
      setAiMessage("Please enter a filter description");
      setAiStatus("error");
      return;
    }

    setAiStatus("generating");
    setAiMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/filters/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          category: aiCategory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate filter: ${response.statusText}`);
      }

      const data = await response.json();

      const generatedFilter: FilterPreset = {
        id: data.id || `generated-${Date.now()}`,
        name: data.name || "Generated Filter",
        category: (aiCategory as any) || "modern",
        description: data.description || aiPrompt,
        cssFilter: data.cssFilter || "",
        intensity: data.intensity?.default || 100,
      };

      setSelectedFilter(generatedFilter);
      setIntensity(generatedFilter.intensity);
      setAiStatus("success");
      setAiMessage(`Generated: ${generatedFilter.name}`);
    } catch (error) {
      setAiStatus("error");
      setAiMessage(error instanceof Error ? error.message : "Failed to generate filter");
    }
  };

  // Upload filter to R2
  const handleUploadFilter = async () => {
    if (!selectedFilter) {
      setUploadMessage("Please generate or select a filter first");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("");

    // Always generate a thumbnail from the canvas if it exists
    let thumbnailDataUrl: string | undefined;
    const canvas = pixiCanvasRef.current || canvasRef.current;
    if (canvas) {
      try {
        const thumbCanvas = document.createElement("canvas");
        thumbCanvas.width = canvas.width;
        thumbCanvas.height = canvas.height;
        const thumbCtx = thumbCanvas.getContext("2d");
        if (thumbCtx) {
          const source = isVideo ? videoRef.current : imageRef.current;
          if (source) {
            thumbCtx.filter = "none";
            thumbCtx.drawImage(source as any, 0, 0, thumbCanvas.width, thumbCanvas.height);
            thumbCtx.filter = combinedFilterString;
            thumbCtx.drawImage(source as any, 0, 0, thumbCanvas.width, thumbCanvas.height);
            applyColorOverlays(thumbCtx, thumbCanvas.width, thumbCanvas.height, manualAdjustments);
            if (manualAdjustments.vignette > 0) {
              applyVignette(thumbCtx, thumbCanvas.width, thumbCanvas.height, manualAdjustments.vignette);
            }
          } else {
            thumbCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
          }
          thumbnailDataUrl = thumbCanvas.toDataURL("image/png");
        }
      } catch (e) {
        console.error("Failed to generate preview thumbnail:", e);
      }
    }

    const creatorInfo = creatorName.trim()
      ? {
          name: creatorName.trim(),
          socialLink: creatorSocialLink.trim() || undefined,
        }
      : undefined;

    // Check if R2 direct publishing configuration is present
    const r2Config = getR2Config();

    if (r2Config) {
      try {
        const result = await publishFilter({
          id: selectedFilter.id,
          category: selectedFilter.category,
          definition: {
            id: selectedFilter.id,
            name: selectedFilter.name,
            category: selectedFilter.category,
            description: selectedFilter.description || "",
            intensity: "Medium",
            swatch: selectedFilter.cssFilter,
            creator: creatorInfo,
            published: isAdmin ? publishApproved : false,
          },
          thumbnailDataUrl,
        });

        setUploadStatus("success");
        setUploadMessage(result.message || `Filter "${selectedFilter.name}" published directly to R2 bucket!`);
      } catch (error) {
        setUploadStatus("error");
        setUploadMessage(error instanceof Error ? error.message : "Failed to publish filter to R2");
      }
      return;
    }

    // Fallback to worker-based API upload
    try {
      const response = await fetch(`${API_BASE_URL}/filters/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: {
            id: selectedFilter.id,
            name: selectedFilter.name,
            category: selectedFilter.category,
            description: selectedFilter.description,
            intensity: "Medium",
            swatch: selectedFilter.cssFilter,
            creator: creatorInfo,
            published: isAdmin ? publishApproved : false,
          },
          thumbnailDataUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadStatus("success");
      setUploadMessage(data.message || "Filter uploaded successfully!");
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage(error instanceof Error ? error.message : "Failed to upload filter");
    }
  };

  // Export frame
  const exportFrame = useCallback(() => {
    const canvas = pixiCanvasRef.current || canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedFilter?.name || "clypra"}-grade-preview.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [selectedFilter]);

  // Filtered presets listing
  const filteredPresets = useMemo(() => {
    return PRESET_FILTERS.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch = presetSearch === "" || p.name.toLowerCase().includes(presetSearch.toLowerCase()) || p.description.toLowerCase().includes(presetSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, presetSearch]);

  // Histogram Path SVG Generator
  const histogramSVGData = useMemo(() => {
    if (!histogramData) return { rPath: "", gPath: "", bPath: "", lPath: "", maxVal: 1 };

    const width = 260;
    const height = 110;

    const maxVal = Math.max(...histogramData.r, ...histogramData.g, ...histogramData.b, ...histogramData.l, 1);

    const getPathData = (bins: number[]) => {
      let points = `M 0 ${height} `;
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * width;
        const y = height - (bins[i] / maxVal) * height * 0.95;
        points += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      points += `L ${width} ${height} Z`;
      return points;
    };

    return {
      rPath: getPathData(histogramData.r),
      gPath: getPathData(histogramData.g),
      bPath: getPathData(histogramData.b),
      lPath: getPathData(histogramData.l),
      maxVal,
    };
  }, [histogramData]);

  return (
    <div className="flex h-full bg-[#07070A] text-[#F4F4F7] font-sans overflow-hidden select-none">
      {/* ================= LEFT SIDEBAR ================= */}
      <div className="w-[340px] bg-[#111117] border-r border-[#22222F] flex flex-col shrink-0 overflow-hidden">
        {/* Header Tab Switcher */}
        <div className="p-2 border-b border-[#22222F] space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#7C6FFF]/10 rounded-lg text-[#7C6FFF]">
              <Palette size={18} />
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase text-white">Filter Lab</h1>
              <p className="text-[10px] text-[#8A8A99]">Color grading and look development</p>
            </div>
          </div>

          {/* Glassmorphic Tabs */}
          <div className="flex p-0.5 bg-[#0F0F15] rounded-lg border border-[#22222F]/40">
            <button onClick={() => setLeftTab("presets")} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${leftTab === "presets" ? "bg-[#1E1E2A] text-white shadow-md border border-[#33334A]/50" : "text-[#8A8A99] hover:text-white"}`}>
              Preset Library
            </button>
            <button onClick={() => setLeftTab("ai")} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${leftTab === "ai" ? "bg-[#1E1E2A] text-white shadow-md border border-[#33334A]/50" : "text-[#8A8A99] hover:text-white"}`}>
              <Sparkles size={12} className={leftTab === "ai" ? "text-purple-400" : ""} />
              AI Generator
            </button>
          </div>
        </div>

        {/* Tab 1: Preset Library Content */}
        {leftTab === "presets" && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search and Category filters */}
            <div className="p-2 space-y-2.5 border-b border-[#22222F]/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A99]" />
                <input type="text" placeholder="Search color presets..." value={presetSearch} onChange={(e) => setPresetSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 bg-[#0F0F15] border border-[#22222F] rounded-md text-xs text-white placeholder-[#5B5B6E] focus:border-[#7C6FFF] focus:ring-1 focus:ring-[#7C6FFF]/30 outline-none transition-all" />
              </div>

              {/* Category selector chips */}
              <div className="flex flex-wrap gap-1 items-center max-h-[75px] overflow-y-auto pr-1">
                {FILTER_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full transition-all border cursor-pointer ${selectedCategory === cat ? "bg-[#7C6FFF]/15 border-[#7C6FFF]/50 text-white" : "bg-[#1C1C26]/40 border-[#22222F] text-[#8A8A99] hover:text-white hover:bg-[#1E1E2A]"}`}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets Cards Grid */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredPresets.length > 0 ? (
                filteredPresets.map((preset) => {
                  const isSelected = selectedFilter?.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedFilter(preset);
                        setIntensity(100);
                      }}
                      className={`w-full p-2.5 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer group ${isSelected ? "bg-[#1E1E2A] border-[#7C6FFF] shadow-md shadow-[#7C6FFF]/5" : "bg-[#13131B] border-[#22222F] hover:bg-[#181824] hover:border-[#2C2C3F]"}`}
                    >
                      {/* Mini Preview Square */}
                      <div className="relative w-12 h-12 rounded bg-gradient-to-tr from-[#3A3270] to-[#7C6FFF] overflow-hidden shrink-0 border border-[#22222F] group-hover:scale-105 transition-transform duration-300">
                        <div
                          className="w-full h-full bg-cover bg-center"
                          style={{
                            backgroundImage: previewFrameUrl ? `url(${previewFrameUrl})` : "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&auto=format&fit=crop')",
                            filter: preset.cssFilter,
                          }}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#7C6FFF]/20 flex items-center justify-center text-white">
                            <Check size={14} className="drop-shadow-md" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-semibold text-white truncate">{preset.name}</span>
                          <span className="text-[9px] uppercase tracking-wider text-[#8A8A99] font-mono shrink-0 scale-90">{preset.category}</span>
                        </div>
                        <p className="text-[10px] text-[#8A8A99] line-clamp-2 mt-1 leading-normal">{preset.description}</p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-[#8A8A99] text-xs">No presets match your search</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: AI Generator Content */}
        {leftTab === "ai" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#B96FFF] flex items-center gap-1.5">
                <Sparkles size={14} className="animate-pulse" />
                Prompt-to-Filter Engine
              </span>
              <p className="text-[10px] text-[#8A8A99] leading-relaxed">Describe a color grading style or movie atmosphere. Our engine will generate a custom color look for you.</p>
            </div>

            {/* AI Prompts Suggestions */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-[#8A8A99] font-semibold">Quick Suggestions</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PROMPT_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAiPrompt(sug.prompt);
                      setAiCategory(sug.category);
                    }}
                    className="p-1.5 bg-[#13131B] hover:bg-[#1C1C2A] border border-[#22222F] hover:border-[#33334A] rounded text-[10px] text-[#8A8A99] hover:text-white text-left transition-colors truncate cursor-pointer"
                  >
                    ⚡ {sug.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Prompt */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#8A8A99] font-semibold flex justify-between">
                <span>Prompt Description</span>
                <span className="text-[#8A8A99]">{aiPrompt.length} chars</span>
              </label>
              <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. vintage warm sunset with golden tones and faded shadows..." rows={4} className="w-full px-3 py-2 bg-[#0F0F15] border border-[#22222F] focus:border-[#7C6FFF] rounded-md text-xs text-white placeholder-[#5B5B6E] resize-none outline-none focus:ring-1 focus:ring-[#7C6FFF]/30 transition-all leading-normal" />
            </div>

            {/* AI Category Select */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-[#8A8A99] font-semibold">Target Style Category</label>
              <select value={aiCategory} onChange={(e) => setAiCategory(e.target.value)} className="w-full px-3 py-2 bg-[#0F0F15] border border-[#22222F] focus:border-[#7C6FFF] rounded-md text-xs text-white focus:ring-1 focus:ring-[#7C6FFF]/30 outline-none transition-all">
                {FILTER_CATEGORIES.filter((c) => c !== "all").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Action button */}
            <button onClick={handleGenerateFilter} disabled={aiStatus === "generating"} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7C6FFF] hover:bg-[#685BEA] disabled:bg-[#7C6FFF]/50 text-white font-semibold text-xs rounded-lg shadow-lg shadow-[#7C6FFF]/10 transition-colors disabled:cursor-not-allowed cursor-pointer">
              {aiStatus === "generating" ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing look...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Lookup Look
                </>
              )}
            </button>

            {/* Status alerts */}
            {aiMessage && (
              <div className={`p-2.5 rounded-lg border text-xs leading-normal flex gap-2 items-start ${aiStatus === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
                <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0 bg-current" />
                <div>{aiMessage}</div>
              </div>
            )}
          </div>
        )}

        {/* Media Import section footer */}
        <div className="p-4 border-t border-[#22222F] bg-[#0F0F15] space-y-2 shrink-0">
          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1C1C26] hover:bg-[#252533] border border-[#2E2E3E] hover:border-[#3A3A4E] text-[#C5C5D2] hover:text-white text-[11px] font-semibold rounded-md cursor-pointer transition-colors">
              <Film size={13} className="text-[#8A8A99]" />
              <span>Import Video</span>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </label>

            <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1C1C26] hover:bg-[#252533] border border-[#2E2E3E] hover:border-[#3A3A4E] text-[#C5C5D2] hover:text-white text-[11px] font-semibold rounded-md cursor-pointer transition-colors">
              <ImageIcon size={13} className="text-[#8A8A99]" />
              <span>Import Image</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {mediaMetadata && (
            <div className="p-2 bg-[#0A0A0E] rounded border border-[#1A1A24] text-[9px] font-mono text-[#8A8A99] flex justify-between items-center">
              <span>
                {isVideo ? "VIDEO" : "IMAGE"} &bull; {mediaMetadata.width}x{mediaMetadata.height}
              </span>
              {isVideo && mediaMetadata.duration && <span>{mediaMetadata.duration.toFixed(1)}s</span>}
            </div>
          )}
        </div>
      </div>

      {/* ================= CENTER WORKSPACE / CANVAS VIEWPORT ================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B0B0F] overflow-hidden">
        {/* Main Toolbar */}
        <div className="h-14 border-b border-[#1A1A24] px-4 flex items-center justify-between shrink-0 bg-[#0E0E14]/70 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-white">Viewer</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-3">
            {mediaUrl && (
              <>
                {/* Draggable Split Switch */}
                <button onClick={() => setShowSplitComparison((prev) => !prev)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${showSplitComparison ? "bg-[#7C6FFF]/15 border-[#7C6FFF]/40 text-[#A49BFF]" : "bg-[#181824] border-[#22222F] text-[#8A8A99] hover:text-white"}`}>
                  {showSplitComparison ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>Split Comparison</span>
                </button>

                {/* Reset button */}
                <button onClick={handleResetAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181824] hover:bg-[#1E1E2D] border border-[#22222F] hover:border-[#323247] rounded-md text-[11px] font-medium text-[#8A8A99] hover:text-white transition-colors cursor-pointer">
                  <Undo size={13} />
                  <span>Reset All</span>
                </button>

                {/* Export button */}
                <button onClick={exportFrame} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181824] hover:bg-[#1E1E2D] border border-[#22222F] hover:border-[#323247] rounded-md text-[11px] font-medium text-[#8A8A99] hover:text-white transition-colors cursor-pointer">
                  <Download size={13} />
                  <span>Export Frame</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Canvas Workspace Viewport Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(28,26,45,0.4)_0%,transparent_70%)]">
          {mediaUrl ? (
            <div ref={containerRef} className="relative inline-block max-h-full max-w-full rounded-xl overflow-hidden shadow-2xl border border-[#22222F] checkerboard" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onTouchMove={handleTouchMove} onTouchEnd={handleMouseUp}>
              <canvas
                ref={canvasRef}
                style={{
                  display: "none",
                }}
              />
              <canvas
                ref={pixiCanvasRef}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "calc(100vh - 200px)",
                  width: "auto",
                  height: "auto",
                }}
                className="select-none pointer-events-none"
              />

              {mediaUrl && isVideo && <video ref={videoRef} src={mediaUrl} className="hidden" preload="auto" playsInline muted onLoadedMetadata={handleVideoMetadataLoaded} onSeeked={handleVideoSeeked} />}

              {/* Slider Drag Overlay */}
              {showSplitComparison && (
                <>
                  {/* Draggable Divider line */}
                  <div className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize select-none pointer-events-auto" style={{ left: `${splitPosition}%` }} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
                    {/* Glowing circular handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-black shadow-2xl border border-gray-400/30 flex items-center justify-center font-bold text-xs select-none hover:scale-110 active:scale-95 transition-all cursor-ew-resize">↔</div>
                  </div>

                  {/* Before / After labels */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border border-white/5 pointer-events-none select-none">Before</div>
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border border-white/5 pointer-events-none select-none">After</div>
                </>
              )}

              {/* Current Active Preset Overlay badge */}
              {selectedFilter && (
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-[#E1E1E6] px-3 py-1.5 rounded-lg border border-white/5 text-[10px] pointer-events-none select-none">
                  <div className="font-bold">{selectedFilter.name}</div>
                  <div className="text-[#8A8A99] font-mono text-[9px] scale-90 -ml-1 mt-0.5">Strength: {intensity}%</div>
                </div>
              )}
            </div>
          ) : (
            /* Styled Import drop zone placeholder */
            <div className="max-w-md w-full p-8 rounded-2xl border border-[#22222F] bg-[#111117]/60 backdrop-blur-md text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C6FFF]/20 to-purple-500/20 border border-[#7C6FFF]/25 flex items-center justify-center mx-auto text-[#7C6FFF]">
                <Compass size={28} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Clypra Studio Canvas</h3>
                <p className="text-xs text-[#8A8A99] max-w-xs mx-auto leading-relaxed">Import a video or image file to start grading. You can apply stunning cinematic presets, adjust specific tones, or generate custom looks using AI.</p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <label className="flex items-center gap-2 py-2 px-4 bg-[#7C6FFF] hover:bg-[#685BEA] text-white text-xs font-semibold rounded-lg shadow-lg shadow-[#7C6FFF]/10 cursor-pointer transition-colors">
                  <Film size={14} />
                  <span>Import Video</span>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
                <label className="flex items-center gap-2 py-2 px-4 bg-[#1E1E2A] hover:bg-[#282837] border border-[#2A2A3D] text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                  <ImageIcon size={14} />
                  <span>Import Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Video Scrubber Timeline */}
        {isVideo && mediaUrl && (
          <div className="h-16 border-t border-[#1A1A24] bg-[#0E0E14] px-4 flex items-center gap-4 shrink-0">
            <button onClick={handlePlayPause} className="w-8 h-8 rounded-full bg-[#7C6FFF] hover:bg-[#685BEA] flex items-center justify-center text-white shrink-0 shadow transition-colors cursor-pointer">
              {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
            </button>

            {/* Scrubber slider track */}
            <div className="flex-1 relative group py-2">
              <input type="range" min="0" max={mediaMetadata?.duration || 0} step="0.05" value={currentTime} onChange={(e) => handleSeek(parseFloat(e.target.value))} className="w-full h-1 bg-[#1E1E2A] rounded-lg appearance-none cursor-pointer outline-none focus:outline-none accent-[#7C6FFF]" />
            </div>

            {/* Time counters */}
            <div className="text-[11px] font-mono text-[#8A8A99] shrink-0 select-none">
              <span className="text-white">{currentTime.toFixed(2)}s</span>
              <span className="opacity-50"> / </span>
              <span>{mediaMetadata?.duration?.toFixed(2) || "0.00"}s</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= RIGHT SIDEBAR ================= */}
      <div className="w-[300px] bg-[#111117] border-l border-[#22222F] flex flex-col shrink-0 overflow-hidden">
        {/* Header Tab switches */}
        <div className="flex border-b border-[#22222F] shrink-0 bg-[#0F0F15]/40">
          <button onClick={() => setRightTab("adjust")} className={`flex-1 py-3 text-[11px] uppercase tracking-wider font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${rightTab === "adjust" ? "border-[#7C6FFF] text-white" : "border-transparent text-[#8A8A99] hover:text-white"}`}>
            <SlidersHorizontal size={13} />
            <span>Grading Controls</span>
          </button>

          <button onClick={() => setRightTab("histogram")} className={`flex-1 py-3 text-[11px] uppercase tracking-wider font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${rightTab === "histogram" ? "border-[#7C6FFF] text-white" : "border-transparent text-[#8A8A99] hover:text-white"}`}>
            <BarChart4 size={13} />
            <span>Histogram</span>
          </button>
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Tab 1: Grading Controls */}
          {rightTab === "adjust" && (
            <div className="p-2 space-y-2">
              {/* Preset Intensity Slider */}
              {selectedFilter ? (
                <div className="p-3 bg-[#171720] rounded-xl border border-[#252535] space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">Preset: {selectedFilter.name}</span>
                    <button
                      onClick={() => {
                        setSelectedFilter(null);
                        setIntensity(100);
                      }}
                      className="text-[10px] text-[#A49BFF] hover:text-white transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#8A8A99]">
                      <span>Look Mix</span>
                      <span className="font-mono text-[#7C6FFF] font-semibold">{intensity}%</span>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded-md appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#12121A] rounded-xl border border-[#1A1A26] text-center">
                  <p className="text-[11px] text-[#8A8A99]">Select a preset filter on the left sidebar to mix and adjust its intensity</p>
                </div>
              )}

              {/* SECTION: LIGHT */}
              <div className="border border-[#22222F] rounded-lg overflow-hidden bg-[#13131B]">
                <button onClick={() => toggleSection("light")} className="w-full px-3 py-2 bg-[#171723] hover:bg-[#1B1B2C] border-b border-[#22222F] flex justify-between items-center text-xs font-bold text-white transition-colors cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Sun size={13} className="text-amber-400" />
                    <span>Light Adjustments</span>
                  </span>
                  {expandedSections.light ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {expandedSections.light && (
                  <div className="p-3.5 space-y-4">
                    {/* Exposure */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Exposure</span>
                        <div className="flex gap-2">
                          <button onDoubleClick={() => handleResetSlider("exposure")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer" title="Double-click to reset">
                            {manualAdjustments.exposure > 0 ? `+${manualAdjustments.exposure}` : manualAdjustments.exposure}%
                          </button>
                        </div>
                      </div>
                      <input type="range" min="-100" max="100" step="1" value={manualAdjustments.exposure} onChange={(e) => handleAdjustmentChange("exposure", parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>

                    {/* Brightness */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Brightness</span>
                        <button onDoubleClick={() => handleResetSlider("brightness")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.brightness > 0 ? `+${manualAdjustments.brightness}` : manualAdjustments.brightness}%
                        </button>
                      </div>
                      <input type="range" min="-100" max="100" step="1" value={manualAdjustments.brightness} onChange={(e) => handleAdjustmentChange("brightness", parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>

                    {/* Contrast */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Contrast</span>
                        <button onDoubleClick={() => handleResetSlider("contrast")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.contrast > 0 ? `+${manualAdjustments.contrast}` : manualAdjustments.contrast}%
                        </button>
                      </div>
                      <input type="range" min="-100" max="100" step="1" value={manualAdjustments.contrast} onChange={(e) => handleAdjustmentChange("contrast", parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: COLOR */}
              <div className="border border-[#22222F] rounded-lg overflow-hidden bg-[#13131B]">
                <button onClick={() => toggleSection("color")} className="w-full px-3 py-2 bg-[#171723] hover:bg-[#1B1B2C] border-b border-[#22222F] flex justify-between items-center text-xs font-bold text-white transition-colors cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Palette size={13} className="text-sky-400" />
                    <span>Color & Tone</span>
                  </span>
                  {expandedSections.color ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {expandedSections.color && (
                  <div className="p-3.5 space-y-4">
                    {/* Temperature */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Temperature (Warmth)</span>
                        <button onDoubleClick={() => handleResetSlider("temperature")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.temperature > 0 ? `Warm (${manualAdjustments.temperature})` : manualAdjustments.temperature < 0 ? `Cool (${manualAdjustments.temperature})` : "Neutral"}
                        </button>
                      </div>
                      <input type="range" min="-100" max="100" step="1" value={manualAdjustments.temperature} onChange={(e) => handleAdjustmentChange("temperature", parseInt(e.target.value))} className="w-full h-1 rounded appearance-none bg-gradient-to-r from-blue-500 via-[#0F0F15] to-amber-500 accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>

                    {/* Tint */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Tint (Magenta/Green)</span>
                        <button onDoubleClick={() => handleResetSlider("tint")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.tint > 0 ? `Magenta (${manualAdjustments.tint})` : manualAdjustments.tint < 0 ? `Green (${manualAdjustments.tint})` : "Neutral"}
                        </button>
                      </div>
                      <input type="range" min="-100" max="100" step="1" value={manualAdjustments.tint} onChange={(e) => handleAdjustmentChange("tint", parseInt(e.target.value))} className="w-full h-1 rounded appearance-none bg-gradient-to-r from-emerald-500 via-[#0F0F15] to-pink-500 accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>

                    {/* Saturation */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Saturation</span>
                        <button onDoubleClick={() => handleResetSlider("saturation")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.saturation > 0 ? `+${manualAdjustments.saturation}` : manualAdjustments.saturation}%
                        </button>
                      </div>
                      <input type="range" min="-100" max="100" step="1" value={manualAdjustments.saturation} onChange={(e) => handleAdjustmentChange("saturation", parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: EFFECTS */}
              <div className="border border-[#22222F] rounded-lg overflow-hidden bg-[#13131B]">
                <button onClick={() => toggleSection("effects")} className="w-full px-3 py-2 bg-[#171723] hover:bg-[#1B1B2C] border-b border-[#22222F] flex justify-between items-center text-xs font-bold text-white transition-colors cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Sliders size={13} className="text-purple-400" />
                    <span>Stylized Effects</span>
                  </span>
                  {expandedSections.effects ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {expandedSections.effects && (
                  <div className="p-3.5 space-y-4">
                    {/* Vignette */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Vignette (Dark Corners)</span>
                        <button onDoubleClick={() => handleResetSlider("vignette")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.vignette}%
                        </button>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={manualAdjustments.vignette} onChange={(e) => handleAdjustmentChange("vignette", parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>

                    {/* Sepia */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Vintage Sepia</span>
                        <button onDoubleClick={() => handleResetSlider("sepia")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.sepia}%
                        </button>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={manualAdjustments.sepia} onChange={(e) => handleAdjustmentChange("sepia", parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>

                    {/* Grayscale */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Grayscale Mix</span>
                        <button onDoubleClick={() => handleResetSlider("grayscale")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.grayscale}%
                        </button>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={manualAdjustments.grayscale} onChange={(e) => handleAdjustmentChange("grayscale", parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>

                    {/* Blur */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Lens Defocus (Blur)</span>
                        <button onDoubleClick={() => handleResetSlider("blur")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.blur}px
                        </button>
                      </div>
                      <input type="range" min="0" max="15" step="0.5" value={manualAdjustments.blur} onChange={(e) => handleAdjustmentChange("blur", parseFloat(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>

                    {/* Invert */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#8A8A99] font-medium">Invert Phase</span>
                        <button onDoubleClick={() => handleResetSlider("invert")} className="text-[9px] font-mono text-[#7C6FFF] hover:text-white cursor-pointer">
                          {manualAdjustments.invert}%
                        </button>
                      </div>
                      <input type="range" min="0" max="100" step="5" value={manualAdjustments.invert} onChange={(e) => handleAdjustmentChange("invert", parseInt(e.target.value))} className="w-full h-1 bg-[#0F0F15] rounded appearance-none accent-[#7C6FFF] outline-none cursor-pointer" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Histogram Visualization */}
          {rightTab === "histogram" && (
            <div className="p-4 space-y-5">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-white">Live Signal Analysis</span>
                <p className="text-[10px] text-[#8A8A99] leading-relaxed">Calculated dynamically from the viewport composite. Double check color clipping in shadows or highlights.</p>
              </div>

              {/* Histogram Display Box */}
              <div className="bg-[#0A0A0E] rounded-xl border border-[#22222F] p-3 space-y-3 shadow-inner">
                {histogramData ? (
                  <div className="relative">
                    {/* SVG Curve */}
                    <svg className="w-full h-[110px]" viewBox="0 0 260 110">
                      <g className="mix-blend-screen opacity-75">
                        {/* Red Channel */}
                        {(histogramChannel === "all" || histogramChannel === "r") && <path d={histogramSVGData.rPath} fill="rgba(239, 68, 68, 0.2)" stroke="rgb(239, 68, 68)" strokeWidth="1" />}

                        {/* Green Channel */}
                        {(histogramChannel === "all" || histogramChannel === "g") && <path d={histogramSVGData.gPath} fill="rgba(34, 197, 94, 0.18)" stroke="rgb(34, 197, 94)" strokeWidth="1" />}

                        {/* Blue Channel */}
                        {(histogramChannel === "all" || histogramChannel === "b") && <path d={histogramSVGData.bPath} fill="rgba(59, 130, 246, 0.25)" stroke="rgb(59, 130, 246)" strokeWidth="1" />}

                        {/* Luminance Channel */}
                        {(histogramChannel === "all" || histogramChannel === "l") && <path d={histogramSVGData.lPath} fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.2" strokeDasharray="2,2" />}
                      </g>
                    </svg>

                    {/* Scale labels */}
                    <div className="flex justify-between items-center text-[9px] font-mono text-[#5B5B6E] mt-1.5 pt-1.5 border-t border-[#22222F]/40 select-none">
                      <span>Shadows (0)</span>
                      <span>Midtones</span>
                      <span>Highlights (255)</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[120px] flex items-center justify-center text-[#5B5B6E] text-xs">No signal detected</div>
                )}
              </div>

              {/* Histogram channel filter tabs */}
              <div className="flex flex-wrap gap-1 p-0.5 bg-[#0F0F15] border border-[#22222F]/50 rounded-lg">
                {(["all", "r", "g", "b", "l"] as const).map((ch) => (
                  <button key={ch} onClick={() => setHistogramChannel(ch)} className={`flex-1 py-1 text-[9px] font-semibold uppercase tracking-wider rounded transition-all cursor-pointer ${histogramChannel === ch ? "bg-[#1E1E2A] text-white" : "text-[#8A8A99] hover:text-white"}`}>
                    {ch === "all" ? "RGB" : ch}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload lookup to R2 footer */}
        {selectedFilter && (
          <div className="p-4 border-t border-[#22222F] bg-[#0F0F15] space-y-3 shrink-0">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-[#8A8A99] font-bold flex items-center gap-1.5">
                <Zap size={11} className="text-teal-400" />
                Look Deployment
              </span>
              {previewFrameUrl && (
                <div onClick={() => setShowThumbnailLightbox(true)} className="relative aspect-video w-full rounded border border-[#1A1A24] overflow-hidden bg-black/45 shadow-inner cursor-zoom-in hover:border-[#7C6FFF]/50 transition-colors group" title="Click to zoom preview">
                  <img src={previewFrameUrl} alt="Current Thumbnail Frame" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" style={{ filter: selectedFilter.cssFilter }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent flex items-end p-1.5 pointer-events-none">
                    <span className="text-[8px] text-gray-300 uppercase tracking-widest font-mono">Thumbnail Frame</span>
                  </div>
                </div>
              )}
              <div className="p-2 bg-[#0A0A0E] rounded border border-[#1A1A24] space-y-1 text-[10px] leading-normal font-mono">
                <div className="flex justify-between text-[#8A8A99]">
                  <span className="truncate">NAME:</span> <span className="text-white font-sans font-semibold truncate max-w-[140px]">{selectedFilter.name}</span>
                </div>
                <div className="flex justify-between text-[#8A8A99]">
                  <span className="truncate">CAT:</span> <span className="text-white font-sans">{selectedFilter.category}</span>
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[#8A8A99] font-bold">Creator Name</label>
                  <input type="text" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="Your Name / Handle" className="w-full px-2.5 py-1.5 bg-[#0A0A0E] border border-[#1A1A24] focus:border-[#7C6FFF] rounded-md text-[11px] text-white placeholder-[#5B5B6E] outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-[#8A8A99] font-bold">Social Link</label>
                  <input type="url" value={creatorSocialLink} onChange={(e) => setCreatorSocialLink(e.target.value)} placeholder="e.g. instagram.com/handle" className="w-full px-2.5 py-1.5 bg-[#0A0A0E] border border-[#1A1A24] focus:border-[#7C6FFF] rounded-md text-[11px] text-white placeholder-[#5B5B6E] outline-none transition-all" />
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 pt-1.5 select-none">
                    <input id="filter-publish-checkbox" type="checkbox" checked={publishApproved} onChange={(e) => setPublishApproved(e.target.checked)} className="h-3.5 w-3.5 rounded border-[#1A1A24] bg-[#0A0A0E] text-[#10B981] focus:ring-[#10B981] cursor-pointer" />
                    <label htmlFor="filter-publish-checkbox" className="text-[10px] font-semibold text-white cursor-pointer">
                      Approve & Publish immediately
                    </label>
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleUploadFilter} disabled={uploadStatus === "uploading"} className="w-full flex items-center justify-center gap-2 py-2 bg-[#10B981] hover:bg-[#059669] disabled:bg-[#10B981]/50 text-white font-semibold text-xs rounded-lg shadow-lg shadow-[#10B981]/5 transition-colors disabled:cursor-not-allowed cursor-pointer">
              {uploadStatus === "uploading" ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Uploading look...
                </>
              ) : (
                <>
                  <Zap size={13} />
                  Deploy Filter to R2
                </>
              )}
            </button>

            {uploadMessage && <div className={`p-2 rounded text-[10px] leading-normal border ${uploadStatus === "error" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>{uploadMessage}</div>}
          </div>
        )}
      </div>
      {showThumbnailLightbox && previewFrameUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-8 cursor-zoom-out" onClick={() => setShowThumbnailLightbox(false)}>
          <div className="relative max-w-4xl max-h-full rounded-2xl border border-white/10 overflow-hidden bg-[#0A0A0F] shadow-2xl flex flex-col cursor-default animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#22222F] flex justify-between items-center bg-[#0F0F15]/80">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Thumbnail Frame Preview</h4>
                <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                  Graded Resolution: {mediaMetadata?.width || "Original"} x {mediaMetadata?.height || "Original"}
                </p>
              </div>
              <button onClick={() => setShowThumbnailLightbox(false)} className="text-gray-400 hover:text-white text-xs bg-[#1E1E2A] hover:bg-[#2A2A3A] px-2 py-1 rounded border border-[#2E2E3E] cursor-pointer transition-colors">
                Close
              </button>
            </div>
            {/* Graded Image */}
            <div className="p-4 flex items-center justify-center bg-[radial-gradient(circle_at_center,#1A1A24_0%,#0A0A0E_100%)] overflow-hidden">
              <img src={previewFrameUrl} alt="Grades Preview Frame" className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-2xl border border-[#1A1A26]" style={{ filter: selectedFilter?.cssFilter }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
