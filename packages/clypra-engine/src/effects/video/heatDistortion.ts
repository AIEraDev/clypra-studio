/**
 * Heat Distortion Effect
 *
 * Displacement mapping with noise-based warping and animated turbulence.
 * Simulates heat haze and atmospheric distortion.
 *
 * Phase 3 Week 6 - Video Effect #5
 */

export const heatDistortionEffect = {
  id: "video.heat-distortion",
  name: "Heat Distortion",
  version: "1.0.0",
  category: "video",
  description: "Heat haze effect with animated displacement",

  schema: {
    parameters: {
      intensity: {
        type: "number",
        default: 0.02,
        min: 0.0,
        max: 0.1,
        step: 0.001,
        label: "Intensity",
        description: "Distortion strength",
      },
      scale: {
        type: "number",
        default: 2.0,
        min: 0.1,
        max: 10.0,
        step: 0.1,
        label: "Scale",
        description: "Turbulence scale",
      },
      speed: {
        type: "number",
        default: 1.0,
        min: 0.0,
        max: 5.0,
        step: 0.1,
        label: "Speed",
        description: "Animation speed",
      },
      vertical: {
        type: "number",
        default: 1.0,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: "Vertical Bias",
        description: "Vertical distortion emphasis",
      },
      octaves: {
        type: "number",
        default: 2,
        min: 1,
        max: 4,
        step: 1,
        label: "Detail",
        description: "Noise octaves (detail level)",
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
      id: "distortion",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform vec2 uResolution;
          uniform float uTime;
          uniform float uIntensity;
          uniform float uScale;
          uniform float uSpeed;
          uniform float uVertical;
          uniform float uOctaves;
          
          varying vec2 vUv;
          
          // Simplex noise helper
          vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }
          
          vec2 mod289(vec2 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
          }
          
          vec3 permute(vec3 x) {
            return mod289(((x * 34.0) + 1.0) * x);
          }
          
          // Simplex 2D noise
          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187,
                                0.366025403784439,
                                -0.577350269189626,
                                0.024390243902439);
            
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v -   i + dot(i, C.xx);
            
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            
            i = mod289(i);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));
            
            vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
            m = m * m;
            m = m * m;
            
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            
            m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
            
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }
          
          // Fractal noise
          float fbm(vec2 p, int octaves) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            for (int i = 0; i < 4; i++) {
              if (i >= octaves) break;
              value += amplitude * snoise(p * frequency);
              frequency *= 2.0;
              amplitude *= 0.5;
            }
            
            return value;
          }
          
          void main() {
            vec2 uv = vUv;
            
            // Animated noise coordinates
            vec2 noiseCoord = uv * uScale;
            float timeOffset = uTime * uSpeed * 0.5;
            
            // Generate displacement field
            int octaves = int(uOctaves);
            vec2 displacement;
            displacement.x = fbm(noiseCoord + vec2(timeOffset, 0.0), octaves);
            displacement.y = fbm(noiseCoord + vec2(0.0, timeOffset + 100.0), octaves);
            
            // Apply vertical bias
            displacement.y *= uVertical;
            
            // Apply intensity
            displacement *= uIntensity;
            
            // Sample with displacement
            vec2 distortedUV = uv + displacement;
            
            // Clamp to avoid sampling outside texture
            distortedUV = clamp(distortedUV, 0.0, 1.0);
            
            vec4 color = texture2D(uSource, distortedUV);
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uResolution: { type: "vec2", value: "resolution" },
          uTime: { type: "float", value: "time" },
          uIntensity: { type: "float", value: "@params.intensity" },
          uScale: { type: "float", value: "@params.scale" },
          uSpeed: { type: "float", value: "@params.speed" },
          uVertical: { type: "float", value: "@params.vertical" },
          uOctaves: { type: "float", value: "@params.octaves" },
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
    { from: "input", fromPin: "source", to: "distortion", toPin: "source" },
    { from: "distortion", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["video", "heat", "distortion", "displacement", "turbulence", "atmospheric"],
    thumbnail: "heat-distortion-thumb.png",
    previewVideo: "heat-distortion-preview.mp4",
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
      id: "subtle-haze",
      name: "Subtle Haze",
      description: "Light atmospheric distortion",
      parameters: {
        intensity: 0.01,
        scale: 3.0,
        speed: 0.5,
        vertical: 1.2,
        octaves: 2,
      },
    },
    {
      id: "heat-waves",
      name: "Heat Waves",
      description: "Rising heat distortion",
      parameters: {
        intensity: 0.02,
        scale: 2.0,
        speed: 1.0,
        vertical: 1.5,
        octaves: 2,
      },
    },
    {
      id: "intense-turbulence",
      name: "Intense Turbulence",
      description: "Strong heat distortion",
      parameters: {
        intensity: 0.04,
        scale: 1.5,
        speed: 1.5,
        vertical: 1.0,
        octaves: 3,
      },
    },
    {
      id: "underwater",
      name: "Underwater",
      description: "Liquid-like distortion",
      parameters: {
        intensity: 0.015,
        scale: 4.0,
        speed: 0.3,
        vertical: 0.8,
        octaves: 3,
      },
    },
  ],
};
