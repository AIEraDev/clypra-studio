/**
 * Benchmark Runner
 *
 * Measures GPU/CPU performance of effects to ensure they meet performance targets.
 * Tracks timing, FPS, memory usage, and generates performance reports.
 *
 * Phase 6 Week 10 - Publishing Pipeline #3
 */

export interface BenchmarkConfig {
  effectId: string;
  parameters: Record<string, any>;
  resolution: { width: number; height: number };
  frameCount: number;
  warmupFrames: number;
  targetFPS: number;
}

export interface BenchmarkResult {
  effectId: string;
  resolution: string;
  frameCount: number;
  performance: {
    averageGPUTime: number; // milliseconds
    minGPUTime: number;
    maxGPUTime: number;
    averageCPUTime: number;
    minCPUTime: number;
    maxCPUTime: number;
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    targetFPS: number;
    meetsTarget: boolean;
  };
  memory: {
    peakUsage: number; // bytes
    averageUsage: number;
    allocations: number;
  };
  passTimings: PassTiming[];
  executedAt: string;
  duration: number; // Total benchmark duration in ms
}

export interface PassTiming {
  passId: string;
  passName: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  percentage: number; // Percentage of total render time
}

export interface FrameTiming {
  frameNumber: number;
  gpuTime: number;
  cpuTime: number;
  totalTime: number;
  fps: number;
  memoryUsage: number;
}

/**
 * Performance Timer
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private endTime: number = 0;

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }

  get elapsed(): number {
    return this.endTime - this.startTime;
  }
}

/**
 * GPU Timer (using WebGL queries)
 */
export class GPUTimer {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private ext: any;
  private query: any;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;

    // Try to get timer query extension
    if (gl instanceof WebGL2RenderingContext) {
      // WebGL2 has built-in support
      this.ext = gl;
    } else {
      // WebGL1 needs extension
      this.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") || gl.getExtension("EXT_disjoint_timer_query");
    }

    if (!this.ext) {
      console.warn("GPU timing not available (timer query extension not supported)");
    }
  }

  isAvailable(): boolean {
    return this.ext !== null;
  }

  beginQuery(): void {
    if (!this.ext) return;

    if (this.gl instanceof WebGL2RenderingContext) {
      this.query = this.gl.createQuery();
      (this.gl as any).beginQuery((this.gl as any).TIME_ELAPSED_EXT, this.query);
    } else {
      this.query = (this.ext as any).createQueryEXT();
      (this.ext as any).beginQueryEXT((this.ext as any).TIME_ELAPSED_EXT, this.query);
    }
  }

  endQuery(): void {
    if (!this.ext) return;

    if (this.gl instanceof WebGL2RenderingContext) {
      (this.gl as any).endQuery((this.gl as any).TIME_ELAPSED_EXT);
    } else {
      (this.ext as any).endQueryEXT((this.ext as any).TIME_ELAPSED_EXT);
    }
  }

  async getResult(): Promise<number> {
    if (!this.ext || !this.query) return 0;

    // Wait for result to be available
    await this.waitForResult();

    let result: number;

    if (this.gl instanceof WebGL2RenderingContext) {
      result = (this.gl as any).getQueryParameter(this.query, (this.gl as any).QUERY_RESULT);
    } else {
      result = (this.ext as any).getQueryObjectEXT(this.query, (this.ext as any).QUERY_RESULT_EXT);
    }

    // Convert nanoseconds to milliseconds
    return result / 1000000;
  }

  private async waitForResult(): Promise<void> {
    return new Promise((resolve) => {
      const checkResult = () => {
        let available: boolean;

        if (this.gl instanceof WebGL2RenderingContext) {
          available = (this.gl as any).getQueryParameter(this.query, (this.gl as any).QUERY_RESULT_AVAILABLE);
        } else {
          available = (this.ext as any).getQueryObjectEXT(this.query, (this.ext as any).QUERY_RESULT_AVAILABLE_EXT);
        }

        if (available) {
          resolve();
        } else {
          requestAnimationFrame(checkResult);
        }
      };

      requestAnimationFrame(checkResult);
    });
  }
}

/**
 * Memory Monitor
 */
export class MemoryMonitor {
  getUsage(): number {
    // Try to get memory info if available
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }

    // Fallback: not available in all browsers
    return 0;
  }

  getPeakUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.totalJSHeapSize;
    }
    return 0;
  }
}

/**
 * Benchmark Runner
 */
export class BenchmarkRunner {
  private memoryMonitor = new MemoryMonitor();

  /**
   * Run a performance benchmark
   */
  async runBenchmark(config: BenchmarkConfig, renderer: BenchmarkRenderer): Promise<BenchmarkResult> {
    const timings: FrameTiming[] = [];
    const startTime = performance.now();

    // Warmup phase
    for (let i = 0; i < config.warmupFrames; i++) {
      await renderer.renderFrame(config.effectId, config.parameters, i);
    }

    // Benchmark phase
    for (let frame = 0; frame < config.frameCount; frame++) {
      const cpuTimer = new PerformanceTimer();
      const memoryBefore = this.memoryMonitor.getUsage();

      cpuTimer.start();

      // Render frame (GPU timing handled by renderer)
      const frameResult = await renderer.renderFrame(config.effectId, config.parameters, frame);

      const cpuTime = cpuTimer.end();
      const memoryAfter = this.memoryMonitor.getUsage();

      timings.push({
        frameNumber: frame,
        gpuTime: frameResult.gpuTime,
        cpuTime,
        totalTime: frameResult.gpuTime + cpuTime,
        fps: 1000 / (frameResult.gpuTime + cpuTime),
        memoryUsage: memoryAfter - memoryBefore,
      });
    }

    const totalDuration = performance.now() - startTime;

    // Calculate statistics
    const gpuTimes = timings.map((t) => t.gpuTime);
    const cpuTimes = timings.map((t) => t.cpuTime);
    const fpsList = timings.map((t) => t.fps);
    const memoryUsages = timings.map((t) => t.memoryUsage);

    const averageGPUTime = this.average(gpuTimes);
    const minGPUTime = Math.min(...gpuTimes);
    const maxGPUTime = Math.max(...gpuTimes);

    const averageCPUTime = this.average(cpuTimes);
    const minCPUTime = Math.min(...cpuTimes);
    const maxCPUTime = Math.max(...cpuTimes);

    const averageFPS = this.average(fpsList);
    const minFPS = Math.min(...fpsList);
    const maxFPS = Math.max(...fpsList);

    const peakMemory = Math.max(...memoryUsages);
    const averageMemory = this.average(memoryUsages);

    // Get pass timings from renderer
    const passTimings = await renderer.getPassTimings(config.effectId);

    return {
      effectId: config.effectId,
      resolution: `${config.resolution.width}x${config.resolution.height}`,
      frameCount: config.frameCount,
      performance: {
        averageGPUTime,
        minGPUTime,
        maxGPUTime,
        averageCPUTime,
        minCPUTime,
        maxCPUTime,
        averageFPS,
        minFPS,
        maxFPS,
        targetFPS: config.targetFPS,
        meetsTarget: averageFPS >= config.targetFPS,
      },
      memory: {
        peakUsage: peakMemory,
        averageUsage: averageMemory,
        allocations: timings.length,
      },
      passTimings,
      executedAt: new Date().toISOString(),
      duration: totalDuration,
    };
  }

  /**
   * Generate a benchmark report
   */
  generateReport(result: BenchmarkResult): string {
    const { performance: perf, memory, passTimings } = result;

    let report = "# Performance Benchmark Report\n\n";
    report += `**Effect:** ${result.effectId}\n`;
    report += `**Resolution:** ${result.resolution}\n`;
    report += `**Frames Tested:** ${result.frameCount}\n`;
    report += `**Duration:** ${result.duration.toFixed(0)}ms\n`;
    report += `**Date:** ${result.executedAt}\n\n`;

    // Performance summary
    report += `## Performance ${perf.meetsTarget ? "✅" : "❌"}\n\n`;
    report += `| Metric | Value | Target |\n`;
    report += `|--------|-------|--------|\n`;
    report += `| Average FPS | ${perf.averageFPS.toFixed(1)} | ${perf.targetFPS} |\n`;
    report += `| Min FPS | ${perf.minFPS.toFixed(1)} | ${perf.targetFPS} |\n`;
    report += `| Max FPS | ${perf.maxFPS.toFixed(1)} | - |\n\n`;

    // Timing breakdown
    report += `## Timing Breakdown\n\n`;
    report += `### GPU Time\n\n`;
    report += `- **Average:** ${perf.averageGPUTime.toFixed(2)}ms\n`;
    report += `- **Min:** ${perf.minGPUTime.toFixed(2)}ms\n`;
    report += `- **Max:** ${perf.maxGPUTime.toFixed(2)}ms\n`;
    report += `- **Target:** <16.67ms (60fps)\n\n`;

    if (perf.averageGPUTime > 16.67) {
      report += `⚠️ **Warning:** Average GPU time exceeds 60fps budget\n\n`;
    }

    report += `### CPU Time\n\n`;
    report += `- **Average:** ${perf.averageCPUTime.toFixed(2)}ms\n`;
    report += `- **Min:** ${perf.minCPUTime.toFixed(2)}ms\n`;
    report += `- **Max:** ${perf.maxCPUTime.toFixed(2)}ms\n\n`;

    // Pass timings
    if (passTimings.length > 0) {
      report += `## Pass Timings\n\n`;
      report += `| Pass | Time | Percentage |\n`;
      report += `|------|------|------------|\n`;

      for (const pass of passTimings) {
        report += `| ${pass.passName} | ${pass.averageTime.toFixed(2)}ms | ${pass.percentage.toFixed(1)}% |\n`;
      }
      report += `\n`;
    }

    // Memory usage
    report += `## Memory Usage\n\n`;
    report += `- **Peak:** ${this.formatBytes(memory.peakUsage)}\n`;
    report += `- **Average:** ${this.formatBytes(memory.averageUsage)}\n`;
    report += `- **Allocations:** ${memory.allocations}\n\n`;

    // Recommendations
    report += `## Recommendations\n\n`;

    if (!perf.meetsTarget) {
      report += `- ❌ Effect does not meet ${perf.targetFPS} FPS target\n`;
      report += `- Consider optimizing shaders or reducing pass count\n\n`;
    } else {
      report += `- ✅ Effect meets performance target\n\n`;
    }

    if (perf.averageGPUTime > 10) {
      report += `- ⚠️ GPU time is high (${perf.averageGPUTime.toFixed(2)}ms)\n`;
      report += `- Review pass timings to identify bottlenecks\n\n`;
    }

    if (passTimings.length > 5) {
      report += `- ⚠️ Effect has ${passTimings.length} render passes\n`;
      report += `- Consider combining passes or using half-resolution buffers\n\n`;
    }

    return report;
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "N/A";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }
}

/**
 * Benchmark Renderer Interface
 */
export interface BenchmarkRenderer {
  renderFrame(effectId: string, parameters: Record<string, any>, frameNumber: number): Promise<{ gpuTime: number }>;
  getPassTimings(effectId: string): Promise<PassTiming[]>;
}

/**
 * Convenience function to run benchmarks
 */
export async function benchmarkEffect(config: BenchmarkConfig, renderer: BenchmarkRenderer): Promise<BenchmarkResult> {
  const runner = new BenchmarkRunner();
  return await runner.runBenchmark(config, renderer);
}
