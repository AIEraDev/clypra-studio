/**
 * Color Isolation Effect
 *
 * Keep subject in color while desaturating background (selective color effect).
 * Consumes mask feature map from feature providers.
 *
 * Phase 5 Week 9 - Body Effect #5
 */

export const colorIsolationEffect = {
  id: "body.color-isolation",
  name: "Color Isolation",
  version: "1.0.0",
  category: "body",
  description: "Keep subject in color, desaturate background",

  schema: {
    parameters: {
      desaturation: {
        type: "number",
        default: 1.0,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: "Desaturation",
        description: "Amount to desaturate background (1.0 = full B&W)",
      },
      edgeBlend: {
        type: "number",
        default: 0.3,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: "Edge Blend",
        description: "Smoothness of color transition at edges",
      },
      colorBoost: {
        type: "number",
        default: 0.0,
        min: 0.0,
        max: 0.5,
        step: 0.05,
        label: "Subject Color Boost",
        description: "Increase saturation of subject",
      },
    },
    inputs: {
      source: {
        type: "Texture",
        required: true,
        label: "Video Input",
      },
      mask: {
        type: "Texture",
        required: true,
        label: "Mask (from feature provider)",
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
        mask: { type: "Texture" },
      },
    },
    // Color Isolation Pass
    {
      id: "isolate",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform sampler2D uMask;
          uniform float uDesaturation;
          uniform float uEdgeBlend;
          uniform float uColorBoost;
          
          varying vec2 vUv;
          
          // RGB to luminance (Rec. 709)
          float getLuminance(vec3 color) {
            return dot(color, vec3(0.2126, 0.7152, 0.0722));
          }
          
          // Desaturate color (mix with luminance)
          vec3 desaturate(vec3 color, float amount) {
            float luma = getLuminance(color);
            return mix(color, vec3(luma), amount);
          }
          
          // Increase saturation
          vec3 saturate(vec3 color, float amount) {
            float luma = getLuminance(color);
            return mix(color, color + (color - luma) * amount, 1.0);
          }
          
          void main() {
            vec3 color = texture2D(uSource, vUv).rgb;
            float mask = texture2D(uMask, vUv).a;
            
            // Apply edge blending to mask
            float blend = mask;
            if (uEdgeBlend > 0.0) {
              float edge = uEdgeBlend * 0.5;
              blend = smoothstep(0.5 - edge, 0.5 + edge, mask);
            }
            
            // Desaturate background
            vec3 desaturated = desaturate(color, uDesaturation);
            
            // Optionally boost subject color
            vec3 subjectColor = color;
            if (uColorBoost > 0.0) {
              subjectColor = saturate(color, uColorBoost);
            }
            
            // Mix based on mask
            vec3 result = mix(desaturated, subjectColor, blend);
            
            gl_FragColor = vec4(result, 1.0);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uMask: { type: "Texture", value: "@input.mask" },
          uDesaturation: { type: "float", value: "@params.desaturation" },
          uEdgeBlend: { type: "float", value: "@params.edgeBlend" },
          uColorBoost: { type: "float", value: "@params.colorBoost" },
        },
      },
      inputs: {
        source: { type: "Texture" },
        mask: { type: "Texture" },
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
    { from: "input", fromPin: "source", to: "isolate", toPin: "source" },
    { from: "input", fromPin: "mask", to: "isolate", toPin: "mask" },
    { from: "isolate", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["body", "mask", "color", "selective", "black-white", "desaturation"],
    thumbnail: "color-isolation-thumb.png",
    previewVideo: "color-isolation-preview.mp4",
    requiredFeatures: ["mask"],
  },

  capabilities: {
    temporal: false,
    stateful: false,
    spatial: false,
    geometry: false,
    inputsCount: 2, // source + mask
  },

  requirements: {
    temporalRadius: 0,
    preferredPrecision: "fp16",
    multipass: false, // Single pass
    supportsHalfResolution: false,
  },

  presets: [
    {
      id: "subtle-isolation",
      name: "Subtle Isolation",
      description: "Slight background desaturation",
      parameters: {
        desaturation: 0.7,
        edgeBlend: 0.4,
        colorBoost: 0.0,
      },
    },
    {
      id: "full-bw",
      name: "Full Black & White",
      description: "Complete background desaturation",
      parameters: {
        desaturation: 1.0,
        edgeBlend: 0.3,
        colorBoost: 0.0,
      },
    },
    {
      id: "pop-color",
      name: "Pop Color",
      description: "Desaturate background, boost subject",
      parameters: {
        desaturation: 1.0,
        edgeBlend: 0.25,
        colorBoost: 0.3,
      },
    },
    {
      id: "soft-blend",
      name: "Soft Blend",
      description: "Very smooth color transition",
      parameters: {
        desaturation: 0.9,
        edgeBlend: 0.6,
        colorBoost: 0.1,
      },
    },
  ],
};
