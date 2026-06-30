/**
 * Luma Wipe Transition
 *
 * Brightness-based mask transition using luminance threshold.
 * Reveals next clip based on brightness levels.
 *
 * Phase 4 Week 7 - Transition #4
 */

export const lumaWipeTransition = {
  id: "transition.luma-wipe",
  name: "Luma Wipe",
  version: "1.0.0",
  category: "transition",
  description: "Brightness-based reveal with gradient wipe",

  schema: {
    parameters: {
      softness: {
        type: "number",
        default: 0.1,
        min: 0.0,
        max: 0.5,
        step: 0.01,
        label: "Softness",
        description: "Edge softness of the wipe",
      },
      invert: {
        type: "boolean",
        default: false,
        label: "Invert",
        description: "Reverse the wipe direction",
      },
      gradient: {
        type: "string",
        default: "diagonal",
        options: ["horizontal", "vertical", "diagonal", "radial", "noise"],
        label: "Gradient Type",
        description: "Pattern for the wipe",
      },
      easing: {
        type: "string",
        default: "linear",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        label: "Easing",
        description: "Transition timing curve",
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
      id: "luma-wipe",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uClipA;
          uniform sampler2D uClipB;
          uniform float uProgress;
          uniform float uSoftness;
          uniform float uInvert;
          uniform float uGradient; // 0=horizontal, 1=vertical, 2=diagonal, 3=radial, 4=noise
          uniform float uEasing;
          
          varying vec2 vUv;
          
          // Easing functions
          float easeIn(float t) {
            return t * t;
          }
          
          float easeOut(float t) {
            return t * (2.0 - t);
          }
          
          float easeInOut(float t) {
            return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t;
          }
          
          float applyEasing(float t, float easingType) {
            if (easingType < 0.5) return t; // linear
            if (easingType < 1.5) return easeIn(t);
            if (easingType < 2.5) return easeOut(t);
            return easeInOut(t);
          }
          
          // Random function for noise gradient
          float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          // Generate gradient value based on type
          float getGradient(vec2 uv, float gradientType) {
            if (gradientType < 0.5) {
              // Horizontal
              return uv.x;
            } else if (gradientType < 1.5) {
              // Vertical
              return uv.y;
            } else if (gradientType < 2.5) {
              // Diagonal
              return (uv.x + uv.y) * 0.5;
            } else if (gradientType < 3.5) {
              // Radial
              vec2 center = vec2(0.5, 0.5);
              return length(uv - center) * 1.414; // normalize to 0-1
            } else {
              // Noise
              return rand(floor(uv * 20.0) / 20.0);
            }
          }
          
          void main() {
            float t = applyEasing(uProgress, uEasing);
            
            // Get gradient value
            float gradient = getGradient(vUv, uGradient);
            
            // Invert if needed
            if (uInvert > 0.5) {
              gradient = 1.0 - gradient;
            }
            
            // Calculate threshold with softness
            float threshold = t;
            float lower = threshold - uSoftness;
            float upper = threshold + uSoftness;
            
            // Smooth transition at threshold
            float mask = smoothstep(lower, upper, gradient);
            
            // Sample both clips
            vec4 colorA = texture2D(uClipA, vUv);
            vec4 colorB = texture2D(uClipB, vUv);
            
            // Blend based on mask
            vec4 color = mix(colorA, colorB, mask);
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uClipA: { type: "Texture", value: "@inputA.clipA" },
          uClipB: { type: "Texture", value: "@inputB.clipB" },
          uProgress: { type: "float", value: "progress" },
          uSoftness: { type: "float", value: "@params.softness" },
          uInvert: { type: "float", value: "@params.invert ? 1.0 : 0.0" },
          uGradient: { type: "float", value: "@params.gradient === 'horizontal' ? 0.0 : @params.gradient === 'vertical' ? 1.0 : @params.gradient === 'diagonal' ? 2.0 : @params.gradient === 'radial' ? 3.0 : 4.0" },
          uEasing: { type: "float", value: "@params.easing === 'easeIn' ? 1.0 : @params.easing === 'easeOut' ? 2.0 : @params.easing === 'easeInOut' ? 3.0 : 0.0" },
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
    { from: "inputA", fromPin: "clipA", to: "luma-wipe", toPin: "clipA" },
    { from: "inputB", fromPin: "clipB", to: "luma-wipe", toPin: "clipB" },
    { from: "luma-wipe", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["transition", "wipe", "luma", "mask", "reveal"],
    thumbnail: "luma-wipe-thumb.png",
    previewVideo: "luma-wipe-preview.mp4",
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
      id: "diagonal-wipe",
      name: "Diagonal Wipe",
      description: "Classic diagonal reveal",
      parameters: {
        softness: 0.1,
        invert: false,
        gradient: "diagonal",
        easing: "linear",
      },
    },
    {
      id: "radial-wipe",
      name: "Radial Wipe",
      description: "Circular reveal from center",
      parameters: {
        softness: 0.15,
        invert: false,
        gradient: "radial",
        easing: "easeInOut",
      },
    },
    {
      id: "horizontal-wipe",
      name: "Horizontal Wipe",
      description: "Left to right reveal",
      parameters: {
        softness: 0.05,
        invert: false,
        gradient: "horizontal",
        easing: "linear",
      },
    },
    {
      id: "noise-dissolve",
      name: "Noise Dissolve",
      description: "Random pixelated reveal",
      parameters: {
        softness: 0.2,
        invert: false,
        gradient: "noise",
        easing: "linear",
      },
    },
  ],
};
