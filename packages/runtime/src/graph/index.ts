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

// Re-export from @clypra-studio/types (single source of truth)
export type { GraphNode, GraphEdge, NodeLifecycleState, MediaProcessingGraph, GraphDataType, GraphValue, GraphPin, NodeCapabilities, NodeRequirements } from "@clypra-studio/types";
export { GraphHelper } from "@clypra-studio/types";

// Legacy aliases for backward compatibility
/** @deprecated Use NodeCapabilities from @clypra-studio/types instead */
export type { NodeCapabilities as EffectCapabilities } from "@clypra-studio/types";
/** @deprecated Use NodeRequirements from @clypra-studio/types instead */
export type { NodeRequirements as EffectRequirements } from "@clypra-studio/types";

// Keep local types file for backward compatibility (deprecated)
// @deprecated Import from @clypra-studio/types instead
export * from "./types";

// Graph builder and validator implementations
export * from "./builder";
export * from "./validator";

// Node registry for dynamic effect lookup
export * from "./NodeRegistry";
