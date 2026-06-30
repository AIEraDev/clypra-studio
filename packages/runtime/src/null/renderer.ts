/**
 * @clypra/runtime — Null Renderer
 *
 * Headless renderer that validates execution without GPU.
 * Same RenderJob → ExecutionResult interface.
 */

import type { RenderJob, ExecutionResult, PassExecutionResult } from "../job/types";
import type { Renderer, RenderContext } from "../executor/executor";

/**
 * Null Renderer
 *
 * Validates graph execution, scheduling, resource planning,
 * cache reuse, aliasing, and optimization without any GPU.
 */
export class NullRenderer implements Renderer {
  private initialized = false;
  private passesExecuted: string[] = [];
  private resourcesUsed = new Set<string>();
  private textureBinds = 0;
  private drawCalls = 0;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async execute(job: RenderJob, context: RenderContext): Promise<ExecutionResult> {
    if (!this.initialized) {
      throw new Error("NullRenderer not initialized");
    }

    const startTime = performance.now();
    const passResults: PassExecutionResult[] = [];

    // Reset tracking
    this.passesExecuted = [];
    this.resourcesUsed.clear();
    this.textureBinds = 0;
    this.drawCalls = 0;

    // Execute passes in order
    for (const passId of job.executionOrder) {
      const pass = job.passes.find((p) => p.id === passId);
      if (!pass) {
        passResults.push({
          passId,
          duration: 0,
          drawCalls: 0,
          textureBinds: 0,
          uniformUpdates: 0,
          success: false,
          error: `Pass ${passId} not found`,
        });
        continue;
      }

      const passStart = performance.now();

      // Track pass execution
      this.passesExecuted.push(pass.id);
      this.drawCalls++;

      // Track texture binds
      this.textureBinds += pass.inputs.length;

      // Track resources used
      for (const input of pass.inputs) {
        this.resourcesUsed.add(input.logicalId);
      }
      for (const output of pass.outputs) {
        this.resourcesUsed.add(output.logicalId);
      }

      // Simulate minimal work
      await new Promise((resolve) => setTimeout(resolve, 0));

      passResults.push({
        passId: pass.id,
        duration: performance.now() - passStart,
        drawCalls: 1,
        textureBinds: pass.inputs.length,
        uniformUpdates: Object.keys(pass.uniforms).length,
        success: true,
      });
    }

    const duration = performance.now() - startTime;

    return {
      jobId: job.jobId,
      frame: job.frame,
      success: true,
      duration,
      passResults,
      resourceUsage: {
        allocated: 0, // Executor tracks this
        reused: 0,
        released: 0,
        peakMemory: 0,
        details: [],
      },
      cacheStats: {
        texturePoolHits: 0,
        texturePoolMisses: 0,
        shaderCacheHits: 0,
        shaderCacheMisses: 0,
      },
      outputTexture: this.getOutput(),
      errors: [],
      warnings: [],
    };
  }

  async dispose(): Promise<void> {
    this.passesExecuted = [];
    this.resourcesUsed.clear();
    this.textureBinds = 0;
    this.drawCalls = 0;
    this.initialized = false;
  }

  /**
   * Get output (for validation)
   */
  private getOutput(): unknown {
    return {
      type: "null",
      passesExecuted: this.passesExecuted.length,
      resourcesUsed: this.resourcesUsed.size,
      textureBinds: this.textureBinds,
      drawCalls: this.drawCalls,
    };
  }

  /**
   * Get execution trace (for testing)
   */
  getTrace(): ExecutionTrace {
    return {
      passesExecuted: [...this.passesExecuted],
      resourcesUsed: Array.from(this.resourcesUsed),
      textureBinds: this.textureBinds,
      drawCalls: this.drawCalls,
    };
  }
}

export interface ExecutionTrace {
  passesExecuted: string[];
  resourcesUsed: string[];
  textureBinds: number;
  drawCalls: number;
}
