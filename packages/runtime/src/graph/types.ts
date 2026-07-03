/**
 * @clypra/runtime — Graph Types (Re-exports from @clypra/types)
 *
 * This file re-exports the canonical graph types from @clypra/types.
 * All new code should import directly from @clypra/types instead.
 *
 * @deprecated Import from '@clypra/types' instead
 */

export type { NodeLifecycleState, GraphDataType, GraphValue, NodeCapabilities, NodeRequirements, GraphPin, GraphNode, GraphEdge, MediaProcessingGraph } from "@clypra/types";

export { GraphHelper } from "@clypra/types";

// Legacy aliases for backward compatibility
export type { NodeCapabilities as EffectCapabilities, NodeRequirements as EffectRequirements } from "@clypra/types";
