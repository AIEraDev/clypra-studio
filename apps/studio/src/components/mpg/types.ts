/**
 * MPG Playground — shared types for V2 filter design lab
 */

export interface StackNode {
  id: string;
  type: string;
  params: Record<string, unknown>;
}

export interface SourceMedia {
  id: string;
  name: string;
  url: string;
  kind: "image";
  /** blob URLs need revoke on cleanup */
  isCustom?: boolean;
}

export interface EffectPreset {
  id: string;
  name: string;
  description?: string;
  effects: Array<{ type: string; params: Record<string, unknown> }>;
}

export type LeftTab = "stack" | "presets" | "generate" | "source";
export type RightTab = "params" | "pipeline" | "publish";

export interface PublishFormState {
  name: string;
  description: string;
  category: string;
  tags: string;
  intensityDefault: number;
  published: boolean;
}
