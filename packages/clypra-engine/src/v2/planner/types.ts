/**
 * @clypra-studio/engine — Pipeline V2: Render Planner Definitions
 *
 * @deprecated This file has been superseded by @clypra/runtime/planner/types
 * Import from @clypra/runtime instead:
 * ```ts
 * import type { FrameGraph, ResourceRequest, RenderPass } from "@clypra/runtime/planner";
 * ```
 * Note: Runtime version includes additional properties (blendMode, clearBeforeRender, PlannerConfig)
 * This file will be removed in v3.0.0
 *
 * Defines transient planning constructs: resource requests, frame-isolated graphs, and render passes.
 */

import type { GraphNode, GraphEdge } from "@clypra-studio/types";

export interface ResourceRequest {
  readonly id: string;
  readonly type: "texture" | "buffer";
  readonly width: number;
  readonly height: number;
  readonly format: "rgba8" | "rgba16f" | "rgba32f" | "r8";
  readonly transient: boolean; // True if it can be reclaimed after the pass completes
}

export interface RenderPass {
  readonly id: string;
  readonly name: string;
  readonly shaderId: string;
  readonly inputs: readonly string[]; // Active resource IDs
  readonly output: string; // Target resource ID
  readonly uniforms: Readonly<Record<string, any>>;
}

/**
 * A flattened, active graph containing only nodes contributing to a specific frame.
 */
export interface FrameGraph {
  readonly frameNumber: number;
  readonly timelineTimeMs: number;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly resourceRequests: readonly ResourceRequest[];
  readonly passes: readonly RenderPass[];
}

export interface DependencyGraph {
  readonly executionOrder: readonly string[]; // Topologically sorted list of node IDs
  readonly readDependencies: Readonly<Record<string, readonly string[]>>; // nodeId -> list of input resource IDs
  readonly writeDependencies: Readonly<Record<string, string>>; // nodeId -> output resource ID
}
