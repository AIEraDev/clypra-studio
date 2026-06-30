/**
 * Spotlight Effect
 *
 * Dramatic spotlight effect on subject using mask-based vignette.
 * Consumes mask feature map from feature providers.
 *
 * Phase 5 Week 9 - Body Effect #3
 */

export const spotlightEffect = {
  id: "body.spotlight",
  name: "Spotlight",
  version: "1.0.0",
  category: "body",
  description: "Dramatic spotlight effect on subject",

  schema: {
    parameters: {
      intensity: {
        type: "number",
        default: 0.7,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: "Darkness",
        description: "How dark the background becomes",
      },
      falloff: {
        type: "number",
        default: 1.0,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: "Falloff",
        description: "Speed of light falloff from subject",
      },
      tint: {
        type: "color",
        default: "#000000",
        label: "Shadow Tint",
        description: "Color tint for darkened areas",
      },
      warmth: {
        type: "number",
        default: 0.0,
        min: -0.5,
        max: 0.5,
        step: 0.05,
        label: "Light Warmth",
        description: "Warm (orange) or cool (blue) light temperature",
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
    // Distance Field Pass - Create smooth distance from mask edges
    {
      id: "distance-field",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uMask;
          uniform vec2 uResolution;
          uniform float uFalloff;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            float mask = texture2D(uMask, vUv).a;
            
            // Simple distance approximation
            // Sample in expanding rings to estimate distance
            float distance = 0.0;
            float maxDist = 100.0 * uFalloff;
            
            if (mask < 0.5) {
              // We're outside the mask, find nearest edge
              for (float r = 1.0; r <= maxDist; r += 2.0) {
                float samples = 8.0 * r;
                float angleStep = 6.283185 / samples;
                
                for (float a = 0.0; a < 6.283185; a += angleStep) {
                  vec2 offset = vec2(cos(a), sin(a)) * r * texelSize;
                  float sample = texture2D(uMask, vUv + offset).a;
                  
                  if (sample > 0.5) {
                    distance = r;
                    break;
                  }
                }
                
                if (distance > 0.0) break;
              }
              
              if (distance == 0.0) distance = maxDist;
            }
            
            // Normalize distance
            float normalizedDist = clamp(distance / maxDist, 0.0, 1.0);
            
            gl_FragColor = vec4(vec3(normalizedDist), 1.0);
          }
        `,
        uniforms: {
          uMask: { type: "Texture", value: "@input.mask" },
          uResolution: { type: "vec2", value: "resolution" },
          uFalloff: { type: "float", value: "@params.falloff" },
        },
      },
      inputs: {
        mask: { type: "Texture" },
      },
      outputs: {
        distanceField: { type: "Texture" },
      },
    },
    // Spotlight Application Pass
    {
      id: "spotlight",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform sampler2D uMask;
          uniform sampler2D uDistanceField;
          uniform vec3 uTint;
          uniform float uIntensity;
          uniform float uFalloff;
          uniform float uWarmth;
          
          varying vec2 vUv;
          
          void main() {
            vec3 color = texture2D(uSource, vUv).rgb;
            float mask = texture2D(uMask, vUv).a;
            float distance = texture2D(uDistanceField, vUv).r;
            
            // Calculate light intensity based on mask and distance
            float light = mask;
            
            // Apply falloff
            float falloffCurve = pow(1.0 - distance, 2.0 / max(uFalloff, 0.1));
            light = mix(falloffCurve, light, 0.5);
            
            // Smooth falloff at edges
            light = smoothstep(0.0, 0.3, light);
            
            // Calculate darkness multiplier
            float darkness = 1.0 - (1.0 - light) * uIntensity;
            
            // Apply tint to darkened areas
            vec3 tintedColor = mix(uTint, color, darkness);
            
            // Apply darkness
            vec3 result = tintedColor * darkness;
            
            // Add subtle warm/cool color temperature to lit areas
            if (uWarmth != 0.0) {
              vec3 warmColor = uWarmth > 0.0 
                ? vec3(1.0, 0.9, 0.8)  // Warm (orange)
                : vec3(0.8, 0.9, 1.0); // Cool (blue)
              
              float warmAmount = abs(uWarmth) * light;
              result = mix(result, result * warmColor, warmAmount);
            }
            
            gl_FragColor = vec4(result, 1.0);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uMask: { type: "Texture", value: "@input.mask" },
          uDistanceField: { type: "Texture", value: "@distance-field.distanceField" },
          uTint: { type: "vec3", value: "@params.tint" },
          uIntensity: { type: "float", value: "@params.intensity" },
          uFalloff: { type: "float", value: "@params.falloff" },
          uWarmth: { type: "float", value: "@params.warmth" },
        },
      },
      inputs: {
        source: { type: "Texture" },
        mask: { type: "Texture" },
        distanceField: { type: "Texture" },
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
    { from: "input", fromPin: "mask", to: "distance-field", toPin: "mask" },
    { from: "input", fromPin: "source", to: "spotlight", toPin: "source" },
    { from: "input", fromPin: "mask", to: "spotlight", toPin: "mask" },
    { from: "distance-field", fromPin: "distanceField", to: "spotlight", toPin: "distanceField" },
    { from: "spotlight", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["body", "mask", "vignette", "lighting", "dramatic", "spotlight"],
    thumbnail: "spotlight-thumb.png",
    previewVideo: "spotlight-preview.mp4",
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
    multipass: true, // 2 passes: distance-field, spotlight
    supportsHalfResolution: false,
  },

  presets: [
    {
      id: "stage-light",
      name: "Stage Light",
      description: "Sharp theatrical spotlight",
      parameters: {
        intensity: 0.85,
        falloff: 1.5,
        tint: "#000000",
        warmth: 0.2,
      },
    },
    {
      id: "soft-spotlight",
      name: "Soft Spotlight",
      description: "Gradual gentle falloff",
      parameters: {
        intensity: 0.6,
        falloff: 0.8,
        tint: "#000000",
        warmth: 0.0,
      },
    },
    {
      id: "blue-moonlight",
      name: "Blue Moonlight",
      description: "Cool blue-tinted shadows",
      parameters: {
        intensity: 0.7,
        falloff: 1.0,
        tint: "#000033",
        warmth: -0.3,
      },
    },
    {
      id: "warm-glow",
      name: "Warm Glow",
      description: "Warm orange atmospheric light",
      parameters: {
        intensity: 0.65,
        falloff: 0.9,
        tint: "#1a0a00",
        warmth: 0.4,
      },
    },
  ],
};
