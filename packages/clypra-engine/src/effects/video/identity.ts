/**
 * Identity Effect
 *
 * Pure pass-through with no modifications.
 * Used for Capability 1 validation: texture upload, reuse, frame sync, seeking, playback.
 *
 * This is the foundation - if Identity isn't perfect, everything built on top will inherit problems.
 */

export const identityEffect = {
  id: "video.identity",
  name: "Identity (No Effect)",
  version: "1.0.0",
  category: "video",
  description: "Pass-through with no modifications - validates core rendering pipeline",

  schema: {
    parameters: {},
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
      id: "passthrough",
      type: "ShaderNode",
      params: {
        shader: "identity", // Maps to identity filter
        uniforms: {},
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
    { from: "input", fromPin: "source", to: "passthrough", toPin: "source" },
    { from: "passthrough", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["video", "testing", "validation", "identity"],
    thumbnail: null,
    previewVideo: null,
  },

  capabilities: {
    temporal: false,
    stateful: false,
    spatial: false,
    geometry: false,
    inputsCount: 1,
  },

  requirements: {
    temporalRadius: 0,
    preferredPrecision: "fp16",
    multipass: false,
    supportsHalfResolution: true,
  },

  presets: [],
};
