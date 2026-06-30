/**
 * Neon Outline Effect
 *
 * Glowing neon outline around the subject using edge detection and glow.
 * Consumes mask feature map from feature providers.
 *
 * Phase 5 Week 9 - Body Effect #1
 */

export const neonOutlineEffect = {
  id: "body.neon-outline",
  name: "Neon Outline",
  version: "1.0.0",
  category: "body",
  description: "Glowing neon outline around the subject",

  schema: {
    parameters: {
      color: {
        type: "color",
        default: "#00FFFF",
        label: "Outline Color",
        description: "Color of the neon glow",
      },
      thickness: {
        type: "number",
        default: 4,
        min: 1,
        max: 20,
        step: 1,
        label: "Thickness",
        description: "Width of the outline in pixels",
      },
      intensity: {
        type: "number",
        default: 1.0,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: "Glow Intensity",
        description: "Brightness of the glow effect",
      },
      softness: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: "Glow Softness",
        description: "How soft/blurred the glow appears",
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
    // Edge Detection Pass
    {
      id: "edge-detect",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uMask;
          uniform vec2 uResolution;
          uniform float uThickness;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            float step = uThickness;
            
            // Sample mask in 3x3 grid (Sobel-like edge detection)
            float tl = texture2D(uMask, vUv + vec2(-step, step) * texelSize).a;
            float t = texture2D(uMask, vUv + vec2(0.0, step) * texelSize).a;
            float tr = texture2D(uMask, vUv + vec2(step, step) * texelSize).a;
            float l = texture2D(uMask, vUv + vec2(-step, 0.0) * texelSize).a;
            float c = texture2D(uMask, vUv).a;
            float r = texture2D(uMask, vUv + vec2(step, 0.0) * texelSize).a;
            float bl = texture2D(uMask, vUv + vec2(-step, -step) * texelSize).a;
            float b = texture2D(uMask, vUv + vec2(0.0, -step) * texelSize).a;
            float br = texture2D(uMask, vUv + vec2(step, -step) * texelSize).a;
            
            // Sobel operators
            float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
            float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
            
            // Edge magnitude
            float edge = sqrt(gx * gx + gy * gy);
            
            // Threshold and normalize
            edge = smoothstep(0.1, 0.5, edge);
            
            gl_FragColor = vec4(edge, edge, edge, edge);
          }
        `,
        uniforms: {
          uMask: { type: "Texture", value: "@input.mask" },
          uResolution: { type: "vec2", value: "resolution" },
          uThickness: { type: "float", value: "@params.thickness" },
        },
      },
      inputs: {
        mask: { type: "Texture" },
      },
      outputs: {
        edges: { type: "Texture" },
      },
    },
    // Horizontal Blur Pass
    {
      id: "blur-h",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uEdges;
          uniform vec2 uResolution;
          uniform float uSoftness;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            float blur = 0.0;
            
            // Gaussian blur weights
            float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
            float radius = 4.0 * uSoftness;
            
            blur += texture2D(uEdges, vUv).r * weights[0];
            
            for (int i = 1; i < 5; i++) {
              float offset = float(i) * radius;
              blur += texture2D(uEdges, vUv + vec2(offset * texelSize.x, 0.0)).r * weights[i];
              blur += texture2D(uEdges, vUv - vec2(offset * texelSize.x, 0.0)).r * weights[i];
            }
            
            gl_FragColor = vec4(blur, blur, blur, blur);
          }
        `,
        uniforms: {
          uEdges: { type: "Texture", value: "@edge-detect.edges" },
          uResolution: { type: "vec2", value: "resolution" },
          uSoftness: { type: "float", value: "@params.softness" },
        },
      },
      inputs: {
        edges: { type: "Texture" },
      },
      outputs: {
        blurredH: { type: "Texture" },
      },
    },
    // Vertical Blur Pass
    {
      id: "blur-v",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uBlurredH;
          uniform vec2 uResolution;
          uniform float uSoftness;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            float blur = 0.0;
            
            // Gaussian blur weights
            float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
            float radius = 4.0 * uSoftness;
            
            blur += texture2D(uBlurredH, vUv).r * weights[0];
            
            for (int i = 1; i < 5; i++) {
              float offset = float(i) * radius;
              blur += texture2D(uBlurredH, vUv + vec2(0.0, offset * texelSize.y)).r * weights[i];
              blur += texture2D(uBlurredH, vUv - vec2(0.0, offset * texelSize.y)).r * weights[i];
            }
            
            gl_FragColor = vec4(blur, blur, blur, blur);
          }
        `,
        uniforms: {
          uBlurredH: { type: "Texture", value: "@blur-h.blurredH" },
          uResolution: { type: "vec2", value: "resolution" },
          uSoftness: { type: "float", value: "@params.softness" },
        },
      },
      inputs: {
        blurredH: { type: "Texture" },
      },
      outputs: {
        glow: { type: "Texture" },
      },
    },
    // Composite Pass
    {
      id: "composite",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform sampler2D uGlow;
          uniform vec3 uColor;
          uniform float uIntensity;
          
          varying vec2 vUv;
          
          void main() {
            vec4 source = texture2D(uSource, vUv);
            float glow = texture2D(uGlow, vUv).r;
            
            // Apply color and intensity to glow
            vec3 glowColor = uColor * glow * uIntensity;
            
            // Additive blend
            vec3 result = source.rgb + glowColor;
            
            gl_FragColor = vec4(result, source.a);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uGlow: { type: "Texture", value: "@blur-v.glow" },
          uColor: { type: "vec3", value: "@params.color" },
          uIntensity: { type: "float", value: "@params.intensity" },
        },
      },
      inputs: {
        source: { type: "Texture" },
        glow: { type: "Texture" },
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
    { from: "input", fromPin: "mask", to: "edge-detect", toPin: "mask" },
    { from: "edge-detect", fromPin: "edges", to: "blur-h", toPin: "edges" },
    { from: "blur-h", fromPin: "blurredH", to: "blur-v", toPin: "blurredH" },
    { from: "input", fromPin: "source", to: "composite", toPin: "source" },
    { from: "blur-v", fromPin: "glow", to: "composite", toPin: "glow" },
    { from: "composite", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["body", "mask", "outline", "glow", "neon", "edge"],
    thumbnail: "neon-outline-thumb.png",
    previewVideo: "neon-outline-preview.mp4",
    requiredFeatures: ["mask"],
  },

  capabilities: {
    temporal: false,
    stateful: false,
    spatial: true,
    geometry: false,
    inputsCount: 2, // source + mask
  },

  requirements: {
    temporalRadius: 0,
    preferredPrecision: "fp16",
    multipass: true, // 4 passes: edge detect, blur-h, blur-v, composite
    supportsHalfResolution: false,
  },

  presets: [
    {
      id: "cyan-glow",
      name: "Cyan Glow",
      description: "Bright cyan neon outline",
      parameters: {
        color: "#00FFFF",
        thickness: 5,
        intensity: 1.5,
        softness: 0.6,
      },
    },
    {
      id: "magenta-blast",
      name: "Magenta Blast",
      description: "Intense magenta outline",
      parameters: {
        color: "#FF00FF",
        thickness: 7,
        intensity: 2.0,
        softness: 0.7,
      },
    },
    {
      id: "subtle-white",
      name: "Subtle White",
      description: "Soft white outline for portraits",
      parameters: {
        color: "#FFFFFF",
        thickness: 3,
        intensity: 0.8,
        softness: 0.4,
      },
    },
    {
      id: "electric-blue",
      name: "Electric Blue",
      description: "Vibrant blue electric effect",
      parameters: {
        color: "#0088FF",
        thickness: 6,
        intensity: 1.8,
        softness: 0.5,
      },
    },
  ],
};
