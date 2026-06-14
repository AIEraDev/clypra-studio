const STORAGE_KEY = "clypra_github_publish_config";

export interface GitHubPublishConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface PublishResult {
  files: string[];
  branch: string;
  prUrl: string;
}

interface TemplatePublishPayload {
  id: string;
  category: string;
  definition: Record<string, unknown>;
  lottieData: unknown;
  thumbnailDataUrl: string;
}

interface EffectPublishPayload {
  id: string;
  category: string;
  definition: Record<string, unknown>;
  thumbnailDataUrl: string;
}

export interface AudioPublishPayload {
  id: string;
  category: "music" | "lo-fi" | "chill" | "cinematic" | "epic" | "upbeat" | "corporate" | "hip-hop" | "trap" | "electronic" | "synth" | "acoustic" | "indie" | "jazz" | "soul" | "ambient" | "background" | "sfx" | "transition" | "impact" | "ui" | "notifications" | "voice";
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    author: string;
    duration: number;
    bpm?: number;
    loopable?: boolean;
    license: {
      type: "cc0" | "cc-by" | "royalty-free" | "public-domain";
      url?: string;
      attributionRequired: boolean;
    };
    source: {
      provider: string;
      url: string;
    };
    safety?: {
      status: "approved";
      reviewedAt?: string;
      notes?: string;
    };
  };
  audioFile: {
    name: string;
    dataUrl: string;
  };
  coverArtDataUrl?: string;
}

export type StickerCategory = "trending" | "football" | "classic" | "new" | "animal-meme" | "hits" | "free-fire" | "icons" | "emoji" | "fun" | "emphasis" | "cover-ups" | "wrong" | "love" | "letters" | "mood" | "sale" | "gaming" | "text-sticker" | "vlog" | "collage" | "y2k" | "countdown" | "music-festival" | "journal" | "campus" | "cartoon" | "animal" | "fashion" | "eco-friendly" | "basketball" | "birthday" | "barbie" | "vibes" | "shimmer" | "glitter" | "frame" | "travel" | "winter" | "fall" | "neon-text" | "details" | "techniques" | "lip-illustration" | "handwriting" | "retro-character" | "illustration" | "alphabet" | "pixelated-style" | "bubble" | "weather" | "label" | "plog" | "cyber" | "stylish" | "food" | "shapes";

export interface StickerPublishPayload {
  id: string;
  category: StickerCategory;
  metadata: {
    name: string;
    tags?: string[];
    isPremium?: boolean;
    format: "static" | "gif" | "lottie";
    isAnimated: boolean;
    safety?: {
      status: "approved";
      reviewedAt?: string;
      notes?: string;
    };
  };
  imageFile: {
    name: string;
    dataUrl: string; // Static image or thumbnail
  };
  animatedFile?: {
    name: string;
    dataUrl: string; // GIF or Lottie JSON
  };
}

export interface OverlayPublishPayload {
  id: string;
  category: "fire" | "light-leak" | "particle" | "weather" | "glitch" | "texture";
  videoFile: {
    name: string;
    dataUrl: string;
  };
  thumbnailDataUrl?: string;
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    duration: number;
    width: number;
    height: number;
    format: "webm" | "mp4" | "mov";
    blendMode: "normal" | "screen" | "multiply" | "overlay" | "soft-light" | "hard-light" | "color-dodge" | "color-burn" | "lighten" | "darken" | "difference";
    defaultOpacity: number;
    loopable?: boolean;
    source: {
      provider: string;
      url: string;
    };
    safety?: {
      status: "approved";
      reviewedAt?: string;
      notes?: string;
    };
  };
}

interface GitHubContentResponse {
  content?: string;
  sha?: string;
}

interface GitHubRefResponse {
  object?: {
    sha?: string;
  };
}

interface GitHubPullResponse {
  html_url?: string;
}

function normalizeConfig(config: GitHubPublishConfig): GitHubPublishConfig {
  return {
    token: config.token.trim(),
    owner: config.owner.trim(),
    repo: config.repo.trim(),
    branch: (config.branch || "main").trim(),
  };
}

function getGithubConfig(): GitHubPublishConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const config = normalizeConfig(JSON.parse(raw));
    return config.token && config.owner && config.repo && config.branch ? config : null;
  } catch {
    return null;
  }
}

function saveGithubConfig(config: GitHubPublishConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.includes(",") ? dataUrl.split(",")[1] || "" : dataUrl;
}

function encodeBase64Utf8(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeBase64Utf8(value: string): string {
  return decodeURIComponent(escape(atob(value.replace(/\n/g, ""))));
}

function sanitizeBranchPart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function humanizeId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDisplayName(definition: Record<string, any>, fallbackId: string): string {
  const name = typeof definition.name === "string" ? definition.name.trim() : "";
  return name || humanizeId(fallbackId);
}

function buildPublishBranch(kind: "effect" | "template" | "audio" | "sticker" | "overlay", id: string, category: string): string {
  return `clypra-studio/${kind}/${sanitizeBranchPart(category)}/${sanitizeBranchPart(id)}`;
}

function buildPublishTitle(action: "Add" | "Update", kind: "effect" | "template" | "audio" | "sticker" | "overlay", displayName: string): string {
  if (kind === "audio") return `${action} audio asset: ${displayName}`;
  if (kind === "sticker") return `${action} sticker: ${displayName}`;
  if (kind === "overlay") return `${action} animated overlay: ${displayName}`;
  return `${action} text ${kind}: ${displayName}`;
}

function summaryFromDefinition(definition: Record<string, any>) {
  return {
    id: definition.id,
    name: definition.name,
    category: String(definition.category || "").toLowerCase(),
    tags: Array.isArray(definition.tags) ? definition.tags : [],
    description: definition.description || "",
    thumbnail: definition.thumbnail || "",
  };
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index === -1) return [...items, item].sort((a, b) => a.id.localeCompare(b.id));
  const next = [...items];
  next[index] = item;
  return next.sort((a, b) => a.id.localeCompare(b.id));
}

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

  // Thumbnails can be any common image format
  if (!["png", "webp", "jpg", "jpeg", "gif"].includes(ext)) {
    throw new Error("Thumbnail must be a valid image format (PNG, WebP, JPG, or GIF).");
  }

  // Normalize jpg to jpeg
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

  // static
  if (!["png", "webp"].includes(ext)) {
    throw new Error("Static stickers must be in PNG or WebP format.");
  }
  return ext;
}

export function useGitHubPublish() {
  const repoRequest = async <T>(config: GitHubPublishConfig, path: string, init?: RequestInit, allowNotFound = false): Promise<T | null> => {
    const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${config.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      if (res.status === 404 && allowNotFound) return null;
      const text = await res.text();

      if (res.status === 403 && path === "git/refs") {
        throw new Error("GitHub blocked branch creation. Use a fine-grained token for this exact repository with Contents: Read and write. The token owner must also have write access to the repository; public read access is not enough.");
      }

      if (res.status === 403 && path === "pulls") {
        throw new Error("GitHub blocked PR creation. Add Pull requests: Read and write to the fine-grained token for this repository.");
      }

      throw new Error(`GitHub ${res.status} for ${path}: ${text}`);
    }

    return res.json() as Promise<T>;
  };

  const contentRequest = async <T>(config: GitHubPublishConfig, path: string, init?: RequestInit, allowNotFound = false): Promise<T | null> => {
    return repoRequest<T>(config, `contents/${path}`, init, allowNotFound);
  };

  const readFile = async (config: GitHubPublishConfig, path: string, branch: string): Promise<GitHubContentResponse | null> => {
    return contentRequest<GitHubContentResponse>(config, `${path}?ref=${encodeURIComponent(branch)}`, undefined, true);
  };

  const readJson = async <T>(config: GitHubPublishConfig, path: string, branch: string, fallback: T): Promise<T> => {
    const file = await readFile(config, path, branch);
    if (!file?.content) return fallback;
    return JSON.parse(decodeBase64Utf8(file.content)) as T;
  };

  const getBranchSha = async (config: GitHubPublishConfig, branch: string): Promise<string | null> => {
    const ref = await repoRequest<GitHubRefResponse>(config, `git/ref/heads/${branch}`, undefined, true);
    return ref?.object?.sha || null;
  };

  const ensurePublishBranch = async (config: GitHubPublishConfig, publishBranch: string): Promise<void> => {
    const baseSha = await getBranchSha(config, config.branch);
    if (!baseSha) throw new Error(`Base branch not found: ${config.branch}`);

    const existingSha = await getBranchSha(config, publishBranch);

    if (existingSha) {
      // Branch exists - update it to point to the latest base branch SHA
      await repoRequest(config, `git/refs/heads/${publishBranch}`, {
        method: "PATCH",
        body: JSON.stringify({
          sha: baseSha,
          force: true,
        }),
      });
    } else {
      // Branch doesn't exist - create it
      await repoRequest(config, "git/refs", {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${publishBranch}`,
          sha: baseSha,
        }),
      });
    }
  };

  const putFile = async (config: GitHubPublishConfig, path: string, branch: string, contentBase64: string, message: string): Promise<void> => {
    const existing = await readFile(config, path, branch);
    await contentRequest(config, path, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: contentBase64,
        branch,
        sha: existing?.sha,
      }),
    });
  };

  /**
   * Upload a large file using the Git Data API (blobs/trees/commits).
   * This bypasses the Contents API size limitations and supports files up to 100MB.
   * Use this for binary files like audio where the Contents API would fail.
   */
  const uploadLargeFile = async (config: GitHubPublishConfig, branch: string, filePath: string, fileBase64: string, commitMessage: string): Promise<void> => {
    console.log(`[uploadLargeFile] Starting upload: ${filePath}, size: ${(fileBase64.length / 1024 / 1024).toFixed(2)}MB base64`);
    
    // 1. Get current branch HEAD SHA
    const ref = await repoRequest<GitHubRefResponse>(config, `git/ref/heads/${branch}`);
    if (!ref?.object?.sha) throw new Error(`Branch ref not found: ${branch}`);
    const latestCommitSha = ref.object.sha;
    console.log(`[uploadLargeFile] Branch SHA: ${latestCommitSha}`);

    // 2. Get the tree SHA from that commit
    interface GitCommitResponse {
      sha: string;
      tree: { sha: string };
    }
    const commitData = await repoRequest<GitCommitResponse>(config, `git/commits/${latestCommitSha}`);
    const baseTreeSha = commitData.tree.sha;
    console.log(`[uploadLargeFile] Base tree SHA: ${baseTreeSha}`);

    // 3. Create a blob directly (bypasses the Contents API size limits)
    interface GitBlobResponse {
      sha: string;
    }
    console.log(`[uploadLargeFile] Creating blob...`);
    try {
      const blobData = await repoRequest<GitBlobResponse>(config, "git/blobs", {
        method: "POST",
        body: JSON.stringify({
          content: fileBase64,
          encoding: "base64",
        }),
      });
      console.log(`[uploadLargeFile] Blob created: ${blobData.sha}`);

      // 4. Create a new tree that includes the new blob
      interface GitTreeResponse {
        sha: string;
      }
      const treeData = await repoRequest<GitTreeResponse>(config, "git/trees", {
        method: "POST",
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: [
            {
              path: filePath,
              mode: "100644",
              type: "blob",
              sha: blobData.sha,
            },
          ],
        }),
      });
      console.log(`[uploadLargeFile] Tree created: ${treeData.sha}`);

      // 5. Create a commit pointing to the new tree
      interface GitCommitCreateResponse {
        sha: string;
      }
      const newCommit = await repoRequest<GitCommitCreateResponse>(config, "git/commits", {
        method: "POST",
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      });
      console.log(`[uploadLargeFile] Commit created: ${newCommit.sha}`);

      // 6. Move the branch ref to the new commit
      await repoRequest(config, `git/refs/heads/${branch}`, {
        method: "PATCH",
        body: JSON.stringify({
          sha: newCommit.sha,
        }),
      });
      console.log(`[uploadLargeFile] Upload complete: ${filePath}`);
    } catch (error: any) {
      console.error(`[uploadLargeFile] Failed:`, error);
      throw new Error(`Failed to upload ${filePath}: ${error.message || 'Unknown error'}. Size: ${(fileBase64.length / 1024 / 1024).toFixed(2)}MB`);
    }
  };

  const putJson = async (config: GitHubPublishConfig, path: string, branch: string, value: unknown, message: string): Promise<void> => {
    await putFile(config, path, branch, encodeBase64Utf8(`${JSON.stringify(value, null, 2)}\n`), message);
  };

  const getOrCreatePullRequest = async (config: GitHubPublishConfig, publishBranch: string, title: string, body: string): Promise<string> => {
    const head = `${config.owner}:${publishBranch}`;
    const existing = await repoRequest<GitHubPullResponse[]>(config, `pulls?state=open&head=${encodeURIComponent(head)}&base=${encodeURIComponent(config.branch)}`);

    const existingUrl = existing?.[0]?.html_url;
    if (existingUrl) return existingUrl;

    const created = await repoRequest<GitHubPullResponse>(config, "pulls", {
      method: "POST",
      body: JSON.stringify({
        title,
        head: publishBranch,
        base: config.branch,
        body,
      }),
    });

    if (!created?.html_url) throw new Error("GitHub did not return a pull request URL.");
    return created.html_url;
  };

  const publishEffect = async (payload: EffectPublishPayload): Promise<PublishResult> => {
    const config = getGithubConfig();
    if (!config) throw new Error("GitHub publishing is not configured.");

    const category = payload.category.toLowerCase();
    const publishBranch = buildPublishBranch("effect", payload.id, category);
    await ensurePublishBranch(config, publishBranch);

    const definition = { ...payload.definition, id: payload.id, category };
    const summary = summaryFromDefinition(definition);
    const categoryIndexPath = `data/effects/${category}/index.json`;
    const globalIndexPath = "data/effects/index.json";

    const categoryIndex = await readJson<any[]>(config, categoryIndexPath, config.branch, []);
    const globalIndex = await readJson<any[]>(config, globalIndexPath, config.branch, []);

    const files = [`data/effects/${category}/${payload.id}.json`, `data/thumbnails/${payload.id}.png`, categoryIndexPath, globalIndexPath];
    const existingDefinition = await readFile(config, files[0], config.branch);
    const action = existingDefinition ? "Update" : "Add";
    const displayName = getDisplayName(definition, payload.id);

    await putJson(config, files[0], publishBranch, definition, `${action} effect ${payload.id}`);
    await putFile(config, files[1], publishBranch, dataUrlToBase64(payload.thumbnailDataUrl), `Publish thumbnail ${payload.id}`);
    await putJson(config, categoryIndexPath, publishBranch, upsertById(categoryIndex, summary), `Update ${category} effect index`);
    await putJson(config, globalIndexPath, publishBranch, upsertById(globalIndex, summary), "Update effects index");

    const prUrl = await getOrCreatePullRequest(config, publishBranch, buildPublishTitle(action, "effect", displayName), `${action}s the ${displayName} text effect (${payload.id}) in ${category}, including JSON definition, PNG thumbnail, category index, and global index.`);

    return { files, branch: publishBranch, prUrl };
  };

  const publishTemplate = async (payload: TemplatePublishPayload): Promise<PublishResult> => {
    const config = getGithubConfig();
    if (!config) throw new Error("GitHub publishing is not configured.");

    const category = payload.category.toLowerCase();
    const publishBranch = buildPublishBranch("template", payload.id, category);
    await ensurePublishBranch(config, publishBranch);

    const definition = { ...payload.definition, id: payload.id, category };
    const categoryIndexPath = `data/templates/${category}/index.json`;
    const globalIndexPath = "data/templates/index.json";

    const categoryIndex = await readJson<any[]>(config, categoryIndexPath, config.branch, []);
    const globalIndex = await readJson<any[]>(config, globalIndexPath, config.branch, []);

    const files = [`data/templates/${category}/${payload.id}.json`, `data/thumbnails/${payload.id}.png`, categoryIndexPath, globalIndexPath];
    const existingTemplate = await readFile(config, files[0], config.branch);
    const action = existingTemplate ? "Update" : "Add";
    const displayName = getDisplayName(definition, payload.id);

    await putJson(config, files[0], publishBranch, payload.lottieData, `${action} template ${payload.id}`);
    await putFile(config, files[1], publishBranch, dataUrlToBase64(payload.thumbnailDataUrl), `Publish thumbnail ${payload.id}`);
    await putJson(config, categoryIndexPath, publishBranch, upsertById(categoryIndex, definition as any), `Update ${category} template index`);
    await putJson(config, globalIndexPath, publishBranch, upsertById(globalIndex, definition as any), "Update templates index");

    const prUrl = await getOrCreatePullRequest(config, publishBranch, buildPublishTitle(action, "template", displayName), `${action}s the ${displayName} text template (${payload.id}) in ${category}, including Lottie JSON, PNG thumbnail, category index, and global index.`);

    return { files, branch: publishBranch, prUrl };
  };

  const publishAudio = async (payload: AudioPublishPayload): Promise<PublishResult> => {
    const config = getGithubConfig();
    if (!config) throw new Error("GitHub publishing is not configured.");

    if (!payload.metadata.author.trim()) throw new Error("Audio author is required.");
    if (!payload.metadata.source.provider.trim() || !payload.metadata.source.url.trim()) throw new Error("Audio source provider and URL are required.");
    if (!payload.metadata.license?.type) throw new Error("Audio license is required.");
    if (!Number.isFinite(payload.metadata.duration) || payload.metadata.duration <= 0) throw new Error("Audio duration must be greater than zero.");

    // Check file size - Git blob API supports up to 100MB
    const audioBase64 = dataUrlToBase64(payload.audioFile.dataUrl);
    const audioSizeBytes = (audioBase64.length * 3) / 4; // Approximate decoded size
    const maxSizeBytes = 100 * 1024 * 1024; // 100MB hard limit
    if (audioSizeBytes > maxSizeBytes) {
      throw new Error(`Audio file is too large (${(audioSizeBytes / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is 100MB.`);
    }

    const category = payload.category.toLowerCase();
    const extension = getAudioExtension(payload.audioFile.name);
    const publishBranch = buildPublishBranch("audio", payload.id, category);
    await ensurePublishBranch(config, publishBranch);

    const audioPath = `data/audio/${category}/${payload.id}.${extension}`;
    const definitionPath = `data/audio/${category}/${payload.id}.json`;
    const categoryIndexPath = `data/audio/${category}/index.json`;
    const globalIndexPath = "data/audio/index.json";
    const coverPath = `data/audio/covers/${payload.id}.png`;
    const rawBase = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}`;

    const definition = {
      id: payload.id,
      category,
      ...payload.metadata,
      safety: payload.metadata.safety || {
        status: "approved",
        reviewedAt: new Date().toISOString(),
      },
      audioUrl: `${rawBase}/${audioPath}`,
      coverArtUrl: payload.coverArtDataUrl ? `${rawBase}/${coverPath}` : undefined,
    };

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

    const categoryIndex = await readJson<any[]>(config, categoryIndexPath, config.branch, []);
    const globalIndex = await readJson<any[]>(config, globalIndexPath, config.branch, []);

    const files = [definitionPath, audioPath, categoryIndexPath, globalIndexPath, ...(payload.coverArtDataUrl ? [coverPath] : [])];
    const existingDefinition = await readFile(config, definitionPath, config.branch);
    const action = existingDefinition ? "Update" : "Add";
    const displayName = getDisplayName(definition, payload.id);

    await putJson(config, definitionPath, publishBranch, definition, `${action} audio metadata ${payload.id}`);

    // Use Git Data API (blobs) for audio files to support up to 100MB
    await uploadLargeFile(config, publishBranch, audioPath, audioBase64, `${action} audio file ${payload.id}`);

    if (payload.coverArtDataUrl) {
      await putFile(config, coverPath, publishBranch, dataUrlToBase64(payload.coverArtDataUrl), `${action} audio cover ${payload.id}`);
    }
    await putJson(config, categoryIndexPath, publishBranch, upsertById(categoryIndex, summary), `Update ${category} audio index`);
    await putJson(config, globalIndexPath, publishBranch, upsertById(globalIndex, summary), "Update audio index");

    const prUrl = await getOrCreatePullRequest(config, publishBranch, buildPublishTitle(action, "audio", displayName), `${action}s the ${displayName} public audio asset (${payload.id}) in ${category}, including reviewed metadata, source/license fields, audio media, and index updates.`);

    return { files, branch: publishBranch, prUrl };
  };

  const publishSticker = async (payload: StickerPublishPayload): Promise<PublishResult> => {
    const config = getGithubConfig();
    if (!config) throw new Error("GitHub publishing is not configured.");

    if (!payload.metadata.name.trim()) throw new Error("Sticker name is required.");

    const category = payload.category.toLowerCase();
    const imageExtension = getThumbnailExtension(payload.imageFile.name);
    const publishBranch = buildPublishBranch("sticker", payload.id, category);
    await ensurePublishBranch(config, publishBranch);

    const thumbnailPath = `data/stickers/${category}/${payload.id}-thumb.${imageExtension}`;
    const imagePath = `data/stickers/${category}/${payload.id}.${imageExtension}`;
    const definitionPath = `data/stickers/${category}/${payload.id}.json`;
    const categoryIndexPath = `data/stickers/${category}/index.json`;
    const globalIndexPath = "data/stickers/index.json";
    const rawBase = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}`;

    // Handle animated file if provided
    let animatedPath: string | undefined;
    let lottieUrl: string | undefined;
    let animatedUrl: string | undefined;

    if (payload.animatedFile && payload.metadata.isAnimated) {
      const animatedExtension = getStickerExtension(payload.animatedFile.name, payload.metadata.format);
      animatedPath = `data/stickers/${category}/${payload.id}-animated.${animatedExtension}`;

      if (payload.metadata.format === "lottie") {
        lottieUrl = `${rawBase}/${animatedPath}`;
      } else if (payload.metadata.format === "gif") {
        animatedUrl = `${rawBase}/${animatedPath}`;
      }
    }

    const definition = {
      id: payload.id,
      name: payload.metadata.name,
      category,
      thumbnailUrl: `${rawBase}/${thumbnailPath}`,
      imageUrl: `${rawBase}/${imagePath}`,
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

    const categoryIndex = await readJson<any[]>(config, categoryIndexPath, config.branch, []);
    const globalIndex = await readJson<any[]>(config, globalIndexPath, config.branch, []);

    const files = [definitionPath, thumbnailPath, imagePath, categoryIndexPath, globalIndexPath, ...(animatedPath ? [animatedPath] : [])];

    const existingDefinition = await readFile(config, definitionPath, config.branch);
    const action = existingDefinition ? "Update" : "Add";
    const displayName = payload.metadata.name;

    // Upload files
    await putJson(config, definitionPath, publishBranch, definition, `${action} sticker metadata ${payload.id}`);
    await putFile(config, thumbnailPath, publishBranch, dataUrlToBase64(payload.imageFile.dataUrl), `${action} sticker thumbnail ${payload.id}`);
    await putFile(config, imagePath, publishBranch, dataUrlToBase64(payload.imageFile.dataUrl), `${action} sticker image ${payload.id}`);

    if (payload.animatedFile && animatedPath) {
      const animatedBase64 = dataUrlToBase64(payload.animatedFile.dataUrl);
      const animatedSizeBytes = (animatedBase64.length * 3) / 4; // Approximate decoded size
      const maxSizeBytes = 100 * 1024 * 1024; // 100MB hard limit
      
      if (animatedSizeBytes > maxSizeBytes) {
        throw new Error(`Animated file is too large (${(animatedSizeBytes / 1024 / 1024).toFixed(2)}MB). Maximum size is 100MB.`);
      }
      
      // Use Git Data API (blobs) for large animated files (>1MB)
      // Note: Git Data API also has 100MB limit, but works better for binary files
      const contentsApiLimit = 1 * 1024 * 1024; // 1MB limit for Contents API
      
      if (animatedSizeBytes > contentsApiLimit) {
        await uploadLargeFile(config, publishBranch, animatedPath, animatedBase64, `${action} sticker animation ${payload.id}`);
      } else {
        await putFile(config, animatedPath, publishBranch, animatedBase64, `${action} sticker animation ${payload.id}`);
      }
    }

    await putJson(config, categoryIndexPath, publishBranch, upsertById(categoryIndex, definition), `Update ${category} stickers index`);
    await putJson(config, globalIndexPath, publishBranch, upsertById(globalIndex, definition), "Update stickers index`);

    const animatedNote = payload.metadata.isAnimated ? ` with ${payload.metadata.format.toUpperCase()} animation` : "";
    const prUrl = await getOrCreatePullRequest(config, publishBranch, buildPublishTitle(action, "sticker", displayName), `${action}s the ${displayName} sticker (${payload.id}) in ${category}${animatedNote}, including JSON definition, image assets, category index, and global index.`);

    return { files, branch: publishBranch, prUrl };
  };

  const publishOverlay = async (payload: OverlayPublishPayload): Promise<PublishResult> => {
    const config = getGithubConfig();
    if (!config) throw new Error("GitHub publishing is not configured.");

    if (!payload.metadata.name.trim()) throw new Error("Overlay name is required.");
    if (!payload.metadata.source.provider.trim() || !payload.metadata.source.url.trim()) throw new Error("Overlay source provider and URL are required.");
    if (!Number.isFinite(payload.metadata.duration) || payload.metadata.duration <= 0) throw new Error("Overlay duration must be greater than zero.");
    if (!Number.isFinite(payload.metadata.width) || payload.metadata.width <= 0) throw new Error("Overlay width must be greater than zero.");
    if (!Number.isFinite(payload.metadata.height) || payload.metadata.height <= 0) throw new Error("Overlay height must be greater than zero.");

    // Check file size - Git blob API supports up to 100MB
    const videoBase64 = dataUrlToBase64(payload.videoFile.dataUrl);
    const videoSizeBytes = (videoBase64.length * 3) / 4; // Approximate decoded size
    const maxSizeBytes = 100 * 1024 * 1024; // 100MB hard limit
    if (videoSizeBytes > maxSizeBytes) {
      throw new Error(`Overlay video file is too large (${(videoSizeBytes / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is 100MB.`);
    }

    const category = payload.category.toLowerCase();
    const extension = payload.metadata.format;
    const publishBranch = buildPublishBranch("overlay", payload.id, category);
    await ensurePublishBranch(config, publishBranch);

    const videoPath = `data/overlays/${category}/${payload.id}.${extension}`;
    const thumbnailPath = `data/overlays/${category}/${payload.id}-thumb.jpg`;
    const definitionPath = `data/overlays/${category}/${payload.id}.json`;
    const categoryIndexPath = `data/overlays/${category}/index.json`;
    const globalIndexPath = "data/overlays/index.json";
    const rawBase = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}`;

    const definition = {
      id: payload.id,
      name: payload.metadata.name,
      category,
      url: `${rawBase}/${videoPath}`,
      thumbnailUrl: payload.thumbnailDataUrl ? `${rawBase}/${thumbnailPath}` : undefined,
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

    const categoryIndex = await readJson<any[]>(config, categoryIndexPath, config.branch, []);
    const globalIndex = await readJson<any[]>(config, globalIndexPath, config.branch, []);

    const files = [definitionPath, videoPath, categoryIndexPath, globalIndexPath, ...(payload.thumbnailDataUrl ? [thumbnailPath] : [])];
    const existingDefinition = await readFile(config, definitionPath, config.branch);
    const action = existingDefinition ? "Update" : "Add";
    const displayName = payload.metadata.name;

    // Upload definition JSON
    await putJson(config, definitionPath, publishBranch, definition, `${action} overlay metadata ${payload.id}`);

    // Use Git Data API (blobs) for video files to support up to 100MB
    await uploadLargeFile(config, publishBranch, videoPath, videoBase64, `${action} overlay video ${payload.id}`);

    // Upload thumbnail if provided
    if (payload.thumbnailDataUrl) {
      await putFile(config, thumbnailPath, publishBranch, dataUrlToBase64(payload.thumbnailDataUrl), `${action} overlay thumbnail ${payload.id}`);
    }

    // Update category index
    await putJson(config, categoryIndexPath, publishBranch, upsertById(categoryIndex, definition), `Update ${category} overlays index`);

    // Update global index
    await putJson(config, globalIndexPath, publishBranch, upsertById(globalIndex, definition), "Update overlays index");

    const prUrl = await getOrCreatePullRequest(config, publishBranch, buildPublishTitle(action, "overlay", displayName), `${action}s the ${displayName} animated overlay (${payload.id}) in ${category}, including video file, thumbnail, metadata JSON, category index, and global index.`);

    return { files, branch: publishBranch, prUrl };
  };

  return {
    publishEffect,
    publishTemplate,
    publishAudio,
    publishSticker,
    publishOverlay,
    saveGithubConfig,
    getGithubConfig,
  };
}
