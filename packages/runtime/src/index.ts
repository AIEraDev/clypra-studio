/**
 * @clypra/runtime
 *
 * Shared runtime infrastructure for all Clypra Studio Labs.
 * This package contains the core execution engine used by Video Lab, Transition Lab, and Body Lab.
 *
 * @packageDocumentation
 */

// Graph building
export * from "./graph";

// Project model (NLE timeline structure)
export * from "./project";

// Project compiler (converts NLE projects to graphs)
export * from "./compiler";

// Frame planning
export * from "./planner";

// Render jobs (immutable execution plans)
export * from "./job";

// Execution
export * from "./executor";

// Runtime snapshots (state, not events)
export * from "./state";

// Renderers
export * from "./pixi";
export * from "./null";

// Resource management
export * from "./resources";

// Runtime validation
export * from "./validation";

// Telemetry (event-oriented, complementary to state)
export * from "./telemetry";

// Testing & Publishing (Phase 6)
export * from "./testing/goldenTests";
export * from "./testing/benchmarkRunner";
export { validateEffect, EffectValidator, type ValidationResult, type EffectDefinition } from "./validation/effectValidator";

export const RUNTIME_VERSION = "1.0.0";
