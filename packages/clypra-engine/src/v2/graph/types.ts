/**
 * @clypra/engine — Pipeline V2: Graph Definitions
 *
 * @deprecated Import from @clypra-studio/types instead
 * This file re-exports from @clypra-studio/types for backward compatibility.
 */

// Re-export from @clypra-studio/types (single source of truth)
export type { NodeLifecycleState, GraphDataType, GraphValue, NodeCapabilities, NodeRequirements, GraphPin, GraphNode, GraphEdge, MediaProcessingGraph } from "@clypra-studio/types";
export { GraphHelper } from "@clypra-studio/types";

// Legacy aliases for backward compatibility
/** @deprecated Use NodeCapabilities from @clypra-studio/types instead */
export type { NodeCapabilities as EffectCapabilities } from "@clypra-studio/types";
/** @deprecated Use NodeRequirements from @clypra-studio/types instead */
export type { NodeRequirements as EffectRequirements } from "@clypra-studio/types";
