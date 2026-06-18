import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from "../hooks/useGeminiApiKey";
import type { TextEffectConfig } from "@clypra/engine";

export interface VideoEffectPresetSuggestion {
  id: string;
  name: string;
  description: string;
  renderer: string;
  params: Record<string, unknown>;
  tags: string[];
  defaultIntensity: number;
  isPremium?: boolean;
}

function createGeminiClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Missing Gemini API key. Please configure it in Settings → API Key.");
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { "User-Agent": "clypra-studio" },
    },
  });
}

// Helper to extract clean error messages
function extractErrorMessage(error: any): string {
  // If it's already a string, return it
  if (typeof error === "string") return error;

  // Try to extract from response.error.message (Gemini API format)
  if (error?.response?.error?.message) return error.response.error.message;

  // Try to extract from error.message
  if (error?.error?.message) return error.error.message;

  // Try to extract message from error object
  if (error?.message) return error.message;

  // Try to extract from response.error.code
  if (error?.response?.error?.code) {
    const code = error.response.error.code;
    const statusMessages: Record<number, string> = {
      400: "Invalid request. Please check your input.",
      401: "Invalid API key. Please check your Gemini API key in Settings.",
      403: "Access denied. Please verify your API key permissions.",
      404: "Model not found. The requested Gemini model may not be available.",
      429: "Rate limit exceeded. Please try again in a moment.",
      500: "Gemini service error. Please try again later.",
      503: "Gemini service temporarily unavailable. Please try again later.",
    };
    return statusMessages[code] || `Request failed with code ${code}`;
  }

  // Try to extract from status
  if (error?.status) {
    const statusMessages: Record<string, string> = {
      INVALID_ARGUMENT: "Invalid request. Please check your input.",
      UNAUTHENTICATED: "Invalid API key. Please check your Gemini API key in Settings.",
      PERMISSION_DENIED: "Access denied. Please verify your API key permissions.",
      NOT_FOUND: "Model not found. The requested Gemini model may not be available.",
      RESOURCE_EXHAUSTED: "Rate limit exceeded. Please try again in a moment.",
      INTERNAL: "Gemini service error. Please try again later.",
      UNAVAILABLE: "Gemini service temporarily unavailable. Please try again later.",
    };
    return statusMessages[error.status] || `Request failed with status ${error.status}`;
  }

  // Default fallback
  return "An unexpected error occurred. Please try again.";
}

// Schema definitions
const textEffectConfigResponseSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING },
    fontFamily: { type: Type.STRING },
    fontSize: { type: Type.NUMBER },
    fillType: { type: Type.STRING },
    fillColor: { type: Type.STRING },
    fillGradientAngle: { type: Type.NUMBER },
    fillGradientStops: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          color: { type: Type.STRING },
          offset: { type: Type.NUMBER },
        },
      },
    },
    strokeEnabled: { type: Type.BOOLEAN },
    strokeColor: { type: Type.STRING },
    strokeWidth: { type: Type.NUMBER },
    glowLayers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          enabled: { type: Type.BOOLEAN },
          color: { type: Type.STRING },
          blur: { type: Type.NUMBER },
          opacity: { type: Type.NUMBER },
          type: { type: Type.STRING },
        },
      },
    },
    shadowEnabled: { type: Type.BOOLEAN },
    shadowColor: { type: Type.STRING },
    shadowBlur: { type: Type.NUMBER },
    shadowOffsetX: { type: Type.NUMBER },
    shadowOffsetY: { type: Type.NUMBER },
    bevelEnabled: { type: Type.BOOLEAN },
    bevelDepth: { type: Type.NUMBER },
    bevelHighlight: { type: Type.STRING },
    bevelShadow: { type: Type.STRING },
    panelEnabled: { type: Type.BOOLEAN },
    panelColor: { type: Type.STRING },
    panelOpacity: { type: Type.NUMBER },
  },
};

const VIDEO_EFFECT_RENDERERS = ["glitch", "rgb_split", "chromatic_aberration", "pixelate", "scanlines", "film_grain", "vignette", "glow"] as const;
const BODY_EFFECT_RENDERERS = ["body-segmentation-glow", "body_glow", "body_outline", "body_particles"] as const;
const ALL_EFFECT_RENDERERS = [...VIDEO_EFFECT_RENDERERS, ...BODY_EFFECT_RENDERERS] as const;

function sanitizeEffectId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "generated-effect"
  );
}

function sanitizeVideoRenderer(value: string): string {
  return VIDEO_EFFECT_RENDERERS.includes(value as (typeof VIDEO_EFFECT_RENDERERS)[number]) ? value : "glitch";
}

function sanitizeEffectRenderer(kind: "video" | "body", value: string): string {
  const renderers = kind === "body" ? BODY_EFFECT_RENDERERS : VIDEO_EFFECT_RENDERERS;
  return (renderers as readonly string[]).includes(value) ? value : renderers[0];
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function getDefaultParamsForRenderer(renderer: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    glitch: { glitchIntensity: 30, rgbSplit: 12, sliceCount: 8, scanlineCount: 120, noiseAmount: 0.4 },
    rgb_split: { rgbSplit: 16, splitDistance: 16 },
    chromatic_aberration: { rgbSplit: 16, splitDistance: 16 },
    pixelate: { pixelSize: 18 },
    scanlines: { scanlineCount: 180 },
    film_grain: { noiseAmount: 0.4 },
    vignette: { radius: 0.75 },
    glow: { glowColor: "#00ffff", glowIntensity: 1.0, glowRadius: 24 },
    "body-segmentation-glow": { glowColor: "#00ffff", glowIntensity: 1.0, glowRadius: 24, feather: 12 },
    body_glow: { glowColor: "#00ffff", glowIntensity: 1.0, glowRadius: 24, feather: 12 },
    body_outline: { outlineColor: "#ffffff", outlineWidth: 6, feather: 8 },
    body_particles: { particleColor: "#ffffff", particleCount: 80, particleSize: 4, drift: 12 },
  };
  return defaults[renderer] || {};
}

const deepResearchResponseSchema = {
  type: Type.OBJECT,
  properties: {
    themeName: { type: Type.STRING },
    historicalContext: { type: Type.STRING },
    visualRules: { type: Type.ARRAY, items: { type: Type.STRING } },
    paletteDeconstruction: { type: Type.ARRAY, items: { type: Type.STRING } },
    config: { type: Type.OBJECT },
    extensionCode: { type: Type.STRING },
  },
  required: ["themeName", "historicalContext", "visualRules", "paletteDeconstruction", "config", "extensionCode"],
};

export async function analyzeStyleFromImage(image: string, mimeType: string = "image/png"): Promise<TextEffectConfig> {
  try {
    const ai = createGeminiClient();
    const cleanBase64 = image.includes("base64,") ? image.split("base64,")[1] : image;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `Analyze the text effect in the provided sample image. Deconstruct its styling characteristics to generate a JSON configuration object that matches the following strict system parameters. Ensure colors are returned in Hex format (e.g. "#FF0000").
Observe if it is minimalist, standard classic, vibrant neon (with heavy glow outer layers), 3D extruded (with bevel enabled), or gothic text.
Be very precise and creative in mapping the visual colors, gradient stops, stroke rules, background panel backing, 3D/bevel depth, and multi-layer glows.`,
        },
      ],
      config: {
        systemInstruction: "You are an expert typography and graphics designer who specializes in reversing custom 2D canvas text styling from sample images.",
        responseMimeType: "application/json",
        responseSchema: textEffectConfigResponseSchema,
      },
    });

    return JSON.parse((response.text || "{}").trim());
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function generateStyleFromPrompt(prompt: string): Promise<TextEffectConfig> {
  try {
    const ai = createGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Based on the user's creative visual styling prompt: "${prompt}", design a high-quality, professional 2D canvas text effect.
Translate this style metaphor into standard configuration parameters. Configure colors precisely using Hex format. Fully populate all fields including bevel, panel, and glowLayers (up to 3 layer slots if applicable).`,
        },
      ],
      config: {
        systemInstruction: "You are an elite web graphics designer who specializes in generating beautiful 2D canvas font styling from text descriptions.",
        responseMimeType: "application/json",
        responseSchema: textEffectConfigResponseSchema,
      },
    });

    return JSON.parse((response.text || "{}").trim());
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Distill a TextEffectConfig into a compact visual summary for naming
function buildEffectVisualSummary(config: TextEffectConfig): string {
  const lines: string[] = [];

  // Fill
  if (config.fillType === "pattern" && config.patternType) {
    lines.push(`Fill: ${config.patternType} pattern`);
  } else if (config.fillType === "linear" && config.fillGradientStops?.length) {
    const colors = config.fillGradientStops.map((s) => s.color).join(" → ");
    lines.push(`Fill: linear gradient (${colors})`);
  } else if (config.fillType === "radial" && config.fillGradientStops?.length) {
    const colors = config.fillGradientStops.map((s) => s.color).join(" → ");
    lines.push(`Fill: radial gradient (${colors})`);
  } else if (config.fillType === "solid") {
    lines.push(`Fill: solid ${config.fillColor}`);
  } else if (config.fillType === "none") {
    lines.push(`Fill: none (outline-only)`);
  }

  // Stroke
  if (config.strokeEnabled && config.strokeWidth > 0) {
    lines.push(`Stroke: ${config.strokeWidth}px ${config.strokeColor}`);
  }

  // Glow
  const activeGlows = config.glowLayers?.filter((g) => g.enabled) ?? [];
  if (activeGlows.length > 0) {
    const glowColors = activeGlows.map((g) => g.color).join(", ");
    lines.push(`Glow: ${activeGlows.length} layer(s) — ${glowColors}`);
  }

  // Bevel / 3D
  if (config.bevelEnabled) {
    lines.push(`Bevel: depth ${config.bevelDepth}, highlight ${config.bevelHighlight}`);
  }

  // Shadow
  if (config.shadowEnabled) {
    lines.push(`Shadow: ${config.shadowType ?? "drop"}, blur ${config.shadowBlur}, offset (${config.shadowOffsetX}, ${config.shadowOffsetY})`);
  }

  // Duplicate stack
  if (config.stackEnabled) {
    lines.push(`Stack: ${config.stackCount} layers`);
  }

  // Custom engine
  if (config.customRenderer) {
    lines.push(`Custom renderer: ${config.customRenderer}`);
  }

  // Font weight hint
  if (config.fontWeight >= 800) lines.push(`Font weight: heavy (${config.fontWeight})`);
  else if (config.fontWeight <= 300) lines.push(`Font weight: thin (${config.fontWeight})`);

  return lines.join("\n");
}

const EFFECT_CATEGORIES = [
  { id: "3d", tone: "dimensional, extruded, sculptural — think chrome blocks, stadium signage, embossed metal" },
  { id: "neon", tone: "electrifying, glowing, urban nightlife — think Vegas strip, arcade signs, laser grids" },
  { id: "metallic", tone: "premium, reflective, industrial — think brushed steel, gold foil, titanium" },
  { id: "glitch", tone: "corrupted, digital artifacts, cyber distortion — think VHS damage, RGB channel split, data corruption" },
  { id: "retro", tone: "nostalgic, era-specific warmth — think diner signs, VHS, 80s arcade, letterpress" },
  { id: "gradient", tone: "smooth chromatic flow, vibrant spectrum — think aurora, sunset blends, holographic foil" },
  { id: "grunge", tone: "raw, textured, worn — think spray paint, torn poster, ink stain, concrete" },
  { id: "outline", tone: "crisp, structural, minimal — think wireframe logos, contour lines, blueprint drafts" },
  { id: "shadow", tone: "depth, elevation, dimensional light — think long shadows, cinematic drop shadows, soft lit type" },
  { id: "elements", tone: "natural phenomena and materials — think fire, ice, water, smoke, stone, wood" },
  { id: "luxury", tone: "refined, editorial, high-fashion — think velvet emboss, serif elegance, champagne foil" },
] as const;

const VALID_EFFECT_CATEGORY_IDS = EFFECT_CATEGORIES.map((c) => c.id);
type EffectCategoryId = (typeof EFFECT_CATEGORIES)[number]["id"];

function resolveEffectCategory(raw: string): EffectCategoryId {
  const normalized = (raw ?? "").toLowerCase().trim();
  if (VALID_EFFECT_CATEGORY_IDS.includes(normalized as EffectCategoryId)) {
    return normalized as EffectCategoryId;
  }
  // Best-effort fuzzy fallback — map legacy / hallucinated values to the nearest official one
  if (normalized.includes("3d") || normalized.includes("bevel") || normalized.includes("extrude")) return "3d";
  if (normalized.includes("neon") || normalized.includes("glow") || normalized.includes("light")) return "neon";
  if (normalized.includes("metal") || normalized.includes("chrome") || normalized.includes("gold")) return "metallic";
  if (normalized.includes("glitch") || normalized.includes("cyber") || normalized.includes("corrupt")) return "glitch";
  if (normalized.includes("retro") || normalized.includes("vintage") || normalized.includes("classic")) return "retro";
  if (normalized.includes("gradient") || normalized.includes("holo") || normalized.includes("rainbow")) return "gradient";
  if (normalized.includes("grunge") || normalized.includes("texture") || normalized.includes("ink")) return "grunge";
  if (normalized.includes("outline") || normalized.includes("stroke") || normalized.includes("minimal")) return "outline";
  if (normalized.includes("shadow") || normalized.includes("depth") || normalized.includes("drop")) return "shadow";
  if (normalized.includes("element") || normalized.includes("fire") || normalized.includes("ice") || normalized.includes("smoke")) return "elements";
  if (normalized.includes("luxury") || normalized.includes("elegant") || normalized.includes("premium")) return "luxury";
  return "outline"; // safe default
}

export async function generateEffectName(config: TextEffectConfig): Promise<{ name: string; category: EffectCategoryId }> {
  const visualSummary = buildEffectVisualSummary(config);

  try {
    const ai = createGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `You are naming a text effect for Clypra Studio — a professional typography tool used by video editors and motion designers.

## Visual Summary of the Effect
${visualSummary}

## Available Categories — you MUST return one of these exact IDs, no variations, no new values:
${EFFECT_CATEGORIES.map((c) => `- "${c.id}": ${c.tone}`).join("\n")}

## Your Task
1. Choose the ONE category ID from the list above that best matches the visual characteristics.
   ⚠️ The "category" field MUST be one of: ${VALID_EFFECT_CATEGORY_IDS.map((id) => `"${id}"`).join(", ")}
2. Generate a name (2–3 words max, under 24 characters) that:
   - Communicates the *visual style*, not the technique (e.g. "Volcanic Lava" not "FireEngine")
   - Sounds premium and production-ready
   - Fits naturally within the chosen category's tone
   - Is unique and evocative — avoid generic words like "effect", "style", "custom", "text"

Return your answer as JSON.`,
        },
      ],
      config: {
        systemInstruction: "You are a senior brand naming specialist for a professional motion graphics tool. You name typography presets so that video creators instantly understand the visual style and emotional tone at a glance. You MUST always use one of the provided category IDs exactly as given.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING, enum: VALID_EFFECT_CATEGORY_IDS as unknown as string[] },
          },
          required: ["name", "category"],
        },
      },
    });

    const resultData = JSON.parse((response.text || "{}").trim());
    return {
      name: resultData.name ?? "Unnamed Effect",
      category: resolveEffectCategory(resultData.category),
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function generateVideoEffectPresetSuggestions(params: { prompt: string; renderer?: string; count?: number }): Promise<VideoEffectPresetSuggestion[]> {
  try {
    const ai = createGeminiClient();
    const count = Math.round(clampNumber(params.count, 1, 30, 20));
    const rendererHint = params.renderer && params.renderer !== "mixed" ? `Use only renderer "${params.renderer}".` : "Use a varied mix of allowed renderers.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Generate ${count} production-ready Clypra video effect preset suggestions for this creative direction:
"${params.prompt}"

${rendererHint}

Allowed renderers and parameters:
- glitch: glitchIntensity 1-60, rgbSplit 0-24, sliceCount 1-24, scanlineCount 20-320, noiseAmount 0-0.8
- rgb_split: rgbSplit 0-32, splitDistance 0-32
- chromatic_aberration: rgbSplit 0-32, splitDistance 0-32
- pixelate: pixelSize 2-64
- scanlines: scanlineCount 20-420
- film_grain: noiseAmount 0-0.8
- vignette: radius 0.2-1.2
- glow: glowColor hex, glowIntensity 0-1.5, glowRadius 2-48

Rules:
- Return unique, marketplace-ready names.
- Return kebab-case IDs.
- Params must match the chosen renderer only.
- defaultIntensity must be 0-100.
- Tags should be lowercase discovery keywords.
- Do not include preview URLs, thumbnails, shader code, or proprietary brand names.`,
        },
      ],
      config: {
        systemInstruction: "You are a senior video effects marketplace curator. You generate compatible procedural preset JSON for Clypra only, never unsupported renderers or unknown parameter names.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            presets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  renderer: { type: Type.STRING, enum: VIDEO_EFFECT_RENDERERS as unknown as string[] },
                  params: { type: Type.OBJECT },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  defaultIntensity: { type: Type.NUMBER },
                  isPremium: { type: Type.BOOLEAN },
                },
                required: ["id", "name", "description", "renderer", "params", "tags", "defaultIntensity"],
              },
            },
          },
          required: ["presets"],
        },
      },
    });

    const result = JSON.parse((response.text || "{}").trim());
    const presets = Array.isArray(result.presets) ? result.presets : [];
    return presets.slice(0, count).map((preset: any, index: number) => {
      const name = String(preset.name || `Generated Effect ${index + 1}`);
      return {
        id: sanitizeEffectId(preset.id || name),
        name,
        description: String(preset.description || "Generated video effect preset."),
        renderer: sanitizeVideoRenderer(String(preset.renderer || params.renderer || "glitch")),
        params: preset.params && typeof preset.params === "object" ? preset.params : {},
        tags: Array.isArray(preset.tags)
          ? preset.tags
              .map((tag: unknown) => String(tag).toLowerCase())
              .filter(Boolean)
              .slice(0, 8)
          : ["video", "effect"],
        defaultIntensity: Math.round(clampNumber(preset.defaultIntensity, 0, 100, 70)),
        isPremium: !!preset.isPremium,
      };
    });
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function generateVideoOrBodyEffectPresetSuggestion(params: { kind: "video" | "body"; prompt: string; renderer?: string }): Promise<VideoEffectPresetSuggestion> {
  try {
    const ai = createGeminiClient();
    const rendererHint = params.renderer && params.renderer !== "auto" ? `Use only renderer "${params.renderer}".` : "Choose the best renderer for the requested effect.";
    const rendererGuide =
      params.kind === "body"
        ? `Allowed body renderers and parameters:
- body-segmentation-glow: glowColor hex, glowIntensity 0-1.5, glowRadius 2-48, feather 0-32
- body_glow: glowColor hex, glowIntensity 0-1.5, glowRadius 2-48, feather 0-32
- body_outline: outlineColor hex, outlineWidth 1-20, feather 0-20
- body_particles: particleColor hex, particleCount 12-220, particleSize 1-10, drift 0-24`
        : `Allowed video renderers and parameters:
- glitch: glitchIntensity 1-60, rgbSplit 0-24, sliceCount 1-24, scanlineCount 20-320, noiseAmount 0-0.8
- rgb_split: rgbSplit 0-32, splitDistance 0-32
- chromatic_aberration: rgbSplit 0-32, splitDistance 0-32
- pixelate: pixelSize 2-64
- scanlines: scanlineCount 20-420
- film_grain: noiseAmount 0-0.8
- vignette: radius 0.2-1.2
- glow: glowColor hex, glowIntensity 0-1.5, glowRadius 2-48`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Generate one production-ready Clypra ${params.kind} effect preset for this creative direction:
"${params.prompt}"

${rendererHint}

${rendererGuide}

Rules:
- Return exactly one marketplace-ready preset.
- ID must be kebab-case.
- Params object MUST contain ALL required parameters for the chosen renderer with realistic values.
- defaultIntensity must be 0-100.
- Tags should be lowercase discovery keywords.
- Do not include preview URLs, thumbnails, shader code, or proprietary brand names.

CRITICAL: The params object must never be empty. It must include all parameters listed for the chosen renderer above.`,
        },
      ],
      config: {
        systemInstruction: "You are a senior video effects marketplace curator. You generate compatible procedural preset JSON for Clypra only, never unsupported renderers or unknown parameter names. ALWAYS populate the params object with all required parameters for the selected renderer.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            renderer: { type: Type.STRING, enum: ALL_EFFECT_RENDERERS as unknown as string[] },
            params: { type: Type.OBJECT },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            defaultIntensity: { type: Type.NUMBER },
            isPremium: { type: Type.BOOLEAN },
          },
          required: ["id", "name", "description", "renderer", "params", "tags", "defaultIntensity"],
        },
      },
    });

    const result = JSON.parse((response.text || "{}").trim());
    const name = String(result.name || "Generated Effect");
    const renderer = sanitizeEffectRenderer(params.kind, String(result.renderer || params.renderer || ""));

    // Ensure params are populated - if AI returns empty object, provide sensible defaults
    let effectParams = result.params && typeof result.params === "object" && Object.keys(result.params).length > 0 ? result.params : getDefaultParamsForRenderer(renderer);

    return {
      id: sanitizeEffectId(result.id || name),
      name,
      description: String(result.description || `Generated ${params.kind} effect preset.`),
      renderer,
      params: effectParams,
      tags: Array.isArray(result.tags)
        ? result.tags
            .map((tag: unknown) => String(tag).toLowerCase())
            .filter(Boolean)
            .slice(0, 8)
        : [params.kind, "effect"],
      defaultIntensity: Math.round(clampNumber(result.defaultIntensity, 0, 100, 70)),
      isPremium: !!result.isPremium,
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function performDeepResearch(topic: string): Promise<{
  themeName: string;
  historicalContext: string;
  visualRules: string[];
  paletteDeconstruction: string[];
  config: TextEffectConfig;
  extensionCode: string;
}> {
  try {
    const ai = createGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Perform typography design research on: "${topic}".
Return theme name, historical context, 3 visual rules, palette notes, a complete TextEffectConfig JSON, and extensionCode (canvas2d snippet for procedural extensions).`,
        },
      ],
      config: {
        systemInstruction: "You are a senior typographic design researcher and computational artist.",
        responseMimeType: "application/json",
        responseSchema: deepResearchResponseSchema,
      },
    });

    return JSON.parse((response.text || "{}").trim());
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function generateLottieMetadata(params: { templateName?: string; currentId?: string; currentDescription?: string; currentTags?: string; currentCategory?: string; lottieData?: any }): Promise<{
  category: string;
  id: string;
  name: string;
  description: string;
  tags: string[];
}> {
  try {
    const ai = createGeminiClient();

    const { templateName, currentId, currentDescription, currentTags, currentCategory, lottieData } = params;

    // Available categories - aligned with professional NLE standards
    const availableCategories = ["lower-third", "title-card", "callout", "caption", "outro", "social", "broadcast", "sports", "countdown", "cinematic"];

    // Build context about the Lottie animation
    let context = `Template Name: ${templateName || "Untitled"}\n`;
    if (currentId) context += `Current ID: ${currentId}\n`;
    if (currentCategory) context += `Current Category: ${currentCategory}\n`;
    if (currentDescription) context += `Current Description: ${currentDescription}\n`;
    if (currentTags) context += `Current Tags: ${currentTags}\n`;

    // Add Lottie structure info if available
    if (lottieData) {
      const layers = lottieData.layers || [];
      const textLayers = layers.filter((l: any) => l.ty === 5);
      const shapeLayers = layers.filter((l: any) => l.ty === 4);
      context += `\nAnimation Info:\n`;
      context += `- Duration: ${lottieData.op || 0} frames at ${lottieData.fr || 30}fps\n`;
      context += `- Dimensions: ${lottieData.w}x${lottieData.h}\n`;
      context += `- Text Layers: ${textLayers.length}\n`;
      context += `- Shape Layers: ${shapeLayers.length}\n`;
      context += `- Total Layers: ${layers.length}\n`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Generate unique, professional metadata for a Lottie animation template based on this information:

${context}

Available Categories (you MUST choose ONE from this list):
${availableCategories.map((c) => `- ${c}`).join("\n")}

Category Definitions (aligned with professional NLE standards):
- lower-third: Text overlays at bottom of screen (news, interviews, name tags, location labels)
- title-card: Opening titles, intro screens, chapter headers, section dividers
- callout: Animated arrows, lines, and labels pointing to elements (product features, highlights, annotations)
- caption: Styled subtitles and captions (word-by-word, pill backgrounds, pop-up text)
- outro: Ending screens, credits, call-to-action, subscribe prompts
- social: Social media posts, stories, reels, TikTok, Instagram content
- broadcast: Professional TV/news style graphics, breaking news, sports coverage
- sports: Athletic graphics, scoreboards, player stats, game highlights
- countdown: Timers, countdowns, clocks, deadline graphics, event countdowns
- cinematic: Film-style, dramatic, high-production value, movie titles

Create:
1. **category**: Choose the MOST appropriate category from the available list above
2. **id**: A unique kebab-case ID (lowercase, hyphens, descriptive, 3-5 words)
3. **name**: A human-readable name (proper capitalization, 2-4 words)
4. **description**: A compelling description (1-2 sentences, highlight use cases)
5. **tags**: 5-8 relevant tags (lowercase, single words or hyphenated phrases)

Make the metadata unique, professional, and SEO-friendly. Focus on the animation's style, purpose, and visual characteristics.`,
        },
      ],
      config: {
        systemInstruction: "You are an expert in motion graphics, animation, and digital content metadata. You create unique, descriptive, and professional metadata for Lottie animations that helps users discover and understand templates. You MUST select a category from the provided list based on professional NLE standards (Premiere Pro, Final Cut Pro, DaVinci Resolve, After Effects).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["category", "id", "name", "description", "tags"],
        },
      },
    });

    return JSON.parse((response.text || "{}").trim());
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

const AUDIO_CATEGORIES = [
  "music", // catch-all browsable music library — the primary tab
  "cinematic", // YouTube creators, vlogs, montages — highest demand
  "upbeat", // social content, reels, highlights — second highest demand
  "lo-fi", // study/productivity content — massive creator niche
  "hip-hop", // most requested genre globally on CapCut
  "ambient", // background for talking-head/interview content
  "sfx", // sound effects — non-negotiable, every editor needs this
] as const;
type AudioCategoryId = (typeof AUDIO_CATEGORIES)[number];

function resolveAudioCategory(raw: string): AudioCategoryId {
  const normalized = (raw || "").toLowerCase().trim();
  if (AUDIO_CATEGORIES.includes(normalized as AudioCategoryId)) return normalized as AudioCategoryId;
  if (normalized.includes("lofi") || normalized.includes("lo-fi") || normalized.includes("chill")) return "lo-fi";
  if (normalized.includes("cinematic") || normalized.includes("film") || normalized.includes("epic") || normalized.includes("trailer")) return "cinematic";
  if (normalized.includes("upbeat") || normalized.includes("happy") || normalized.includes("energetic") || normalized.includes("positive")) return "upbeat";
  if (normalized.includes("hip") || normalized.includes("trap") || normalized.includes("rap") || normalized.includes("beat")) return "hip-hop";
  if (normalized.includes("ambient") || normalized.includes("room") || normalized.includes("noise") || normalized.includes("background") || normalized.includes("atmospheric")) return "ambient";
  if (normalized.includes("sfx") || normalized.includes("effect") || normalized.includes("sound") || normalized.includes("transition") || normalized.includes("whoosh") || normalized.includes("impact") || normalized.includes("ui") || normalized.includes("notification")) return "sfx";
  return "music";
}

export async function generateAudioMetadata(params: { fileName: string; currentName?: string; currentCategory?: string; currentDescription?: string; currentTags?: string; author?: string; duration?: number }): Promise<{
  category: AudioCategoryId;
  id: string;
  name: string;
  description: string;
  tags: string[];
  bpm?: number;
  loopable: boolean;
}> {
  try {
    const ai = createGeminiClient();
    const context = [`File name: ${params.fileName}`, params.currentName ? `Current name: ${params.currentName}` : "", params.currentCategory ? `Current category: ${params.currentCategory}` : "", params.currentDescription ? `Current description: ${params.currentDescription}` : "", params.currentTags ? `Current tags: ${params.currentTags}` : "", params.author ? `Author/rightsholder: ${params.author}` : "", params.duration ? `Duration seconds: ${params.duration}` : ""].filter(Boolean).join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `Generate safe, professional catalog metadata for a public audio asset in Clypra Studio.

${context}

Available categories, choose exactly one:
${AUDIO_CATEGORIES.map((category) => `- ${category}`).join("\n")}

Rules:
- Infer from the filename and existing hints only. Do not invent a source, author, or license.
- If it is a sound effect/noise, use categories like ambient, sfx, transition, impact, ui, or notifications.
- If it is music, use the closest genre/mood category.
- Name should be human-readable and production-ready.
- ID must be kebab-case.
- Description should be one concise sentence for video editors.
- Tags should be 5-8 lowercase discovery terms.
- BPM should be omitted unless strongly implied by the name/category.
- loopable should be true only for beds, ambience, loops, or repeating music.`,
        },
      ],
      config: {
        systemInstruction: "You are an audio asset librarian for a professional video editor. You generate accurate, conservative metadata and never invent legal/source fields.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: AUDIO_CATEGORIES as unknown as string[] },
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            bpm: { type: Type.NUMBER },
            loopable: { type: Type.BOOLEAN },
          },
          required: ["category", "id", "name", "description", "tags", "loopable"],
        },
      },
    });

    const result = JSON.parse((response.text || "{}").trim());
    return {
      category: resolveAudioCategory(result.category),
      id: String(result.id || params.fileName.replace(/\.[^.]+$/, ""))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      name: result.name || params.fileName.replace(/\.[^.]+$/, ""),
      description: result.description || "",
      tags: Array.isArray(result.tags) ? result.tags : [],
      bpm: typeof result.bpm === "number" ? result.bpm : undefined,
      loopable: !!result.loopable,
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

const STICKER_CATEGORIES = ["trending", "emoji", "fun", "love", "gaming", "food", "animal", "shapes", "icons", "travel", "birthday", "weather", "sale", "vlog", "y2k", "glitter", "neon-text", "classic", "new", "football", "animal-meme", "hits", "free-fire", "emphasis", "cover-ups", "wrong", "letters", "mood", "text-sticker", "collage", "countdown", "music-festival", "journal", "campus", "cartoon", "fashion", "eco-friendly", "basketball", "barbie", "vibes", "shimmer", "frame", "winter", "fall", "details", "techniques", "lip-illustration", "handwriting", "retro-character", "illustration", "alphabet", "pixelated-style", "bubble", "label", "plog", "cyber", "stylish"] as const;
type StickerCategoryId = (typeof STICKER_CATEGORIES)[number];

function resolveStickerCategory(raw: string): StickerCategoryId {
  const normalized = (raw || "").toLowerCase().trim();
  if (STICKER_CATEGORIES.includes(normalized as StickerCategoryId)) return normalized as StickerCategoryId;

  // Fuzzy matching for common category variations
  if (normalized.includes("emoji") || normalized.includes("emoticon") || normalized.includes("smiley")) return "emoji";
  if (normalized.includes("trend") || normalized.includes("popular") || normalized.includes("hot")) return "trending";
  if (normalized.includes("love") || normalized.includes("heart") || normalized.includes("romance")) return "love";
  if (normalized.includes("game") || normalized.includes("gaming")) return "gaming";
  if (normalized.includes("food") || normalized.includes("eat") || normalized.includes("drink")) return "food";
  if (normalized.includes("animal") && normalized.includes("meme")) return "animal-meme";
  if (normalized.includes("animal") || normalized.includes("pet")) return "animal";
  if (normalized.includes("shape") || normalized.includes("geometric")) return "shapes";
  if (normalized.includes("icon")) return "icons";
  if (normalized.includes("travel") || normalized.includes("vacation") || normalized.includes("trip")) return "travel";
  if (normalized.includes("birthday") || normalized.includes("party") || normalized.includes("celebration")) return "birthday";
  if (normalized.includes("weather") || normalized.includes("sun") || normalized.includes("rain")) return "weather";
  if (normalized.includes("sale") || normalized.includes("discount") || normalized.includes("offer")) return "sale";
  if (normalized.includes("vlog") || normalized.includes("youtube")) return "vlog";
  if (normalized.includes("y2k") || normalized.includes("2000")) return "y2k";
  if (normalized.includes("glitter") || normalized.includes("sparkle") || normalized.includes("shine")) return "glitter";
  if (normalized.includes("neon")) return "neon-text";
  if (normalized.includes("text")) return "text-sticker";
  if (normalized.includes("music") || normalized.includes("festival")) return "music-festival";
  if (normalized.includes("fashion") || normalized.includes("style") || normalized.includes("clothing")) return "fashion";
  if (normalized.includes("sport") || normalized.includes("football") || normalized.includes("soccer")) return "football";
  if (normalized.includes("basket")) return "basketball";
  if (normalized.includes("cartoon") || normalized.includes("comic")) return "cartoon";
  if (normalized.includes("retro") && normalized.includes("character")) return "retro-character";
  if (normalized.includes("winter") || normalized.includes("snow") || normalized.includes("cold")) return "winter";
  if (normalized.includes("fall") || normalized.includes("autumn")) return "fall";
  if (normalized.includes("frame") || normalized.includes("border")) return "frame";
  if (normalized.includes("cyber") || normalized.includes("tech") || normalized.includes("digital")) return "cyber";

  return "fun"; // safe default
}

export async function generateStickerMetadata(imageDataUrl: string): Promise<{
  name: string;
  tags: string;
  category: StickerCategoryId;
}> {
  try {
    const ai = createGeminiClient();
    const cleanBase64 = imageDataUrl.includes("base64,") ? imageDataUrl.split("base64,")[1] : imageDataUrl;
    const mimeType = imageDataUrl.match(/data:([^;]+);/)?.[1] || "image/png";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: `Analyze this sticker image and generate professional metadata for Clypra Studio's sticker library.

Available categories (choose exactly ONE):
${STICKER_CATEGORIES.map((cat) => `- ${cat}`).join("\n")}

Category Guidelines:
- emoji: Faces, emotions, emoticons, reactions
- fun: Playful, humorous, casual graphics
- love: Hearts, romance, relationships, affection
- gaming: Video game related, controllers, achievements
- food: Food, drinks, meals, desserts
- animal: Pets, wildlife, creatures
- animal-meme: Funny animal memes (doge, cat memes, etc.)
- shapes: Geometric shapes, basic forms, patterns
- icons: UI icons, symbols, minimalist graphics
- travel: Landmarks, transportation, vacation, maps
- birthday: Birthday celebrations, cakes, balloons
- weather: Weather icons, sun, rain, clouds, snow
- sale: Sale tags, discount badges, pricing
- vlog: YouTube, content creator, camera, video
- y2k: Early 2000s aesthetic, retro tech
- glitter: Sparkly, shiny, glamorous
- neon-text: Neon sign style text
- text-sticker: Text-based stickers, quotes, phrases
- music-festival: Music, concerts, festivals
- fashion: Clothing, accessories, style
- cartoon: Cartoon characters, comic style
- retro-character: Retro/vintage character designs
- cyber: Cyberpunk, tech, futuristic
- frame: Decorative frames, borders
- winter/fall: Seasonal stickers

Rules:
- Analyze the visual content of the sticker carefully
- Name should be 2-4 words, descriptive and human-readable
- Tags should be 3-6 comma-separated keywords (no spaces after commas)
- Choose the most appropriate category based on the image content
- Keep metadata professional and suitable for video editors`,
        },
      ],
      config: {
        systemInstruction: "You are a visual asset metadata specialist for a professional video editing tool. You analyze sticker images and generate accurate, descriptive metadata that helps video creators discover and use assets effectively.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            tags: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["name", "tags", "category"],
        },
      },
    });

    const result = JSON.parse((response.text || "{}").trim());
    return {
      name: result.name || "Untitled Sticker",
      tags: result.tags || "",
      category: resolveStickerCategory(result.category),
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
