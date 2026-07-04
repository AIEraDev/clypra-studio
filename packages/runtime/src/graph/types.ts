/**
 * @clypra/runtime — Graph Types (Re-exports from @clypra-studio/types)
 *
 * This file re-exports the canonical graph types from @clypra-studio/types.
 * All new code should import directly from @clypra-studio/types instead.
 *
 * @deprecated Import from '@clypra-studio/types' instead
 */

export type { NodeLifecycleState, GraphDataType, GraphValue, NodeCapabilities, NodeRequirements, GraphPin, GraphNode, GraphEdge, MediaProcessingGraph } from "@clypra-studio/types";

export { GraphHelper } from "@clypra-studio/types";

// Legacy aliases for backward compatibility
export type { NodeCapabilities as EffectCapabilities, NodeRequirements as EffectRequirements } from "@clypra-studio/types";
