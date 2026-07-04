import type { BodySegmentationRuntime, BodySegmentationRuntimeConfig } from "@clypra-studio/engine";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://clypra-worker-api.abdulkabirmusa.com";

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

  const response = await fetch(`${API_BASE}/effects/segmentation-config`, {
    cache: "reload",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to load body segmentation config: ${response.statusText}`);
  }

  const config = (await response.json()) as Partial<BodySegmentationRuntimeConfig>;
  const runtime = normalizeRuntime(config.runtime) || "mediapipe";

  return {
    runtime,
    modelUrl: config.modelUrl,
    runtimeScriptUrl: config.runtimeScriptUrl,
    wasmBaseUrl: config.wasmBaseUrl,
    minConfidence: config.minConfidence,
    requestTimeoutMs: config.requestTimeoutMs,
    cacheMaxEntries: config.cacheMaxEntries,
  };
}

export async function getBodySegmentationConfig(): Promise<BodySegmentationRuntimeConfig> {
  if (!configPromise) {
    configPromise = fetchRemoteConfig()
      .catch((error) => {
        console.warn("[BodySegmentation] Falling back to local runtime config:", error);
        return { runtime: "heuristic" as const };
      })
      .then((remoteConfig) => ({ ...remoteConfig, ...envOverrides() }));
  }

  return configPromise;
}
