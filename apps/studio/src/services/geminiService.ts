/**
 * Gemini AI Service Client for Clypra Studio
 *
 * All AI generation requests are routed through clypra-api Hono backend endpoints.
 * Direct client-side SDK usage has been removed for security and consistency.
 */

import type { TextEffectConfig } from "@clypra-studio/engine";

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

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8787";
    }
  }
  return "https://clypra-worker-api.abdulkabirmusa.com";
}

async function apiPost(endpoint: string, body: any): Promise<any> {
  const base = getApiBaseUrl();
  const token = localStorage.getItem("clypra_auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || `AI generation failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Reconstruct styling characteristics from a sample image
 */
export async function analyzeStyleFromImage(image: string, mimeType: string = "image/png"): Promise<TextEffectConfig> {
  return apiPost("/ai/analyze-style", { imageDataUrl: image });
}

/**
 * Generate style config from prompt
 */
export async function generateStyleFromPrompt(prompt: string): Promise<TextEffectConfig> {
  return apiPost("/ai/generate-style", { prompt });
}

/**
 * Generate creative name and category for text effect config
 */
export async function generateEffectName(config: TextEffectConfig): Promise<{ name: string; category: string }> {
  return apiPost("/ai/text-effect-name", { config });
}

/**
 * Generate video effect preset suggestions for creative direction
 */
export async function generateVideoEffectPresetSuggestions(params: { prompt: string; renderer?: string; count?: number }): Promise<VideoEffectPresetSuggestion[]> {
  // Map count and renderer values and invoke single generator loop or backend proxy
  const count = params.count || 5;
  const results: VideoEffectPresetSuggestion[] = [];
  for (let i = 0; i < count; i++) {
    try {
      const result = await generateVideoOrBodyEffectPresetSuggestion({
        kind: "video",
        prompt: `${params.prompt} (variation ${i + 1} of ${count})`,
        renderer: params.renderer,
      });
      results.push(result);
    } catch (e) {
      console.warn("Failed to generate preset variation:", e);
    }
  }
  return results;
}

/**
 * Generate single video/body effect preset suggestion
 */
export async function generateVideoOrBodyEffectPresetSuggestion(params: { kind: "video" | "body"; prompt: string; renderer?: string }): Promise<VideoEffectPresetSuggestion> {
  return apiPost("/ai/video-effect", params);
}

/**
 * Perform typographic design research
 */
export async function performDeepResearch(topic: string): Promise<{
  themeName: string;
  historicalContext: string;
  visualRules: string[];
  paletteDeconstruction: string[];
  config: TextEffectConfig;
  extensionCode: string;
}> {
  return apiPost("/ai/deep-research", { topic });
}

/**
 * Generate metadata for Text/Canvas templates
 */
export async function generateTemplateMetadata(params: {
  templateName?: string;
  currentId?: string;
  currentDescription?: string;
  currentTags?: string;
  currentCategory?: string;
  templateData?: any;
  lottieData?: any;
}): Promise<{
  category: string;
  id: string;
  name: string;
  description: string;
  tags: string[];
}> {
  return apiPost("/ai/template-metadata", params);
}

export const generateLottieMetadata = generateTemplateMetadata;

/**
 * Generate metadata for audio files
 */
export async function generateAudioMetadata(params: {
  fileName: string;
  currentName?: string;
  currentCategory?: string;
  currentDescription?: string;
  currentTags?: string;
  author?: string;
  duration?: number;
}): Promise<{
  category: string;
  id: string;
  name: string;
  description: string;
  tags: string[];
  bpm?: number;
  loopable: boolean;
}> {
  return apiPost("/ai/audio-metadata", params);
}
