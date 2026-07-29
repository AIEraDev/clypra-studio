import type { ShaderNode } from "@clypra-studio/types";

/**
 * Saturation Node Template
 */
export function createSaturationNode(id = "sat_01", defaultAmount = 1.2): ShaderNode {
  return {
    id,
    type: "SaturationNode",
    inputs: [{ id: "inColor", label: "Color Input", type: "vec4f" }],
    outputs: [{ id: "outColor", label: "Color Output", type: "vec4f" }],
    uniforms: {
      amount: { type: "f32", defaultValue: defaultAmount },
    },
    generateCode: (inputs, uniforms) => {
      const inVar = inputs.inColor || "srcColor";
      const uAmount = uniforms.amount || "1.2";
      return `  let luma_${id} = dot(${inVar}.rgb, vec3f(0.2126, 0.7152, 0.0722));
  let v_${id}_outColor = vec4f(mix(vec3f(luma_${id}), ${inVar}.rgb, ${uAmount}), ${inVar}.a);`;
    },
  };
}

/**
 * Tint Node Template
 */
export function createTintNode(id = "tint_01", defaultColor: [number, number, number] = [1.0, 0.9, 0.8]): ShaderNode {
  return {
    id,
    type: "TintNode",
    inputs: [{ id: "inColor", label: "Color Input", type: "vec4f" }],
    outputs: [{ id: "outColor", label: "Color Output", type: "vec4f" }],
    uniforms: {
      tintColor: { type: "vec3f", defaultValue: defaultColor },
    },
    generateCode: (inputs, uniforms) => {
      const inVar = inputs.inColor || "srcColor";
      const uTint = uniforms.tintColor || "vec3f(1.0, 0.9, 0.8)";
      return `  let v_${id}_outColor = vec4f(${inVar}.rgb * ${uTint}, ${inVar}.a);`;
    },
  };
}

/**
 * Vignette Node Template
 */
export function createVignetteNode(id = "vignette_01", defaultRadius = 0.75, defaultSoftness = 0.45): ShaderNode {
  return {
    id,
    type: "VignetteNode",
    inputs: [{ id: "inColor", label: "Color Input", type: "vec4f" }],
    outputs: [{ id: "outColor", label: "Color Output", type: "vec4f" }],
    uniforms: {
      radius: { type: "f32", defaultValue: defaultRadius },
      softness: { type: "f32", defaultValue: defaultSoftness },
    },
    generateCode: (inputs, uniforms) => {
      const inVar = inputs.inColor || "srcColor";
      const uRadius = uniforms.radius || "0.75";
      const uSoftness = uniforms.softness || "0.45";
      return `  let uvDist_${id} = distance(in.uv, vec2f(0.5, 0.5));
  let vigFactor_${id} = smoothstep(${uRadius}, ${uRadius} - ${uSoftness}, uvDist_${id});
  let v_${id}_outColor = vec4f(${inVar}.rgb * vigFactor_${id}, ${inVar}.a);`;
    },
  };
}

/**
 * Chroma Key (Green Screen) Node Template
 */
export function createChromaKeyNode(
  id = "chroma_01",
  defaultKeyColor: [number, number, number] = [0.0, 1.0, 0.0]
): ShaderNode {
  return {
    id,
    type: "ChromaKeyNode",
    inputs: [{ id: "inColor", label: "Color Input", type: "vec4f" }],
    outputs: [{ id: "outColor", label: "Color Output", type: "vec4f" }],
    uniforms: {
      keyColor: { type: "vec3f", defaultValue: defaultKeyColor },
      threshold: { type: "f32", defaultValue: 0.4 },
    },
    generateCode: (inputs, uniforms) => {
      const inVar = inputs.inColor || "srcColor";
      const uKey = uniforms.keyColor || "vec3f(0.0, 1.0, 0.0)";
      const uThresh = uniforms.threshold || "0.4";
      return `  let diff_${id} = distance(${inVar}.rgb, ${uKey});
  let alpha_${id} = smoothstep(0.1, ${uThresh}, diff_${id});
  let v_${id}_outColor = vec4f(${inVar}.rgb * alpha_${id}, ${inVar}.a * alpha_${id});`;
    },
  };
}
