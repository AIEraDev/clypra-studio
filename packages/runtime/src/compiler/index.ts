/**
 * @clypra/runtime — Project Compiler
 *
 * Compiles NLE project manifests into executable MediaProcessingGraphs.
 */

export * from "./compiler";

// Effect Graph Compiler for Video Lab
export { EffectGraphCompiler } from "./effect-compiler";
export type { VideoEffectDefinition } from "./effect-compiler";
