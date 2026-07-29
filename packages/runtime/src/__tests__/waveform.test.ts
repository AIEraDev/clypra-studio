import { describe, it, expect, vi } from "vitest";
import { createWaveformVisualizerNode } from "../nodes/waveform-visualizer-node";
import { WebGPUAudioWaveTexture } from "../nodes/webgpu-audio-wave-texture";
import { WGSLGraphCompiler } from "../compiler/wgsl-graph-compiler";
import type { NodeGraph } from "@clypra-studio/types";

describe("WaveformVisualizerNode & 1D Audio Wave Texture Manager", () => {
  it("should compile WaveformVisualizerNode into WGSL shader code with renderAudioWaveform helper", () => {
    const waveNode = createWaveformVisualizerNode("wave_viz_01");
    const compiler = new WGSLGraphCompiler();

    const graph: NodeGraph = {
      nodes: [waveNode],
      connections: [],
      outputNodeId: "wave_viz_01",
    };

    const compiled = compiler.compile(graph);

    expect(compiled.wgslCode).toContain("fn renderAudioWaveform");
    expect(compiled.wgslCode).toContain("@group(0) @binding(3) var audioWaveTexture_wave_viz_01: texture_1d<f32>;");
    expect(compiled.wgslCode).toContain("u_wave_viz_01_color: vec4f");
  });

  it("should create WebGPUAudioWaveTexture 1D texture and write PCM samples", () => {
    const mockCreateTexture = vi.fn().mockReturnValue({
      createView: vi.fn().mockReturnValue({ label: "Audio PCM Waveform View" }),
    });
    const mockWriteTexture = vi.fn();

    const mockDevice = {
      createTexture: mockCreateTexture,
      queue: {
        writeTexture: mockWriteTexture,
      },
    } as unknown as GPUDevice;

    const waveTex = new WebGPUAudioWaveTexture(mockDevice, 512);
    expect(mockCreateTexture).toHaveBeenCalledWith(
      expect.objectContaining({
        size: [512, 1, 1],
        dimension: "1d",
        format: "r32float",
      })
    );

    const pcmSamples = new Float32Array(512);
    waveTex.updateSamples(pcmSamples);
    expect(mockWriteTexture).toHaveBeenCalled();
  });
});
