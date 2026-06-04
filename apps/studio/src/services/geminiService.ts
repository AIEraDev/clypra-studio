import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from "../hooks/useGeminiApiKey";
import type { TextEffectConfig } from "@clypra/engine";

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
