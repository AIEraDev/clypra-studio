export const AUDIO_CATEGORIES = [
  "music", // General music library
  "cinematic", // YouTube creators, trailers, montages
  "upbeat", // Social content, reels, highlights
  "lo-fi", // Study/chill/productivity niche
  "hip-hop", // Urban & modern beats
  "ambient", // Background soundscapes
  "sfx", // Sound effects & foley
  "transition", // Whooshes, risers, impacts
  "ui", // Clicks, pops, notifications
] as const;

export type AudioCategory = (typeof AUDIO_CATEGORIES)[number];

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
