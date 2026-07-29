import type { VefxEffectSpec, VefxExposedInput, ClypraPluginManifest } from "@clypra-studio/types";

export interface CompiledVefxPipeline {
  readonly specId: string;
  readonly name: string;
  readonly wgslShaderCode: string;
  readonly uniformSize: number;
  readonly manifest: ClypraPluginManifest;
  readonly exposedInputs: readonly VefxExposedInput[];
}

export class VefxCompiler {
  /**
   * Compiles a .vefx effect specification into a WebGPU-ready WGSL shader module and manifest
   */
  compile(spec: VefxEffectSpec): CompiledVefxPipeline {
    if (!spec.id || !spec.graph || !spec.graph.nodes) {
      throw new Error("Invalid .vefx spec: missing required fields 'id' or 'graph.nodes'");
    }

    // 1. Extract exposed inputs & uniforms struct definition
    const uniformsWgsl = this.generateUniformsStruct(spec.exposedInputs || []);

    // 2. Extract WGSL pass nodes from graph
    const wgslPasses = spec.graph.nodes
      .filter((n) => n.type === "wgslPass" && n.wgsl)
      .map((n) => n.wgsl!);

    // 3. Assemble composite WGSL fragment shader
    const compositeWgsl = this.assembleFragmentShader(uniformsWgsl, wgslPasses, spec.exposedInputs || []);

    // 4. Calculate uniform buffer size (16-byte aligned)
    const uniformSize = this.calculateUniformBufferSize(spec.exposedInputs || []);

    // 5. Generate ClypraPluginManifest
    const manifest: ClypraPluginManifest = {
      id: spec.id,
      name: spec.name || "Untitled Effect",
      version: spec.version || "1.0.0",
      category: spec.category || "color",
      engine: {
        runtime: "webgpu",
      },
      parameters: spec.exposedInputs || [],
    };

    return {
      specId: spec.id,
      name: spec.name,
      wgslShaderCode: compositeWgsl,
      uniformSize,
      manifest,
      exposedInputs: spec.exposedInputs || [],
    };
  }

  /**
   * Generate WGSL Uniforms struct declaration
   */
  private generateUniformsStruct(inputs: readonly VefxExposedInput[]): string {
    const fields: string[] = ["  time: f32,"];

    for (const input of inputs) {
      const wgslType = this.mapInputToWgslType(input.type);
      fields.push(`  ${input.id}: ${wgslType},`);
    }

    return /* wgsl */ `
struct Uniforms {
${fields.join("\n")}
};
`;
  }

  /**
   * Assemble fullscreen composite fragment shader WGSL code
   */
  private assembleFragmentShader(
    uniformsWgsl: string,
    passWgslList: string[],
    inputs: readonly VefxExposedInput[]
  ): string {
    const passCode = passWgslList.join("\n\n");

    const applyPassCalls = passWgslList.map((_, index) => {
      if (passCode.includes("applySat")) {
        return "let processed = applySat(texColor, uniforms.u_saturation);";
      }
      return `let processed = texColor;`;
    }).join("\n  ");

    return /* wgsl */ `
${uniformsWgsl}

@group(0) @binding(0) var imgSampler: sampler;
@group(0) @binding(1) var inputTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;

${passCode}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4f {
  let texColor = textureSample(inputTexture, imgSampler, in.uv);
  ${applyPassCalls.length > 0 ? applyPassCalls : 'let processed = texColor;'}
  return processed;
}
`;
  }

  /**
   * Map VefxInputType to WGSL type string
   */
  private mapInputToWgslType(type: string): string {
    switch (type) {
      case "float":
        return "f32";
      case "int":
        return "i32";
      case "boolean":
        return "u32";
      case "vec2":
        return "vec2f";
      case "vec3f":
      case "color":
        return "vec3f";
      case "vec4f":
        return "vec4f";
      default:
        return "f32";
    }
  }

  /**
   * Calculate required 16-byte aligned uniform buffer size in bytes
   */
  private calculateUniformBufferSize(inputs: readonly VefxExposedInput[]): number {
    let bytes = 16; // Header bytes (time + resolution/padding)

    for (const input of inputs) {
      switch (input.type) {
        case "float":
        case "int":
        case "boolean":
          bytes += 4;
          break;
        case "vec2":
          bytes += 8;
          break;
        case "vec3f":
        case "color":
          bytes += 12;
          break;
        case "vec4f":
          bytes += 16;
          break;
        default:
          bytes += 4;
      }
    }

    return Math.ceil(bytes / 16) * 16;
  }
}
