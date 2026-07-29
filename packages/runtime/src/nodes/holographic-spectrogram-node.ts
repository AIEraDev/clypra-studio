import type { ShaderNode } from "@clypra-studio/types";

export function createHolographicSpectrogramNode(
  id = "holo_spec_01",
  defaultIntensity = 0.8,
  defaultDispersion = 0.05,
  defaultSpeed = 1.0
): ShaderNode {
  return {
    id,
    type: "HolographicSpectrogramNode",
    inputs: [{ id: "inColor", label: "Background Color", type: "vec4f" }],
    outputs: [{ id: "outColor", label: "Composite Output", type: "vec4f" }],
    uniforms: {
      intensity: { type: "f32", defaultValue: defaultIntensity },
      dispersion: { type: "f32", defaultValue: defaultDispersion },
      speed: { type: "f32", defaultValue: defaultSpeed },
    },
    generateCode: (inputs, uniforms) => {
      const inVar = inputs.inColor || "srcColor";
      const uIntensity = uniforms.intensity || `uniforms.u_${id}_intensity`;
      const uDispersion = uniforms.dispersion || `uniforms.u_${id}_dispersion`;
      const uSpeed = uniforms.speed || `uniforms.u_${id}_speed`;

      return `  // Render 3D Holographic Waterfall Spectrogram overlay
  let holoOverlay_${id} = renderHolographicSpectrogram(
    in.uv,
    audioWaveTexture_${id},
    imgSampler,
    uniforms.time,
    ${uIntensity},
    ${uDispersion},
    ${uSpeed}
  );

  // Blend holographic spectrogram over background video
  let v_${id}_outColor = vec4f(
    mix(${inVar}.rgb, holoOverlay_${id}.rgb, holoOverlay_${id}.a * ${uIntensity}),
    ${inVar}.a
  );`;
    },
  };
}
