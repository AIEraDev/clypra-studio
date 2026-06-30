/**
 * Bloom Effect
 *
 * Multi-pass bloom with brightness threshold, Gaussian blur, and additive composite.
 * Creates soft glow around bright areas.
 *
 * Phase 3 Week 6 - Video Effect #3
 */

export const bloomEffect = {
  id: "video.bloom",
  name: "Bloom",
  version: "1.0.0",
  category: "video",
  description: "Soft glow effect with brightness threshold and blur",

  schema: {
    parameters: {
      threshold: {
        type: "number",
        default: 0.7,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Threshold",
        description: "Brightness threshold for bloom",
      },
      intensity: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.01,
        label: "Intensity",
        description: "Bloom strength",
      },
      radius: {
        type: "number",
        default: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: "Radius",
        description: "Bloom spread size",
      },
      softness: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Softness",
        description: "Threshold softness/feather",
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
    // Extract bright areas
    {
      id: "brightness-extract",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform float uThreshold;
          uniform float uSoftness;
          
          varying vec2 vUv;
          
          // Luminance calculation
          float luminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
          }
          
          void main() {
            vec4 color = texture2D(uSource, vUv);
            float luma = luminance(color.rgb);
            
            // Soft threshold
            float bloom = smoothstep(uThreshold - uSoftness, uThreshold + uSoftness, luma);
            
            gl_FragColor = vec4(color.rgb * bloom, 1.0);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uThreshold: { type: "float", value: "@params.threshold" },
          uSoftness: { type: "float", value: "@params.softness" },
        },
      },
      inputs: {
        source: { type: "Texture" },
      },
      outputs: {
        bright: { type: "Texture" },
      },
    },
    // Horizontal blur pass
    {
      id: "blur-h",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform vec2 uResolution;
          uniform float uRadius;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            vec4 color = vec4(0.0);
            
            // Gaussian weights (9-tap)
            float weights[9];
            weights[0] = 0.05;
            weights[1] = 0.09;
            weights[2] = 0.12;
            weights[3] = 0.15;
            weights[4] = 0.18;
            weights[5] = 0.15;
            weights[6] = 0.12;
            weights[7] = 0.09;
            weights[8] = 0.05;
            
            for (int i = 0; i < 9; i++) {
              float offset = float(i - 4) * uRadius;
              color += texture2D(uSource, vUv + vec2(offset * texelSize.x, 0.0)) * weights[i];
            }
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@brightness-extract.bright" },
          uResolution: { type: "vec2", value: "resolution" },
          uRadius: { type: "float", value: "@params.radius" },
        },
      },
      inputs: {
        source: { type: "Texture" },
      },
      outputs: {
        blurred: { type: "Texture" },
      },
    },
    // Vertical blur pass
    {
      id: "blur-v",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform vec2 uResolution;
          uniform float uRadius;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            vec4 color = vec4(0.0);
            
            // Gaussian weights (9-tap)
            float weights[9];
            weights[0] = 0.05;
            weights[1] = 0.09;
            weights[2] = 0.12;
            weights[3] = 0.15;
            weights[4] = 0.18;
            weights[5] = 0.15;
            weights[6] = 0.12;
            weights[7] = 0.09;
            weights[8] = 0.05;
            
            for (int i = 0; i < 9; i++) {
              float offset = float(i - 4) * uRadius;
              color += texture2D(uSource, vUv + vec2(0.0, offset * texelSize.y)) * weights[i];
            }
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@blur-h.blurred" },
          uResolution: { type: "vec2", value: "resolution" },
          uRadius: { type: "float", value: "@params.radius" },
        },
      },
      inputs: {
        source: { type: "Texture" },
      },
      outputs: {
        blurred: { type: "Texture" },
      },
    },
    // Composite original + bloom
    {
      id: "composite",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform sampler2D uBloom;
          uniform float uIntensity;
          
          varying vec2 vUv;
          
          void main() {
            vec4 original = texture2D(uSource, vUv);
            vec4 bloom = texture2D(uBloom, vUv);
            
            // Additive blend
            vec3 color = original.rgb + bloom.rgb * uIntensity;
            
            gl_FragColor = vec4(color, original.a);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uBloom: { type: "Texture", value: "@blur-v.blurred" },
          uIntensity: { type: "float", value: "@params.intensity" },
        },
      },
      inputs: {
        source: { type: "Texture" },
        bloom: { type: "Texture" },
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
    { from: "input", fromPin: "source", to: "brightness-extract", toPin: "source" },
    { from: "brightness-extract", fromPin: "bright", to: "blur-h", toPin: "source" },
    { from: "blur-h", fromPin: "blurred", to: "blur-v", toPin: "source" },
    { from: "input", fromPin: "source", to: "composite", toPin: "source" },
    { from: "blur-v", fromPin: "blurred", to: "composite", toPin: "bloom" },
    { from: "composite", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["video", "bloom", "glow", "blur", "light"],
    thumbnail: "bloom-thumb.png",
    previewVideo: "bloom-preview.mp4",
  },

  capabilities: {
    temporal: false,
    stateful: false,
    spatial: true,
    geometry: false,
    inputsCount: 1,
  },

  requirements: {
    temporalRadius: 0,
    preferredPrecision: "fp16",
    multipass: true,
    supportsHalfResolution: true,
  },

  presets: [
    {
      id: "subtle-glow",
      name: "Subtle Glow",
      description: "Gentle bloom for highlights",
      parameters: {
        threshold: 0.8,
        intensity: 0.3,
        radius: 0.8,
        softness: 0.3,
      },
    },
    {
      id: "dramatic-bloom",
      name: "Dramatic Bloom",
      description: "Strong bloom effect",
      parameters: {
        threshold: 0.6,
        intensity: 0.8,
        radius: 1.5,
        softness: 0.5,
      },
    },
    {
      id: "dreamy",
      name: "Dreamy",
      description: "Soft dreamy atmosphere",
      parameters: {
        threshold: 0.5,
        intensity: 1.0,
        radius: 2.0,
        softness: 0.7,
      },
    },
  ],
};
