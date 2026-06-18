/**
 * R2 Publishing Hook
 *
 * Direct publishing to R2 bucket without GitHub intermediary
 * Supports all content types: effects, templates, audio, stickers, overlays, video effects
 */

import { type R2UploadConfig, getR2Config, saveR2Config, uploadFileFromDataUrl, uploadR2Json, getR2Json, upsertById, getPublicUrl, uploadBatch } from "../services/r2Service";

import type { AudioPublishPayload, StickerPublishPayload, OverlayPublishPayload, VideoEffectPresetPublishPayload, VideoEffectPresetBatchPublishPayload } from "../types/publish";

export interface R2PublishResult {
  files: string[];
  urls: Record<string, string>;
  message: string;
}

interface EffectPublishPayload {
  id: string;
  category: string;
  definition: {
    id: string;
    name: string;
    category: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  thumbnailDataUrl: string;
}

interface TemplatePublishPayload {
  id: string;
  category: string;
  definition: {
    id: string;
    name: string;
    category: string;
    description?: string;
    tags?: string[];
    [key: string]: unknown;
  };
  lottieData: unknown;
  thumbnailDataUrl: string;
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function getAudioExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = match?.[1] || "mp3";
  if (!["mp3", "wav", "m4a", "aac", "flac", "ogg"].includes(ext)) {
    throw new Error("Unsupported audio format. Use MP3, WAV, M4A, AAC, FLAC, or OGG.");
  }
  return ext;
}

function getThumbnailExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = match?.[1] || "png";
  if (!["png", "webp", "jpg", "jpeg", "gif"].includes(ext)) {
    throw new Error("Thumbnail must be a valid image format (PNG, WebP, JPG, or GIF).");
  }
  return ext === "jpg" ? "jpeg" : ext;
}

function getStickerExtension(fileName: string, format: "static" | "gif" | "lottie"): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = match?.[1] || "png";

  if (format === "lottie") {
    if (ext !== "json") throw new Error("Lottie files must be in JSON format.");
    return "json";
  }

  if (format === "gif") {
    if (ext !== "gif") throw new Error("Animated stickers must be in GIF format.");
    return "gif";
  }

  if (!["png", "webp"].includes(ext)) {
    throw new Error("Static stickers must be in PNG or WebP format.");
  }
  return ext;
}

function extensionFromFileName(name: string, fallback: string): string {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || fallback;
}

// ─── Publishing Functions ────────────────────────────────────────────────────

export function useR2Publish() {
  /**
   * Publish Text Effect to R2
   */
  const publishEffect = async (payload: EffectPublishPayload): Promise<R2PublishResult> => {
    const config = getR2Config();
    if (!config) throw new Error("R2 publishing is not configured.");

    const category = payload.category.toLowerCase();
    const definition = { ...payload.definition, id: payload.id, category };

    const definitionKey = `text-effects/${category}/${payload.id}.json`;
    const thumbnailKey = `thumbnails/${payload.id}.png`;
    const categoryIndexKey = `text-effects/${category}/index.json`;
    const globalIndexKey = `text-effects/index.json`;

    // Upload definition and thumbnail
    await uploadR2Json(config, definitionKey, definition);
    await uploadFileFromDataUrl(config, thumbnailKey, payload.thumbnailDataUrl, "image/png");

    // Update indexes
    const categoryIndex = await getR2Json<any[]>(config, categoryIndexKey, []);
    const globalIndex = await getR2Json<any[]>(config, globalIndexKey, []);

    const summary = {
      id: definition.id,
      name: definition.name,
      category,
      tags: definition.tags || [],
      description: definition.description || "",
      thumbnail: getPublicUrl(config.bucketName, thumbnailKey),
    };

    await uploadR2Json(config, categoryIndexKey, upsertById(categoryIndex, summary as any));
    await uploadR2Json(config, globalIndexKey, upsertById(globalIndex, summary as any));

    return {
      files: [definitionKey, thumbnailKey, categoryIndexKey, globalIndexKey],
      urls: {
        definition: getPublicUrl(config.bucketName, definitionKey),
        thumbnail: getPublicUrl(config.bucketName, thumbnailKey),
      },
      message: `Published text effect: ${definition.name}`,
    };
  };

  /**
   * Publish Text Template to R2
   */
  const publishTemplate = async (payload: TemplatePublishPayload): Promise<R2PublishResult> => {
    const config = getR2Config();
    if (!config) throw new Error("R2 publishing is not configured.");

    const category = payload.category.toLowerCase();
    const definition = { ...payload.definition, id: payload.id, category };

    const lottieKey = `text-templates/${category}/${payload.id}.json`;
    const thumbnailKey = `thumbnails/${payload.id}.png`;
    const categoryIndexKey = `text-templates/${category}/index.json`;
    const globalIndexKey = `text-templates/index.json`;

    // Upload Lottie and thumbnail
    await uploadR2Json(config, lottieKey, payload.lottieData);
    await uploadFileFromDataUrl(config, thumbnailKey, payload.thumbnailDataUrl, "image/png");

    // Update indexes
    const categoryIndex = await getR2Json<any[]>(config, categoryIndexKey, []);
    const globalIndex = await getR2Json<any[]>(config, globalIndexKey, []);

    await uploadR2Json(config, categoryIndexKey, upsertById(categoryIndex, definition as any));
    await uploadR2Json(config, globalIndexKey, upsertById(globalIndex, definition as any));

    return {
      files: [lottieKey, thumbnailKey, categoryIndexKey, globalIndexKey],
      urls: {
        lottie: getPublicUrl(config.bucketName, lottieKey),
        thumbnail: getPublicUrl(config.bucketName, thumbnailKey),
      },
      message: `Published text template: ${definition.name}`,
    };
  };

  /**
   * Publish Audio to R2
   */
  const publishAudio = async (payload: AudioPublishPayload): Promise<R2PublishResult> => {
    const config = getR2Config();
    if (!config) throw new Error("R2 publishing is not configured.");

    if (!payload.metadata.author.trim()) throw new Error("Audio author is required.");
    if (!payload.metadata.source.provider.trim() || !payload.metadata.source.url.trim()) {
      throw new Error("Audio source provider and URL are required.");
    }
    if (!payload.metadata.license?.type) throw new Error("Audio license is required.");
    if (!Number.isFinite(payload.metadata.duration) || payload.metadata.duration <= 0) {
      throw new Error("Audio duration must be greater than zero.");
    }

    const category = payload.category.toLowerCase();
    const extension = getAudioExtension(payload.audioFile.name);

    const audioKey = `audio/${category}/${payload.id}.${extension}`;
    const definitionKey = `audio/${category}/${payload.id}.json`;
    const coverKey = payload.coverArtDataUrl ? `audio/covers/${payload.id}.png` : undefined;
    const categoryIndexKey = `audio/${category}/index.json`;
    const globalIndexKey = `audio/index.json`;

    const definition = {
      id: payload.id,
      category,
      ...payload.metadata,
      safety: payload.metadata.safety || {
        status: "approved",
        reviewedAt: new Date().toISOString(),
      },
      audioUrl: getPublicUrl(config.bucketName, audioKey),
      coverArtUrl: coverKey ? getPublicUrl(config.bucketName, coverKey) : undefined,
    };

    // Upload files
    const uploads = [
      { key: audioKey, data: payload.audioFile.dataUrl, contentType: `audio/${extension}` },
      { key: definitionKey, data: JSON.stringify(definition, null, 2), contentType: "application/json" },
    ];

    if (coverKey && payload.coverArtDataUrl) {
      uploads.push({ key: coverKey, data: payload.coverArtDataUrl, contentType: "image/png" });
    }

    // Batch upload (parallel)
    await Promise.all([uploadFileFromDataUrl(config, audioKey, payload.audioFile.dataUrl, `audio/${extension}`), uploadR2Json(config, definitionKey, definition), coverKey && payload.coverArtDataUrl ? uploadFileFromDataUrl(config, coverKey, payload.coverArtDataUrl, "image/png") : Promise.resolve()]);

    // Update indexes
    const categoryIndex = await getR2Json<any[]>(config, categoryIndexKey, []);
    const globalIndex = await getR2Json<any[]>(config, globalIndexKey, []);

    const summary = {
      id: definition.id,
      name: definition.name,
      category,
      description: definition.description || "",
      tags: definition.tags || [],
      author: definition.author,
      duration: definition.duration,
      bpm: definition.bpm,
      loopable: definition.loopable,
      license: definition.license,
      source: definition.source,
      audioUrl: definition.audioUrl,
      coverArtUrl: definition.coverArtUrl,
      safety: definition.safety,
    };

    await uploadR2Json(config, categoryIndexKey, upsertById(categoryIndex, summary as any));
    await uploadR2Json(config, globalIndexKey, upsertById(globalIndex, summary as any));

    return {
      files: [audioKey, definitionKey, ...(coverKey ? [coverKey] : []), categoryIndexKey, globalIndexKey],
      urls: {
        audio: getPublicUrl(config.bucketName, audioKey),
        definition: getPublicUrl(config.bucketName, definitionKey),
        ...(coverKey ? { cover: getPublicUrl(config.bucketName, coverKey) } : {}),
      },
      message: `Published audio: ${definition.name}`,
    };
  };

  /**
   * Publish Sticker to R2
   */
  const publishSticker = async (payload: StickerPublishPayload): Promise<R2PublishResult> => {
    const config = getR2Config();
    if (!config) throw new Error("R2 publishing is not configured.");

    if (!payload.metadata.name.trim()) throw new Error("Sticker name is required.");

    const category = payload.category.toLowerCase();
    const imageExtension = getThumbnailExtension(payload.imageFile.name);

    const thumbnailKey = `stickers/${category}/${payload.id}-thumb.${imageExtension}`;
    const imageKey = `stickers/${category}/${payload.id}.${imageExtension}`;
    const definitionKey = `stickers/${category}/${payload.id}.json`;
    const categoryIndexKey = `stickers/${category}/index.json`;
    const globalIndexKey = `stickers/index.json`;

    let animatedKey: string | undefined;
    let lottieUrl: string | undefined;
    let animatedUrl: string | undefined;

    if (payload.animatedFile && payload.metadata.isAnimated) {
      const animatedExtension = getStickerExtension(payload.animatedFile.name, payload.metadata.format);
      animatedKey = `stickers/${category}/${payload.id}-animated.${animatedExtension}`;

      if (payload.metadata.format === "lottie") {
        lottieUrl = getPublicUrl(config.bucketName, animatedKey);
      } else if (payload.metadata.format === "gif") {
        animatedUrl = getPublicUrl(config.bucketName, animatedKey);
      }
    }

    const definition = {
      id: payload.id,
      name: payload.metadata.name,
      category,
      thumbnailUrl: getPublicUrl(config.bucketName, thumbnailKey),
      imageUrl: getPublicUrl(config.bucketName, imageKey),
      animatedUrl,
      lottieUrl,
      format: payload.metadata.format,
      isAnimated: payload.metadata.isAnimated,
      isPremium: payload.metadata.isPremium || false,
      tags: payload.metadata.tags || [],
      safety: payload.metadata.safety || {
        status: "approved",
        reviewedAt: new Date().toISOString(),
      },
    };

    // Upload files
    await Promise.all([uploadFileFromDataUrl(config, thumbnailKey, payload.imageFile.dataUrl, `image/${imageExtension}`), uploadFileFromDataUrl(config, imageKey, payload.imageFile.dataUrl, `image/${imageExtension}`), uploadR2Json(config, definitionKey, definition), animatedKey && payload.animatedFile ? uploadFileFromDataUrl(config, animatedKey, payload.animatedFile.dataUrl, payload.metadata.format === "lottie" ? "application/json" : "image/gif") : Promise.resolve()]);

    // Update indexes
    const categoryIndex = await getR2Json<any[]>(config, categoryIndexKey, []);
    const globalIndex = await getR2Json<any[]>(config, globalIndexKey, []);

    await uploadR2Json(config, categoryIndexKey, upsertById(categoryIndex, definition as any));
    await uploadR2Json(config, globalIndexKey, upsertById(globalIndex, definition as any));

    return {
      files: [thumbnailKey, imageKey, definitionKey, ...(animatedKey ? [animatedKey] : []), categoryIndexKey, globalIndexKey],
      urls: {
        thumbnail: getPublicUrl(config.bucketName, thumbnailKey),
        image: getPublicUrl(config.bucketName, imageKey),
        ...(animatedKey ? { animated: getPublicUrl(config.bucketName, animatedKey) } : {}),
      },
      message: `Published sticker: ${definition.name}`,
    };
  };

  /**
   * Publish Overlay to R2
   */
  const publishOverlay = async (payload: OverlayPublishPayload): Promise<R2PublishResult> => {
    const config = getR2Config();
    if (!config) throw new Error("R2 publishing is not configured.");

    if (!payload.metadata.name.trim()) throw new Error("Overlay name is required.");
    if (!payload.metadata.source.provider.trim() || !payload.metadata.source.url.trim()) {
      throw new Error("Overlay source provider and URL are required.");
    }
    if (!Number.isFinite(payload.metadata.duration) || payload.metadata.duration <= 0) {
      throw new Error("Overlay duration must be greater than zero.");
    }

    const category = payload.category.toLowerCase();
    const extension = payload.metadata.format;

    const videoKey = `overlays/${category}/${payload.id}.${extension}`;
    const thumbnailKey = payload.thumbnailDataUrl ? `overlays/${category}/${payload.id}-thumb.jpg` : undefined;
    const definitionKey = `overlays/${category}/${payload.id}.json`;
    const categoryIndexKey = `overlays/${category}/index.json`;
    const globalIndexKey = `overlays/index.json`;

    const definition = {
      id: payload.id,
      name: payload.metadata.name,
      category,
      url: getPublicUrl(config.bucketName, videoKey),
      thumbnailUrl: thumbnailKey ? getPublicUrl(config.bucketName, thumbnailKey) : undefined,
      duration: payload.metadata.duration,
      width: payload.metadata.width,
      height: payload.metadata.height,
      format: payload.metadata.format,
      blendMode: payload.metadata.blendMode,
      tags: payload.metadata.tags || [],
      description: payload.metadata.description,
      recommended: {
        opacity: payload.metadata.defaultOpacity,
        blendMode: payload.metadata.blendMode,
      },
      loopable: payload.metadata.loopable !== false,
      source: payload.metadata.source,
      safety: payload.metadata.safety || {
        status: "approved",
        reviewedAt: new Date().toISOString(),
      },
    };

    // Upload files
    await Promise.all([uploadFileFromDataUrl(config, videoKey, payload.videoFile.dataUrl, `video/${extension}`), uploadR2Json(config, definitionKey, definition), thumbnailKey && payload.thumbnailDataUrl ? uploadFileFromDataUrl(config, thumbnailKey, payload.thumbnailDataUrl, "image/jpeg") : Promise.resolve()]);

    // Update indexes
    const categoryIndex = await getR2Json<any[]>(config, categoryIndexKey, []);
    const globalIndex = await getR2Json<any[]>(config, globalIndexKey, []);

    await uploadR2Json(config, categoryIndexKey, upsertById(categoryIndex, definition as any));
    await uploadR2Json(config, globalIndexKey, upsertById(globalIndex, definition as any));

    return {
      files: [videoKey, definitionKey, ...(thumbnailKey ? [thumbnailKey] : []), categoryIndexKey, globalIndexKey],
      urls: {
        video: getPublicUrl(config.bucketName, videoKey),
        ...(thumbnailKey ? { thumbnail: getPublicUrl(config.bucketName, thumbnailKey) } : {}),
      },
      message: `Published overlay: ${definition.name}`,
    };
  };

  /**
   * Publish Video Effect Preset to R2
   */
  const publishVideoEffectPreset = async (payload: VideoEffectPresetPublishPayload): Promise<R2PublishResult> => {
    const config = getR2Config();
    if (!config) throw new Error("R2 publishing is not configured.");

    if (!payload.metadata.name.trim()) throw new Error("Effect name is required.");
    if (!payload.metadata.renderer.trim()) throw new Error("Renderer is required.");

    const kind = payload.kind;
    const category = payload.metadata.category?.trim() || kind;

    const definitionKey = `body-video-effects/${kind}/${payload.id}.json`;
    const thumbnailKey = payload.thumbnailDataUrl ? `thumbnails/${payload.id}.jpg` : undefined;
    const previewKey = payload.previewFile ? `previews/${payload.id}.${extensionFromFileName(payload.previewFile.name, "webm")}` : undefined;
    const indexKey = `body-video-effects/${kind}/index.json`;

    const definition = {
      id: payload.id,
      name: payload.metadata.name,
      type: kind === "body" ? "body-effect" : "video-effect",
      category,
      description: payload.metadata.description || "",
      thumbnail: thumbnailKey ? getPublicUrl(config.bucketName, thumbnailKey) : "",
      preview: previewKey ? getPublicUrl(config.bucketName, previewKey) : payload.metadata.previewUrl || undefined,
      isPremium: payload.metadata.isPremium || false,
      renderer: payload.metadata.renderer,
      params: payload.metadata.params || {},
      intensity: payload.metadata.intensity,
      ...(kind === "body"
        ? {
            requirements: payload.metadata.requirements || {
              bodySegmentation: true,
              minConfidence: 0.7,
            },
          }
        : {}),
      tags: payload.metadata.tags || [],
    };

    // Upload files
    await Promise.all([uploadR2Json(config, definitionKey, definition), thumbnailKey && payload.thumbnailDataUrl ? uploadFileFromDataUrl(config, thumbnailKey, payload.thumbnailDataUrl, "image/jpeg") : Promise.resolve(), previewKey && payload.previewFile ? uploadFileFromDataUrl(config, previewKey, payload.previewFile.dataUrl, "video/webm") : Promise.resolve()]);

    // Update index
    const index = await getR2Json<any[]>(config, indexKey, []);
    await uploadR2Json(config, indexKey, upsertById(index, definition as any));

    return {
      files: [definitionKey, ...(thumbnailKey ? [thumbnailKey] : []), ...(previewKey ? [previewKey] : []), indexKey],
      urls: {
        definition: getPublicUrl(config.bucketName, definitionKey),
        ...(thumbnailKey ? { thumbnail: getPublicUrl(config.bucketName, thumbnailKey) } : {}),
        ...(previewKey ? { preview: getPublicUrl(config.bucketName, previewKey) } : {}),
      },
      message: `Published ${kind} effect: ${definition.name}`,
    };
  };

  /**
   * Publish Video Effect Preset Batch to R2
   */
  const publishVideoEffectPresetBatch = async (payload: VideoEffectPresetBatchPublishPayload): Promise<R2PublishResult> => {
    const config = getR2Config();
    if (!config) throw new Error("R2 publishing is not configured.");
    if (!payload.presets.length) throw new Error("Select at least one preset to publish.");

    const kind = payload.kind;
    const indexKey = `body-video-effects/${kind}/index.json`;
    let index = await getR2Json<any[]>(config, indexKey, []);
    const files: string[] = [indexKey];
    const urls: Record<string, string> = {};

    for (const preset of payload.presets) {
      if (!preset.id.trim()) throw new Error("Every preset needs an ID.");
      if (!preset.metadata.name.trim()) throw new Error(`Preset ${preset.id} needs a name.`);
      if (!preset.metadata.renderer.trim()) throw new Error(`Preset ${preset.id} needs a renderer.`);

      const category = preset.metadata.category?.trim() || kind;
      const definitionKey = `body-video-effects/${kind}/${preset.id}.json`;
      const thumbnailKey = preset.thumbnailDataUrl ? `thumbnails/${preset.id}.jpg` : undefined;
      const previewKey = preset.previewFile ? `previews/${preset.id}.${extensionFromFileName(preset.previewFile.name, "webm")}` : undefined;

      const definition = {
        id: preset.id,
        name: preset.metadata.name,
        type: kind === "body" ? "body-effect" : "video-effect",
        category,
        description: preset.metadata.description || "",
        thumbnail: thumbnailKey ? getPublicUrl(config.bucketName, thumbnailKey) : "",
        preview: previewKey ? getPublicUrl(config.bucketName, previewKey) : preset.metadata.previewUrl || undefined,
        isPremium: preset.metadata.isPremium || false,
        renderer: preset.metadata.renderer,
        params: preset.metadata.params || {},
        intensity: preset.metadata.intensity,
        ...(kind === "body"
          ? {
              requirements: preset.metadata.requirements || {
                bodySegmentation: true,
                minConfidence: 0.7,
              },
            }
          : {}),
        tags: preset.metadata.tags || [],
      };

      // Upload files
      await Promise.all([uploadR2Json(config, definitionKey, definition), thumbnailKey && preset.thumbnailDataUrl ? uploadFileFromDataUrl(config, thumbnailKey, preset.thumbnailDataUrl, "image/jpeg") : Promise.resolve(), previewKey && preset.previewFile ? uploadFileFromDataUrl(config, previewKey, preset.previewFile.dataUrl, "video/webm") : Promise.resolve()]);

      index = upsertById(index, definition as any);
      files.push(definitionKey);
      if (thumbnailKey) files.push(thumbnailKey);
      if (previewKey) files.push(previewKey);
      urls[preset.id] = getPublicUrl(config.bucketName, definitionKey);
    }

    // Update index
    await uploadR2Json(config, indexKey, index);

    return {
      files,
      urls,
      message: `Published ${payload.presets.length} ${kind} effect presets`,
    };
  };

  return {
    publishEffect,
    publishTemplate,
    publishAudio,
    publishSticker,
    publishOverlay,
    publishVideoEffectPreset,
    publishVideoEffectPresetBatch,
    getR2Config,
    saveR2Config,
  };
}
