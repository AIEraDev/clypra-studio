import type {
  NodeGraph,
  ShaderNode,
  GraphConnection,
  CompilationResult,
  DataType,
} from "@clypra-studio/types";

export class WGSLGraphCompiler {
  /**
   * Compiles a NodeGraph DAG into a single-pass WGSL composite fragment shader
   */
  public compile(graph: NodeGraph): CompilationResult {
    if (!graph.nodes || graph.nodes.length === 0) {
      throw new Error("Cannot compile empty NodeGraph: no nodes provided.");
    }

    // 1. Sort nodes topologically using Kahn's algorithm
    const sortedNodes = this.topologicalSort(graph.nodes, graph.connections);

    const structFields: string[] = ["  time: f32,"];
    const uniformDeclarations: Array<{ name: string; type: DataType }> = [];
    const functionBodyLines: string[] = [];

    // Map tracking variable name assigned to each output pin: "nodeId:pinId" -> "var_name"
    const pinVarMap = new Map<string, string>();

    // 2. Iterate through ordered nodes and compile code in sequence
    for (const node of sortedNodes) {
      const inputVarMap: Record<string, string> = {};
      const uniformVarMap: Record<string, string> = {};

      // A. Resolve Input Connections
      for (const inputPin of node.inputs) {
        const conn = graph.connections.find(
          (c) => c.toNodeId === node.id && c.toPinId === inputPin.id
        );

        if (conn) {
          const sourceVarKey = `${conn.fromNodeId}:${conn.fromPinId}`;
          inputVarMap[inputPin.id] = pinVarMap.get(sourceVarKey) || "srcColor";
        } else {
          // Fallback default values if unplugged
          inputVarMap[inputPin.id] = this.getDefaultLiteral(inputPin.type);
        }
      }

      // B. Resolve Exposed Uniforms
      if (node.uniforms) {
        for (const [uName, uSpec] of Object.entries(node.uniforms)) {
          const scopedUniformName = `u_${node.id}_${uName}`;
          uniformDeclarations.push({ name: scopedUniformName, type: uSpec.type });
          structFields.push(`  ${scopedUniformName}: ${uSpec.type},`);
          uniformVarMap[uName] = `uniforms.${scopedUniformName}`;
        }
      }

      // C. Generate Variable Declarations for Output Pins
      for (const outputPin of node.outputs) {
        const outVarName = `v_${node.id}_${outputPin.id}`;
        pinVarMap.set(`${node.id}:${outputPin.id}`, outVarName);
      }

      // D. Generate and inject Node Body Code
      const nodeCode = node.generateCode(inputVarMap, uniformVarMap);
      functionBodyLines.push(`  // --- Node: ${node.id} (${node.type}) ---`);
      functionBodyLines.push(nodeCode);
    }

    // 3. Assemble Full WGSL Source
    const finalOutputVar =
      pinVarMap.get(`${graph.outputNodeId}:outColor`) ||
      pinVarMap.get(`${graph.outputNodeId}:outTexture`) ||
      "srcColor";

    const has3DLut = sortedNodes.some((n) => n.type === "Lut3DNode");
    const hasWaveform = sortedNodes.some((n) => n.type === "WaveformVisualizerNode");

    let extraBindings = "";
    if (has3DLut) {
      extraBindings += `@group(0) @binding(3) var lutTexture_lut_3d_01: texture_3d<f32>;\n`;
    }
    if (hasWaveform) {
      extraBindings += `@group(0) @binding(3) var audioWaveTexture_wave_viz_01: texture_1d<f32>;\n`;
    }

    const wgslCode = `
// ==========================================
// Auto-Generated Single-Pass Composite WGSL Shader
// ==========================================

struct Uniforms {
${structFields.join("\n")}
};

@group(0) @binding(0) var imgSampler: sampler;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;
${extraBindings}
// Global WGSL Helper for 3D LUT Color Mapping
fn apply3DLUT(
  color: vec3f, 
  lut: texture_3d<f32>, 
  smp: sampler
) -> vec3f {
  let clampedColor = clamp(color, vec3f(0.0), vec3f(1.0));
  let lutSize = vec3f(textureDimensions(lut, 0));
  let range = (lutSize - vec3f(1.0)) / lutSize;
  let offset = vec3f(0.5) / lutSize;
  let uvw = offset + clampedColor * range;
  return textureSample(lut, smp, uvw).rgb;
}

// Global WGSL Helper for Primary Color Wheels (Lift / Gamma / Gain)
fn applyLiftGammaGain(
  inColor: vec4f, 
  lift: vec3f, 
  gamma: vec3f, 
  gain: vec3f,
  saturation: f32
) -> vec4f {
  let rgb = max(inColor.rgb, vec3f(0.0));
  let liftedGained = rgb * gain + lift * (vec3f(1.0) - rgb);
  let clampedLGG = max(liftedGained, vec3f(0.0001));
  let safeGamma = max(gamma, vec3f(0.0001));
  let invGamma = vec3f(1.0) / safeGamma;
  let gammaCorrected = pow(clampedLGG, invGamma);
  let luma = dot(gammaCorrected, vec3f(0.2126, 0.7152, 0.0722));
  let finalRGB = mix(vec3f(luma), gammaCorrected, saturation);
  return vec4f(finalRGB, inColor.a);
}

// Global WGSL Helper for Procedural Audio Waveform Rendering
fn renderAudioWaveform(
  uv: vec2f, 
  waveTexture: texture_1d<f32>, 
  waveSampler: sampler,
  lineColor: vec4f,
  thickness: f32,
  glow: f32
) -> vec4f {
  let rawSample = textureSample(waveTexture, waveSampler, uv.x).r;
  let waveY = 0.5 + (rawSample * 0.4);
  let dist = abs(uv.y - waveY);
  let df = fwidth(uv.y);
  let lineAlpha = smoothstep(thickness + df, thickness - df, dist);
  let glowAlpha = exp(-dist * (1.0 / max(glow, 0.001)));
  let finalAlpha = clamp(lineAlpha + (glowAlpha * 0.4), 0.0, 1.0);
  return vec4f(lineColor.rgb, lineColor.a * finalAlpha);
}


struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var pos = array<vec2f, 4>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0,  1.0)
  );
  var uv = array<vec2f, 4>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0),
    vec2f(0.0, 0.0), vec2f(1.0, 0.0)
  );
  var output: VertexOutput;
  output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
  output.uv = uv[vertexIndex];
  return output;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  // Base Video Frame Sampler
  let srcColor = textureSample(inputTexture, imgSampler, in.uv);

${functionBodyLines.join("\n")}

  // Final Composite Output
  return ${finalOutputVar};
}
`;

    return { wgslCode, uniformsLayout: uniformDeclarations };
  }

  /**
   * Topological Sorting via Kahn's Algorithm
   */
  private topologicalSort(
    nodes: readonly ShaderNode[],
    connections: readonly GraphConnection[]
  ): ShaderNode[] {
    const inDegree = new Map<string, number>();
    const graphMap = new Map<string, string[]>();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      graphMap.set(n.id, []);
    });

    connections.forEach((conn) => {
      if (inDegree.has(conn.toNodeId)) {
        inDegree.set(conn.toNodeId, (inDegree.get(conn.toNodeId) || 0) + 1);
      }
      graphMap.get(conn.fromNodeId)?.push(conn.toNodeId);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    const resultIds: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      resultIds.push(u);

      for (const v of graphMap.get(u) || []) {
        inDegree.set(v, (inDegree.get(v) || 0) - 1);
        if (inDegree.get(v) === 0) queue.push(v);
      }
    }

    if (resultIds.length !== nodes.length) {
      throw new Error("Cyclic dependency detected in Shader Node Graph!");
    }

    return resultIds.map((id) => nodes.find((n) => n.id === id)!);
  }

  private getDefaultLiteral(type: DataType): string {
    switch (type) {
      case "f32":
        return "0.0";
      case "vec2f":
        return "vec2f(0.0)";
      case "vec3f":
        return "vec3f(0.0)";
      case "vec4f":
        return "vec4f(0.0, 0.0, 0.0, 1.0)";
      default:
        return "0.0";
    }
  }
}
