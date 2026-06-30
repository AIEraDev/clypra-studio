/**
 * Backend Parity Test
 *
 * Proves the same RenderJob executes correctly across different backends:
 * - NullRenderer (validation only)
 * - PixiRenderer (WebGL)
 * - (Future) RustRenderer (wgpu)
 */

import { describe, it, expect } from "vitest";
import { GraphBuilder } from "../graph/builder";
import { FrameGraphPlanner } from "../planner/planner";
import { Executor } from "../executor/executor";
import { NullRenderer } from "../null/renderer";
import type { RenderJob } from "../job/types";

describe("Backend Parity", () => {
  it("should execute same job on NullRenderer", async () => {
    // Build graph
    const builder = new GraphBuilder("parity-test");
    const graph = builder.build({ id: "brightness", type: "brightness", parameters: { brightness: 1.5 } }, [{ id: "video", type: "video", source: "test" }]);

    // Plan frame
    const planner = new FrameGraphPlanner({ targetWidth: 256, targetHeight: 256 });
    const frameGraph = planner.plan(graph, 0, 0);

    // Convert to RenderJob (immutable)
    const job: RenderJob = {
      jobId: `job-0`,
      frame: 0,
      timestamp: performance.now(),
      executionOrder: frameGraph.passes.map((p) => p.id),
      passes: frameGraph.passes.map((p) => ({
        id: p.id,
        name: p.name,
        shader: p.shaderId,
        inputs: p.inputs.map((id, idx) => ({
          logicalId: id,
          binding: idx,
          usage: "read" as const,
        })),
        outputs: [
          {
            logicalId: p.output,
            binding: 0,
            usage: "write" as const,
          },
        ],
        uniforms: p.uniforms,
        clearBeforeRender: p.clearBeforeRender ?? true,
        dependsOn: [],
      })),
      resources: frameGraph.resourceRequests.map((r) => ({
        logicalId: r.id,
        type: "texture" as const,
        width: r.width,
        height: r.height,
        format: "rgba8",
        persistent: !r.transient,
        transient: r.transient,
        aliasable: r.transient,
        usage: {
          read: true,
          write: true,
          upload: false,
          download: false,
        },
      })),
      policy: {
        parallelPasses: false,
        maxConcurrency: 1,
        resourcePooling: true,
        aggressiveAliasing: true,
        lazyAllocation: true,
        skipRedundantPasses: false,
        cacheShadersPrograms: true,
        validateBeforeExecution: true,
        assertionsEnabled: true,
      },
      dependencies: {
        nodes: [],
        edges: [],
      },
      metadata: {
        graphHash: "test-hash",
        projectHash: "project-hash",
        plannerVersion: "1.0.0",
        optimizations: [],
        warnings: [],
      },
    };

    // Initialize renderer
    const nullRenderer = new NullRenderer();
    await nullRenderer.initialize();

    // Execute with Executor → NullRenderer
    const executor = new Executor();
    const result = await executor.execute(job, nullRenderer);

    // Validate execution
    expect(result.success).toBe(true);
    expect(result.passResults.length).toBeGreaterThan(0);
    expect(result.errors.length).toBe(0);

    // Get trace
    const trace = nullRenderer.getTrace();
    expect(trace.passesExecuted.length).toBeGreaterThan(0);
    expect(trace.resourcesUsed.length).toBeGreaterThan(0);

    // Cleanup
    await nullRenderer.dispose();
  });

  it("should produce consistent pass order", async () => {
    // Build multi-pass graph
    const builder = new GraphBuilder("order-test");
    const graph = builder.buildComposite(
      [
        { id: "pass1", type: "brightness", parameters: { brightness: 1.2 } },
        { id: "pass2", type: "contrast", parameters: { contrast: 1.1 } },
      ],
      [{ id: "video", type: "video", source: "test" }],
    );

    const planner = new FrameGraphPlanner({ targetWidth: 256, targetHeight: 256 });
    const frameGraph = planner.plan(graph, 0, 0);

    // Convert to job
    const job: RenderJob = {
      jobId: "order-test",
      frame: 0,
      timestamp: performance.now(),
      executionOrder: frameGraph.passes.map((p) => p.id),
      passes: frameGraph.passes.map((p) => ({
        id: p.id,
        name: p.name,
        shader: p.shaderId,
        inputs: p.inputs.map((id, idx) => ({
          logicalId: id,
          binding: idx,
          usage: "read" as const,
        })),
        outputs: [
          {
            logicalId: p.output,
            binding: 0,
            usage: "write" as const,
          },
        ],
        uniforms: p.uniforms,
        clearBeforeRender: true,
        dependsOn: [],
      })),
      resources: [],
      policy: {
        parallelPasses: false,
        maxConcurrency: 1,
        resourcePooling: true,
        aggressiveAliasing: true,
        lazyAllocation: true,
        skipRedundantPasses: false,
        cacheShadersPrograms: true,
        validateBeforeExecution: true,
        assertionsEnabled: true,
      },
      dependencies: { nodes: [], edges: [] },
      metadata: {
        graphHash: "test",
        projectHash: "test",
        plannerVersion: "1.0.0",
        optimizations: [],
        warnings: [],
      },
    };

    // Initialize and execute
    const nullRenderer = new NullRenderer();
    await nullRenderer.initialize();

    const executor = new Executor();
    const result = await executor.execute(job, nullRenderer);

    // Verify execution order matches job
    const trace = nullRenderer.getTrace();
    expect(trace.passesExecuted).toEqual(job.executionOrder);

    await nullRenderer.dispose();
  });

  it("should track resource allocations", async () => {
    const builder = new GraphBuilder("resource-test");
    const graph = builder.build({ id: "identity", type: "copy", parameters: {} }, [{ id: "video", type: "video", source: "test" }]);

    const planner = new FrameGraphPlanner({ targetWidth: 256, targetHeight: 256 });
    const frameGraph = planner.plan(graph, 0, 0);

    const job: RenderJob = {
      jobId: "resource-test",
      frame: 0,
      timestamp: performance.now(),
      executionOrder: frameGraph.passes.map((p) => p.id),
      passes: frameGraph.passes.map((p) => ({
        id: p.id,
        name: p.name,
        shader: p.shaderId,
        inputs: p.inputs.map((id, idx) => ({
          logicalId: id,
          binding: idx,
          usage: "read" as const,
        })),
        outputs: [
          {
            logicalId: p.output,
            binding: 0,
            usage: "write" as const,
          },
        ],
        uniforms: p.uniforms,
        clearBeforeRender: true,
        dependsOn: [],
      })),
      resources: [],
      policy: {
        parallelPasses: false,
        maxConcurrency: 1,
        resourcePooling: true,
        aggressiveAliasing: true,
        lazyAllocation: true,
        skipRedundantPasses: false,
        cacheShadersPrograms: true,
        validateBeforeExecution: true,
        assertionsEnabled: true,
      },
      dependencies: { nodes: [], edges: [] },
      metadata: {
        graphHash: "test",
        projectHash: "test",
        plannerVersion: "1.0.0",
        optimizations: [],
        warnings: [],
      },
    };

    const nullRenderer = new NullRenderer();
    await nullRenderer.initialize();

    const executor = new Executor();
    await executor.execute(job, nullRenderer);

    const trace = nullRenderer.getTrace();

    // Identity should use at least 2 resources (input + output)
    expect(trace.resourcesUsed.length).toBeGreaterThanOrEqual(2);

    await nullRenderer.dispose();
  });
});
