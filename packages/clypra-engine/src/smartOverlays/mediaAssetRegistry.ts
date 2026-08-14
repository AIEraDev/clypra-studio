import type { PrimitiveMediaNode, MediaKind } from "@clypra-studio/types";

export interface MediaAssetMetadata {
  sourceUrl: string;
  mediaType: MediaKind;
  intrinsicWidth: number;
  intrinsicHeight: number;
  duration: number;
  loaded: boolean;
  error?: string;
}

export class MediaAssetRegistry {
  private cache = new Map<string, MediaAssetMetadata>();

  /**
   * Register or retrieve cached media asset metadata
   */
  public getOrRegister(url: string, mediaType: MediaKind, defaultWidth = 1920, defaultHeight = 1080): MediaAssetMetadata {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    const meta: MediaAssetMetadata = {
      sourceUrl: url,
      mediaType,
      intrinsicWidth: defaultWidth,
      intrinsicHeight: defaultHeight,
      duration: mediaType === "image" ? Infinity : 10.0,
      loaded: true,
    };

    this.cache.set(url, meta);
    return meta;
  }

  /**
   * Deterministically calculate target media frame time from timeline time.
   *
   * Formula: t_media = (t_timeline - start) * playbackRate + trimStart
   */
  public calculateMediaTime(node: PrimitiveMediaNode, timelineTime: number): number {
    const timing = node.timing || {};
    const start = timing.start ?? 0;
    const trimStart = timing.trimStart ?? 0;
    const trimEnd = timing.trimEnd;
    const playbackRate = timing.playbackRate ?? node.playbackRate ?? 1.0;

    if (timelineTime < start) {
      return trimStart;
    }

    let mediaTime = (timelineTime - start) * playbackRate + trimStart;

    if (trimEnd !== undefined && mediaTime > trimEnd) {
      mediaTime = trimEnd;
    }

    return mediaTime;
  }

  /**
   * Returns current cache size for memory auditing
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Evict cache for memory management
   */
  public clear(): void {
    this.cache.clear();
  }
}

export const mediaAssetRegistry = new MediaAssetRegistry();
