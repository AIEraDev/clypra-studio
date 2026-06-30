/**
 * Cross Dissolve Transition
 *
 * Simple alpha blend between two clips.
 * The fundamental transition effect.
 *
 * Phase 4 Week 7 - Transition #1
 */

export const crossDissolveTransition = {
  id: "transition.cross-dissolve",
  name: "Cross Dissolve",
  version: "1.0.0",
  category: "transition",
  description: "Classic fade between two clips with alpha blending",

  schema: {
    parameters: {
      easing: {
        type: "string",
        default: "linear",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "smoothstep"],
        label: "Easing",
        description: "Transition timing curve",
      },
      fadeColor: {
        type: "color",
        default: "#000000",
        label: "Fade Color",
        description: "Optional color to fade through (none = direct blend)",
      },
      useFadeColor: {
        type: "boolean",
        default: false,
        label: "Fade Through Color",
        description: "Fade to color then to next clip",
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
      id: "dissolve",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uClipA;
          uniform sampler2D uClipB;
          uniform float uProgress;
          uniform float uEasing;
          uniform vec3 uFadeColor;
          uniform float uUseFadeColor;
          
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
          
          float smoothstep(float t) {
            return t * t * (3.0 - 2.0 * t);
          }
          
          float applyEasing(float t, float easingType) {
            if (easingType < 0.5) return t; // linear
            if (easingType < 1.5) return easeIn(t);
            if (easingType < 2.5) return easeOut(t);
            if (easingType < 3.5) return easeInOut(t);
            return smoothstep(t);
          }
          
          void main() {
            float t = applyEasing(uProgress, uEasing);
            
            vec4 colorA = texture2D(uClipA, vUv);
            vec4 colorB = texture2D(uClipB, vUv);
            
            vec4 result;
            
            if (uUseFadeColor > 0.5) {
              // Fade through color
              if (t < 0.5) {
                // Fade A to color
                float fadeOut = t * 2.0;
                result = mix(colorA, vec4(uFadeColor, 1.0), fadeOut);
              } else {
                // Fade color to B
                float fadeIn = (t - 0.5) * 2.0;
                result = mix(vec4(uFadeColor, 1.0), colorB, fadeIn);
              }
            } else {
              // Direct blend
              result = mix(colorA, colorB, t);
            }
            
            gl_FragColor = result;
          }
        `,
        uniforms: {
          uClipA: { type: "Texture", value: "@inputA.clipA" },
          uClipB: { type: "Texture", value: "@inputB.clipB" },
          uProgress: { type: "float", value: "progress" },
          uEasing: { type: "float", value: "@params.easing === 'easeIn' ? 1.0 : @params.easing === 'easeOut' ? 2.0 : @params.easing === 'easeInOut' ? 3.0 : @params.easing === 'smoothstep' ? 4.0 : 0.0" },
          uFadeColor: { type: "vec3", value: "@params.fadeColor" },
          uUseFadeColor: { type: "float", value: "@params.useFadeColor ? 1.0 : 0.0" },
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
    { from: "inputA", fromPin: "clipA", to: "dissolve", toPin: "clipA" },
    { from: "inputB", fromPin: "clipB", to: "dissolve", toPin: "clipB" },
    { from: "dissolve", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["transition", "blend", "dissolve", "fade", "alpha"],
    thumbnail: "cross-dissolve-thumb.png",
    previewVideo: "cross-dissolve-preview.mp4",
  },

  capabilities: {
    temporal: true,
    stateful: false,
    spatial: false,
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
      id: "linear-dissolve",
      name: "Linear Dissolve",
      description: "Constant speed blend",
      parameters: {
        easing: "linear",
        fadeColor: "#000000",
        useFadeColor: false,
      },
    },
    {
      id: "smooth-dissolve",
      name: "Smooth Dissolve",
      description: "Natural eased transition",
      parameters: {
        easing: "smoothstep",
        fadeColor: "#000000",
        useFadeColor: false,
      },
    },
    {
      id: "fade-to-black",
      name: "Fade to Black",
      description: "Classic fade through black",
      parameters: {
        easing: "linear",
        fadeColor: "#000000",
        useFadeColor: true,
      },
    },
    {
      id: "fade-to-white",
      name: "Fade to White",
      description: "Bright transition through white",
      parameters: {
        easing: "smoothstep",
        fadeColor: "#FFFFFF",
        useFadeColor: true,
      },
    },
  ],
};
