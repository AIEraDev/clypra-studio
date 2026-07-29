/// <reference types="@webgpu/types" />
import type { KeyframePoint } from "@clypra-studio/types";
import { MultiKeyframeEvaluator } from "./multi-keyframe-evaluator";

export class PlaybackEngine {
  private device: GPUDevice;
  private uniformBuffer: GPUBuffer;
  private evaluator: MultiKeyframeEvaluator;

  public tracks: Map<string, KeyframePoint[]> = new Map();

  private currentTime = 0;
  private isPlaying = false;
  private lastFrameTime = 0;
  private animationFrameId: number | null = null;

  private onFrameRenderCallback?: (time: number) => void;

  constructor(device: GPUDevice, uniformBufferSize = 256) {
    this.device = device;
    this.evaluator = new MultiKeyframeEvaluator();

    const bufferSize = Math.max(16, Math.ceil(uniformBufferSize / 16) * 16);
    const usage =
      typeof GPUBufferUsage !== "undefined"
        ? GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        : 0x0040 | 0x0008;

    this.uniformBuffer = device.createBuffer({
      size: bufferSize,
      usage,
    });
  }

  public updateTrackKeyframes(trackId: string, keyframes: KeyframePoint[]): void {
    this.tracks.set(trackId, keyframes);
  }

  public setRenderCallback(cb: (time: number) => void): void {
    this.onFrameRenderCallback = cb;
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastFrameTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.tick();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.animationFrameId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public seek(timeInSeconds: number): void {
    this.currentTime = Math.max(0, timeInSeconds);
    this.evaluateAndFlushUniforms();
    if (this.onFrameRenderCallback) {
      this.onFrameRenderCallback(this.currentTime);
    }
  }

  private tick = (): void => {
    if (!this.isPlaying) return;

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.currentTime += delta;

    this.evaluateAndFlushUniforms();

    if (this.onFrameRenderCallback) {
      this.onFrameRenderCallback(this.currentTime);
    }

    if (typeof requestAnimationFrame !== "undefined") {
      this.animationFrameId = requestAnimationFrame(this.tick);
    }
  };

  public evaluateAndFlushUniforms(): void {
    const floatData: number[] = [];

    for (const [_, keyframes] of this.tracks) {
      const currentVal = this.evaluator.evaluate(keyframes, this.currentTime);
      floatData.push(currentVal);
    }

    while (floatData.length % 4 !== 0) {
      floatData.push(0.0);
    }

    const rawBuffer = new Float32Array(floatData);

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      rawBuffer.buffer,
      0,
      rawBuffer.byteLength
    );
  }

  public getUniformBuffer(): GPUBuffer {
    return this.uniformBuffer;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public isRunning(): boolean {
    return this.isPlaying;
  }
}
