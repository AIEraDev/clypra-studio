/**
 * @clypra-studio/types — Effect Type Definitions
 *
 * Single source of truth for all effect-related types across the Clypra ecosystem.
 */

/**
 * Base effect definition
 */
export interface EffectDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly parameters: Record<string, unknown>;
}

/**
 * Effect instance in a project/timeline
 */
export interface EffectInstance {
  readonly id: string;
  readonly effectId: string;
  readonly type: string;
  readonly parameters: Record<string, unknown>;
  readonly enabled: boolean;
}

/**
 * Effect capabilities (what the effect can do)
 */
export interface EffectCapabilities {
  readonly temporal: boolean;
  readonly stateful: boolean;
  readonly requiresFrameHistory: number;
  readonly requiresGPU: boolean;
}

/**
 * Effect requirements (what the effect needs)
 */
export interface EffectRequirements {
  readonly temporalRadius: number;
  readonly preferredPrecision: "fp8" | "fp16" | "fp32";
  readonly minTextureSize: number;
  readonly maxTextureSize: number;
}

/**
 * Effect performance profile
 */
export interface EffectProfile {
  readonly gpuCost: number; // 1-10 scale
  readonly memoryCost: number; // VRAM usage index
  readonly cpuCost: number; // CPU overhead
  readonly complexity: "low" | "medium" | "high" | "extreme";
}

/**
 * Effect metadata for UI and registry
 */
export interface EffectMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly thumbnailUrl?: string;
  readonly capabilities: EffectCapabilities;
  readonly profile: EffectProfile;
}

/**
 * Effect preset (pre-configured effect for users)
 */
export interface EffectPreset {
  readonly id: string;
  readonly effectId: string;
  readonly name: string;
  readonly description?: string;
  readonly parameters: Record<string, unknown>;
  readonly thumbnailUrl?: string;
}

/**
 * Applied effect on a clip (used in timeline)
 */
export interface AppliedEffect {
  readonly id: string;
  readonly effectId: string;
  readonly presetId?: string;
  readonly parameters: Record<string, unknown>;
  readonly enabled: boolean;
  readonly startTime: number;
  readonly duration: number;
}

/**
 * Effect parameters (common parameter types)
 */
export interface EffectParameters {
  // Common parameters
  intensity?: number; // 0-100
  opacity?: number; // 0-100
  blend?: string; // Blend mode

  // Color parameters
  color?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;

  // Blur/filter parameters
  blur?: number;
  radius?: number;
  threshold?: number;

  // Transform parameters
  scale?: number;
  rotation?: number;
  x?: number;
  y?: number;

  // Timing parameters
  speed?: number;
  delay?: number;
  duration?: number;

  // Advanced parameters
  [key: string]: unknown;
}

/**
 * Effect validation result
 */
export interface EffectValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Effect category for organization
 */
export interface EffectCategory {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly icon?: string;
  readonly order: number;
}

/**
 * Effect manifest (collection of effects)
 */
export interface EffectManifest {
  readonly version: string;
  readonly categories: readonly EffectCategory[];
  readonly effects: readonly EffectMetadata[];
  readonly presets: readonly EffectPreset[];
}
