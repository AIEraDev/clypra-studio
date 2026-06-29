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
    published?: boolean;
  };
}

export type StickerCategory = "emoji" | "text" | "gaming" | "sports" | "animals" | "love" | "mood" | "food" | "travel" | "birthday" | "frames" | "shapes" | "fashion" | "retro" | "illustration";

export interface StickerPublishPayload {
  id: string;
  category: StickerCategory;
  imageFile: {
    name: string;
    dataUrl: string;
  };
  animatedFile?: {
    name: string;
    dataUrl: string;
  };
  metadata: {
    name: string;
    tags: string[];
    isPremium: boolean;
    format: "static" | "gif" | "lottie";
    isAnimated: boolean;
    safety: {
      status: "approved" | "pending" | "flagged";
      reviewedAt: string;
      notes?: string;
    };
    published?: boolean;
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
    name: string;
    source: {
      provider: string;
      url: string;
    };
    format: string;
    description: string;
    defaultOpacity: number;
    safety: {
      status: "approved" | "pending" | "flagged";
      reviewedAt: string;
      notes?: string;
    };
    tags: string[];
    duration: number;
    width: number;
    height: number;
    fps: number;
    loopable: boolean;
    blendMode?: "normal" | "screen" | "multiply" | "overlay" | "add" | "soft-light" | "hard-light" | "color-dodge" | "color-burn" | "lighten" | "darken" | "difference";
    published?: boolean;
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
    published?: boolean;
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

export interface FilterPublishPayload {
  id: string;
  category: string;
  definition: {
    id: string;
    name: string;
    category: string;
    description: string;
    intensity: string;
    swatch: string;
    creator?: {
      name: string;
      socialLink?: string;
    };
    published?: boolean;
  };
  thumbnailDataUrl?: string;
}

/** V2 MPG effect stack preset for Clypra Editor */
export interface MpgStackPublishPayload {
  id: string;
  category: string;
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    published?: boolean;
    intensity: {
      min: number;
      max: number;
      default: number;
      step: number;
    };
    /** V2 node stack — consumed by editor via mpg_stack renderer */
    effectStack: Array<{ type: string; params: Record<string, unknown> }>;
  };
  thumbnailDataUrl?: string;
}
