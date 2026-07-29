/// <reference types="@webgpu/types" />

/**
 * @clypra-studio/types — Portable .vefx Intermediate JSON Specification Standard & Plugin Bridge Contracts
 */

/**
 * Exposed Input Parameter Type
 */
export type VefxInputType = "float" | "int" | "boolean" | "color" | "vec2" | "vec3f" | "vec4f" | "select" | "texture";

/**
 * Option for select-type exposed inputs
 */
export interface VefxInputOption {
  readonly label: string;
  readonly value: string | number;
}

/**
 * Exposed Input definition in a .vefx effect
 */
export interface VefxExposedInput {
  readonly id: string;
  readonly label: string;
  readonly type: VefxInputType;
  readonly default: number | boolean | string | readonly number[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly keyframable?: boolean;
  readonly options?: readonly VefxInputOption[];
}

/**
 * Node definition in a .vefx node graph
 */
export interface VefxNode {
  readonly id: string;
  readonly type: "textureInput" | "textureOutput" | "wgslPass" | "lutPass" | "blendPass" | string;
  readonly label: string;
  readonly wgsl?: string;
  readonly params?: Record<string, unknown>;
  readonly inputs?: Record<string, string>;
  readonly outputs?: Record<string, string>;
}

/**
 * Connection between nodes in a .vefx graph
 */
export interface VefxConnection {
  readonly from: string;
  readonly outputPin: string;
  readonly to: string;
  readonly inputPin: string;
}

/**
 * Graph structure in a .vefx spec
 */
export interface VefxGraph {
  readonly nodes: readonly VefxNode[];
  readonly connections: readonly VefxConnection[];
}

/**
 * Intermediate JSON Specification Standard (.vefx)
 */
export interface VefxEffectSpec {
  readonly $schema?: string;
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author?: string;
  readonly category?: string;
  readonly description?: string;
  readonly exposedInputs: readonly VefxExposedInput[];
  readonly graph: VefxGraph;
}

// ==========================================
// Plugin Bridge API Contracts
// ==========================================

export interface FrameContext {
  readonly currentTime: number;          // In seconds (e.g., 12.45)
  readonly frameIndex: number;           // Target frame number
  readonly timecode: string;             // "00:00:12:11"
  readonly resolution: [number, number]; // [1920, 1080]
  readonly sampleRate: number;           // e.g., 60 FPS
}

export interface RenderTarget {
  readonly inputTexture: GPUTexture;     // Video frame decoded by Host Editor
  readonly outputTexture: GPUTexture;    // Canvas target for host preview/export
  readonly device: GPUDevice;            // Host's shared WebGPU context
}

export type ParameterValues = Record<string, number | boolean | string | number[]>;

export interface ClypraPluginEngineConfig {
  readonly runtime: "webgpu" | "webgl2" | "wasm";
  readonly entryPoint?: string;
}

export interface ClypraPluginManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: "color" | "blur" | "stylize" | "keying" | "utility" | string;
  readonly engine: ClypraPluginEngineConfig;
  readonly parameters: readonly VefxExposedInput[];
}

export interface ClypraVideoPlugin {
  manifest: ClypraPluginManifest;
  onInit(device: GPUDevice): Promise<void>;
  onUpdateParameters(params: ParameterValues): void;
  render(
    commandEncoder: GPUCommandEncoder,
    target: RenderTarget,
    context: FrameContext
  ): void;
  onDestroy(): void;
}

// IPC Protocol Message Contracts
export type PluginIPCMessageType = "HOST_INIT_PLUGIN" | "HOST_PARAM_CHANGE" | "HOST_RENDER_FRAME" | "PLUGIN_ERROR";

export interface PluginIPCMessage<T = unknown> {
  readonly type: PluginIPCMessageType;
  readonly payload: T;
  readonly timestamp?: number;
}
