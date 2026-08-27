import { getStudioApiBaseUrl } from "./apiConfig";

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
  videoResolution: string;
  videoCodec: string;
  comparison: OSComparisonMetric[];
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

export const performanceClient = {
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
      return await res.json();
    } catch {
      return this.getLocalFallbackOSComparison();
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
      return await res.json();
    } catch {
      return this.getLocalFallbackHardwareComparison();
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
      return await res.json();
    } catch {
      return this.getLocalFallbackAnomalies();
    }
  },

  async getFallbacks(): Promise<FallbackData | null> {
    try {
      const res = await fetch(`${getStudioApiBaseUrl()}/performance/edge-cases/fallbacks`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return this.getLocalFallbackFallbacks();
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
      return this.getLocalFallbackReleaseRegression();
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
      return {
        suites: [
          {
            suiteId: "clypra-suite-4k60-hevc10",
            name: "4K 60fps HEVC 10-bit HDR10 Playback Cadence",
            description: "High-stress 4K 10-bit playback testing zero-copy GPU decoder throughput and P99 frame pacing.",
            targetResolution: "4k",
            targetFps: 60,
            testCasesCount: 4,
          },
          {
            suiteId: "clypra-suite-seek-cold-4k",
            name: "4K 60fps Cold Keyframe Seek Response",
            description: "Rapid timeline random seeking evaluating demuxer seeking, keyframe seek distance, and first-frame visible latency.",
            targetResolution: "4k",
            targetFps: 60,
            testCasesCount: 5,
          },
          {
            suiteId: "clypra-suite-vfr-scrub-120",
            name: "1080p 120fps VFR High-Speed Scrub",
            description: "Variable frame rate scrubbing evaluating timeline timebase interpolation without audio drift.",
            targetResolution: "1080p",
            targetFps: 120,
            testCasesCount: 3,
          },
          {
            suiteId: "clypra-suite-prores-8k-export",
            name: "8K ProRes 422 Real-time Shader Composite",
            description: "Extreme bandwidth export pipeline testing multi-layer blending, color grade shaders, and NVENC/VideoToolbox export.",
            targetResolution: "8k",
            targetFps: 60,
            testCasesCount: 2,
          },
        ],
      };
    }
  },

  async getExportComparison(): Promise<ExportComparisonData | null> {
    try {
      const res = await fetch(`${getStudioApiBaseUrl()}/performance/comparison/exports`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return this.getLocalFallbackExportComparison();
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
      return this.getLocalFallbackSessionRollups();
    }
  },

  getLocalFallbackOSComparison(): OSComparisonData {
    return {
      baselineOS: "macos",
      workloadMode: "playback",
      videoResolution: "4k",
      videoCodec: "hevc",
      comparison: [
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
          p95RenderTimeUs: 19800,
          p99RenderTimeUs: 28400,
          meanRenderTimeUs: 10200,
          droppedFrameRatioP95: 0.052,
          p95SeekLatencyMs: 68.0,
          fallbackRate: 0.015,
          relativeSlowdownVsBaseline: 1.9,
          meetsSLA: false,
        },
        {
          osFamily: "linux",
          sampleCount: 42300,
          p50RenderTimeUs: 7200,
          p95RenderTimeUs: 12800,
          p99RenderTimeUs: 16900,
          meanRenderTimeUs: 8100,
          droppedFrameRatioP95: 0.003,
          p95SeekLatencyMs: 44.0,
          fallbackRate: 0.002,
          relativeSlowdownVsBaseline: 1.23,
          meetsSLA: true,
        },
        {
          osFamily: "ios",
          sampleCount: 92100,
          p50RenderTimeUs: 6800,
          p95RenderTimeUs: 11900,
          p99RenderTimeUs: 15100,
          meanRenderTimeUs: 7400,
          droppedFrameRatioP95: 0.002,
          p95SeekLatencyMs: 42.0,
          fallbackRate: 0.0005,
          relativeSlowdownVsBaseline: 1.14,
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
      ],
    };
  },

  getLocalFallbackHardwareComparison(): HardwareComparisonData {
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

  getLocalFallbackAnomalies(): { totalAnomaliesDetected: number; anomalies: AnomalyItem[] } {
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

  getLocalFallbackFallbacks(): FallbackData {
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

  getLocalFallbackReleaseRegression(): ReleaseRegressionData {
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

  getLocalFallbackExportComparison(): ExportComparisonData {
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

  getLocalFallbackSessionRollups(): SessionRollupData {
    return {
      totalRollupSessions: 28400,
      totalAccumulatedFrames: 17040000,
      avgJankEventsPerSession: 0.42,
      p95AvDriftMs: 3.8,
      avgCacheHitRatio: 0.945,
    };
  },
};
