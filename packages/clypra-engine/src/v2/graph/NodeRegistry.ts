/**
 * @clypra/engine — Pipeline V2: Node Registry
 *
 * Implements a dynamic registry pattern to load, hold, and retrieve effect and processing node definitions.
 * Eliminates hardcoded string checks in the compiler and planner by providing a centralized capability lookup.
 */

import type { EffectCapabilities, EffectRequirements, GraphPin, GraphDataType } from "./types";

export interface NodeDefinition {
  readonly type: string;
  readonly name: string;
  readonly description: string;
  readonly version: number;
  readonly capabilities: EffectCapabilities;
  readonly requirements: EffectRequirements;
  readonly inputs: readonly GraphPin[];
  readonly outputs: readonly GraphPin[];
  readonly defaultParams: Readonly<Record<string, any>>;
  readonly paramSchema?: Readonly<Record<string, { type: string; min?: number; max?: number; default?: any }>>;
}

export interface ExecutionPlanner {
  /**
   * Plans how a node should be translated into render passes.
   * Returns an array of partial pass definitions (shaderId, uniforms logic, etc.)
   */
  planExecution(
    nodeId: string,
    nodeType: string,
    params: Readonly<Record<string, any>>,
    inputResourceIds: readonly string[],
    outputResourceId: string,
    viewportWidth: number,
    viewportHeight: number,
  ): Array<{
    shaderId: string;
    name: string;
    inputs: readonly string[];
    output: string;
    uniforms: Readonly<Record<string, any>>;
    intermediateResources?: Array<{
      id: string;
      type: "texture" | "buffer";
      width: number;
      height: number;
      format: string;
      transient: boolean;
    }>;
  }>;
}

export class NodeRegistry {
  private definitions = new Map<string, NodeDefinition>();
  private planners = new Map<string, ExecutionPlanner>();

  /**
   * Registers a new node type with its definition and execution planner.
   */
  register(definition: NodeDefinition, planner: ExecutionPlanner): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(`Node type "${definition.type}" is already registered`);
    }
    this.definitions.set(definition.type, definition);
    this.planners.set(definition.type, planner);
  }

  /**
   * Retrieves the definition for a node type.
   */
  getDefinition(type: string): NodeDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * Retrieves the execution planner for a node type.
   */
  getPlanner(type: string): ExecutionPlanner | undefined {
    return this.planners.get(type);
  }

  /**
   * Checks if a node type is registered.
   */
  has(type: string): boolean {
    return this.definitions.has(type);
  }

  /**
   * Returns all registered node types.
   */
  getAllTypes(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Returns all registered node definitions.
   */
  getAllDefinitions(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Creates a default registry with built-in node types pre-registered.
   */
  static createDefault(): NodeRegistry {
    const registry = new NodeRegistry();

    // Register TrackSourceManager
    registry.register(
      {
        type: "TrackSourceManager",
        name: "Track Source Manager",
        description: "Manages clip activation and source frame reading",
        version: 1,
        capabilities: {
          temporal: false,
          stateful: false,
          spatial: false,
          geometry: false,
          inputsCount: 0,
        },
        requirements: {
          temporalRadius: 0,
          preferredPrecision: "fp16",
          multipass: false,
          supportsHalfResolution: true,
        },
        inputs: [],
        outputs: [{ id: "output", name: "Color Out", type: "Texture" }],
        defaultParams: { clips: [] },
      },
      {
        planExecution(nodeId, nodeType, params, inputs, output, width, height) {
          return [
            {
              shaderId: "blit-source",
              name: "Read Track Source Frame",
              inputs: [],
              output,
              uniforms: { timeMs: params.timeMs || 0 },
            },
          ];
        },
      },
    );

    // Register OutputNode
    registry.register(
      {
        type: "OutputNode",
        name: "Output Node",
        description: "Final composition output",
        version: 1,
        capabilities: {
          temporal: false,
          stateful: false,
          spatial: false,
          geometry: false,
          inputsCount: 1,
        },
        requirements: {
          temporalRadius: 0,
          preferredPrecision: "fp16",
          multipass: false,
          supportsHalfResolution: true,
        },
        inputs: [{ id: "input", name: "Final Color", type: "Texture" }],
        outputs: [],
        defaultParams: {},
      },
      {
        planExecution(nodeId, nodeType, params, inputs, output, width, height) {
          return [
            {
              shaderId: "copy",
              name: "Blit to Output",
              inputs,
              output,
              uniforms: {},
            },
          ];
        },
      },
    );

    // Register GaussianBlur
    registry.register(
      {
        type: "GaussianBlur",
        name: "Gaussian Blur",
        description: "Two-pass separable Gaussian blur filter",
        version: 1,
        capabilities: {
          temporal: false,
          stateful: false,
          spatial: true,
          geometry: false,
          inputsCount: 1,
        },
        requirements: {
          temporalRadius: 0,
          preferredPrecision: "fp16",
          multipass: true,
          supportsHalfResolution: true,
        },
        inputs: [{ id: "input", name: "Color Input", type: "Texture" }],
        outputs: [{ id: "output", name: "Color Output", type: "Texture" }],
        defaultParams: { blur: 8.0 },
        paramSchema: {
          blur: { type: "number", min: 0, max: 100, default: 8.0 },
        },
      },
      {
        planExecution(nodeId, nodeType, params, inputs, output, width, height) {
          const blurTempH = `res-temp-h-${nodeId}`;
          return [
            {
              shaderId: "gaussian-blur-h",
              name: "Gaussian Blur Horizontal",
              inputs,
              output: blurTempH,
              uniforms: { uBlurStrength: params.blur || 8.0 },
              intermediateResources: [
                {
                  id: blurTempH,
                  type: "texture",
                  width,
                  height,
                  format: "rgba16f",
                  transient: true,
                },
              ],
            },
            {
              shaderId: "gaussian-blur-v",
              name: "Gaussian Blur Vertical",
              inputs: [blurTempH],
              output,
              uniforms: { uBlurStrength: params.blur || 8.0 },
            },
          ];
        },
      },
    );

    // Register Brightness
    registry.register(
      {
        type: "Brightness",
        name: "Brightness",
        description: "Adjusts image brightness",
        version: 1,
        capabilities: {
          temporal: false,
          stateful: false,
          spatial: false,
          geometry: false,
          inputsCount: 1,
        },
        requirements: {
          temporalRadius: 0,
          preferredPrecision: "fp8",
          multipass: false,
          supportsHalfResolution: true,
        },
        inputs: [{ id: "input", name: "Color Input", type: "Texture" }],
        outputs: [{ id: "output", name: "Color Output", type: "Texture" }],
        defaultParams: { brightness: 0.0 },
        paramSchema: {
          brightness: { type: "number", min: -1, max: 1, default: 0.0 },
        },
      },
      {
        planExecution(nodeId, nodeType, params, inputs, output, width, height) {
          return [
            {
              shaderId: "brightness",
              name: "Apply Brightness",
              inputs,
              output,
              uniforms: params,
            },
          ];
        },
      },
    );

    // Register Contrast
    registry.register(
      {
        type: "Contrast",
        name: "Contrast",
        description: "Adjusts image contrast",
        version: 1,
        capabilities: {
          temporal: false,
          stateful: false,
          spatial: false,
          geometry: false,
          inputsCount: 1,
        },
        requirements: {
          temporalRadius: 0,
          preferredPrecision: "fp8",
          multipass: false,
          supportsHalfResolution: true,
        },
        inputs: [{ id: "input", name: "Color Input", type: "Texture" }],
        outputs: [{ id: "output", name: "Color Output", type: "Texture" }],
        defaultParams: { contrast: 0.0 },
        paramSchema: {
          contrast: { type: "number", min: -1, max: 1, default: 0.0 },
        },
      },
      {
        planExecution(nodeId, nodeType, params, inputs, output, width, height) {
          return [
            {
              shaderId: "contrast",
              name: "Apply Contrast",
              inputs,
              output,
              uniforms: params,
            },
          ];
        },
      },
    );

    // Register AlphaBlend
    registry.register(
      {
        type: "AlphaBlend",
        name: "Alpha Blend",
        description: "Blends two layers with alpha compositing",
        version: 1,
        capabilities: {
          temporal: false,
          stateful: false,
          spatial: false,
          geometry: false,
          inputsCount: 2,
        },
        requirements: {
          temporalRadius: 0,
          preferredPrecision: "fp16",
          multipass: false,
          supportsHalfResolution: true,
        },
        inputs: [
          { id: "base", name: "Base layer", type: "Texture" },
          { id: "over", name: "Overlay layer", type: "Texture" },
        ],
        outputs: [{ id: "output", name: "Blended Output", type: "Texture" }],
        defaultParams: { blendMode: "normal", opacity: 1.0 },
        paramSchema: {
          opacity: { type: "number", min: 0, max: 1, default: 1.0 },
        },
      },
      {
        planExecution(nodeId, nodeType, params, inputs, output, width, height) {
          return [
            {
              shaderId: "blend-normal",
              name: "Blend Layers",
              inputs,
              output,
              uniforms: { opacity: params.opacity ?? 1.0 },
            },
          ];
        },
      },
    );

    // Register MotionBlur
    registry.register(
      {
        type: "MotionBlur",
        name: "Motion Blur",
        description: "Applies temporal motion blur effect",
        version: 1,
        capabilities: {
          temporal: true,
          stateful: false,
          spatial: true,
          geometry: false,
          inputsCount: 1,
        },
        requirements: {
          temporalRadius: 3,
          preferredPrecision: "fp16",
          multipass: false,
          supportsHalfResolution: false,
        },
        inputs: [{ id: "input", name: "Color Input", type: "Texture" }],
        outputs: [{ id: "output", name: "Color Output", type: "Texture" }],
        defaultParams: { samples: 8, strength: 1.0 },
        paramSchema: {
          samples: { type: "number", min: 2, max: 32, default: 8 },
          strength: { type: "number", min: 0, max: 2, default: 1.0 },
        },
      },
      {
        planExecution(nodeId, nodeType, params, inputs, output, width, height) {
          return [
            {
              shaderId: "motion-blur",
              name: "Apply Motion Blur",
              inputs,
              output,
              uniforms: params,
            },
          ];
        },
      },
    );

    return registry;
  }
}
