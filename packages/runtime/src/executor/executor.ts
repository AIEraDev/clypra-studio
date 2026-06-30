/**
 * @clypra/runtime — Executor
 *
 * Consumes immutable RenderJob.
 * Produces ExecutionResult.
 * Never mutates the job.
 *
 * Think: SQL query executor
 *
 * The Executor is the runtime brain. It owns:
 * - Resource allocation
 * - Aliasing
 * - Synchronization
 * - Pass scheduling
 * - Cache lookup
 * - Replay
 * - Snapshot generation
 */

import type { RenderJob, ExecutionResult, PassExecutionResult, ResourceDescriptor, ResourceUsageDetail } from "../job/types";
import type { RuntimeSnapshot, BackendInfo } from "../state/types";
import { RuntimeStateTracker } from "../state/tracker";

export interface ExecutorConfig {
  // Resource management
  enableResourcePooling?: boolean;
  enableAliasing?: boolean;
  maxTexturePoolSize?: number;

  // Performance
  enableCaching?: boolean;
  maxConcurrency?: number;

  // Observability
  captureSnapshots?: boolean;
  snapshotHistory?: number;

  // Backend info for snapshots
  backend?: BackendInfo;
}

/**
 * Executor
 *
 * Schedules and executes render jobs.
 * Backend-agnostic orchestration.
 */
export class Executor {
  private config: ExecutorConfig;
  private resources = new Map<string, unknown>(); // logicalId -> backend resource
  private texturePool = new Map<string, unknown[]>(); // format -> available textures
  private stateTracker: RuntimeStateTracker | null = null;
  private frameCounter = 0;

  constructor(config: ExecutorConfig = {}) {
    this.config = {
      enableResourcePooling: config.enableResourcePooling ?? true,
      enableAliasing: config.enableAliasing ?? true,
      maxTexturePoolSize: config.maxTexturePoolSize ?? 20,
      enableCaching: config.enableCaching ?? true,
      maxConcurrency: config.maxConcurrency ?? 1,
      captureSnapshots: config.captureSnapshots ?? false,
      snapshotHistory: config.snapshotHistory ?? 60,
      backend: config.backend,
    };

    // Initialize state tracker if snapshots enabled
    if (this.config.captureSnapshots && this.config.backend) {
      this.stateTracker = new RuntimeStateTracker({
        snapshotVersion: "1.0.0",
        plannerVersion: "1.0.0",
        rendererVersion: "1.0.0",
        backend: this.config.backend,
        historySize: this.config.snapshotHistory,
      });
    }
  }

  /**
   * Execute a render job
   *
   * Returns execution result (immutable).
   */
  async execute(job: RenderJob, renderer: Renderer): Promise<ExecutionResult> {
    const startTime = performance.now();

    const errors: string[] = [];
    const warnings: string[] = [];

    let allocated = 0;
    let reused = 0;
    let released = 0;
    const details: ResourceUsageDetail[] = [];

    try {
      // Step 1: Allocate resources (executor owns this)
      for (const resource of job.resources) {
        const wasReused = await this.allocateResource(resource, renderer);
        if (wasReused) {
          reused++;
        } else {
          allocated++;
        }
      }

      // Step 2: Build render context
      const context: RenderContext = {
        resources: this.resources,
        outputResource: "output",
        frame: job.frame,
        timestamp: job.timestamp,
      };

      // Step 3: Execute via renderer
      const result = await renderer.execute(job, context);

      // Step 4: Release transient resources (executor owns this)
      for (const resource of job.resources) {
        if (resource.transient) {
          await this.releaseResource(resource.logicalId, resource.aliasable);
          released++;
        }
      }

      // Step 5: Capture snapshot if enabled
      if (this.stateTracker) {
        this.stateTracker.capture(job, result);
      }

      return result;
    } catch (error) {
      errors.push(String(error));

      return {
        jobId: job.jobId,
        frame: job.frame,
        success: false,
        duration: performance.now() - startTime,
        passResults: [],
        resourceUsage: {
          allocated,
          reused,
          released,
          peakMemory: 0,
          details,
        },
        cacheStats: {
          texturePoolHits: reused,
          texturePoolMisses: allocated,
          shaderCacheHits: 0,
          shaderCacheMisses: 0,
        },
        outputTexture: null,
        errors,
        warnings,
      };
    }
  }

  /**
   * Allocate resource (with pooling and aliasing)
   *
   * Returns true if reused from pool.
   */
  private async allocateResource(resource: ResourceDescriptor, renderer: unknown): Promise<boolean> {
    // Check pool first
    if (this.config.enableResourcePooling) {
      const poolKey = `${resource.type}-${resource.format}-${resource.width}x${resource.height}`;
      const pool = this.texturePool.get(poolKey);

      if (pool && pool.length > 0) {
        const pooledResource = pool.pop()!;
        this.resources.set(resource.logicalId, pooledResource);
        return true; // Reused
      }
    }

    // Allocate new resource (backend-specific, handled by renderer in init)
    // For now, we'll create a placeholder
    this.resources.set(resource.logicalId, {
      type: resource.type,
      width: resource.width,
      height: resource.height,
      format: resource.format,
    });

    return false; // Allocated new
  }

  /**
   * Release resource (return to pool if aliasable)
   */
  private async releaseResource(logicalId: string, aliasable: boolean): Promise<void> {
    const resource = this.resources.get(logicalId);
    if (!resource) return;

    // Return to pool if aliasable and pooling enabled
    if (aliasable && this.config.enableResourcePooling) {
      const poolKey = `${(resource as any).type}-${(resource as any).format}-${(resource as any).width}x${(resource as any).height}`;

      if (!this.texturePool.has(poolKey)) {
        this.texturePool.set(poolKey, []);
      }

      const pool = this.texturePool.get(poolKey)!;
      if (pool.length < this.config.maxTexturePoolSize!) {
        pool.push(resource);
      }
    }

    this.resources.delete(logicalId);
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(): RuntimeSnapshot | null {
    return this.stateTracker?.getLatest() ?? null;
  }

  /**
   * Get snapshot history
   */
  getSnapshotHistory(): RuntimeSnapshot[] {
    return this.stateTracker?.getHistory() ?? [];
  }

  /**
   * Clear all resources and pools
   */
  clear(): void {
    this.resources.clear();
    this.texturePool.clear();
    this.stateTracker?.clear();
    this.frameCounter = 0;
  }
}

/**
 * Render Context
 *
 * Provided by executor to renderer for each job execution.
 */
export interface RenderContext {
  // Resources allocated by executor
  resources: Map<string, unknown>; // logicalId -> backend-specific texture/buffer

  // Output target
  outputResource: string;

  // Frame metadata
  frame: number;
  timestamp: number;
}

/**
 * Renderer Interface (Backend-agnostic)
 *
 * The renderer has ONE responsibility: execute render jobs.
 *
 * Not:
 * - compile
 * - plan
 * - cache
 * - validation
 * - optimization
 *
 * Those belong elsewhere.
 */
export interface Renderer {
  /**
   * Initialize the renderer
   */
  initialize(config?: unknown): Promise<void>;

  /**
   * Execute a render job
   *
   * The executor provides allocated resources.
   * The renderer just draws.
   */
  execute(job: RenderJob, context: RenderContext): Promise<ExecutionResult>;

  /**
   * Dispose the renderer
   */
  dispose(): Promise<void>;
}
