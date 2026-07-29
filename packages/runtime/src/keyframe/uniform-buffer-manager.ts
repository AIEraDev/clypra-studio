/// <reference types="@webgpu/types" />

import type { AnimatedProperty, Keyframe } from "@clypra-studio/types";
import { KeyframeEvaluator } from "./keyframe-evaluator";

export class UniformBufferManager {
  private device: GPUDevice;
  private buffer: GPUBuffer;
  private evaluator: KeyframeEvaluator;
  private byteBuffer: ArrayBuffer;
  private floatView: Float32Array;

  constructor(device: GPUDevice, uniformBufferSizeInBytes: number) {
    this.device = device;
    this.evaluator = new KeyframeEvaluator();

    // WebGPU uniform buffers require 16-byte alignment
    const alignedSize = Math.ceil(uniformBufferSizeInBytes / 16) * 16;

    this.buffer = device.createBuffer({
      size: alignedSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.byteBuffer = new ArrayBuffer(alignedSize);
    this.floatView = new Float32Array(this.byteBuffer);
  }

  /**
   * Evaluates keyframes and pushes updated float values to WebGPU VRAM.
   */
  public updateUniformsForFrame(properties: AnimatedProperty[], currentTime: number): void {
    let floatOffset = 0;

    for (const prop of properties) {
      if (prop.type === "float") {
        const val = this.evaluator.evaluate(prop, currentTime);
        this.floatView[floatOffset] = val;
        floatOffset += 1;
      } else if (prop.type === "vec2f") {
        const valX = this.evaluator.evaluate(
          { ...prop, keyframes: extractChannelKeyframes(prop.keyframes, 0) },
          currentTime
        );
        const valY = this.evaluator.evaluate(
          { ...prop, keyframes: extractChannelKeyframes(prop.keyframes, 1) },
          currentTime
        );
        this.floatView[floatOffset] = valX;
        this.floatView[floatOffset + 1] = valY;
        floatOffset += 2;
      } else if (prop.type === "vec3f") {
        const valX = this.evaluator.evaluate(
          { ...prop, keyframes: extractChannelKeyframes(prop.keyframes, 0) },
          currentTime
        );
        const valY = this.evaluator.evaluate(
          { ...prop, keyframes: extractChannelKeyframes(prop.keyframes, 1) },
          currentTime
        );
        const valZ = this.evaluator.evaluate(
          { ...prop, keyframes: extractChannelKeyframes(prop.keyframes, 2) },
          currentTime
        );
        this.floatView[floatOffset] = valX;
        this.floatView[floatOffset + 1] = valY;
        this.floatView[floatOffset + 2] = valZ;
        floatOffset += 3;
      }
    }

    // Zero-copy transfer float array directly to GPU Memory Buffer
    this.device.queue.writeBuffer(
      this.buffer,
      0,
      this.byteBuffer,
      0,
      this.byteBuffer.byteLength
    );
  }

  public getFloatView(): Float32Array {
    return this.floatView;
  }

  public getGPUBuffer(): GPUBuffer {
    return this.buffer;
  }

  public destroy(): void {
    if (this.buffer) {
      this.buffer.destroy();
    }
  }
}

// Helper to extract channel-specific keyframe values (e.g. Vec2 X vs Y)
function extractChannelKeyframes(keyframes: readonly Keyframe[], channelIndex: number): Keyframe[] {
  return keyframes.map((kf) => ({
    ...kf,
    value: Array.isArray(kf.value) ? kf.value[channelIndex] : kf.value,
  }));
}
