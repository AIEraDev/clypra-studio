/**
 * Push Transition
 *
 * Spatial offset with clipping - one clip pushes the other off screen.
 * Supports 4 directions: left, right, up, down.
 *
 * Phase 4 Week 7 - Transition #2
 */

export const pushTransition = {
  id: "transition.push",
  name: "Push",
  version: "1.0.0",
  category: "transition",
  description: "One clip pushes the other off screen",

  schema: {
    parameters: {
      direction: {
        type: "string",
        default: "left",
        options: ["left", "right", "up", "down"],
        label: "Direction",
        description: "Direction to push",
      },
      easing: {
        type: "string",
        default: "easeInOut",
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
      id: "push",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uClipA;
          uniform sampler2D uClipB;
          uniform float uProgress;
          uniform float uDirection; // 0=left, 1=right, 2=up, 3=down
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
          
          void main() {
            float t = applyEasing(uProgress, uEasing);
            vec2 uv = vUv;
            
            // Calculate offset based on direction
            vec2 offsetA = vec2(0.0);
            vec2 offsetB = vec2(0.0);
            
            if (uDirection < 0.5) {
              // Push left
              offsetA = vec2(-t, 0.0);
              offsetB = vec2(1.0 - t, 0.0);
            } else if (uDirection < 1.5) {
              // Push right
              offsetA = vec2(t, 0.0);
              offsetB = vec2(-1.0 + t, 0.0);
            } else if (uDirection < 2.5) {
              // Push up
              offsetA = vec2(0.0, -t);
              offsetB = vec2(0.0, 1.0 - t);
            } else {
              // Push down
              offsetA = vec2(0.0, t);
              offsetB = vec2(0.0, -1.0 + t);
            }
            
            vec2 uvA = uv + offsetA;
            vec2 uvB = uv + offsetB;
            
            vec4 color;
            
            // Check which clip is visible at this UV coordinate
            if (uvA.x >= 0.0 && uvA.x <= 1.0 && uvA.y >= 0.0 && uvA.y <= 1.0) {
              color = texture2D(uClipA, uvA);
            } else if (uvB.x >= 0.0 && uvB.x <= 1.0 && uvB.y >= 0.0 && uvB.y <= 1.0) {
              color = texture2D(uClipB, uvB);
            } else {
              color = vec4(0.0, 0.0, 0.0, 1.0);
            }
            
            gl_FragColor = color;
          }
        `,
        uniforms: {
          uClipA: { type: "Texture", value: "@inputA.clipA" },
          uClipB: { type: "Texture", value: "@inputB.clipB" },
          uProgress: { type: "float", value: "progress" },
          uDirection: { type: "float", value: "@params.direction === 'left' ? 0.0 : @params.direction === 'right' ? 1.0 : @params.direction === 'up' ? 2.0 : 3.0" },
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
    { from: "inputA", fromPin: "clipA", to: "push", toPin: "clipA" },
    { from: "inputB", fromPin: "clipB", to: "push", toPin: "clipB" },
    { from: "push", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["transition", "push", "slide", "spatial", "directional"],
    thumbnail: "push-thumb.png",
    previewVideo: "push-preview.mp4",
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
      id: "push-left",
      name: "Push Left",
      description: "Push old clip to the left",
      parameters: {
        direction: "left",
        easing: "easeInOut",
      },
    },
    {
      id: "push-right",
      name: "Push Right",
      description: "Push old clip to the right",
      parameters: {
        direction: "right",
        easing: "easeInOut",
      },
    },
    {
      id: "push-up",
      name: "Push Up",
      description: "Push old clip upward",
      parameters: {
        direction: "up",
        easing: "easeInOut",
      },
    },
    {
      id: "push-down",
      name: "Push Down",
      description: "Push old clip downward",
      parameters: {
        direction: "down",
        easing: "easeInOut",
      },
    },
  ],
};
