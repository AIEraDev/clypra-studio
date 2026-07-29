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

// ==========================================
// DAG Abstract Syntax Graph (AST) Types
// ==========================================

export type DataType = "f32" | "vec2f" | "vec3f" | "vec4f" | "texture_2d<f32>";

export interface NodePin {
  readonly id: string;
  readonly label: string;
  readonly type: DataType;
}

export interface ShaderNodeUniformSpec {
  readonly type: DataType;
  readonly defaultValue: any;
  readonly min?: number;
  readonly max?: number;
}

export interface ShaderNode {
  readonly id: string;
  readonly type: string;
  readonly inputs: readonly NodePin[];
  readonly outputs: readonly NodePin[];
  readonly uniforms?: Record<string, ShaderNodeUniformSpec>;
  readonly generateCode: (inputs: Record<string, string>, uniforms: Record<string, string>) => string;
}

export interface GraphConnection {
  readonly fromNodeId: string;
  readonly fromPinId: string;
  readonly toNodeId: string;
  readonly toPinId: string;
}

export interface NodeGraph {
  readonly nodes: readonly ShaderNode[];
  readonly connections: readonly GraphConnection[];
  readonly outputNodeId: string; // Terminal node (e.g., Render Target Output)
}

export interface CompilationResult {
  readonly wgslCode: string;
  readonly uniformsLayout: Array<{ name: string; type: DataType }>;
}

// ==========================================
// Keyframe Interpolation & Animation Engine Types
// ==========================================

export type EasingMode = "hold" | "linear" | "cubic-bezier";

export interface Keyframe {
  readonly time: number;          // Timestamp in seconds
  readonly value: number | number[]; // Value or multi-channel array
  readonly easing: EasingMode;
  readonly controlPoints?: [number, number, number, number]; // Cubic Bezier handles [x1, y1, x2, y2]
}

export interface AnimatedProperty {
  readonly id: string;
  readonly type: "float" | "vec2f" | "vec3f" | "vec4f";
  readonly defaultValue: number | number[];
  readonly keyframes: readonly Keyframe[];
}

export type FrequencyBand = "bass" | "mids" | "treble" | "custom";

export interface AudioBinding {
  readonly propertyId: string;         // Target parameter (e.g. "u_sat_01_amount")
  readonly band: FrequencyBand;
  readonly customFreqRange?: [number, number]; // e.g. [20, 250] Hz for Sub-Bass
  readonly sensitivity: number;        // Multiplier scale for audio reactivity
  readonly minThreshold: number;       // Noise floor (ignore values below this 0-1)
  readonly smoothing: number;          // Attack/Release smoothing (0.0 = raw, 0.9 = heavy lag)
  readonly blendMode: "add" | "multiply" | "override"; // How audio combines with keyframe values
}

export interface BakedFrameSpectrum {
  readonly frameIndex: number;
  readonly timestamp: number;
  readonly bass: number;     // 20 - 250 Hz
  readonly mids: number;     // 250 - 4000 Hz
  readonly treble: number;   // 4000 - 20000 Hz
  readonly rawBins: Float32Array; // Full FFT magnitude spectrum
}

export type HandleMode = "aligned" | "mirrored" | "broken";

export interface KeyframePoint {
  readonly id: string;
  readonly time: number;  // X-axis (Seconds)
  readonly value: number; // Y-axis (Parameter Value)
  readonly easing: "linear" | "cubic-bezier" | "hold";
  readonly handleMode?: HandleMode; // Default: 'aligned'
  readonly handleIn?: { dt: number; dv: number };
  readonly handleOut?: { dt: number; dv: number };
}

export interface TimelineViewport {
  readonly scrollX: number; // Viewport start time (seconds)
  readonly zoomX: number;   // Pixels per second
  readonly scrollY: number; // Viewport center value
  readonly zoomY: number;   // Pixels per unit value
}




