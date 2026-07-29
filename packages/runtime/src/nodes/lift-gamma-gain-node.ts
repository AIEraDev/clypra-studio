import type { ShaderNode } from "@clypra-studio/types";

export function createLiftGammaGainNode(id = "lgg_01"): ShaderNode {
  return {
    id,
    type: "LiftGammaGainNode",
    inputs: [{ id: "inColor", label: "Color Input", type: "vec4f" }],
    outputs: [{ id: "outColor", label: "Graded Output", type: "vec4f" }],
    uniforms: {
      lift: { type: "vec3f", defaultValue: [0.0, 0.0, 0.0] },
      gamma: { type: "vec3f", defaultValue: [1.0, 1.0, 1.0] },
      gain: { type: "vec3f", defaultValue: [1.0, 1.0, 1.0] },
      sat: { type: "f32", defaultValue: 1.0 },
    },
    generateCode: (inputs, uniforms) => {
      const inVar = inputs.inColor || "srcColor";
      const uLift = uniforms.lift || `uniforms.u_${id}_lift`;
      const uGamma = uniforms.gamma || `uniforms.u_${id}_gamma`;
      const uGain = uniforms.gain || `uniforms.u_${id}_gain`;
      const uSat = uniforms.sat || `uniforms.u_${id}_sat`;

      return `  let v_${id}_outColor = applyLiftGammaGain(
    ${inVar},
    ${uLift},
    ${uGamma},
    ${uGain},
    ${uSat}
  );`;
    },
  };
}

export function create3DLutNode(id = "lut_3d_01", defaultIntensity = 1.0): ShaderNode {
  return {
    id,
    type: "Lut3DNode",
    inputs: [{ id: "inColor", label: "Color Input", type: "vec4f" }],
    outputs: [{ id: "outColor", label: "Graded Output", type: "vec4f" }],
    uniforms: {
      intensity: { type: "f32", defaultValue: defaultIntensity },
    },
    generateCode: (inputs, uniforms) => {
      const inVar = inputs.inColor || "srcColor";
      const uIntensity = uniforms.intensity || "1.0";
      return `  let lutGradedColor_${id} = apply3DLUT(${inVar}.rgb, lutTexture_${id}, imgSampler);
  let v_${id}_outColor = vec4f(mix(${inVar}.rgb, lutGradedColor_${id}, ${uIntensity}), ${inVar}.a);`;
    },
  };
}
