import { describe, it, expect } from "vitest";
import { createLiftGammaGainNode, create3DLutNode } from "../nodes/lift-gamma-gain-node";
import { WGSLGraphCompiler } from "../compiler/wgsl-graph-compiler";
import type { NodeGraph } from "@clypra-studio/types";

describe("LiftGammaGain & 3D LUT Color Grading Nodes", () => {
  it("should generate WGSL code for Lift, Gamma, Gain CDL node", () => {
    const lggNode = createLiftGammaGainNode("lgg_01");
    const compiler = new WGSLGraphCompiler();

    const graph: NodeGraph = {
      nodes: [lggNode],
      connections: [],
      outputNodeId: "lgg_01",
    };

    const compiled = compiler.compile(graph);

    expect(compiled.wgslCode).toContain("fn applyLiftGammaGain");
    expect(compiled.wgslCode).toContain("u_lgg_01_lift: vec3f");
    expect(compiled.wgslCode).toContain("u_lgg_01_gamma: vec3f");
    expect(compiled.wgslCode).toContain("u_lgg_01_gain: vec3f");
    expect(compiled.wgslCode).toContain("u_lgg_01_sat: f32");
  });

  it("should inject 3D LUT binding and sampling function when 3D LUT node is present", () => {
    const lutNode = create3DLutNode("lut_3d_01", 0.8);
    const compiler = new WGSLGraphCompiler();

    const graph: NodeGraph = {
      nodes: [lutNode],
      connections: [],
      outputNodeId: "lut_3d_01",
    };

    const compiled = compiler.compile(graph);

    expect(compiled.wgslCode).toContain("@group(0) @binding(3) var lutTexture_lut_3d_01: texture_3d<f32>;");
    expect(compiled.wgslCode).toContain("fn apply3DLUT");
  });
});
