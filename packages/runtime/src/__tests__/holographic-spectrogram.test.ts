import { describe, it, expect } from "vitest";
import { createHolographicSpectrogramNode } from "../nodes/holographic-spectrogram-node";
import { WGSLGraphCompiler } from "../compiler/wgsl-graph-compiler";
import type { NodeGraph } from "@clypra-studio/types";

describe("HolographicSpectrogramNode — 3D Waterfall Spectrogram Shader", () => {
  it("should compile HolographicSpectrogramNode with renderHolographicSpectrogram WGSL helper", () => {
    const holoNode = createHolographicSpectrogramNode("holo_spec_01");
    const compiler = new WGSLGraphCompiler();

    const graph: NodeGraph = {
      nodes: [holoNode],
      connections: [],
      outputNodeId: "holo_spec_01",
    };

    const compiled = compiler.compile(graph);

    expect(compiled.wgslCode).toContain("fn renderHolographicSpectrogram");
    expect(compiled.wgslCode).toContain("@group(0) @binding(3) var audioWaveTexture_holo_spec_01: texture_1d<f32>;");
    expect(compiled.wgslCode).toContain("u_holo_spec_01_intensity: f32");
    expect(compiled.wgslCode).toContain("u_holo_spec_01_dispersion: f32");
    expect(compiled.wgslCode).toContain("u_holo_spec_01_speed: f32");
  });
});
