/// <reference types="@webgpu/types" />

import type {
  ClypraVideoPlugin,
  ClypraPluginManifest,
  RenderTarget,
  FrameContext,
  ParameterValues,
  VefxEffectSpec,
} from "@clypra-studio/types";
import { EffectPipelineEngine } from "../webgpu/EffectPipelineEngine";
import { VefxCompiler } from "../compiler/vefx-compiler";

export class ClypraPluginBridge implements ClypraVideoPlugin {
  public manifest: ClypraPluginManifest;
  private engine: EffectPipelineEngine;
  private parameters: ParameterValues = {};
  private wgslCode: string;
  private uniformSize: number;

  constructor(spec: VefxEffectSpec) {
    const compiler = new VefxCompiler();
    const compiled = compiler.compile(spec);

    this.manifest = compiled.manifest;
    this.wgslCode = compiled.wgslShaderCode;
    this.uniformSize = compiled.uniformSize;
    this.engine = new EffectPipelineEngine();

    // Initialize default parameter values from exposed inputs
    for (const input of compiled.exposedInputs) {
      this.parameters[input.id] = Array.isArray(input.default)
        ? [...input.default]
        : (input.default as string | number | boolean);
    }
  }

  /**
   * Initializes GPU pipeline with the host editor's GPUDevice context
   */
  async onInit(device: GPUDevice): Promise<void> {
    await this.engine.initialize(device, this.wgslCode, {
      uniformSize: this.uniformSize,
    });
  }

  /**
   * Called by host editor when timeline scrubbed or keyframe parameters update
   */
  onUpdateParameters(params: ParameterValues): void {
    this.parameters = {
      ...this.parameters,
      ...params,
    };
  }

  /**
   * Executes a single frame render pass during host playback
   */
  render(
    commandEncoder: GPUCommandEncoder,
    target: RenderTarget,
    context: FrameContext
  ): void {
    const customValues: number[] = [];

    // Extract numerical uniform parameters
    for (const input of this.manifest.parameters) {
      const val = this.parameters[input.id];
      if (typeof val === "number") {
        customValues.push(val);
      } else if (Array.isArray(val)) {
        customValues.push(...val);
      } else if (typeof val === "boolean") {
        customValues.push(val ? 1 : 0);
      }
    }

    const uniformData = this.engine.packUniformBuffer({
      time: context.currentTime,
      resolution: context.resolution,
      customValues,
    });

    const inputView = target.inputTexture.createView();
    const outputView = target.outputTexture.createView();

    this.engine.renderFrame(commandEncoder, inputView, outputView, uniformData);
  }

  /**
   * Cleanup and dispose GPU resources
   */
  onDestroy(): void {
    this.engine.destroy();
  }
}

/**
 * Factory method for host editors to create plugin bridge instances from .vefx specs
 */
export function createClypraVideoPlugin(spec: VefxEffectSpec): ClypraVideoPlugin {
  return new ClypraPluginBridge(spec);
}
