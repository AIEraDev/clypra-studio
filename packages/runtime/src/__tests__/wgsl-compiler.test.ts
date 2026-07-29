import { describe, it, expect } from "vitest";
import type { NodeGraph } from "@clypra-studio/types";
import { WGSLGraphCompiler } from "../compiler/wgsl-graph-compiler";
import { createSaturationNode, createTintNode } from "../nodes/shader-node-templates";

describe("WGSLGraphCompiler — Single-Pass DAG Compiler", () => {
  it("should perform topological sort and compile chained nodes into single-pass fs_main", () => {
    const compiler = new WGSLGraphCompiler();

    const satNode = createSaturationNode("sat_01", 1.5);
    const tintNode = createTintNode("tint_01", [1.0, 0.8, 0.6]);

    const graph: NodeGraph = {
      nodes: [satNode, tintNode],
      connections: [
        {
          fromNodeId: "sat_01",
          fromPinId: "outColor",
          toNodeId: "tint_01",
          toPinId: "inColor",
        },
      ],
      outputNodeId: "tint_01",
    };

    const compiled = compiler.compile(graph);

    expect(compiled.wgslCode).toContain("struct Uniforms");
    expect(compiled.wgslCode).toContain("u_sat_01_amount: f32");
    expect(compiled.wgslCode).toContain("u_tint_01_tintColor: vec3f");
    expect(compiled.wgslCode).toContain("fn fs_main");
    expect(compiled.wgslCode).toContain("// --- Node: sat_01 (SaturationNode) ---");
    expect(compiled.wgslCode).toContain("// --- Node: tint_01 (TintNode) ---");
    expect(compiled.wgslCode).toContain("return v_tint_01_outColor;");
    expect(compiled.uniformsLayout).toHaveLength(2);
  });

  it("should throw error on cyclic dependencies in node graph", () => {
    const compiler = new WGSLGraphCompiler();

    const satNode = createSaturationNode("sat_01");
    const tintNode = createTintNode("tint_01");

    const cyclicGraph: NodeGraph = {
      nodes: [satNode, tintNode],
      connections: [
        { fromNodeId: "sat_01", fromPinId: "outColor", toNodeId: "tint_01", toPinId: "inColor" },
        { fromNodeId: "tint_01", fromPinId: "outColor", toNodeId: "sat_01", toPinId: "inColor" },
      ],
      outputNodeId: "tint_01",
    };

    expect(() => compiler.compile(cyclicGraph)).toThrow("Cyclic dependency detected");
  });
});
