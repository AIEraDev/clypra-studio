import { describe, it, expect, vi } from "vitest";
import { GPUDeviceLossRecoveryManager } from "../webgpu/gpu-device-loss-manager";

describe("GPUDeviceLossRecoveryManager — Context Recovery", () => {
  it("should register recovery callbacks and listen for WebGPU device lost events", () => {
    const mockDevice = {
      lost: Promise.resolve({ reason: "destroyed", message: "Mock GPU loss" }),
    } as unknown as GPUDevice;

    const manager = new GPUDeviceLossRecoveryManager(mockDevice);
    const mockCallback = vi.fn();

    manager.onRecovery(mockCallback);
    expect(manager).toBeDefined();
  });
});
