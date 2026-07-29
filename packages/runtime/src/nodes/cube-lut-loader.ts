/// <reference types="@webgpu/types" />

export class CubeLutLoader {
  /**
   * Parses standard Adobe .CUBE file text into a WebGPU 3D Texture
   */
  public static create3DLutTexture(device: GPUDevice, cubeFileContent: string): GPUTexture {
    const lines = cubeFileContent.split("\n");
    let lutSize = 32;
    const data: number[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || trimmed.length === 0) continue;

      if (trimmed.startsWith("LUT_3D_SIZE")) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          lutSize = parseInt(parts[1], 10);
        }
        continue;
      }

      // Parse RGB float lines
      const parts = trimmed.split(/\s+/).map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        // Push R, G, B, A (WebGPU rgba32float requires 4 channels)
        data.push(parts[0], parts[1], parts[2], 1.0);
      }
    }

    const floatData = new Float32Array(data);

    const usage =
      typeof GPUTextureUsage !== "undefined"
        ? GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        : 0x04 | 0x08;

    // Create 3D GPU Texture
    const lutTexture = device.createTexture({
      label: "3D LUT Texture",
      size: [lutSize, lutSize, lutSize],
      dimension: "3d",
      format: "rgba32float",
      usage,
    });

    // Write Float32Array into 3D Texture VRAM
    device.queue.writeTexture(
      { texture: lutTexture },
      floatData,
      { bytesPerRow: lutSize * 4 * 4, rowsPerImage: lutSize }, // 4 channels * 4 bytes/float
      { width: lutSize, height: lutSize, depthOrArrayLayers: lutSize }
    );

    return lutTexture;
  }
}
