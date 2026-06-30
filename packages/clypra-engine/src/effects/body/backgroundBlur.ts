/**
 * Background Blur Effect
 *
 * Blur the background while keeping subject sharp using mask inversion.
 * Consumes mask feature map from feature providers.
 *
 * Phase 5 Week 9 - Body Effect #2
 */

export const backgroundBlurEffect = {
  id: "body.background-blur",
  name: "Background Blur",
  version: "1.0.0",
  category: "body",
  description: "Blur the background while keeping subject sharp",

  schema: {
    parameters: {
      blurAmount: {
        type: "number",
        default: 20,
        min: 0,
        max: 50,
        step: 1,
        label: "Blur Amount",
        description: "Strength of background blur",
      },
      edgeSoftness: {
        type: "number",
        default: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: "Edge Softness",
        description: "Softness of the mask edge transition",
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
    // Horizontal Blur Pass (first pass)
    {
      id: "blur-h-1",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform vec2 uResolution;
          uniform float uBlurAmount;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            vec3 result = vec3(0.0);
            
            // Gaussian kernel (9-tap)
            float weights[9] = float[](
              0.05, 0.09, 0.12, 0.15, 0.16, 0.15, 0.12, 0.09, 0.05
            );
            
            float radius = uBlurAmount * 0.5;
            
            for (int i = 0; i < 9; i++) {
              float offset = (float(i) - 4.0) * radius * texelSize.x;
              vec2 sampleUv = vUv + vec2(offset, 0.0);
              result += texture2D(uSource, sampleUv).rgb * weights[i];
            }
            
            gl_FragColor = vec4(result, 1.0);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uResolution: { type: "vec2", value: "resolution" },
          uBlurAmount: { type: "float", value: "@params.blurAmount" },
        },
      },
      inputs: {
        source: { type: "Texture" },
      },
      outputs: {
        blurredH1: { type: "Texture" },
      },
    },
    // Vertical Blur Pass (first pass)
    {
      id: "blur-v-1",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uBlurredH;
          uniform vec2 uResolution;
          uniform float uBlurAmount;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            vec3 result = vec3(0.0);
            
            // Gaussian kernel (9-tap)
            float weights[9] = float[](
              0.05, 0.09, 0.12, 0.15, 0.16, 0.15, 0.12, 0.09, 0.05
            );
            
            float radius = uBlurAmount * 0.5;
            
            for (int i = 0; i < 9; i++) {
              float offset = (float(i) - 4.0) * radius * texelSize.y;
              vec2 sampleUv = vUv + vec2(0.0, offset);
              result += texture2D(uBlurredH, sampleUv).rgb * weights[i];
            }
            
            gl_FragColor = vec4(result, 1.0);
          }
        `,
        uniforms: {
          uBlurredH: { type: "Texture", value: "@blur-h-1.blurredH1" },
          uResolution: { type: "vec2", value: "resolution" },
          uBlurAmount: { type: "float", value: "@params.blurAmount" },
        },
      },
      inputs: {
        blurredH: { type: "Texture" },
      },
      outputs: {
        blurredV1: { type: "Texture" },
      },
    },
    // Horizontal Blur Pass (second pass for stronger blur)
    {
      id: "blur-h-2",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uBlurred;
          uniform vec2 uResolution;
          uniform float uBlurAmount;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            vec3 result = vec3(0.0);
            
            float weights[9] = float[](
              0.05, 0.09, 0.12, 0.15, 0.16, 0.15, 0.12, 0.09, 0.05
            );
            
            float radius = uBlurAmount * 0.5;
            
            for (int i = 0; i < 9; i++) {
              float offset = (float(i) - 4.0) * radius * texelSize.x;
              vec2 sampleUv = vUv + vec2(offset, 0.0);
              result += texture2D(uBlurred, sampleUv).rgb * weights[i];
            }
            
            gl_FragColor = vec4(result, 1.0);
          }
        `,
        uniforms: {
          uBlurred: { type: "Texture", value: "@blur-v-1.blurredV1" },
          uResolution: { type: "vec2", value: "resolution" },
          uBlurAmount: { type: "float", value: "@params.blurAmount" },
        },
      },
      inputs: {
        blurred: { type: "Texture" },
      },
      outputs: {
        blurredH2: { type: "Texture" },
      },
    },
    // Vertical Blur Pass (second pass)
    {
      id: "blur-v-2",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uBlurredH;
          uniform vec2 uResolution;
          uniform float uBlurAmount;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            vec3 result = vec3(0.0);
            
            float weights[9] = float[](
              0.05, 0.09, 0.12, 0.15, 0.16, 0.15, 0.12, 0.09, 0.05
            );
            
            float radius = uBlurAmount * 0.5;
            
            for (int i = 0; i < 9; i++) {
              float offset = (float(i) - 4.0) * radius * texelSize.y;
              vec2 sampleUv = vUv + vec2(0.0, offset);
              result += texture2D(uBlurredH, sampleUv).rgb * weights[i];
            }
            
            gl_FragColor = vec4(result, 1.0);
          }
        `,
        uniforms: {
          uBlurredH: { type: "Texture", value: "@blur-h-2.blurredH2" },
          uResolution: { type: "vec2", value: "resolution" },
          uBlurAmount: { type: "float", value: "@params.blurAmount" },
        },
      },
      inputs: {
        blurredH: { type: "Texture" },
      },
      outputs: {
        background: { type: "Texture" },
      },
    },
    // Composite Pass: Blend sharp foreground with blurred background
    {
      id: "composite",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform sampler2D uBackground;
          uniform sampler2D uMask;
          uniform float uEdgeSoftness;
          
          varying vec2 vUv;
          
          void main() {
            vec3 source = texture2D(uSource, vUv).rgb;
            vec3 background = texture2D(uBackground, vUv).rgb;
            float mask = texture2D(uMask, vUv).a;
            
            // Smooth step for soft edges
            float blend = mask;
            if (uEdgeSoftness > 0.0) {
              float edge = uEdgeSoftness * 0.5;
              blend = smoothstep(0.5 - edge, 0.5 + edge, mask);
            }
            
            // Mix sharp foreground with blurred background
            vec3 result = mix(background, source, blend);
            
            gl_FragColor = vec4(result, 1.0);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uBackground: { type: "Texture", value: "@blur-v-2.background" },
          uMask: { type: "Texture", value: "@input.mask" },
          uEdgeSoftness: { type: "float", value: "@params.edgeSoftness" },
        },
      },
      inputs: {
        source: { type: "Texture" },
        background: { type: "Texture" },
        mask: { type: "Texture" },
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
    { from: "input", fromPin: "source", to: "blur-h-1", toPin: "source" },
    { from: "blur-h-1", fromPin: "blurredH1", to: "blur-v-1", toPin: "blurredH" },
    { from: "blur-v-1", fromPin: "blurredV1", to: "blur-h-2", toPin: "blurred" },
    { from: "blur-h-2", fromPin: "blurredH2", to: "blur-v-2", toPin: "blurredH" },
    { from: "input", fromPin: "source", to: "composite", toPin: "source" },
    { from: "blur-v-2", fromPin: "background", to: "composite", toPin: "background" },
    { from: "input", fromPin: "mask", to: "composite", toPin: "mask" },
    { from: "composite", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["body", "mask", "blur", "background", "bokeh", "portrait"],
    thumbnail: "background-blur-thumb.png",
    previewVideo: "background-blur-preview.mp4",
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
    multipass: true, // 5 passes: blur-h-1, blur-v-1, blur-h-2, blur-v-2, composite
    supportsHalfResolution: true, // Blur can be done at half res for performance
  },

  presets: [
    {
      id: "soft-bokeh",
      name: "Soft Bokeh",
      description: "Light blur for subtle separation",
      parameters: {
        blurAmount: 15,
        edgeSoftness: 0.3,
      },
    },
    {
      id: "studio-portrait",
      name: "Studio Portrait",
      description: "Medium blur for professional portraits",
      parameters: {
        blurAmount: 25,
        edgeSoftness: 0.2,
      },
    },
    {
      id: "extreme-blur",
      name: "Extreme Blur",
      description: "Heavy blur for maximum subject isolation",
      parameters: {
        blurAmount: 40,
        edgeSoftness: 0.15,
      },
    },
    {
      id: "sharp-edge",
      name: "Sharp Edge",
      description: "Strong blur with crisp mask edge",
      parameters: {
        blurAmount: 30,
        edgeSoftness: 0.05,
      },
    },
  ],
};
