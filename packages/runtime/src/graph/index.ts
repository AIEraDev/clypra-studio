/**
 * Graph Builder - Media Processing Graph Construction
 *
 * This module handles the construction of media processing graphs from effect definitions.
 * It is responsible for:
 * - Building node trees from effect compositions
 * - Validating graph structure
 * - Resolving dependencies
 * - Capability tracking
 */

// Re-export from @clypra/types (single source of truth)
export type { GraphNode, GraphEdge, NodeLifecycleState, MediaProcessingGraph, GraphDataType, GraphValue, GraphPin, EffectCapabilities, EffectRequirements } from "@clypra/types";
export { GraphHelper } from "@clypra/types";

// Keep local types file for backward compatibility (deprecated)
// @deprecated Import from @clypra/types instead
export * from "./types";

// Graph builder and validator implementations
export * from "./builder";
export * from "./validator";
