import { describe, it, expect, vi } from "vitest";
import { CubeLutLoader } from "../nodes/cube-lut-loader";

describe("CubeLutLoader — Adobe .CUBE 3D LUT Parser", () => {
  const sampleCubeFile = `
# Title: Sample 3D LUT
LUT_3D_SIZE 2

0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
`;

  it("should parse Adobe .CUBE lines into RGBA32F data and create WebGPU 3D Texture", () => {
    const mockCreateTexture = vi.fn().mockReturnValue({ label: "3D LUT Texture" });
    const mockWriteTexture = vi.fn();

    const mockDevice = {
      createTexture: mockCreateTexture,
      queue: {
        writeTexture: mockWriteTexture,
      },
    } as unknown as GPUDevice;

    const texture = CubeLutLoader.create3DLutTexture(mockDevice, sampleCubeFile);

    expect(texture).toBeDefined();
    expect(mockCreateTexture).toHaveBeenCalledWith(
      expect.objectContaining({
        size: [2, 2, 2],
        dimension: "3d",
        format: "rgba32float",
      })
    );
    expect(mockWriteTexture).toHaveBeenCalled();
  });
});
