import type { ShaderNode } from "@clypra-studio/types";

export function createWaveformVisualizerNode(
  id = "wave_viz_01",
  defaultColor: [number, number, number, number] = [0.2, 0.8, 1.0, 1.0],
  defaultThickness = 0.008,
  defaultGlow = 0.03
): ShaderNode {
  return {
    id,
    type: "WaveformVisualizerNode",
    inputs: [{ id: "inColor", label: "Background Color", type: "vec4f" }],
    outputs: [{ id: "outColor", label: "Composite Output", type: "vec4f" }],
    uniforms: {
      color: { type: "vec4f", defaultValue: defaultColor },
      thickness: { type: "f32", defaultValue: defaultThickness },
      glow: { type: "f32", defaultValue: defaultGlow },
    },
    generateCode: (inputs, uniforms) => {
      const inVar = inputs.inColor || "srcColor";
      const uColor = uniforms.color || `uniforms.u_${id}_color`;
      const uThickness = uniforms.thickness || `uniforms.u_${id}_thickness`;
      const uGlow = uniforms.glow || `uniforms.u_${id}_glow`;

      return `  // Render waveform overlay
  let waveOverlay_${id} = renderAudioWaveform(
    in.uv,
    audioWaveTexture_${id},
    imgSampler,
    ${uColor},
    ${uThickness},
    ${uGlow}
  );

  // Alpha blend waveform on top of incoming background video color
  let v_${id}_outColor = vec4f(
    mix(${inVar}.rgb, waveOverlay_${id}.rgb, waveOverlay_${id}.a),
    ${inVar}.a
  );`;
    },
  };
}
