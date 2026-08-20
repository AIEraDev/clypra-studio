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
export * from "./null";

// Resource management
export * from "./resources";

// Telemetry (event-oriented, complementary to state)
export * from "./telemetry";

// WebGPU execution pipeline
export * from "./webgpu";

// Host Plugin Bridge & SDK
export * from "./bridge";

// Keyframe Interpolation & Animation Engine
export * from "./keyframe";

// Built-in Shader Node Templates
export * from "./nodes";

// Audio Spectrum Binding Engine
export * from "./audio";

// Testing & Publishing (Phase 6)
export * from "./testing/goldenTests";
export * from "./testing/benchmarkRunner";
export { validateEffect, EffectValidator, type ValidationResult, type EffectDefinition } from "./validation/effectValidator";

export const RUNTIME_VERSION = "0.1.0";
