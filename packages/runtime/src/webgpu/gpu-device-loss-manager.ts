/// <reference types="@webgpu/types" />

export class GPUDeviceLossRecoveryManager {
  private device: GPUDevice;
  private recoveryCallbacks: Array<(newDevice: GPUDevice) => Promise<void>> = [];

  constructor(device: GPUDevice) {
    this.device = device;
    this.listenForDeviceLoss();
  }

  public onRecovery(callback: (newDevice: GPUDevice) => Promise<void>): void {
    this.recoveryCallbacks.push(callback);
  }

  private listenForDeviceLoss(): void {
    if (this.device && this.device.lost) {
      this.device.lost.then(async (info) => {
        console.warn(`[WebGPU] GPUDevice lost! Reason: ${info.reason}, Message: ${info.message}`);
        await this.attemptRecovery();
      });
    }
  }

  private async attemptRecovery(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.gpu) return;

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return;

      const newDevice = await adapter.requestDevice();
      this.device = newDevice;
      this.listenForDeviceLoss();

      for (const callback of this.recoveryCallbacks) {
        await callback(newDevice);
      }
      console.log("⚡ [WebGPU] Context and VRAM buffers successfully recovered!");
    } catch (err) {
      console.error("[WebGPU] Failed to recover GPUDevice context:", err);
    }
  }
}
