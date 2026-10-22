export const AUDIO_CATEGORIES = [
  "music", // Background music and soundtracks
  "sound-effects", // General sound effects (impacts, whooshes, etc.)
  "transitions", // Transition sound effects (swooshes, risers, etc.)
  "ambient", // Atmospheric and background ambience
  "ui-interface", // UI sounds (clicks, beeps, notifications)
] as const;

export type AudioCategory = (typeof AUDIO_CATEGORIES)[number];

export const CATEGORY_TAG_SUGGESTIONS: Record<
  AudioCategory,
  readonly string[]
> = {
  music: [
    "lo-fi",
    "cinematic",
    "upbeat",
    "hip-hop",
    "chill",
    "indie",
    "electronic",
    "acoustic",
    "jazz",
    "ambient-music",
  ],
  "sound-effects": [
    "impact",
    "whoosh",
    "riser",
    "stinger",
    "glitch",
    "pop",
    "hit",
    "sweep",
  ],
  transitions: [
    "whoosh",
    "swipe",
    "sweep",
    "reverse-cymbal",
    "riser",
    "transition-sfx",
  ],
  ambient: [
    "room-tone",
    "crowd",
    "city",
    "nature",
    "rain",
    "office",
    "atmosphere",
    "background-noise",
  ],
  "ui-interface": [
    "click",
    "notification",
    "typing",
    "button",
    "beep",
    "alert",
    "ui-sound",
    "interface-sound",
  ],
};

export const LICENSE_TYPES = [
  "cc0",
  "cc-by",
  "royalty-free",
  "public-domain",
] as const;

export type LicenseType = (typeof LICENSE_TYPES)[number];

export interface AudioTelemetry {
  sampleRate?: number;
  channels?: number;
  duration: number;
  fileSize?: number;
  mimeType?: string;
  bitrateKbps?: number;
  estimatedBpm?: number;
}

export interface AudioAsset {
  id: string;
  name: string;
  category: AudioCategory | string;
  description?: string;
  tags: string[];
  author: string;
  duration: number;
  bpm?: number;
  loopable?: boolean;
  license: {
    type: LicenseType | string;
    url?: string;
    attributionRequired: boolean;
  };
  source: {
    provider: string;
    url: string;
  };
  audioUrl: string;
  waveformUrl?: string;
  coverArtUrl?: string;
  isPremium?: boolean;
  safety?: {
    status: "approved";
    reviewedAt?: string;
    notes?: string;
  };
  published?: boolean;
}

export interface PreflightCheckItem {
  id: string;
  label: string;
  status: "passed" | "failed" | "warning";
  detail: string;
}

export type AudioLabViewMode = "studio" | "catalog";

export interface DemoSampleTrack extends Omit<AudioAsset, "category"> {
  category: AudioCategory;
}
