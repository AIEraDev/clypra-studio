import type { BodySegmentationRequest, BodySegmentationResponse, BodySegmentationRuntime } from "@clypra-studio/engine";

declare const self: {
  ort?: any;
  onmessage: ((event: MessageEvent<BodySegmentationRequest>) => void | Promise<void>) | null;
  postMessage: (message: BodySegmentationResponse) => void;
};

let loadedRuntimeScriptUrl: string | null = null;
let onnxSession: any = null;
let onnxModelUrl: string | null = null;
let mediaPipeRuntimeScriptUrl: string | null = null;
let mediaPipeModule: any = null;
let mediaPipeSegmenter: any = null;
let mediaPipeConfigKey: string | null = null;

self.onmessage = async (event: MessageEvent<BodySegmentationRequest>) => {
  const request = event.data;
  const response = await segment(request);
  self.postMessage(response);
};

async function segment(request: BodySegmentationRequest): Promise<BodySegmentationResponse> {
  try {
    let mask: ImageData | null = null;
    let runtimeUsed: BodySegmentationRuntime | "fallback" = request.runtime;

    if (request.runtime === "onnx") {
      mask = await segmentWithOnnx(request);
      if (!mask) runtimeUsed = "fallback";
    } else if (request.runtime === "mediapipe") {
      mask = await segmentWithMediaPipe(request);
      if (!mask) runtimeUsed = "fallback";
    }

    if (!mask) {
      mask = segmentWithHeuristic(request.imageData, request.minConfidence);
      runtimeUsed = request.runtime === "heuristic" ? "heuristic" : "fallback";
    }

    return {
      requestId: request.requestId,
      cacheKey: request.cacheKey,
      mask,
      runtimeUsed,
    };
  } catch (error) {
    return {
      requestId: request.requestId,
      cacheKey: request.cacheKey,
      runtimeUsed: "fallback",
      mask: segmentWithHeuristic(request.imageData, request.minConfidence),
      error: error instanceof Error ? error.message : "Body segmentation failed",
    };
  }
}

async function segmentWithOnnx(request: BodySegmentationRequest): Promise<ImageData | null> {
  if (!request.modelUrl || !request.runtimeScriptUrl) return null;

  await loadRuntimeScript(request.runtimeScriptUrl);
  const ort = self.ort;
  if (!ort?.InferenceSession || !ort?.Tensor) return null;

  if (request.wasmBaseUrl && ort.env?.wasm) {
    ort.env.wasm.wasmPaths = request.wasmBaseUrl;
  }

  if (!onnxSession || onnxModelUrl !== request.modelUrl) {
    onnxSession = await ort.InferenceSession.create(request.modelUrl, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    onnxModelUrl = request.modelUrl;
  }

  const width = request.imageData.width;
  const height = request.imageData.height;
  const tensor = imageDataToNchwFloatTensor(request.imageData, ort);
  const inputName = onnxSession.inputNames?.[0];
  const outputName = onnxSession.outputNames?.[0];
  if (!inputName || !outputName) return null;

  const outputs = await onnxSession.run({ [inputName]: tensor });
  const output = outputs[outputName];
  if (!output?.data) return null;

  return tensorOutputToMask(output.data, width, height, request.minConfidence);
}

async function segmentWithMediaPipe(request: BodySegmentationRequest): Promise<ImageData | null> {
  if (!request.modelUrl || !request.runtimeScriptUrl || !request.wasmBaseUrl) return null;

  const module = await loadMediaPipeRuntime(request.runtimeScriptUrl);
  const { FilesetResolver, ImageSegmenter } = module;
  if (!FilesetResolver?.forVisionTasks || !ImageSegmenter?.createFromOptions) return null;

  const configKey = [request.runtimeScriptUrl, request.modelUrl, request.wasmBaseUrl].join("|");
  if (!mediaPipeSegmenter || mediaPipeConfigKey !== configKey) {
    const fileset = await FilesetResolver.forVisionTasks(request.wasmBaseUrl);
    mediaPipeSegmenter = await ImageSegmenter.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: request.modelUrl,
      },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: true,
    });
    mediaPipeConfigKey = configKey;
  }

  const result = await runMediaPipeSegmentation(mediaPipeSegmenter, request.imageData);
  if (!result) return null;

  try {
    return mediaPipeResultToMask(result, request.imageData.width, request.imageData.height, request.minConfidence);
  } finally {
    closeMediaPipeResult(result);
  }
}

async function loadRuntimeScript(url: string): Promise<void> {
  if (loadedRuntimeScriptUrl === url) return;
  const mod = await import(/* @vite-ignore */ url);
  self.ort = mod.default || mod.ort || mod;
  loadedRuntimeScriptUrl = url;
}

async function loadMediaPipeRuntime(url: string): Promise<any> {
  if (mediaPipeModule && mediaPipeRuntimeScriptUrl === url) return mediaPipeModule;
  mediaPipeModule = await import(/* @vite-ignore */ url);
  mediaPipeRuntimeScriptUrl = url;
  mediaPipeSegmenter = null;
  mediaPipeConfigKey = null;
  return mediaPipeModule;
}

function runMediaPipeSegmentation(segmenter: any, imageData: ImageData): Promise<any> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("MediaPipe segmentation timed out"));
    }, 4000);
    const finish = (result: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(result);
    };

    try {
      const maybeResult = segmenter.segment(imageData, finish);
      if (maybeResult?.then) {
        maybeResult.then(finish, reject);
      } else if (maybeResult) {
        finish(maybeResult);
      }
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

function mediaPipeResultToMask(result: any, width: number, height: number, minConfidence: number): ImageData | null {
  const confidenceMasks = Array.isArray(result.confidenceMasks) ? result.confidenceMasks : [];

  // The selfie_multiclass_256x256 model outputs one confidence mask per class:
  //   index 0 = background
  //   index 1 = hair
  //   index 2 = body skin
  //   index 3 = face skin
  //   index 4 = clothes
  //   index 5 = others
  //
  // For full-person coverage (hair + body + face + clothes) we take the MAX
  // confidence value across ALL foreground classes (indices 1-N) per pixel.
  // This ensures hair and body are covered, not just the face.
  //
  // For the legacy single-class selfie_segmenter the output is 1–2 masks where
  // the last entry is "person confidence" — we keep that fallback below.
  if (confidenceMasks.length >= 4) {
    // Multiclass model: combine all foreground classes (skip index 0 = background)
    const maskW = confidenceMasks[1]?.width || width;
    const maskH = confidenceMasks[1]?.height || height;
    const pixelCount = maskW * maskH;
    const combinedConfidence = new Float32Array(pixelCount);

    for (let classIdx = 1; classIdx < confidenceMasks.length; classIdx++) {
      const classMask = confidenceMasks[classIdx];
      if (!classMask) continue;
      const classData = getMaskFloatData(classMask);
      if (!classData) continue;
      for (let i = 0; i < pixelCount; i++) {
        const v = classData[i] ?? 0;
        if (v > combinedConfidence[i]) combinedConfidence[i] = v;
      }
    }

    const rawMask = confidenceDataToMask(combinedConfidence, maskW, maskH, minConfidence);
    // Morphological closing: dilate(1)→erode(1) fills single-pixel hair gaps.
    // radius=1 keeps boundary overshoot to ~3.5 display pixels when upscaled from
    // 256×256 to display resolution. radius=3 was causing ~10px overshoot that
    // ate adjacent text characters (like the "u" in "Musa").
    return morphologicalClose(rawMask, 1);
  }

  // Legacy single-class fallback: last confidence mask = person
  if (confidenceMasks.length > 0) {
    const personMask = confidenceMasks[confidenceMasks.length - 1];
    const confidenceData = getMaskFloatData(personMask);
    if (confidenceData) {
      const maskW = personMask.width || width;
      const maskH = personMask.height || height;
      return confidenceDataToMask(confidenceData, maskW, maskH, minConfidence);
    }
  }

  if (result.categoryMask) {
    const categoryData = getMaskByteData(result.categoryMask);
    if (categoryData) {
      const maskW = result.categoryMask.width || width;
      const maskH = result.categoryMask.height || height;
      return categoryDataToMask(categoryData, maskW, maskH);
    }
  }

  return null;
}

function getMaskFloatData(mask: any): Float32Array | null {
  if (typeof mask.getAsFloat32Array === "function") return mask.getAsFloat32Array();
  if (mask.data instanceof Float32Array) return mask.data;
  return null;
}

// Helper to check standard byte structures in mediapipe
function getMaskByteData(mask: any): Uint8Array | null {
  if (typeof mask.getAsUint8Array === "function") return mask.getAsUint8Array();
  if (mask.data instanceof Uint8Array) return mask.data;
  return null;
}

function confidenceDataToMask(
  confidenceData: Float32Array,
  width: number,
  height: number,
  minConfidence: number,
): ImageData {
  const pixelCount = width * height;
  const mask = new ImageData(width, height);

  // Smoothstep transition band around minConfidence:
  // - Subject interior (confidence >= upperBound): 100% solid opaque (alpha = 255)
  // - Background (confidence <= lowerBound): 0% transparent (alpha = 0)
  // - Outer boundary: cubic Hermite smoothstep anti-aliasing
  const edgeBand = 0.08;
  const lowerBound = Math.max(0.01, minConfidence - edgeBand);
  const upperBound = Math.min(0.99, minConfidence + edgeBand);
  const bandRange = upperBound - lowerBound;

  for (let i = 0; i < pixelCount; i++) {
    const confidence = confidenceData[i] ?? 0;
    let alpha: number;

    if (confidence >= upperBound) {
      alpha = 255;
    } else if (confidence <= lowerBound) {
      alpha = 0;
    } else {
      const t = (confidence - lowerBound) / bandRange;
      alpha = Math.round(t * t * (3 - 2 * t) * 255);
    }

    const dst = i * 4;
    mask.data[dst] = 255;
    mask.data[dst + 1] = 255;
    mask.data[dst + 2] = 255;
    mask.data[dst + 3] = alpha;
  }

  return mask;
}

function categoryDataToMask(categoryData: Uint8Array, width: number, height: number): ImageData {
  const pixelCount = width * height;
  const mask = new ImageData(width, height);

  for (let i = 0; i < pixelCount; i++) {
    const dst = i * 4;
    mask.data[dst] = 255;
    mask.data[dst + 1] = 255;
    mask.data[dst + 2] = 255;
    mask.data[dst + 3] = categoryData[i] > 0 ? 255 : 0;
  }

  return softenMask(mask);
}

function closeMediaPipeResult(result: any): void {
  const masks = [
    result.categoryMask,
    ...(Array.isArray(result.confidenceMasks) ? result.confidenceMasks : []),
  ].filter(Boolean);

  for (const mask of masks) {
    if (typeof mask.close === "function") {
      mask.close();
    }
  }
}

function imageDataToNchwFloatTensor(imageData: ImageData, ort: any): any {
  const { data, width, height } = imageData;
  const size = width * height;
  const input = new Float32Array(size * 3);

  for (let i = 0; i < size; i++) {
    const src = i * 4;
    input[i] = data[src] / 255;
    input[size + i] = data[src + 1] / 255;
    input[size * 2 + i] = data[src + 2] / 255;
  }

  return new ort.Tensor("float32", input, [1, 3, height, width]);
}

function tensorOutputToMask(
  output: Float32Array | Uint8Array | number[],
  width: number,
  height: number,
  minConfidence: number,
): ImageData {
  const outputLength = output.length;
  const pixelCount = width * height;
  const channelOffset = outputLength >= pixelCount * 2 ? pixelCount : 0;
  const mask = new ImageData(width, height);

  const edgeBand = 0.08;
  const lowerBound = Math.max(0.01, minConfidence - edgeBand);
  const upperBound = Math.min(0.99, minConfidence + edgeBand);
  const bandRange = upperBound - lowerBound;

  for (let i = 0; i < pixelCount; i++) {
    const confidence = Number(output[channelOffset + i] ?? output[i] ?? 0);
    let alpha: number;

    if (confidence >= upperBound) {
      alpha = 255;
    } else if (confidence <= lowerBound) {
      alpha = 0;
    } else {
      const t = (confidence - lowerBound) / bandRange;
      alpha = Math.round(t * t * (3 - 2 * t) * 255);
    }

    const dst = i * 4;
    mask.data[dst] = 255;
    mask.data[dst + 1] = 255;
    mask.data[dst + 2] = 255;
    mask.data[dst + 3] = alpha;
  }

  return mask;
}

function segmentWithHeuristic(imageData: ImageData, minConfidence: number): ImageData {
  const { width, height } = imageData;
  const data = imageData.data;
  const mask = new ImageData(width, height);
  let totalLuma = 0;
  let samples = 0;

  for (let i = 0; i < data.length; i += 16) {
    totalLuma += luma(data[i], data[i + 1], data[i + 2]);
    samples++;
  }

  const avgLuma = samples > 0 ? totalLuma / samples : 96;
  const threshold = Math.max(18, Math.min(180, avgLuma * 0.78));
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let i = 0; i < width * height; i++) {
    const src = i * 4;
    const x = i % width;
    const y = Math.floor(i / width);
    const alpha = data[src + 3];
    const currentLuma = luma(data[src], data[src + 1], data[src + 2]);
    const chroma = Math.max(data[src], data[src + 1], data[src + 2]) - Math.min(data[src], data[src + 1], data[src + 2]);
    const centerBias = 1 - Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / maxDistance;
    const isSubject = alpha > 8 && (currentLuma > threshold || chroma > 28) && centerBias > (1 - minConfidence);
    const dst = i * 4;
    mask.data[dst] = 255;
    mask.data[dst + 1] = 255;
    mask.data[dst + 2] = 255;
    mask.data[dst + 3] = isSubject ? 255 : 0;
  }

  return softenMask(mask);
}

function softenMask(mask: ImageData): ImageData {
  const { width, height, data } = mask;
  const next = new ImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let total = 0;
      let count = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          total += data[(ny * width + nx) * 4 + 3];
          count++;
        }
      }
      const dst = (y * width + x) * 4;
      next.data[dst] = 255;
      next.data[dst + 1] = 255;
      next.data[dst + 2] = 255;
      next.data[dst + 3] = Math.floor(total / Math.max(1, count));
    }
  }

  return next;
}

/**
 * Morphological closing: dilate(radius) → erode(radius).
 * Fills small holes inside the mask (e.g. dark hair gaps) and smooths
 * jagged hair edges without significantly expanding the true boundary.
 */
function morphologicalClose(mask: ImageData, radius: number): ImageData {
  const { width, height } = mask;

  // --- Dilate: each pixel takes the MAX alpha of its neighbourhood ---
  const dilated = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxA = 0;
      for (let oy = -radius; oy <= radius; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const a = mask.data[(ny * width + nx) * 4 + 3];
          if (a > maxA) maxA = a;
        }
      }
      dilated[y * width + x] = maxA;
    }
  }

  // --- Erode: each pixel takes the MIN alpha of its neighbourhood ---
  const result = new ImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minA = 255;
      for (let oy = -radius; oy <= radius; oy++) {
        for (let ox = -radius; ox <= radius; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const a = dilated[ny * width + nx];
          if (a < minA) minA = a;
        }
      }
      const dst = (y * width + x) * 4;
      result.data[dst] = 255;
      result.data[dst + 1] = 255;
      result.data[dst + 2] = 255;
      result.data[dst + 3] = minA;
    }
  }

  return result;
}

function luma(r: number, g: number, b: number): number {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
