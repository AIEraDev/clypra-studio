/**
 * Publishing Type Definitions
 * Types used across publishing workflows
 */

export interface AudioPublishPayload {
  id: string;
  category: string;
  audioFile: {
    name: string;
    dataUrl: string;
  };
  coverArtDataUrl?: string;
  metadata: {
    name: string;
    description: string;
    tags: string[];
    author: string;
    duration: number;
    bpm?: number;
    loopable: boolean;
    license: {
      type: "cc0" | "cc-by" | "royalty-free" | "public-domain";
      url?: string;
      attributionRequired: boolean;
    };
    source: {
      provider: string;
      url: string;
    };
    safety: {
      status: "approved" | "pending" | "flagged";
      reviewedAt: string;
      notes?: string;
    };
  };
}

export type StickerCategory = "emoji" | "reaction" | "meme" | "sticker" | "decorative" | "animated" | "game" | "holiday";

export interface StickerPublishPayload {
  id: string;
  category: StickerCategory;
  name: string;
  tags: string[];
  file: {
    name: string;
    dataUrl: string;
  };
  thumbnailDataUrl?: string;
  metadata: {
    width: number;
    height: number;
    animated: boolean;
    transparent: boolean;
  };
}

export interface OverlayPublishPayload {
  id: string;
  name: string;
  category: "fire" | "light-leak" | "particle" | "weather" | "glitch" | "texture" | "bokeh" | "dust" | "fog" | "rain" | "snow" | "smoke" | "sparkle";
  description: string;
  tags: string[];
  videoFile: {
    name: string;
    dataUrl: string;
  };
  thumbnailDataUrl?: string;
  metadata: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    loopable: boolean;
    blendMode?: "normal" | "screen" | "multiply" | "overlay" | "add";
  };
}

export interface VideoEffectPresetPublishPayload {
  id: string;
  kind: "video" | "body";
  thumbnailDataUrl?: string;
  previewFile?: {
    name: string;
    dataUrl: string;
  };
  metadata: {
    name: string;
    description?: string;
    category?: string;
    renderer: string;
    params?: Record<string, unknown>;
    tags?: string[];
    isPremium?: boolean;
    intensity: {
      min: number;
      max: number;
      default: number;
      step: number;
    };
    requirements?: {
      bodySegmentation?: boolean;
      minConfidence?: number;
    };
    previewUrl?: string;
  };
}

export interface VideoEffectPresetBatchPublishPayload {
  kind: "video" | "body";
  presets: Array<{
    id: string;
    metadata: VideoEffectPresetPublishPayload["metadata"];
    thumbnailDataUrl?: string;
    previewFile?: {
      name: string;
      dataUrl: string;
    };
  }>;
}
