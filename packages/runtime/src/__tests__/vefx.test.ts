import { describe, it, expect, vi } from "vitest";
import type { VefxEffectSpec } from "@clypra-studio/types";
import { VefxCompiler } from "../compiler/vefx-compiler";
import { EffectPipelineEngine } from "../webgpu/EffectPipelineEngine";
import { ClypraPluginBridge } from "../bridge/plugin-bridge-sdk";
import { handleHostIPCMessage, dispatchParamChangeToPlugin } from "../bridge/ipc-worker-bridge";

describe(".vefx Intermediate Specification & WebGPU Engine", () => {
  const sampleVefxSpec: VefxEffectSpec = {
    $schema: "https://spec.studio.internal/v1/effect.json",
    id: "fx_color_vibe_pro_001",
    name: "Color Vibe & Bloom Pro",
    version: "1.0.0",
    author: "Studio User",
    exposedInputs: [
      {
        id: "u_saturation",
        label: "Saturation",
        type: "float",
        default: 1.2,
        min: 0.0,
        max: 3.0,
        step: 0.05,
      },
      {
        id: "u_tint_color",
        label: "Shadow Tint",
        type: "vec3f",
        default: [0.1, 0.05, 0.2],
      },
    ],
    graph: {
      nodes: [
        {
          id: "node_input_frame",
          type: "textureInput",
          label: "Source Video",
        },
        {
          id: "node_sat_pass",
          type: "wgslPass",
          label: "Saturation Shader",
          wgsl: `fn applySat(color: vec4f, sat: f32) -> vec4f {
  let luma = dot(color.rgb, vec3f(0.2126, 0.7152, 0.0722));
  return vec4f(mix(vec3f(luma), color.rgb, sat), color.a);
}`,
        },
        {
          id: "node_output_frame",
          type: "textureOutput",
          label: "Render Output",
        },
      ],
      connections: [
        {
          from: "node_input_frame",
          outputPin: "texture",
          to: "node_sat_pass",
          inputPin: "inTexture",
        },
        {
          from: "node_sat_pass",
          outputPin: "outTexture",
          to: "node_output_frame",
          inputPin: "texture",
        },
      ],
    },
  };

  it("should compile .vefx spec into WGSL shader code and manifest", () => {
    const compiler = new VefxCompiler();
    const compiled = compiler.compile(sampleVefxSpec);

    expect(compiled.specId).toBe("fx_color_vibe_pro_001");
    expect(compiled.name).toBe("Color Vibe & Bloom Pro");
    expect(compiled.wgslShaderCode).toContain("struct Uniforms");
    expect(compiled.wgslShaderCode).toContain("fn fs_main");
    expect(compiled.wgslShaderCode).toContain("applySat");
    expect(compiled.uniformSize).toBeGreaterThanOrEqual(16);
    expect(compiled.manifest.parameters).toHaveLength(2);
  });

  it("should pack uniform buffers with 16-byte alignment", () => {
    const engine = new EffectPipelineEngine();
    const packed = engine.packUniformBuffer({
      time: 12.5,
      resolution: [1920, 1080],
      customValues: [1.5, 0.1, 0.05, 0.2],
    });

    expect(packed).toBeInstanceOf(Float32Array);
    expect(packed.length).toBe(16); // 16 floats = 64 bytes
    expect(packed[0]).toBe(12.5);
    expect(packed[1]).toBe(1920);
    expect(packed[2]).toBe(1080);
    expect(packed[4]).toBe(1.5);
    expect(packed[5]).toBeCloseTo(0.1);
  });

  it("should instantiate ClypraPluginBridge and update parameters", () => {
    const bridge = new ClypraPluginBridge(sampleVefxSpec);

    expect(bridge.manifest.id).toBe("fx_color_vibe_pro_001");
    expect(bridge.manifest.name).toBe("Color Vibe & Bloom Pro");

    bridge.onUpdateParameters({ u_saturation: 2.0 });
    expect((bridge as any).parameters["u_saturation"]).toBe(2.0);
  });

  it("should handle IPC parameter messages in worker sandbox bridge", () => {
    const paramCallback = vi.fn();

    const mockEvent = {
      data: {
        type: "HOST_PARAM_CHANGE",
        payload: { id: "u_saturation", value: 1.8 },
      },
    } as MessageEvent;

    handleHostIPCMessage(mockEvent, paramCallback);
    expect(paramCallback).toHaveBeenCalledWith({ u_saturation: 1.8 });
  });
});
