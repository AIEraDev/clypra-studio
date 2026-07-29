/// <reference types="@webgpu/types" />

export class WebGPUAudioWaveTexture {
  private device: GPUDevice;
  private texture: GPUTexture;
  private sampleCount: number;

  constructor(device: GPUDevice, sampleCount = 512) {
    this.device = device;
    this.sampleCount = sampleCount;

    const usage =
      typeof GPUTextureUsage !== "undefined"
        ? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        : 0x04 | 0x08;

    // Create 1D Float32 Texture for PCM samples
    this.texture = device.createTexture({
      label: "Audio PCM Waveform 1D Texture",
      size: [sampleCount, 1, 1],
      dimension: "1d",
      format: "r32float",
      usage,
    });
  }

  /**
   * Uploads an array of Float32 PCM samples (-1.0 to 1.0) for the current frame
   */
  public updateSamples(pcmData: Float32Array): void {
    const buffer =
      pcmData.length === this.sampleCount ? pcmData : pcmData.slice(0, this.sampleCount);

    this.device.queue.writeTexture(
      { texture: this.texture },
      buffer.buffer,
      { bytesPerRow: this.sampleCount * 4 },
      { width: this.sampleCount }
    );
  }

  public getTextureView(): GPUTextureView {
    return this.texture.createView({ dimension: "1d" });
  }
}
