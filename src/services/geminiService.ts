import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from "../hooks/useGeminiApiKey";
import type { TextEffectConfig } from "../types";

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

  // Try to extract message from error object
  if (error?.message) return error.message;

  // Try to extract from error response
  if (error?.error?.message) return error.error.message;

  // Try to extract from status
  if (error?.status) {
    const statusMessages: Record<number, string> = {
      400: "Invalid request. Please check your input.",
      401: "Invalid API key. Please check your Gemini API key in Settings.",
      403: "Access denied. Please verify your API key permissions.",
      404: "Model not found. The requested Gemini model may not be available.",
      429: "Rate limit exceeded. Please try again in a moment.",
      500: "Gemini service error. Please try again later.",
      503: "Gemini service temporarily unavailable. Please try again later.",
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
      model: "gemini-2.0-flash-exp",
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
      model: "gemini-2.0-flash-exp",
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

export async function generateEffectName(config: TextEffectConfig): Promise<string> {
  try {
    const ai = createGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          text: `Generate a creative premium name (1 to 3 words) for this typography style:\n${JSON.stringify(config, null, 2)}`,
        },
      ],
      config: {
        systemInstruction: "You are an elite brand naming specialist for typography presets.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedName: { type: Type.STRING },
          },
          required: ["suggestedName"],
        },
      },
    });

    const resultData = JSON.parse((response.text || "{}").trim());
    return resultData.suggestedName;
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
      model: "gemini-2.0-flash-exp",
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
      model: "gemini-2.0-flash-exp",
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
