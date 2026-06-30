/**
 * Glitch Transition
 *
 * Random displacement and artifacts during transition.
 * Creates chaotic, digital glitch effect between clips.
 *
 * Phase 4 Week 7 - Transition #5
 */

export const glitchTransition = {
  id: "transition.glitch",
  name: "Glitch",
  version: "1.0.0",
  category: "transition",
  description: "Chaotic digital glitch with displacement and artifacts",

  schema: {
    parameters: {
      intensity: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Intensity",
        description: "Glitch effect strength",
      },
      blockSize: {
        type: "number",
        default: 10.0,
        min: 1.0,
        max: 50.0,
        step: 1.0,
        label: "Block Size",
        description: "Size of glitch blocks",
      },
      rgbShift: {
        type: "boolean",
        default: true,
        label: "RGB Shift",
        description: "Add chromatic aberration",
      },
      noise: {
        type: "boolean",
        default: true,
        label: "Noise",
        description: "Add random noise artifacts",
      },
    },
    inputs: {
      clipA: {
        type: "Texture",
        required: true,
        label: "Clip A (Outgoing)",
      },
      clipB: {
        type: "Texture",
        required: true,
        label: "Clip B (Incoming)",
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
      id: "inputA",
      type: "Input",
      params: {},
      outputs: {
        clipA: { type: "Texture" },
      },
    },
    {
      id: "inputB",
      type: "Input",
      params: {},
      outputs: {
        clipB: { type: "Texture" },
      },
    },
    {
      id: "glitch",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uClipA;
          uniform sampler2D uClipB;
          uniform float uProgress;
          uniform float uIntensity;
          uniform float uBlockSize;
          uniform float uRgbShift;
          uniform float uNoise;
          uniform vec2 uResolution;
          
          varying vec2 vUv;
          
          // Random function
          float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          // Block-based random
          float blockRand(vec2 uv, float blockSize) {
            vec2 block = floor(uv * uResolution / blockSize);
            return rand(block + vec2(uProgress * 10.0));
          }
          
          void main() {
            vec2 uv = vUv;
            float t = uProgress;
            
            // Glitch intensity peaks at mid-transition
            float glitchAmount = uIntensity * (1.0 - abs(t * 2.0 - 1.0));
            
            // Block-based displacement
            float blockR = blockRand(uv, uBlockSize);
            
            if (blockR < glitchAmount) {
              // Random horizontal displacement
              float displacement = (rand(vec2(blockR, t)) - 0.5) * glitchAmount * 0.3;
              uv.x += displacement;
              
              // Random vertical jitter (smaller)
              float jitter = (rand(vec2(blockR + 1.0, t)) - 0.5) * glitchAmount * 0.1;
              uv.y += jitter;
            }
            
            // Clamp UVs
            uv = clamp(uv, 0.0, 1.0);
            
            // RGB shift during glitch
            vec4 colorA, colorB;
            
            if (uRgbShift > 0.5 && glitchAmount > 0.1) {
              float shiftAmount = glitchAmount * 0.01;
              
              // Clip A with RGB shift
              float rA = texture2D(uClipA, uv + vec2(shiftAmount, 0.0)).r;
              float gA = texture2D(uClipA, uv).g;
              float bA = texture2D(uClipA, uv - vec2(shiftAmount, 0.0)).b;
              colorA = vec4(rA, gA, bA, 1.0);
              
              // Clip B with RGB shift
              float rB = texture2D(uClipB, uv + vec2(shiftAmount, 0.0)).r;
              float gB = texture2D(uClipB, uv).g;
              float bB = texture2D(uClipB, uv - vec2(shiftAmount, 0.0)).b;
              colorB = vec4(rB, gB, bB, 1.0);
            } else {
              colorA = texture2D(uClipA, uv);
              colorB = texture2D(uClipB, uv);
            }
            
            // Random block switching during glitch
            float blockSwitch = blockRand(vUv, uBlockSize * 0.5);
            float threshold = mix(t, 0.5, glitchAmount);
            
            vec4 color;
            if (blockSwitch < threshold) {
              color = colorB;
            } else {
              color = mix(colorA, colorB, t);
            }
            
            // Add noise artifacts during glitch
            if (uNoise > 0.5 && glitchAmount > 0.2) {
              float noiseVal = rand(vUv * 500.0 + vec2(t * 100.0));
              if (noiseVal > 0.95) {
                color.rgb = vec3(noiseVal);
              }
            }
            
            // Occasional full-frame corruption
            if (glitchAmount > 0.4) {
              float corruptionChance = rand(vec2(floor(t * 60.0)));
              if (corruptionChance < glitchAmount * 0.1) {
                // Invert colors briefly
                color.rgb = 1.0 - color.rgb;
              }
            }
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uClipA: { type: "Texture", value: "@inputA.clipA" },
          uClipB: { type: "Texture", value: "@inputB.clipB" },
          uProgress: { type: "float", value: "progress" },
          uIntensity: { type: "float", value: "@params.intensity" },
          uBlockSize: { type: "float", value: "@params.blockSize" },
          uRgbShift: { type: "float", value: "@params.rgbShift ? 1.0 : 0.0" },
          uNoise: { type: "float", value: "@params.noise ? 1.0 : 0.0" },
          uResolution: { type: "vec2", value: "resolution" },
        },
      },
      inputs: {
        clipA: { type: "Texture" },
        clipB: { type: "Texture" },
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
    { from: "inputA", fromPin: "clipA", to: "glitch", toPin: "clipA" },
    { from: "inputB", fromPin: "clipB", to: "glitch", toPin: "clipB" },
    { from: "glitch", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["transition", "glitch", "digital", "chaos", "corruption", "artifacts"],
    thumbnail: "glitch-thumb.png",
    previewVideo: "glitch-preview.mp4",
  },

  capabilities: {
    temporal: true,
    stateful: false,
    spatial: true,
    geometry: false,
    inputsCount: 2,
  },

  requirements: {
    temporalRadius: 0,
    preferredPrecision: "fp16",
    multipass: false,
    supportsHalfResolution: false,
  },

  presets: [
    {
      id: "subtle-glitch",
      name: "Subtle Glitch",
      description: "Light digital artifacts",
      parameters: {
        intensity: 0.3,
        blockSize: 20.0,
        rgbShift: true,
        noise: false,
      },
    },
    {
      id: "medium-glitch",
      name: "Medium Glitch",
      description: "Balanced glitch effect",
      parameters: {
        intensity: 0.5,
        blockSize: 10.0,
        rgbShift: true,
        noise: true,
      },
    },
    {
      id: "heavy-corruption",
      name: "Heavy Corruption",
      description: "Chaotic digital breakdown",
      parameters: {
        intensity: 0.8,
        blockSize: 5.0,
        rgbShift: true,
        noise: true,
      },
    },
    {
      id: "clean-switch",
      name: "Clean Block Switch",
      description: "Block-based without artifacts",
      parameters: {
        intensity: 0.4,
        blockSize: 15.0,
        rgbShift: false,
        noise: false,
      },
    },
  ],
};
