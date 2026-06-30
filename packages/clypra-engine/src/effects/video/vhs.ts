/**
 * VHS Effect
 *
 * Authentic VHS tape look with scanlines, RGB shift, tape noise, and tracking errors.
 * Emulates analog video artifacts.
 *
 * Phase 3 Week 6 - Video Effect #2
 */

export const vhsEffect = {
  id: "video.vhs",
  name: "VHS",
  version: "1.0.0",
  category: "video",
  description: "Authentic VHS tape look with analog artifacts",

  schema: {
    parameters: {
      distortion: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Distortion",
        description: "Amount of tape distortion",
      },
      rgbShift: {
        type: "number",
        default: 0.003,
        min: 0.0,
        max: 0.02,
        step: 0.001,
        label: "RGB Shift",
        description: "Chromatic aberration strength",
      },
      scanlines: {
        type: "number",
        default: 0.3,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Scanlines",
        description: "Scanline intensity",
      },
      noise: {
        type: "number",
        default: 0.15,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Tape Noise",
        description: "Random noise artifacts",
      },
      tracking: {
        type: "number",
        default: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: "Tracking Errors",
        description: "Horizontal sync issues",
      },
      jitter: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: "Jitter Amount",
        description: "Frame jitter intensity",
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
      id: "vhs",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform vec2 uResolution;
          uniform float uTime;
          uniform float uDistortion;
          uniform float uRgbShift;
          uniform float uScanlines;
          uniform float uNoise;
          uniform float uTracking;
          uniform float uJitter;
          
          varying vec2 vUv;
          
          // Random function
          float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          // Noise function
          float noise(vec2 p) {
            return rand(floor(p * 500.0) + uTime);
          }
          
          void main() {
            vec2 uv = vUv;
            
            // Tracking errors (horizontal sync issues)
            if (uTracking > 0.001) {
              float trackingLine = floor(uv.y * 10.0);
              float trackingOffset = rand(vec2(trackingLine, floor(uTime * 2.0)));
              if (trackingOffset > (1.0 - uTracking * 0.5)) {
                uv.x += (trackingOffset - 0.5) * uTracking * 0.1;
              }
            }
            
            // Frame jitter
            if (uJitter > 0.001) {
              float jitterX = (rand(vec2(uTime * 0.5, 0.0)) - 0.5) * uJitter * 0.01;
              float jitterY = (rand(vec2(uTime * 0.5, 1.0)) - 0.5) * uJitter * 0.01;
              uv += vec2(jitterX, jitterY);
            }
            
            // Distortion (wave)
            if (uDistortion > 0.001) {
              float distortAmount = sin(uv.y * 10.0 + uTime * 2.0) * uDistortion * 0.02;
              uv.x += distortAmount;
            }
            
            // RGB shift (chromatic aberration)
            vec3 color;
            if (uRgbShift > 0.001) {
              float r = texture2D(uSource, uv + vec2(uRgbShift, 0.0)).r;
              float g = texture2D(uSource, uv).g;
              float b = texture2D(uSource, uv - vec2(uRgbShift, 0.0)).b;
              color = vec3(r, g, b);
            } else {
              color = texture2D(uSource, uv).rgb;
            }
            
            // Scanlines
            if (uScanlines > 0.001) {
              float scanline = sin(uv.y * uResolution.y * 2.0) * 0.5 + 0.5;
              color *= 1.0 - (scanline * uScanlines * 0.3);
            }
            
            // Tape noise
            if (uNoise > 0.001) {
              float noiseVal = noise(uv);
              color += (noiseVal - 0.5) * uNoise * 0.2;
            }
            
            // Vignette (CRT edge darkening)
            vec2 position = vUv - 0.5;
            float vignette = 1.0 - dot(position, position) * 0.5;
            color *= vignette;
            
            // Slight color shift (VHS color degradation)
            color = mix(color, vec3(dot(color, vec3(0.299, 0.587, 0.114))), 0.1);
            
            gl_FragColor = vec4(color, 1.0);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uResolution: { type: "vec2", value: "resolution" },
          uTime: { type: "float", value: "time" },
          uDistortion: { type: "float", value: "@params.distortion" },
          uRgbShift: { type: "float", value: "@params.rgbShift" },
          uScanlines: { type: "float", value: "@params.scanlines" },
          uNoise: { type: "float", value: "@params.noise" },
          uTracking: { type: "float", value: "@params.tracking" },
          uJitter: { type: "float", value: "@params.jitter" },
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
    { from: "input", fromPin: "source", to: "vhs", toPin: "source" },
    { from: "vhs", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["video", "vhs", "retro", "analog", "distortion", "vintage"],
    thumbnail: "vhs-thumb.png",
    previewVideo: "vhs-preview.mp4",
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
      id: "subtle-vhs",
      name: "Subtle VHS",
      description: "Light VHS look with minimal artifacts",
      parameters: {
        distortion: 0.2,
        rgbShift: 0.001,
        scanlines: 0.2,
        noise: 0.08,
        tracking: 0.1,
        jitter: 0.2,
      },
    },
    {
      id: "classic-vhs",
      name: "Classic VHS",
      description: "Authentic 80s VHS tape look",
      parameters: {
        distortion: 0.5,
        rgbShift: 0.003,
        scanlines: 0.3,
        noise: 0.15,
        tracking: 0.2,
        jitter: 0.5,
      },
    },
    {
      id: "damaged-tape",
      name: "Damaged Tape",
      description: "Heavily degraded VHS tape",
      parameters: {
        distortion: 0.8,
        rgbShift: 0.006,
        scanlines: 0.5,
        noise: 0.3,
        tracking: 0.4,
        jitter: 1.0,
      },
    },
  ],
};
