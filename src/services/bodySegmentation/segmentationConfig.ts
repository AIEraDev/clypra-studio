import type { BodySegmentationRuntime, BodySegmentationRuntimeConfig } from "@clypra-studio/engine";
import { getStudioApiBaseUrl } from "../apiConfig";

const API_BASE = getStudioApiBaseUrl();

const DEFAULT_CONFIG: BodySegmentationRuntimeConfig = {
  runtime: "mediapipe",
  // selfie_multiclass_256x256 segments: background(0), hair(1), body-skin(2),
  // face-skin(3), clothes(4), others(5) — covers full person including hair & body.
  // selfie_segmenter only captured the face silhouette, causing text to bleed
  // through hair and miss the body entirely.
  modelUrl: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
  runtimeScriptUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs",
  wasmBaseUrl: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  minConfidence: 0.45,   // lowered from 0.55: multiclass model needs a lower threshold
  requestTimeoutMs: 5000, // multiclass model is larger — allow more init time
  cacheMaxEntries: 120,
};

let configPromise: Promise<BodySegmentationRuntimeConfig> | null = null;

function getEnvValue(key: string): string | undefined {
  return (import.meta.env[key] as string | undefined) || undefined;
}

function normalizeRuntime(value: unknown): BodySegmentationRuntime | null {
  return value === "heuristic" || value === "onnx" || value === "mediapipe" ? value : null;
}

function envOverrides(): Partial<BodySegmentationRuntimeConfig> {
  const runtime = normalizeRuntime(getEnvValue("VITE_CLYPRA_BODY_SEGMENTATION_RUNTIME"));

  return {
    ...(runtime ? { runtime } : {}),
    ...(getEnvValue("VITE_CLYPRA_BODY_SEGMENTATION_MODEL_URL") ? { modelUrl: getEnvValue("VITE_CLYPRA_BODY_SEGMENTATION_MODEL_URL") } : {}),
    ...(getEnvValue("VITE_CLYPRA_BODY_SEGMENTATION_RUNTIME_SCRIPT_URL") ? { runtimeScriptUrl: getEnvValue("VITE_CLYPRA_BODY_SEGMENTATION_RUNTIME_SCRIPT_URL") } : {}),
    ...(getEnvValue("VITE_CLYPRA_BODY_SEGMENTATION_WASM_BASE_URL") ? { wasmBaseUrl: getEnvValue("VITE_CLYPRA_BODY_SEGMENTATION_WASM_BASE_URL") } : {}),
  };
}

async function fetchRemoteConfig(): Promise<BodySegmentationRuntimeConfig> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = typeof window !== "undefined" ? localStorage.getItem("clypra_auth_token") : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/body-effects/segmentation-config`, {
    cache: "reload",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to load body segmentation config: ${response.statusText}`);
  }

  const config = (await response.json()) as Partial<BodySegmentationRuntimeConfig>;
  const runtime = normalizeRuntime(config.runtime) || DEFAULT_CONFIG.runtime;

  return {
    runtime,
    modelUrl: config.modelUrl || DEFAULT_CONFIG.modelUrl,
    runtimeScriptUrl: config.runtimeScriptUrl || DEFAULT_CONFIG.runtimeScriptUrl,
    wasmBaseUrl: config.wasmBaseUrl || DEFAULT_CONFIG.wasmBaseUrl,
    minConfidence: config.minConfidence ?? DEFAULT_CONFIG.minConfidence,
    requestTimeoutMs: config.requestTimeoutMs ?? DEFAULT_CONFIG.requestTimeoutMs,
    cacheMaxEntries: config.cacheMaxEntries ?? DEFAULT_CONFIG.cacheMaxEntries,
  };
}

export async function getBodySegmentationConfig(): Promise<BodySegmentationRuntimeConfig> {
  if (!configPromise) {
    configPromise = fetchRemoteConfig()
      .catch((error) => {
        console.warn("[BodySegmentation] Falling back to default MediaPipe runtime config:", error);
        return DEFAULT_CONFIG;
      })
      .then((remoteConfig) => ({
        ...DEFAULT_CONFIG,
        ...remoteConfig,
        ...envOverrides(),
      }));
  }

  return configPromise;
}
