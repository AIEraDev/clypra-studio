/**
 * @clypra/runtime
 *
 * Shared runtime infrastructure for all Clypra Studio Labs.
 * This package contains the core execution engine used by Video Lab, Transition Lab, and Body Lab.
 */

// Graph building
export * from "./graph";

// Frame planning
export * from "./planner";

// Pixi rendering backend
export * from "./pixi";

// Resource management
export * from "./resources";

// Runtime validation
export * from "./validation";

// Testing & Publishing (Phase 6)
export * from "./testing/goldenTests";
export * from "./testing/benchmarkRunner";
export { validateEffect, EffectValidator, type ValidationResult, type EffectDefinition } from "./validation/effectValidator";

export const RUNTIME_VERSION = "1.0.0";
