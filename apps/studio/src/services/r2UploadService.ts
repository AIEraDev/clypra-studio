/**
 * R2 Upload Service - Handles direct uploads to Cloudflare R2 bucket
 * Allows immediate audio availability without GitHub PR workflow
 */

export interface R2UploadConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export interface R2UploadResult {
  success: boolean;
  fileUrl: string;
  key: string;
  message?: string;
}

const STORAGE_KEY = "clypra_r2_upload_config";

/**
 * Get R2 configuration from localStorage
 */
export function getR2Config(): R2UploadConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const config = JSON.parse(raw) as R2UploadConfig;
    return config.accountId && config.accessKeyId && config.secretAccessKey && config.bucketName ? config : null;
  } catch {
    return null;
  }
}

/**
 * Save R2 configuration to localStorage
 */
export function saveR2Config(config: R2UploadConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Get audio file extension from filename
 */
function getAudioExtension(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = match?.[1] || "mp3";
  if (!["mp3", "wav", "m4a", "aac", "flac", "ogg"].includes(ext)) {
    throw new Error("Unsupported audio format. Use MP3, WAV, M4A, AAC, FLAC, or OGG.");
  }
  return ext;
}

/**
 * Convert data URL to Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch?.[1] || "application/octet-stream";
  const base64 = parts[1] || "";
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Generate AWS Signature Version 4 for authentication
 */
async function generateAwsSignature(method: string, url: string, headers: Record<string, string>, payload: string, config: R2UploadConfig, timestamp: string): Promise<string> {
  const encoder = new TextEncoder();

  // Create canonical request
  const canonicalUri = new URL(url).pathname;
  const canonicalQueryString = "";
  const signedHeaders = Object.keys(headers)
    .sort()
    .map((k) => k.toLowerCase())
    .join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k.toLowerCase()}:${headers[k]?.trim()}\n`)
    .join("");

  // Hash the payload
  const payloadHash = await crypto.subtle.digest("SHA-256", encoder.encode(payload));
  const payloadHashHex = Array.from(new Uint8Array(payloadHash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHashHex}`;

  // Create string to sign
  const dateStamp = timestamp.slice(0, 8);
  const region = "auto"; // R2 uses 'auto' as region
  const service = "s3";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const canonicalRequestHash = await crypto.subtle.digest("SHA-256", encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${canonicalRequestHashHex}`;

  // Calculate signature
  const kDate = await hmacSha256(encoder.encode(`AWS4${config.secretAccessKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = await hmacSha256(kSigning, stringToSign);

  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
}

/**
 * HMAC SHA256 helper
 */
async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

/**
 * Upload audio file to R2 bucket
 */
export async function uploadAudioToR2(payload: {
  id: string;
  category: string;
  audioFile: {
    name: string;
    dataUrl: string;
  };
  coverArtDataUrl?: string;
  metadata: {
    name: string;
    description?: string;
    tags?: string[];
    author: string;
    duration: number;
    bpm?: number;
    loopable?: boolean;
    license: {
      type: string;
      url?: string;
      attributionRequired: boolean;
    };
    source: {
      provider: string;
      url: string;
    };
    safety?: {
      status: string;
      reviewedAt?: string;
      notes?: string;
    };
  };
}): Promise<R2UploadResult> {
  const config = getR2Config();
  if (!config) {
    throw new Error("R2 upload is not configured. Please configure your R2 credentials first.");
  }

  // Validate required fields
  if (!payload.metadata.author.trim()) throw new Error("Audio author is required.");
  if (!payload.metadata.source.provider.trim() || !payload.metadata.source.url.trim()) {
    throw new Error("Audio source provider and URL are required.");
  }
  if (!Number.isFinite(payload.metadata.duration) || payload.metadata.duration <= 0) {
    throw new Error("Audio duration must be greater than zero.");
  }

  const category = payload.category.toLowerCase();
  const extension = getAudioExtension(payload.audioFile.name);
  const audioKey = `audio/${category}/${payload.id}.${extension}`;
  const metadataKey = `audio/${category}/${payload.id}.json`;
  const coverKey = payload.coverArtDataUrl ? `audio/covers/${payload.id}.png` : undefined;

  try {
    // Upload audio file
    const audioBlob = dataUrlToBlob(payload.audioFile.dataUrl);
    const audioSizeMB = audioBlob.size / (1024 * 1024);

    if (audioSizeMB > 100) {
      throw new Error(`Audio file is too large (${audioSizeMB.toFixed(2)}MB). Maximum allowed size is 100MB.`);
    }

    const audioUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${audioKey}`;
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");

    const audioHeaders: Record<string, string> = {
      "Content-Type": audioBlob.type || "audio/mpeg",
      "x-amz-date": timestamp,
      Host: `${config.accountId}.r2.cloudflarestorage.com`,
    };

    const audioPayload = await audioBlob.arrayBuffer();
    const audioPayloadString = Array.from(new Uint8Array(audioPayload))
      .map((byte) => String.fromCharCode(byte))
      .join("");

    const audioAuth = await generateAwsSignature("PUT", audioUrl, audioHeaders, audioPayloadString, config, timestamp);

    const audioResponse = await fetch(audioUrl, {
      method: "PUT",
      headers: {
        ...audioHeaders,
        Authorization: audioAuth,
      },
      body: audioBlob,
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to upload audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    // Upload cover art if provided
    if (payload.coverArtDataUrl && coverKey) {
      const coverBlob = dataUrlToBlob(payload.coverArtDataUrl);
      const coverUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${coverKey}`;
      const coverTimestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");

      const coverHeaders: Record<string, string> = {
        "Content-Type": "image/png",
        "x-amz-date": coverTimestamp,
        Host: `${config.accountId}.r2.cloudflarestorage.com`,
      };

      const coverPayload = await coverBlob.arrayBuffer();
      const coverPayloadString = Array.from(new Uint8Array(coverPayload))
        .map((byte) => String.fromCharCode(byte))
        .join("");

      const coverAuth = await generateAwsSignature("PUT", coverUrl, coverHeaders, coverPayloadString, config, coverTimestamp);

      const coverResponse = await fetch(coverUrl, {
        method: "PUT",
        headers: {
          ...coverHeaders,
          Authorization: coverAuth,
        },
        body: coverBlob,
      });

      if (!coverResponse.ok) {
        console.warn(`Failed to upload cover art: ${coverResponse.status} ${coverResponse.statusText}`);
      }
    }

    // Create metadata definition
    const definition = {
      id: payload.id,
      category,
      ...payload.metadata,
      safety: payload.metadata.safety || {
        status: "approved",
        reviewedAt: new Date().toISOString(),
      },
      audioUrl: `https://clypra-worker-api.abdulkabirmusa.com/media/${audioKey}`,
      coverArtUrl: coverKey ? `https://clypra-worker-api.abdulkabirmusa.com/media/${coverKey}` : undefined,
    };

    // Upload metadata JSON
    const metadataBlob = new Blob([JSON.stringify(definition, null, 2)], { type: "application/json" });
    const metadataUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${metadataKey}`;
    const metadataTimestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");

    const metadataHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-amz-date": metadataTimestamp,
      Host: `${config.accountId}.r2.cloudflarestorage.com`,
    };

    const metadataPayload = await metadataBlob.text();
    const metadataAuth = await generateAwsSignature("PUT", metadataUrl, metadataHeaders, metadataPayload, config, metadataTimestamp);

    const metadataResponse = await fetch(metadataUrl, {
      method: "PUT",
      headers: {
        ...metadataHeaders,
        Authorization: metadataAuth,
      },
      body: metadataBlob,
    });

    if (!metadataResponse.ok) {
      throw new Error(`Failed to upload metadata: ${metadataResponse.status} ${metadataResponse.statusText}`);
    }

    return {
      success: true,
      fileUrl: definition.audioUrl,
      key: audioKey,
      message: `Audio uploaded successfully to R2! Available immediately at ${definition.audioUrl}`,
    };
  } catch (error) {
    console.error("R2 upload failed:", error);
    throw new Error(`R2 upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
