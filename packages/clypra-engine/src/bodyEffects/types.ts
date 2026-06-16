export type BodySegmentationRuntime = "heuristic" | "onnx" | "mediapipe";

export interface BodySegmentationRequest {
  requestId: number;
  cacheKey: string;
  imageData: ImageData;
  runtime: BodySegmentationRuntime;
  modelUrl?: string;
  runtimeScriptUrl?: string;
  wasmBaseUrl?: string;
  minConfidence: number;
}

export interface BodySegmentationRuntimeConfig {
  runtime: BodySegmentationRuntime;
  modelUrl?: string;
  runtimeScriptUrl?: string;
  wasmBaseUrl?: string;
  minConfidence?: number;
  requestTimeoutMs?: number;
  cacheMaxEntries?: number;
}

export interface BodySegmentationResponse {
  requestId: number;
  cacheKey: string;
  mask?: ImageData;
  runtimeUsed: BodySegmentationRuntime | "fallback";
  error?: string;
}

export interface BodySegmentationOptions {
  clipId?: string;
  effectId: string;
  renderer: string;
  time: number;
  width: number;
  height: number;
  minConfidence?: number;
}
