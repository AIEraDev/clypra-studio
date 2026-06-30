/**
 * Film Grain Effect
 *
 * Procedural grain texture with adjustable size and intensity.
 * Uses temporal noise animation for realistic film look.
 *
 * Phase 3 Week 6 - Video Effect #1
 */

export const filmGrainEffect = {
  id: "video.film-grain",
  name: "Film Grain",
  version: "1.0.0",
  category: "video",
  description: "Add cinematic film grain with procedural noise",

  schema: {
    parameters: {
      intensity: {
        type: "number",
        default: 0.15,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Intensity",
        description: "Grain visibility strength",
      },
      size: {
        type: "number",
        default: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        label: "Grain Size",
        description: "Size of grain particles",
      },
      colored: {
        type: "boolean",
        default: false,
        label: "Colored Grain",
        description: "Use RGB noise instead of luminance",
      },
      animated: {
        type: "boolean",
        default: true,
        label: "Animated",
        description: "Animate grain over time",
      },
      speed: {
        type: "number",
        default: 1.0,
        min: 0.0,
        max: 5.0,
        step: 0.1,
        label: "Animation Speed",
        description: "Speed of grain animation",
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
      id: "grain",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform vec2 uResolution;
          uniform float uTime;
          uniform float uIntensity;
          uniform float uSize;
          uniform float uAnimated;
          uniform float uColored;
          uniform float uSpeed;
          
          varying vec2 vUv;
          
          // Hash function for noise
          float hash(vec2 p) {
            p = fract(p * vec2(443.8975, 397.2973));
            p += dot(p, p + 19.19);
            return fract(p.x * p.y);
          }
          
          // 2D noise
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
          }
          
          void main() {
            vec4 color = texture2D(uSource, vUv);
            
            // Calculate grain coordinate
            vec2 grainCoord = vUv * uResolution / uSize;
            
            // Add time for animation
            float timeOffset = uAnimated > 0.5 ? uTime * uSpeed : 0.0;
            grainCoord += timeOffset;
            
            // Generate grain
            float grain;
            if (uColored > 0.5) {
              // Colored grain (RGB channels)
              vec3 coloredGrain = vec3(
                noise(grainCoord),
                noise(grainCoord + vec2(12.9898, 78.233)),
                noise(grainCoord + vec2(93.9898, 67.345))
              );
              color.rgb += (coloredGrain - 0.5) * uIntensity;
            } else {
              // Luminance grain
              grain = noise(grainCoord);
              color.rgb += (grain - 0.5) * uIntensity;
            }
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uResolution: { type: "vec2", value: "resolution" },
          uTime: { type: "float", value: "time" },
          uIntensity: { type: "float", value: "@params.intensity" },
          uSize: { type: "float", value: "@params.size" },
          uAnimated: { type: "float", value: "@params.animated ? 1.0 : 0.0" },
          uColored: { type: "float", value: "@params.colored ? 1.0 : 0.0" },
          uSpeed: { type: "float", value: "@params.speed" },
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
    { from: "input", fromPin: "source", to: "grain", toPin: "source" },
    { from: "grain", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["video", "noise", "grain", "cinematic", "texture"],
    thumbnail: "film-grain-thumb.png",
    previewVideo: "film-grain-preview.mp4",
  },

  capabilities: {
    temporal: true,
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
      name: "Subtle Grain",
      description: "Light film grain for clean footage",
      parameters: {
        intensity: 0.08,
        size: 1.0,
        colored: false,
        animated: true,
        speed: 0.5,
      },
    },
    {
      id: "medium",
      name: "Medium Grain",
      description: "Balanced grain for most footage",
      parameters: {
        intensity: 0.15,
        size: 1.2,
        colored: false,
        animated: true,
        speed: 1.0,
      },
    },
    {
      id: "heavy",
      name: "Heavy Grain",
      description: "Strong grain for vintage look",
      parameters: {
        intensity: 0.3,
        size: 1.5,
        colored: false,
        animated: true,
        speed: 1.5,
      },
    },
    {
      id: "color-grain",
      name: "Color Grain",
      description: "RGB chromatic grain",
      parameters: {
        intensity: 0.12,
        size: 0.8,
        colored: true,
        animated: true,
        speed: 1.0,
      },
    },
  ],
};
