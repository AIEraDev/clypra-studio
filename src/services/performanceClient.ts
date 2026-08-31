import { getStudioApiBaseUrl } from "./apiConfig";

function assertTestFixtureAccess(): void {
  if (import.meta.env.MODE !== "test") {
    throw new Error("Synthetic performance fixtures are test-only; use the live API client.");
  }
}

export interface OSComparisonMetric {
  osFamily: string;
  sampleCount: number;
  p50RenderTimeUs: number;
  p95RenderTimeUs: number;
  p99RenderTimeUs: number;
  meanRenderTimeUs: number;
  droppedFrameRatioP95: number;
  p95SeekLatencyMs: number;
  fallbackRate: number;
  relativeSlowdownVsBaseline: number;
  meetsSLA: boolean;
}

export interface OSComparisonData {
  baselineOS: string;
  workloadMode: string;
  videoResolution?: string;
  videoCodec?: string;
  resolutionBucket?: string;
  comparison: OSComparisonMetric[];
  osMatrix?: OSComparisonMetric[];
}

export interface GPUArchitectureMetric {
  gpuVendor: string;
  gpuModel: string;
  sampleCount: number;
  p50RenderTimeUs: number;
  p95RenderTimeUs: number;
  p95SeekLatencyMs: number;
  droppedFrameRatioP95: number;
  fallbackRate: number;
  primaryBottleneck: "decode" | "compose" | "upload" | "readback" | "none";
  meetsSLA: boolean;
}

export interface HardwareComparisonData {
  workloadMode: string;
  gpuMatrix: GPUArchitectureMetric[];
}

export interface AnomalyItem {
  anomalyId: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  impactedCohort: {
    osFamily?: string;
    gpuVendor?: string;
    gpuModelRegex?: string;
    driverVersions?: string[];
    videoCodec?: string;
    resolutionBucket?: string;
  };
  affectedSessionsCount: number;
  affectedUsersPct: number;
  metrics: {
    cohortP95RenderTimeUs: number;
    globalP95RenderTimeUs: number;
    relativeSlowdownFactor: number;
    droppedFramesRatioMean: number;
    p95SeekLatencyMs: number;
    primaryBottleneckStage?: string;
  };
  rootCauseHypothesis: string;
  suggestedMitigation: string;
  detectedAt: string;
}

export interface FallbackData {
  totalFallbacks: number;
  fallbackBreakdown: Array<{
    transition: string;
    count: number;
    topReasons: Array<{ code: string; count: number }>;
    topImpactedDevices: Array<{ gpuModel: string; os: string; count: number }>;
  }>;
}

export interface ReleaseRegressionData {
  baseVersion: string;
  targetVersion: string;
  totalBaseSamples: number;
  totalTargetSamples: number;
  overallDelta: {
    p95RenderTimeDeltaUs: number;
    p95RenderTimePctDelta: number;
    droppedFrameRatioPctDelta: number;
    p95SeekLatencyPctDelta: number;
    fallbackRatePctDelta: number;
    isStatisticallySignificant: boolean;
    pValue: number;
  };
  dimensionBreakdown: Array<{
    dimensionKey: string;
    dimensionValue: string;
    p95DeltaUs: number;
    pctDelta: number;
    regressed: boolean;
  }>;
}

export interface BenchmarkSuite {
  suiteId: string;
  name: string;
  description: string;
  targetResolution: string;
  targetFps: number;
  testCasesCount: number;
}

export interface ExportPerformanceCohort {
  osFamily: string;
  gpuVendor: string;
  codec: string;
  resolution: string;
  sampleCount: number;
  avgExportFps: number;
  avgRealTimeFactor: number;
  renderTimePct: number;
  encodeTimePct: number;
  successRate: number;
}

export interface ExportComparisonData {
  totalExports: number;
  globalAvgFps: number;
  globalAvgRTF: number;
  cohorts: ExportPerformanceCohort[];
}

export interface SessionRollupData {
  totalRollupSessions: number;
  totalAccumulatedFrames: number;
  avgJankEventsPerSession: number;
  p95AvDriftMs: number;
  avgCacheHitRatio: number;
}

export interface PreviewComparisonCohort {
  view: "webview" | "native";
  surface: "dom-canvas" | "native-surface";
  runtimeEnvironment: "development" | "production";
  scenario?: "playback" | "seek" | "scrub" | "paused-interaction" | "qualification";
  qualificationRunId?: string;
  measurementSource?: "frontend-span" | "native-sample" | "session-rollup";
  sampleCount: number;
  measuredFrameCount: number;
  totalFrames: number;
  droppedFrames: number;
  staleFrames: number;
  cancelledFrames: number;
  durationMs: number;
  latestTimestampMs?: number;
  sourceCounts: {
    frontendSpan: number;
    nativeSample: number;
    sessionRollup: number;
    legacy: number;
  };
  confidence: "insufficient" | "preliminary" | "qualified";
  p50RenderTimeUs: number;
  p95RenderTimeUs: number;
  p99RenderTimeUs: number;
  droppedFrameRatioP95: number;
  droppedFrameRatio: number;
  p95DecodeUs: number;
  p95DecoderMutexWaitUs: number;
  p95ConversionUploadUs: number;
  p95ComposeUs: number;
  p95SurfaceAcquireUs: number;
  p95GpuQueueWaitUs: number;
  p95ReadbackUs: number;
  p95TransferUs: number;
  p95CanvasPaintUs: number;
  p95PresentUs: number;
  p95SchedulerWaitUs: number;
  p95IpcWaitUs: number;
  firstFrameVisibleMs?: number;
  jankEvents: number;
  primaryBottleneck: "decode" | "decoderMutexWait" | "conversionUpload" | "compose" | "surfaceAcquire" | "gpuQueueWait" | "readback" | "transfer" | "canvasPaint" | "submitPresent" | "schedulerWait" | "ipcWait" | "none";
  meetsSLA: boolean;
}

export interface PreviewComparisonData {
  workloadMode: string;
  scenario?: PreviewComparisonCohort["scenario"];
  qualificationRunId?: string;
  totalSampleSize: number;
  totalApiSamples: number;
  totalMeasuredFrames: number;
  latestTimestampMs?: number;
  sourceCounts: PreviewComparisonCohort["sourceCounts"];
  cohorts: PreviewComparisonCohort[];
}

export interface AudioPerformanceCohort {
  backend: "native-cpal" | "web-audio";
  runtimeEnvironment: "development" | "production";
  sampleCount: number;
  windowDurationMs: number;
  callbackCount: number;
  renderedFrames: number;
  nonSilentFrames: number;
  underruns: number;
  mixerLockMisses: number;
  bufferHitRatio: number;
  callbackP50Us: number;
  callbackP95Us: number;
  callbackP99Us: number;
  callbackMaxUs: number;
  callbackOverBudgetCount: number;
  p95DecodeUs: number;
  p95BufferWaitUs: number;
  p95MixerUs: number;
  p95OutputUs: number;
  p95SeekMs: number;
  p95ClockDriftMs: number;
  activeClipCount: number;
  activeVoiceCount: number;
  latestTimestampMs?: number;
  lastError?: string;
  meetsSLA: boolean;
  bottleneck: string;
}

export interface AudioComparisonData {
  totalApiSamples: number;
  totalWindows: number;
  latestTimestampMs?: number;
  cohorts: AudioPerformanceCohort[];
}

export interface TextPerformanceCohort {
  kind: "plain" | "effect" | "template";
  rendererPath: "native-raster" | "webview-canvas" | "studio-preview";
  runtimeEnvironment: "development" | "production";
  phase: "session-prewarm" | "text-prefetch" | "visible-playback" | "interactive-preview";
  sampleCount: number;
  renderCount: number;
  windowDurationMs: number;
  cacheHitRatio: number;
  p50RenderTimeUs: number;
  p95RenderTimeUs: number;
  p99RenderTimeUs: number;
  p95FontWaitUs: number;
  p95CompileUs: number;
  p95RasterUs: number;
  p95ReadbackUs: number;
  p95TransferUs: number;
  p95PaintUs: number;
  bottleneck: string;
  latestTimestampMs?: number;
  confidence: "insufficient" | "preliminary" | "qualified";
  meetsSLA: boolean;
}

export interface TextComparisonData {
  totalApiSamples: number;
  totalWindows: number;
  latestTimestampMs?: number;
  cohorts: TextPerformanceCohort[];
}

export const performanceClient = {
  async getAudioComparison(options: {
    backend?: "native-cpal" | "web-audio";
    environment?: "development" | "production";
  } = {}): Promise<AudioComparisonData | null> {
    try {
      const url = new URL(`${getStudioApiBaseUrl()}/performance/comparison/audio`);
      if (options.backend) url.searchParams.set("backend", options.backend);
      if (options.environment) url.searchParams.set("environment", options.environment);
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        totalApiSamples: json.totalApiSamples || 0,
        totalWindows: json.totalWindows || 0,
        latestTimestampMs: json.latestTimestampMs,
        cohorts: json.cohorts || [],
      };
    } catch {
      return null;
    }
  },

  async getTextComparison(options: {
    kind?: TextPerformanceCohort["kind"];
    rendererPath?: TextPerformanceCohort["rendererPath"];
    environment?: TextPerformanceCohort["runtimeEnvironment"];
    phase?: TextPerformanceCohort["phase"];
  } = {}): Promise<TextComparisonData | null> {
    try {
      const url = new URL(`${getStudioApiBaseUrl()}/performance/comparison/text`);
      if (options.kind) url.searchParams.set("kind", options.kind);
      if (options.rendererPath) url.searchParams.set("renderer_path", options.rendererPath);
      if (options.environment) url.searchParams.set("environment", options.environment);
      if (options.phase) url.searchParams.set("phase", options.phase);
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        totalApiSamples: json.totalApiSamples || 0,
        totalWindows: json.totalWindows || 0,
        latestTimestampMs: json.latestTimestampMs,
        cohorts: json.cohorts || [],
      };
    } catch {
      return null;
    }
  },

  async getOSComparison(workload = "playback", resolution = "4k", codec = "hevc"): Promise<OSComparisonData | null> {
    try {
      const url = new URL(`${getStudioApiBaseUrl()}/performance/comparison/os`);
      url.searchParams.set("workload", workload);
      url.searchParams.set("resolution", resolution);
      url.searchParams.set("codec", codec);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = json.comparison || json.osMatrix || [];
      if (rows.length === 0) return null;
      return {
        ...json,
        comparison: rows,
        osMatrix: rows,
      };
    } catch {
      return null;
    }
  },

  async getHardwareComparison(workload = "playback"): Promise<HardwareComparisonData | null> {
    try {
      const url = new URL(`${getStudioApiBaseUrl()}/performance/comparison/hardware`);
      url.searchParams.set("workload", workload);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if ((json.gpuMatrix || []).length === 0) return null;
      return {
        ...json,
        gpuMatrix: json.gpuMatrix || [],
      };
    } catch {
      return null;
    }
  },

  async getAnomalies(severity?: string): Promise<{ totalAnomaliesDetected: number; anomalies: AnomalyItem[] } | null> {
    try {
      const url = new URL(`${getStudioApiBaseUrl()}/performance/edge-cases/anomalies`);
      if (severity) url.searchParams.set("severity", severity);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        totalAnomaliesDetected: json.totalAnomaliesDetected ?? (json.anomalies?.length || 0),
        anomalies: json.anomalies || [],
      };
    } catch {
      return null;
    }
  },

  async getFallbacks(): Promise<FallbackData | null> {
    try {
      const res = await fetch(`${getStudioApiBaseUrl()}/performance/edge-cases/fallbacks`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        ...json,
        fallbackBreakdown: json.fallbackBreakdown || [],
      };
    } catch {
      return null;
    }
  },

  async getReleaseRegression(baseVersion = "1.4.3", targetVersion = "1.4.4"): Promise<ReleaseRegressionData | null> {
    try {
      const url = new URL(`${getStudioApiBaseUrl()}/performance/comparison/releases`);
      url.searchParams.set("base_version", baseVersion);
      url.searchParams.set("target_version", targetVersion);

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getBenchmarkSuites(): Promise<{ suites: BenchmarkSuite[] } | null> {
    try {
      const res = await fetch(`${getStudioApiBaseUrl()}/performance/benchmarks/suites`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getExportComparison(): Promise<ExportComparisonData | null> {
    try {
      const res = await fetch(`${getStudioApiBaseUrl()}/performance/comparison/exports`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        ...json,
        cohorts: json.cohorts || [],
      };
    } catch {
      return null;
    }
  },

  async getSessionRollups(): Promise<SessionRollupData | null> {
    try {
      const res = await fetch(`${getStudioApiBaseUrl()}/performance/comparison/sessions`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getPreviewComparison(
    workload = "playback",
    options: {
      scenario?: PreviewComparisonCohort["scenario"];
      qualificationRunId?: string;
      runtimeEnvironment?: "development" | "production";
      view?: "native" | "webview";
      measurementSource?: "frontend-span" | "native-sample" | "session-rollup";
    } = {},
  ): Promise<PreviewComparisonData | null> {
    try {
      const url = new URL(`${getStudioApiBaseUrl()}/performance/comparison/preview`);
      url.searchParams.set("workload", workload);
      if (options.scenario) url.searchParams.set("scenario", options.scenario);
      if (options.qualificationRunId) url.searchParams.set("qualification_run_id", options.qualificationRunId);
      if (options.runtimeEnvironment) url.searchParams.set("environment", options.runtimeEnvironment);
      if (options.view) url.searchParams.set("view", options.view);
      if (options.measurementSource) url.searchParams.set("measurement_source", options.measurementSource);
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return {
        workloadMode: json.workloadMode || workload,
        scenario: json.scenario,
        qualificationRunId: json.qualificationRunId,
        totalSampleSize: json.totalSampleSize || 0,
        totalApiSamples: json.totalApiSamples || 0,
        totalMeasuredFrames: json.totalMeasuredFrames || json.totalSampleSize || 0,
        latestTimestampMs: json.latestTimestampMs,
        sourceCounts: json.sourceCounts || { frontendSpan: 0, nativeSample: 0, sessionRollup: 0, legacy: 0 },
        cohorts: json.cohorts || [],
      };
    } catch {
      return null;
    }
  },

  /** Test-only fixture; Admin pages must use the live API methods above. */
  getTestFixtureOSComparison(): OSComparisonData {
    assertTestFixtureAccess();
    const comparison: OSComparisonMetric[] = [
      {
        osFamily: "macos",
        sampleCount: 184200,
        p50RenderTimeUs: 5800,
        p95RenderTimeUs: 10400,
        p99RenderTimeUs: 13200,
        meanRenderTimeUs: 6400,
        droppedFrameRatioP95: 0.001,
        p95SeekLatencyMs: 38.5,
        fallbackRate: 0.0,
        relativeSlowdownVsBaseline: 1.0,
        meetsSLA: true,
      },
      {
        osFamily: "windows",
        sampleCount: 215400,
        p50RenderTimeUs: 8900,
        p95RenderTimeUs: 15400,
        p99RenderTimeUs: 18200,
        meanRenderTimeUs: 9600,
        droppedFrameRatioP95: 0.012,
        p95SeekLatencyMs: 44.0,
        fallbackRate: 0.002,
        relativeSlowdownVsBaseline: 1.48,
        meetsSLA: true,
      },
      {
        osFamily: "linux",
        sampleCount: 42100,
        p50RenderTimeUs: 6200,
        p95RenderTimeUs: 11200,
        p99RenderTimeUs: 14800,
        meanRenderTimeUs: 6900,
        droppedFrameRatioP95: 0.003,
        p95SeekLatencyMs: 41.2,
        fallbackRate: 0.0,
        relativeSlowdownVsBaseline: 1.08,
        meetsSLA: true,
      },
      {
        osFamily: "ios",
        sampleCount: 92300,
        p50RenderTimeUs: 7100,
        p95RenderTimeUs: 12100,
        p99RenderTimeUs: 15400,
        meanRenderTimeUs: 7800,
        droppedFrameRatioP95: 0.002,
        p95SeekLatencyMs: 48.0,
        fallbackRate: 0.0,
        relativeSlowdownVsBaseline: 1.16,
        meetsSLA: true,
      },
      {
        osFamily: "android",
        sampleCount: 74300,
        p50RenderTimeUs: 11400,
        p95RenderTimeUs: 24800,
        p99RenderTimeUs: 36000,
        meanRenderTimeUs: 13800,
        droppedFrameRatioP95: 0.095,
        p95SeekLatencyMs: 118.0,
        fallbackRate: 0.068,
        relativeSlowdownVsBaseline: 2.38,
        meetsSLA: false,
      },
    ];

    return {
      baselineOS: "macos",
      workloadMode: "playback",
      videoResolution: "4k",
      videoCodec: "hevc",
      comparison,
      osMatrix: comparison,
    };
  },

  getTestFixtureHardwareComparison(): HardwareComparisonData {
    assertTestFixtureAccess();
    return {
      workloadMode: "playback",
      gpuMatrix: [
        {
          gpuVendor: "apple",
          gpuModel: "Apple M3 Pro",
          sampleCount: 64200,
          p50RenderTimeUs: 5800,
          p95RenderTimeUs: 9800,
          p95SeekLatencyMs: 34.0,
          droppedFrameRatioP95: 0.001,
          fallbackRate: 0.0,
          primaryBottleneck: "none",
          meetsSLA: true,
        },
        {
          gpuVendor: "nvidia",
          gpuModel: "NVIDIA GeForce RTX 4070",
          sampleCount: 52100,
          p50RenderTimeUs: 6200,
          p95RenderTimeUs: 11200,
          p95SeekLatencyMs: 40.5,
          droppedFrameRatioP95: 0.002,
          fallbackRate: 0.0001,
          primaryBottleneck: "none",
          meetsSLA: true,
        },
        {
          gpuVendor: "amd",
          gpuModel: "AMD Radeon RX 7800 XT",
          sampleCount: 38700,
          p50RenderTimeUs: 6900,
          p95RenderTimeUs: 12400,
          p95SeekLatencyMs: 46.0,
          droppedFrameRatioP95: 0.003,
          fallbackRate: 0.001,
          primaryBottleneck: "none",
          meetsSLA: true,
        },
        {
          gpuVendor: "intel",
          gpuModel: "Intel Iris Xe Graphics",
          sampleCount: 48900,
          p50RenderTimeUs: 15400,
          p95RenderTimeUs: 29800,
          p95SeekLatencyMs: 142.0,
          droppedFrameRatioP95: 0.185,
          fallbackRate: 0.038,
          primaryBottleneck: "decode",
          meetsSLA: false,
        },
        {
          gpuVendor: "arm",
          gpuModel: "Mali-G78 MP14",
          sampleCount: 31200,
          p50RenderTimeUs: 14200,
          p95RenderTimeUs: 26500,
          p95SeekLatencyMs: 128.0,
          droppedFrameRatioP95: 0.092,
          fallbackRate: 0.074,
          primaryBottleneck: "compose",
          meetsSLA: false,
        },
      ],
    };
  },

  getTestFixtureAnomalies(): { totalAnomaliesDetected: number; anomalies: AnomalyItem[] } {
    assertTestFixtureAccess();
    return {
      totalAnomaliesDetected: 2,
      anomalies: [
        {
          anomalyId: "anom_win_intel_hevc_4k",
          severity: "critical" as const,
          title: "Critical Frame Drop Regression on Windows / Intel Iris Xe with 4K HEVC 10-bit",
          impactedCohort: {
            osFamily: "windows",
            gpuVendor: "intel",
            driverVersions: ["31.0.101.5333", "31.0.101.5382"],
            videoCodec: "hevc",
            resolutionBucket: "4k",
          },
          affectedSessionsCount: 8420,
          affectedUsersPct: 4.12,
          metrics: {
            cohortP95RenderTimeUs: 29800,
            globalP95RenderTimeUs: 10400,
            relativeSlowdownFactor: 2.87,
            droppedFramesRatioMean: 0.185,
            p95SeekLatencyMs: 142.0,
            primaryBottleneckStage: "decodeUs",
          },
          rootCauseHypothesis: "Intel integrated Gen12 hardware HEVC 10-bit decoder DXVA context thrashing during concurrent RGBA texture composition.",
          suggestedMitigation: "Force D3D11 shared texture path or downgrade to 8-bit proxy preview on Intel Gen12 graphics.",
          detectedAt: new Date().toISOString(),
        },
        {
          anomalyId: "anom_android_mali_webgpu_fallback",
          severity: "high" as const,
          title: "WebGPU Device Lost Triggering WebGL Fallback on ARM Mali GPUs",
          impactedCohort: {
            osFamily: "android",
            gpuVendor: "arm",
            videoCodec: "h264",
            resolutionBucket: "1080p",
          },
          affectedSessionsCount: 4210,
          affectedUsersPct: 2.35,
          metrics: {
            cohortP95RenderTimeUs: 26500,
            globalP95RenderTimeUs: 10400,
            relativeSlowdownFactor: 2.55,
            droppedFramesRatioMean: 0.092,
            p95SeekLatencyMs: 128.0,
            primaryBottleneckStage: "composeUs",
          },
          rootCauseHypothesis: "ARM Mali-G78 GPU tile memory exhaustion when allocating high-resolution HDR texture render passes.",
          suggestedMitigation: "Reduce maximum offscreen framebuffer depth to 8-bit and disable 4x MSAA on Mali mobile GPUs.",
          detectedAt: new Date().toISOString(),
        },
      ],
    };
  },

  getTestFixtureFallbacks(): FallbackData {
    assertTestFixtureAccess();
    return {
      totalFallbacks: 1420,
      fallbackBreakdown: [
        {
          transition: "webgpu -> webgl2",
          count: 1180,
          topReasons: [
            { code: "GPUAdapterNotFoundError", count: 890 },
            { code: "DeviceLost_OutOfMemory", count: 290 },
          ],
          topImpactedDevices: [
            { gpuModel: "Mali-G78 MP14", os: "android", count: 420 },
            { gpuModel: "Intel HD Graphics 620", os: "windows", count: 380 },
          ],
        },
        {
          transition: "hw_decode -> sw_ffmpeg",
          count: 240,
          topReasons: [
            { code: "MEDIA_ERR_DECODE_LIMIT_EXCEEDED", count: 190 },
            { code: "UNSUPPORTED_CHROMA_422", count: 50 },
          ],
          topImpactedDevices: [
            { gpuModel: "Apple M1", os: "macos", count: 110 },
            { gpuModel: "NVIDIA GTX 1060", os: "windows", count: 80 },
          ],
        },
      ],
    };
  },

  getTestFixtureReleaseRegression(): ReleaseRegressionData {
    assertTestFixtureAccess();
    return {
      baseVersion: "1.4.3",
      targetVersion: "1.4.4",
      totalBaseSamples: 142000,
      totalTargetSamples: 156000,
      overallDelta: {
        p95RenderTimeDeltaUs: -1200,
        p95RenderTimePctDelta: -10.3,
        droppedFrameRatioPctDelta: -18.2,
        p95SeekLatencyPctDelta: -12.5,
        fallbackRatePctDelta: -4.1,
        isStatisticallySignificant: true,
        pValue: 0.0001,
      },
      dimensionBreakdown: [
        {
          dimensionKey: "osFamily",
          dimensionValue: "macos",
          p95DeltaUs: -800,
          pctDelta: -7.1,
          regressed: false,
        },
        {
          dimensionKey: "osFamily",
          dimensionValue: "windows",
          p95DeltaUs: -1600,
          pctDelta: -7.5,
          regressed: false,
        },
        {
          dimensionKey: "osFamily",
          dimensionValue: "linux",
          p95DeltaUs: -400,
          pctDelta: -3.0,
          regressed: false,
        },
      ],
    };
  },

  getTestFixtureExportComparison(): ExportComparisonData {
    assertTestFixtureAccess();
    return {
      totalExports: 4200,
      globalAvgFps: 58.4,
      globalAvgRTF: 0.52,
      cohorts: [
        {
          osFamily: "macos",
          gpuVendor: "apple",
          codec: "hevc",
          resolution: "4k",
          sampleCount: 1850,
          avgExportFps: 74.2,
          avgRealTimeFactor: 0.41,
          renderTimePct: 58,
          encodeTimePct: 42,
          successRate: 0.998,
        },
        {
          osFamily: "windows",
          gpuVendor: "nvidia",
          codec: "hevc",
          resolution: "4k",
          sampleCount: 1420,
          avgExportFps: 68.5,
          avgRealTimeFactor: 0.44,
          renderTimePct: 62,
          encodeTimePct: 38,
          successRate: 0.994,
        },
        {
          osFamily: "windows",
          gpuVendor: "intel",
          codec: "hevc",
          resolution: "4k",
          sampleCount: 520,
          avgExportFps: 22.1,
          avgRealTimeFactor: 1.36,
          renderTimePct: 78,
          encodeTimePct: 22,
          successRate: 0.965,
        },
        {
          osFamily: "linux",
          gpuVendor: "amd",
          codec: "hevc",
          resolution: "4k",
          sampleCount: 410,
          avgExportFps: 54.0,
          avgRealTimeFactor: 0.55,
          renderTimePct: 65,
          encodeTimePct: 35,
          successRate: 0.991,
        },
      ],
    };
  },

  getTestFixtureSessionRollups(): SessionRollupData {
    assertTestFixtureAccess();
    return {
      totalRollupSessions: 28400,
      totalAccumulatedFrames: 17040000,
      avgJankEventsPerSession: 0.42,
      p95AvDriftMs: 3.8,
      avgCacheHitRatio: 0.945,
    };
  },
};
