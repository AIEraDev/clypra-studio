/**
 * @clypra/engine — Pipeline V2: Runtime Definitions
 *
 * @deprecated These types are interfaces only. Full implementations exist in @clypra/runtime
 * Import from @clypra/runtime instead:
 * ```ts
 * import { PixiRenderer, NullRenderer, Executor } from "@clypra/runtime/renderer";
 * ```
 * This file will be removed in v3.0.0
 *
 * Defines execution-specific layers: policies, backends, and command buffers.
 */

import type { RenderPass } from "../planner/types";

export type ExecutionQuality = "draft" | "preview" | "export";
export type PlaybackMode = "play" | "seek";
export type PlaybackDirection = "forward" | "reverse";

export interface ExecutionPolicy {
  readonly quality: ExecutionQuality;
  readonly playbackMode: PlaybackMode;
  readonly direction: PlaybackDirection;
  readonly targetFps: number;
}

export interface Command {
  readonly op: "bind_texture" | "bind_uniforms" | "draw" | "copy" | "clear";
  readonly resourceId?: string;
  readonly params?: Readonly<Record<string, any>>;
}

export interface CommandBuffer {
  readonly frameNumber: number;
  readonly passes: readonly {
    readonly pass: RenderPass;
    readonly commands: readonly Command[];
  }[];
}

export interface RenderBackend {
  /** Initialize connection to physical GPU queue/canvas */
  init(canvasElement?: HTMLCanvasElement): Promise<void>;
  /** Allocate physical textures or buffers */
  allocateResource(id: string, type: "texture" | "buffer", width: number, height: number, format: string): void;
  /** Release physical textures or buffers */
  releaseResource(id: string): void;
  /** Compile static shader kernels */
  compileShader(shaderId: string, sourceGLSLOrWGSL: string): void;
  /** Execute command buffer queue */
  submit(commandBuffer: CommandBuffer): Promise<void>;
  /** Retrieve pixel buffer from target texture */
  readPixels(resourceId: string): Promise<Uint8Array>;
  /** Release all allocated memory */
  destroy(): void;
}
