/**
 * R2 Service - Direct uploads to Cloudflare R2
 *
 * Provides direct file uploads to R2 bucket without GitHub intermediary
 */

import { getStudioApiBaseUrl } from "./apiConfig";

export interface R2UploadConfig {
  accountId: string;
  apiToken: string;
  bucketName: string;
}

export interface R2UploadResult {
  key: string;
  url: string;
  size: number;
}

const STORAGE_KEY = "clypra_r2_config";

/**
 * Normalize and validate R2 configuration
 */
function normalizeConfig(config: R2UploadConfig): R2UploadConfig {
  return {
    accountId: config.accountId.trim(),
    apiToken: config.apiToken.trim(),
    bucketName: config.bucketName.trim() || "clypra-assets",
  };
}

/**
 * Get R2 configuration from localStorage
 */
export function getR2Config(): R2UploadConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const config = normalizeConfig(JSON.parse(raw));
    return config.accountId && config.apiToken && config.bucketName ? config : null;
  } catch {
    return null;
  }
}

/**
 * Save R2 configuration to localStorage
 */
export function saveR2Config(config: R2UploadConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
}

/**
 * Convert data URL to ArrayBuffer
 */
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert data URL to base64 string
 */
function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.includes(",") ? dataUrl.split(",")[1] || "" : dataUrl;
}

/**
 * Upload file directly to R2 using Cloudflare API
 */
export async function uploadToR2(config: R2UploadConfig, key: string, data: ArrayBuffer | string, contentType: string): Promise<R2UploadResult> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucketName}/objects/${encodeURIComponent(key)}`;

  console.log(`[R2] Uploading: ${key} (${contentType})`);

  const body = typeof data === "string" ? data : data;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": contentType,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`R2 upload failed for ${key}: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const size = typeof data === "string" ? data.length : data.byteLength;
  const publicUrl = `https://${config.bucketName}.r2.cloudflarestorage.com/${key}`;

  console.log(`[R2] ✅ Uploaded: ${key} (${(size / 1024).toFixed(2)} KB)`);

  return {
    key,
    url: publicUrl,
    size,
  };
}

/**
 * Upload file from data URL
 */
export async function uploadFileFromDataUrl(config: R2UploadConfig, key: string, dataUrl: string, contentType: string): Promise<R2UploadResult> {
  const arrayBuffer = dataUrlToArrayBuffer(dataUrl);
  return uploadToR2(config, key, arrayBuffer, contentType);
}

/**
 * Get file from R2
 */
export async function getR2File(config: R2UploadConfig, key: string): Promise<ArrayBuffer | null> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucketName}/objects/${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
    },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`R2 get failed for ${key}: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return response.arrayBuffer();
}

/**
 * Get JSON file from R2
 */
export async function getR2Json<T>(config: R2UploadConfig, key: string, fallback: T): Promise<T> {
  try {
    const buffer = await getR2File(config, key);
    if (!buffer) return fallback;

    const text = new TextDecoder().decode(buffer);
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn(`[R2] Could not read JSON from ${key}:`, error);
    return fallback;
  }
}

/**
 * Upload JSON to R2
 */
export async function uploadR2Json(config: R2UploadConfig, key: string, data: unknown): Promise<R2UploadResult> {
  const jsonString = JSON.stringify(data, null, 2);
  return uploadToR2(config, key, jsonString, "application/json");
}

/**
 * Delete file from R2
 */
export async function deleteR2File(config: R2UploadConfig, key: string): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucketName}/objects/${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`R2 delete failed for ${key}: ${response.status} ${response.statusText}\n${errorText}`);
  }

  console.log(`[R2] 🗑️  Deleted: ${key}`);
}

/**
 * Batch upload files to R2 with parallel processing
 */
export async function uploadBatch(
  config: R2UploadConfig,
  uploads: Array<{
    key: string;
    data: ArrayBuffer | string;
    contentType: string;
  }>,
  maxParallel: number = 5,
): Promise<R2UploadResult[]> {
  const results: R2UploadResult[] = [];
  const batches: (typeof uploads)[] = [];

  // Split into batches
  for (let i = 0; i < uploads.length; i += maxParallel) {
    batches.push(uploads.slice(i, i + maxParallel));
  }

  // Upload batches sequentially, items within batch in parallel
  for (let i = 0; i < batches.length; i++) {
    console.log(`[R2] Batch ${i + 1}/${batches.length}`);
    const batchResults = await Promise.all(batches[i].map((upload) => uploadToR2(config, upload.key, upload.data, upload.contentType)));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Helper to upsert item by ID in array
 */
export function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index === -1) {
    return [...items, item].sort((a, b) => a.id.localeCompare(b.id));
  }
  const next = [...items];
  next[index] = item;
  return next.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Get public URL for R2 object
 * Uses the clypra-api worker URL instead of direct R2 URL
 */
export function getPublicUrl(bucketName: string, key: string): string {
  // Use the configured API origin so local Studio/API runs keep published
  // catalog URLs on the same environment instead of silently pointing at prod.
  void bucketName;
  return `${getStudioApiBaseUrl()}/media/${key}`;
}
