/**
 * Chromatic Aberration Effect
 *
 * RGB channel displacement with radial distortion.
 * Simulates lens defects and color fringing.
 *
 * Phase 3 Week 6 - Video Effect #4
 */

export const chromaticAberrationEffect = {
  id: "video.chromatic-aberration",
  name: "Chromatic Aberration",
  version: "1.0.0",
  category: "video",
  description: "RGB channel separation with lens distortion",

  schema: {
    parameters: {
      amount: {
        type: "number",
        default: 0.005,
        min: 0.0,
        max: 0.05,
        step: 0.001,
        label: "Amount",
        description: "Separation distance",
      },
      radial: {
        type: "boolean",
        default: true,
        label: "Radial",
        description: "Use radial distortion from center",
      },
      angle: {
        type: "number",
        default: 0.0,
        min: 0.0,
        max: 360.0,
        step: 1.0,
        label: "Angle",
        description: "Direction of separation (degrees)",
      },
      centerX: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Center X",
        description: "Horizontal center point",
      },
      centerY: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Center Y",
        description: "Vertical center point",
      },
      falloff: {
        type: "number",
        default: 1.0,
        min: 0.0,
        max: 3.0,
        step: 0.1,
        label: "Falloff",
        description: "Radial falloff strength",
      },
    },
    inputs: {
      source: {
        type: "Texture",
        required: true,
        label: "Video Input",
      },
    },
    outputs: {
      result: {
        type: "Texture",
        label: "Output",
      },
    },
  },

  nodes: [
    {
      id: "input",
      type: "Input",
      params: {},
      outputs: {
        source: { type: "Texture" },
      },
    },
    {
      id: "aberration",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform float uAmount;
          uniform float uRadial;
          uniform float uAngle;
          uniform vec2 uCenter;
          uniform float uFalloff;
          
          varying vec2 vUv;
          
          #define PI 3.14159265359
          
          void main() {
            vec2 uv = vUv;
            vec2 dir;
            float dist = 0.0;
            
            if (uRadial > 0.5) {
              // Radial distortion from center
              vec2 toCenter = uv - uCenter;
              dist = length(toCenter);
              dir = normalize(toCenter);
              
              // Apply falloff
              dist = pow(dist, uFalloff);
            } else {
              // Directional aberration
              float rad = uAngle * PI / 180.0;
              dir = vec2(cos(rad), sin(rad));
              dist = 1.0;
            }
            
            // Calculate channel offsets
            float offset = uAmount * dist;
            
            vec2 rOffset = dir * offset * 1.0;   // Red pushed outward
            vec2 gOffset = dir * offset * 0.0;   // Green stays centered
            vec2 bOffset = dir * offset * -1.0;  // Blue pulled inward
            
            // Sample each channel
            float r = texture2D(uSource, uv + rOffset).r;
            float g = texture2D(uSource, uv + gOffset).g;
            float b = texture2D(uSource, uv + bOffset).b;
            
            gl_FragColor = vec4(r, g, b, 1.0);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uAmount: { type: "float", value: "@params.amount" },
          uRadial: { type: "float", value: "@params.radial ? 1.0 : 0.0" },
          uAngle: { type: "float", value: "@params.angle" },
          uCenter: { type: "vec2", value: "[@params.centerX, @params.centerY]" },
          uFalloff: { type: "float", value: "@params.falloff" },
        },
      },
      inputs: {
        source: { type: "Texture" },
      },
      outputs: {
        result: { type: "Texture" },
      },
    },
    {
      id: "output",
      type: "Output",
      params: {},
      inputs: {
        result: { type: "Texture" },
      },
    },
  ],

  edges: [
    { from: "input", fromPin: "source", to: "aberration", toPin: "source" },
    { from: "aberration", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["video", "chromatic", "aberration", "color", "distortion", "lens"],
    thumbnail: "chromatic-aberration-thumb.png",
    previewVideo: "chromatic-aberration-preview.mp4",
  },

  capabilities: {
    temporal: false,
    stateful: false,
    spatial: false,
    geometry: false,
    inputsCount: 1,
  },

  requirements: {
    temporalRadius: 0,
    preferredPrecision: "fp16",
    multipass: false,
    supportsHalfResolution: false,
  },

  presets: [
    {
      id: "subtle",
      name: "Subtle",
      description: "Slight color fringing",
      parameters: {
        amount: 0.002,
        radial: true,
        angle: 0,
        centerX: 0.5,
        centerY: 0.5,
        falloff: 1.0,
      },
    },
    {
      id: "lens-defect",
      name: "Lens Defect",
      description: "Realistic lens aberration",
      parameters: {
        amount: 0.005,
        radial: true,
        angle: 0,
        centerX: 0.5,
        centerY: 0.5,
        falloff: 1.5,
      },
    },
    {
      id: "strong-radial",
      name: "Strong Radial",
      description: "Heavy radial distortion",
      parameters: {
        amount: 0.015,
        radial: true,
        angle: 0,
        centerX: 0.5,
        centerY: 0.5,
        falloff: 2.0,
      },
    },
    {
      id: "horizontal",
      name: "Horizontal Shift",
      description: "Horizontal RGB separation",
      parameters: {
        amount: 0.008,
        radial: false,
        angle: 0,
        centerX: 0.5,
        centerY: 0.5,
        falloff: 1.0,
      },
    },
  ],
};
