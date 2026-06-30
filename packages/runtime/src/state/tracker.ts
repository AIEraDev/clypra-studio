/**
 * @clypra/runtime — Runtime State Tracker
 *
 * Builds RuntimeSnapshot from RenderJob + ExecutionResult.
 * No events. Pure snapshot generation.
 */

import type { RenderJob, ExecutionResult } from "../job/types";
import type { RuntimeSnapshot, GraphSnapshot, ExecutionSnapshot, ResourceSnapshot, PerformanceSnapshot, DiagnosticSnapshot, PassDependencyGraph, PassResult, BackendInfo, SchedulingState, LogicalResource, PhysicalAllocation, AliasingInfo, CachePerformance, DiagnosticMessage } from "./types";

export interface RuntimeStateTrackerConfig {
  snapshotVersion: string;
  plannerVersion: string;
  rendererVersion: string;
  backend: BackendInfo;
  historySize?: number;
}

/**
 * Runtime State Tracker
 *
 * Generates immutable snapshots from job + result pairs.
 */
export class RuntimeStateTracker {
  private config: RuntimeStateTrackerConfig;
  private history: RuntimeSnapshot[] = [];
  private frameCounter = 0;

  // Running averages
  private frameTimes: number[] = [];
  private gpuTimes: number[] = [];
  private cpuTimes: number[] = [];

  constructor(config: RuntimeStateTrackerConfig) {
    this.config = {
      ...config,
      historySize: config.historySize ?? 60,
    };
  }

  /**
   * Capture snapshot from job execution
   */
  capture(job: RenderJob, result: ExecutionResult): RuntimeSnapshot {
    const timestamp = performance.now();

    // Update running averages
    this.frameTimes.push(result.duration);
    if (this.frameTimes.length > 60) this.frameTimes.shift();

    const gpuTime = result.passResults.reduce((sum, p) => sum + p.duration, 0);
    const cpuTime = result.duration - gpuTime;
    this.gpuTimes.push(gpuTime);
    this.cpuTimes.push(cpuTime);
    if (this.gpuTimes.length > 60) this.gpuTimes.shift();
    if (this.cpuTimes.length > 60) this.cpuTimes.shift();

    const snapshot: RuntimeSnapshot = {
      snapshotVersion: this.config.snapshotVersion,
      plannerVersion: this.config.plannerVersion,
      rendererVersion: this.config.rendererVersion,
      graphHash: job.metadata.graphHash,
      projectHash: job.metadata.projectHash,

      frame: job.frame,
      timestamp,

      graph: this.buildGraphSnapshot(job),
      execution: this.buildExecutionSnapshot(job, result),
      resources: this.buildResourceSnapshot(job, result),
      performance: this.buildPerformanceSnapshot(result),
      diagnostics: this.buildDiagnosticSnapshot(result),
    };

    // Add to history
    this.history.push(snapshot);
    if (this.history.length > this.config.historySize!) {
      this.history.shift();
    }

    this.frameCounter++;

    return snapshot;
  }

  /**
   * Build graph snapshot (immutable definition)
   */
  private buildGraphSnapshot(job: RenderJob): GraphSnapshot {
    // Build pass dependency graph
    const dependencies: PassDependencyGraph = {
      nodes: job.passes.map((p) => ({
        id: p.id,
        name: p.name,
        shader: p.shader,
        type: this.inferPassType(p.shader),
      })),
      edges: [],
    };

    // Build edges from pass dependencies
    for (const pass of job.passes) {
      for (const input of pass.inputs) {
        // Find which pass produces this input
        const producerPass = job.passes.find((p) => p.outputs.some((o) => o.logicalId === input.logicalId));

        if (producerPass) {
          dependencies.edges.push({
            from: producerPass.id,
            to: pass.id,
            resource: input.logicalId,
          });
        }
      }
    }

    return {
      nodeCount: job.passes.length,
      effectCount: job.passes.filter((p) => this.inferPassType(p.shader) === "effect").length,
      sourceCount: job.passes.filter((p) => this.inferPassType(p.shader) === "source").length,
      passCount: job.passes.length,
      dependencies,
      optimizations: job.metadata.optimizations.map((opt) => ({
        type: "merge",
        description: opt,
      })),
    };
  }

  /**
   * Build execution snapshot (what happened)
   */
  private buildExecutionSnapshot(job: RenderJob, result: ExecutionResult): ExecutionSnapshot {
    const passResults: PassResult[] = result.passResults.map((pr) => {
      const pass = job.passes.find((p) => p.id === pr.passId);
      return {
        id: pr.passId,
        name: pass?.name ?? pr.passId,
        shader: pass?.shader ?? "unknown",
        stage: pr.success ? "completed" : "failed",
        startedAt: 0, // Would need timing from executor
        finishedAt: pr.duration,
        duration: pr.duration,
        inputs:
          pass?.inputs.map((inp) => ({
            logicalId: inp.logicalId,
            physicalId: `Texture#${inp.logicalId}`, // Simplified
            binding: inp.binding,
            usage: inp.usage,
          })) ?? [],
        outputs:
          pass?.outputs.map((out) => ({
            logicalId: out.logicalId,
            physicalId: `Texture#${out.logicalId}`, // Simplified
            binding: out.binding,
            usage: out.usage,
          })) ?? [],
        uniforms: pass?.uniforms ?? {},
        drawCalls: pr.drawCalls,
        textureBinds: pr.textureBinds,
        shaderSwitches: 1, // Simplified
      };
    });

    const scheduling: SchedulingState = {
      readyQueue: [],
      passQueue: job.executionOrder,
      waitingQueue: [],
      completedQueue: result.passResults.filter((p) => p.success).map((p) => p.passId),
    };

    return {
      status: result.success ? "completed" : "failed",
      duration: result.duration,
      executionOrder: job.executionOrder,
      passResults,
      scheduling,
      backend: this.config.backend,
    };
  }

  /**
   * Build resource snapshot (allocation state)
   */
  private buildResourceSnapshot(job: RenderJob, result: ExecutionResult): ResourceSnapshot {
    const logical: LogicalResource[] = job.resources.map((r) => ({
      id: r.logicalId,
      type: r.type,
      width: r.width,
      height: r.height,
      format: r.format,
      createdFrame: job.frame,
      firstUsedFrame: job.frame,
      lastUsedFrame: job.frame,
      releasedFrame: r.transient ? job.frame : null,
      persistent: r.persistent,
      transient: r.transient,
      physicalId: `Texture#${r.logicalId}`, // Simplified
    }));

    const physical: PhysicalAllocation[] = job.resources.map((r) => ({
      id: `Texture#${r.logicalId}`,
      type: r.type,
      width: r.width,
      height: r.height,
      format: r.format,
      sizeBytes: r.width * r.height * 4, // RGBA8
      logicalResources: [r.logicalId],
      allocatedAt: 0,
      releasedAt: r.transient ? result.duration : null,
      reuseCount: 0,
    }));

    const aliasing: AliasingInfo[] = [];

    return {
      logical,
      physical,
      aliasing,
      totalAllocated: result.resourceUsage.allocated,
      totalReleased: result.resourceUsage.released,
      totalReused: result.resourceUsage.reused,
      peakMemory: result.resourceUsage.peakMemory,
    };
  }

  /**
   * Build performance snapshot (timing & memory)
   */
  private buildPerformanceSnapshot(result: ExecutionResult): PerformanceSnapshot {
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const avgGpuTime = this.gpuTimes.reduce((a, b) => a + b, 0) / this.gpuTimes.length;
    const avgCpuTime = this.cpuTimes.reduce((a, b) => a + b, 0) / this.cpuTimes.length;

    const cache: CachePerformance = {
      texturePool: {
        size: 0,
        available: 0,
        hitRate: result.cacheStats.texturePoolHits / (result.cacheStats.texturePoolHits + result.cacheStats.texturePoolMisses || 1),
      },
      shaderCache: {
        size: 0,
        hits: result.cacheStats.shaderCacheHits,
        misses: result.cacheStats.shaderCacheMisses,
      },
      resourceCache: {
        hits: result.cacheStats.texturePoolHits,
        misses: result.cacheStats.texturePoolMisses,
        evictions: 0,
      },
    };

    const gpuTime = result.passResults.reduce((sum, p) => sum + p.duration, 0);
    const cpuTime = result.duration - gpuTime;

    return {
      frameTime: result.duration,
      fps: 1000 / result.duration,

      compile: 0,
      plan: 0,
      schedule: 0,
      execute: result.duration,
      render: gpuTime,
      present: 0,

      gpuTime,
      cpuTime,
      uploadTime: 0,
      downloadTime: 0,

      textureMemory: result.resourceUsage.peakMemory,
      bufferMemory: 0,
      totalMemory: result.resourceUsage.peakMemory,
      peakMemory: result.resourceUsage.peakMemory,

      avgFrameTime,
      avgFps: 1000 / avgFrameTime,
      avgGpuTime,
      avgCpuTime,

      cache,
    };
  }

  /**
   * Build diagnostic snapshot (errors & warnings)
   */
  private buildDiagnosticSnapshot(result: ExecutionResult): DiagnosticSnapshot {
    const errors: DiagnosticMessage[] = result.errors.map((msg) => ({
      timestamp: performance.now(),
      subsystem: "executor",
      severity: "error",
      message: msg,
    }));

    const warnings: DiagnosticMessage[] = result.warnings.map((msg) => ({
      timestamp: performance.now(),
      subsystem: "executor",
      severity: "warning",
      message: msg,
    }));

    return {
      errors,
      warnings,
      info: [],
    };
  }

  /**
   * Infer pass type from shader name
   */
  private inferPassType(shader: string): "source" | "effect" | "composite" | "output" {
    if (shader === "copy" || shader === "blit" || shader === "blit-source") {
      return "source";
    }
    if (shader === "output") {
      return "output";
    }
    if (shader.includes("composite") || shader.includes("blend")) {
      return "composite";
    }
    return "effect";
  }

  /**
   * Get latest snapshot
   */
  getLatest(): RuntimeSnapshot | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * Get snapshot history
   */
  getHistory(): RuntimeSnapshot[] {
    return [...this.history];
  }

  /**
   * Get snapshot at index
   */
  getAt(index: number): RuntimeSnapshot | null {
    return this.history[index] ?? null;
  }

  /**
   * Get snapshot range
   */
  getRange(start: number, end: number): RuntimeSnapshot[] {
    return this.history.slice(start, end);
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.frameCounter = 0;
    this.frameTimes = [];
    this.gpuTimes = [];
    this.cpuTimes = [];
  }
}
