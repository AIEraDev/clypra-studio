/**
 * @clypra/runtime — Planner Types
 *
 * Defines transient planning constructs: resource requests, frame-isolated graphs, and render passes.
 */

import type { GraphNode, GraphEdge } from "./graph";

export interface ResourceRequest {
  readonly id: string;
  readonly type: "texture" | "buffer";
  readonly width: number;
  readonly height: number;
  readonly format: "rgba8" | "rgba16f" | "rgba32f" | "r8" | "depth24";
  readonly transient: boolean; // True if it can be reclaimed after the pass completes
}

export interface RenderPass {
  readonly id: string;
  readonly name: string;
  readonly shaderId: string;
  readonly inputs: readonly string[]; // Active resource IDs
  readonly output: string; // Target resource ID
  readonly uniforms: Readonly<Record<string, any>>;
  readonly blendMode?: string;
  readonly clearBeforeRender?: boolean;
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

/**
 * Planner configuration
 */
export interface PlannerConfig {
  readonly targetWidth: number;
  readonly targetHeight: number;
  readonly enableOptimizations: boolean;
  readonly allowHalfResolution: boolean;
  readonly maxTransientResources: number;
}
