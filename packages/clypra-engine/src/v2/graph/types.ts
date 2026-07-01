/**
 * @clypra/engine — Pipeline V2: Graph Definitions
 *
 * @deprecated Import from @clypra/types instead
 * This file re-exports from @clypra/types for backward compatibility.
 */

// Re-export from @clypra/types (single source of truth)
export type { NodeLifecycleState, GraphDataType, GraphValue, NodeCapabilities, NodeRequirements, GraphPin, GraphNode, GraphEdge, MediaProcessingGraph } from "@clypra/types";
export { GraphHelper } from "@clypra/types";

// Legacy aliases for backward compatibility
/** @deprecated Use NodeCapabilities from @clypra/types instead */
export type { NodeCapabilities as EffectCapabilities } from "@clypra/types";
/** @deprecated Use NodeRequirements from @clypra/types instead */
export type { NodeRequirements as EffectRequirements } from "@clypra/types";
