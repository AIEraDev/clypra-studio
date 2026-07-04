/**
 * @clypra/runtime — Frame Graph Planner
 *
 * Converts media processing graphs into executable frame graphs.
 * Handles resource allocation, pass optimization, and execution ordering.
 */

// Re-export from @clypra-studio/types (single source of truth)
export type { FrameGraph, RenderPass, ResourceRequest, PlannerConfig } from "@clypra-studio/types";

// Keep local types file for backward compatibility (deprecated)
// @deprecated Import from @clypra-studio/types instead
export * from "./types";

// Planner and optimizer implementations
export * from "./planner";
export * from "./optimizer";
