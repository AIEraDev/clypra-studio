/**
 * Zoom Transition
 *
 * Scale interpolation with blend - zoom in/out while transitioning.
 * Creates dynamic motion between clips.
 *
 * Phase 4 Week 7 - Transition #3
 */

export const zoomTransition = {
  id: "transition.zoom",
  name: "Zoom",
  version: "1.0.0",
  category: "transition",
  description: "Zoom in or out while transitioning between clips",

  schema: {
    parameters: {
      direction: {
        type: "string",
        default: "in",
        options: ["in", "out"],
        label: "Direction",
        description: "Zoom direction",
      },
      intensity: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: "Intensity",
        description: "Zoom amount",
      },
      easing: {
        type: "string",
        default: "easeInOut",
        options: ["linear", "easeIn", "easeOut", "easeInOut"],
        label: "Easing",
        description: "Transition timing curve",
      },
      blur: {
        type: "boolean",
        default: true,
        label: "Motion Blur",
        description: "Add blur during zoom",
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
      id: "zoom",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uClipA;
          uniform sampler2D uClipB;
          uniform float uProgress;
          uniform float uDirection; // 0=in, 1=out
          uniform float uIntensity;
          uniform float uEasing;
          uniform float uBlur;
          
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
          
          vec4 sampleWithBlur(sampler2D tex, vec2 uv, float blurAmount) {
            if (uBlur < 0.5 || blurAmount < 0.01) {
              return texture2D(tex, uv);
            }
            
            // Simple 5-tap blur
            vec4 color = vec4(0.0);
            float offset = blurAmount * 0.01;
            
            color += texture2D(tex, uv) * 0.4;
            color += texture2D(tex, uv + vec2(offset, 0.0)) * 0.15;
            color += texture2D(tex, uv - vec2(offset, 0.0)) * 0.15;
            color += texture2D(tex, uv + vec2(0.0, offset)) * 0.15;
            color += texture2D(tex, uv - vec2(0.0, offset)) * 0.15;
            
            return color;
          }
          
          void main() {
            float t = applyEasing(uProgress, uEasing);
            vec2 center = vec2(0.5, 0.5);
            
            // Calculate zoom scales
            float scaleA, scaleB;
            
            if (uDirection < 0.5) {
              // Zoom in: A shrinks, B grows from small
              scaleA = 1.0 + t * uIntensity;
              scaleB = 1.0 - (1.0 - t) * uIntensity;
            } else {
              // Zoom out: A grows, B shrinks to small
              scaleA = 1.0 - t * uIntensity * 0.5;
              scaleB = 1.0 + (1.0 - t) * uIntensity;
            }
            
            // Apply zoom
            vec2 uvA = (vUv - center) / scaleA + center;
            vec2 uvB = (vUv - center) / scaleB + center;
            
            // Blur amount based on zoom speed
            float blurAmountA = abs(scaleA - 1.0) * 2.0;
            float blurAmountB = abs(scaleB - 1.0) * 2.0;
            
            // Sample with optional blur
            vec4 colorA = sampleWithBlur(uClipA, uvA, blurAmountA);
            vec4 colorB = sampleWithBlur(uClipB, uvB, blurAmountB);
            
            // Handle out-of-bounds UVs
            if (uvA.x < 0.0 || uvA.x > 1.0 || uvA.y < 0.0 || uvA.y > 1.0) {
              colorA = vec4(0.0);
            }
            if (uvB.x < 0.0 || uvB.x > 1.0 || uvB.y < 0.0 || uvB.y > 1.0) {
              colorB = vec4(0.0);
            }
            
            // Blend
            vec4 color = mix(colorA, colorB, t);
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uClipA: { type: "Texture", value: "@inputA.clipA" },
          uClipB: { type: "Texture", value: "@inputB.clipB" },
          uProgress: { type: "float", value: "progress" },
          uDirection: { type: "float", value: "@params.direction === 'in' ? 0.0 : 1.0" },
          uIntensity: { type: "float", value: "@params.intensity" },
          uEasing: { type: "float", value: "@params.easing === 'easeIn' ? 1.0 : @params.easing === 'easeOut' ? 2.0 : @params.easing === 'easeInOut' ? 3.0 : 0.0" },
          uBlur: { type: "float", value: "@params.blur ? 1.0 : 0.0" },
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
    { from: "inputA", fromPin: "clipA", to: "zoom", toPin: "clipA" },
    { from: "inputB", fromPin: "clipB", to: "zoom", toPin: "clipB" },
    { from: "zoom", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["transition", "zoom", "scale", "dynamic", "motion"],
    thumbnail: "zoom-thumb.png",
    previewVideo: "zoom-preview.mp4",
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
      id: "zoom-in",
      name: "Zoom In",
      description: "Zoom into next clip",
      parameters: {
        direction: "in",
        intensity: 0.5,
        easing: "easeInOut",
        blur: true,
      },
    },
    {
      id: "zoom-out",
      name: "Zoom Out",
      description: "Zoom out to next clip",
      parameters: {
        direction: "out",
        intensity: 0.5,
        easing: "easeInOut",
        blur: true,
      },
    },
    {
      id: "dramatic-zoom-in",
      name: "Dramatic Zoom In",
      description: "Strong zoom effect",
      parameters: {
        direction: "in",
        intensity: 1.2,
        easing: "easeIn",
        blur: true,
      },
    },
    {
      id: "subtle-zoom",
      name: "Subtle Zoom",
      description: "Gentle zoom transition",
      parameters: {
        direction: "in",
        intensity: 0.2,
        easing: "easeInOut",
        blur: false,
      },
    },
  ],
};
