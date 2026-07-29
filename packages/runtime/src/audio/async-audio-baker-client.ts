import type { BakeTaskMessage, BakedFrameResult } from "@clypra-studio/types";
import { WasmAudioSpectrumBaker, type FastBakedSpectrum } from "./wasm-spectrum-baker";

export class AsyncAudioBakerClient {
  private worker: Worker | null = null;
  private pendingTasks: Map<string, (result: FastBakedSpectrum[]) => void> = new Map();
  private localBaker = new WasmAudioSpectrumBaker();

  constructor(workerUrl?: string) {
    if (typeof Worker !== "undefined" && workerUrl) {
      this.worker = new Worker(workerUrl, { type: "module" });
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }
  }

  private handleWorkerMessage(e: MessageEvent<BakedFrameResult>): void {
    const { taskId, resultBuffer, totalFrames } = e.data;
    const resolve = this.pendingTasks.get(taskId);
    if (!resolve) return;

    const resultArray = new Float32Array(resultBuffer);
    const frames: FastBakedSpectrum[] = new Array(totalFrames);

    for (let i = 0; i < totalFrames; i++) {
      const idx = i * 3;
      frames[i] = {
        bass: resultArray[idx],
        mids: resultArray[idx + 1],
        treble: resultArray[idx + 2],
      };
    }

    this.pendingTasks.delete(taskId);
    resolve(frames);
  }

  /**
   * Bakes audio asynchronously using Web Worker thread offloading or local fallback
   */
  public async bakeAudio(
    pcmData: Float32Array,
    sampleRate = 44100,
    fps = 60,
    fftSize = 512
  ): Promise<FastBakedSpectrum[]> {
    if (!this.worker) {
      // Direct local execution fallback for Node/non-worker environments
      return this.localBaker.bakeSpectrumFast(pcmData, sampleRate, fps, fftSize);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return new Promise((resolve) => {
      this.pendingTasks.set(taskId, resolve);

      const pcmCopy = new Float32Array(pcmData);
      const message: BakeTaskMessage = {
        type: "BAKE_AUDIO",
        taskId,
        pcmBuffer: pcmCopy,
        sampleRate,
        fps,
        fftSize,
      };

      this.worker!.postMessage(message, [pcmCopy.buffer]);
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
