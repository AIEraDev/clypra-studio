/**
 * Particle Aura Effect
 *
 * Animated particles around subject edges using edge detection and particle simulation.
 * Consumes mask feature map from feature providers.
 *
 * Phase 5 Week 9 - Body Effect #4 (Most Complex)
 */

export const particleAuraEffect = {
  id: "body.particle-aura",
  name: "Particle Aura",
  version: "1.0.0",
  category: "body",
  description: "Animated particles around subject edges",

  schema: {
    parameters: {
      particleCount: {
        type: "number",
        default: 50,
        min: 10,
        max: 200,
        step: 10,
        label: "Particle Count",
        description: "Number of visible particles",
      },
      particleSize: {
        type: "number",
        default: 3.0,
        min: 1.0,
        max: 10.0,
        step: 0.5,
        label: "Particle Size",
        description: "Size of each particle in pixels",
      },
      speed: {
        type: "number",
        default: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: "Animation Speed",
        description: "Speed of particle movement",
      },
      color: {
        type: "color",
        default: "#FFFFFF",
        label: "Particle Color",
        description: "Color of the particles",
      },
      spread: {
        type: "number",
        default: 10.0,
        min: 0.0,
        max: 50.0,
        step: 1.0,
        label: "Spread Distance",
        description: "How far particles drift from edges",
      },
      glow: {
        type: "number",
        default: 0.3,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: "Glow Amount",
        description: "Soft glow around particles",
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
    // Edge Detection Pass
    {
      id: "edge-detect",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uMask;
          uniform vec2 uResolution;
          
          varying vec2 vUv;
          
          void main() {
            vec2 texelSize = 1.0 / uResolution;
            
            // Sobel edge detection
            float tl = texture2D(uMask, vUv + vec2(-texelSize.x, texelSize.y)).a;
            float t = texture2D(uMask, vUv + vec2(0.0, texelSize.y)).a;
            float tr = texture2D(uMask, vUv + vec2(texelSize.x, texelSize.y)).a;
            float l = texture2D(uMask, vUv + vec2(-texelSize.x, 0.0)).a;
            float r = texture2D(uMask, vUv + vec2(texelSize.x, 0.0)).a;
            float bl = texture2D(uMask, vUv + vec2(-texelSize.x, -texelSize.y)).a;
            float b = texture2D(uMask, vUv + vec2(0.0, -texelSize.y)).a;
            float br = texture2D(uMask, vUv + vec2(texelSize.x, -texelSize.y)).a;
            
            float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
            float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
            
            float edge = sqrt(gx * gx + gy * gy);
            edge = smoothstep(0.2, 0.6, edge);
            
            gl_FragColor = vec4(edge, edge, edge, edge);
          }
        `,
        uniforms: {
          uMask: { type: "Texture", value: "@input.mask" },
          uResolution: { type: "vec2", value: "resolution" },
        },
      },
      inputs: {
        mask: { type: "Texture" },
      },
      outputs: {
        edges: { type: "Texture" },
      },
    },
    // Particle Generation & Rendering Pass
    {
      id: "particles",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uEdges;
          uniform vec2 uResolution;
          uniform float uTime;
          uniform float uParticleCount;
          uniform float uParticleSize;
          uniform float uSpeed;
          uniform float uSpread;
          
          varying vec2 vUv;
          
          // Hash functions for pseudo-random numbers
          float hash(float n) {
            return fract(sin(n) * 43758.5453123);
          }
          
          vec2 hash2(float n) {
            return fract(sin(vec2(n, n + 1.0)) * vec2(43758.5453123, 22578.1459123));
          }
          
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float n = i.x + i.y * 57.0;
            return mix(
              mix(hash(n), hash(n + 1.0), f.x),
              mix(hash(n + 57.0), hash(n + 58.0), f.x),
              f.y
            );
          }
          
          void main() {
            float edgeValue = texture2D(uEdges, vUv).r;
            float particleIntensity = 0.0;
            
            // Only process if we're near edges
            if (edgeValue > 0.01) {
              // Sample multiple particles
              int maxParticles = int(uParticleCount);
              
              for (int i = 0; i < 200; i++) {
                if (i >= maxParticles) break;
                
                float particleId = float(i);
                
                // Generate particle position based on UV and particle ID
                vec2 seed = vUv * 100.0 + particleId * 0.1;
                vec2 particleOffset = hash2(particleId) * 2.0 - 1.0;
                
                // Animate particles
                float timeOffset = hash(particleId) * 6.283185;
                float angle = uTime * uSpeed + timeOffset;
                
                // Circular motion
                vec2 motion = vec2(
                  cos(angle + particleId * 0.5),
                  sin(angle + particleId * 0.3)
                ) * 0.01 * uSpeed;
                
                // Add noise-based drift
                vec2 drift = vec2(
                  noise(seed + uTime * uSpeed * 0.1),
                  noise(seed + uTime * uSpeed * 0.1 + 100.0)
                ) * 2.0 - 1.0;
                drift *= 0.005 * uSpread;
                
                // Calculate particle position
                vec2 particlePos = vUv + motion + drift;
                
                // Check if current pixel is near this particle
                float dist = length((particlePos - vUv) * uResolution);
                
                // Particle falloff
                float particleRadius = uParticleSize;
                float particle = 1.0 - smoothstep(0.0, particleRadius, dist);
                
                // Only show particle if it's on an edge
                float edgeAtParticle = texture2D(uEdges, particlePos).r;
                particle *= edgeAtParticle;
                
                // Add fade in/out animation
                float lifetime = fract(uTime * uSpeed * 0.1 + hash(particleId));
                float fade = sin(lifetime * 3.14159) * 0.5 + 0.5;
                particle *= fade;
                
                particleIntensity += particle;
              }
              
              // Normalize
              particleIntensity = clamp(particleIntensity, 0.0, 1.0);
            }
            
            gl_FragColor = vec4(particleIntensity, particleIntensity, particleIntensity, particleIntensity);
          }
        `,
        uniforms: {
          uEdges: { type: "Texture", value: "@edge-detect.edges" },
          uResolution: { type: "vec2", value: "resolution" },
          uTime: { type: "float", value: "time" },
          uParticleCount: { type: "float", value: "@params.particleCount" },
          uParticleSize: { type: "float", value: "@params.particleSize" },
          uSpeed: { type: "float", value: "@params.speed" },
          uSpread: { type: "float", value: "@params.spread" },
        },
      },
      inputs: {
        edges: { type: "Texture" },
      },
      outputs: {
        particles: { type: "Texture" },
      },
    },
    // Glow Pass (Optional)
    {
      id: "glow",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uParticles;
          uniform vec2 uResolution;
          uniform float uGlow;
          
          varying vec2 vUv;
          
          void main() {
            if (uGlow < 0.01) {
              gl_FragColor = texture2D(uParticles, vUv);
              return;
            }
            
            vec2 texelSize = 1.0 / uResolution;
            float result = 0.0;
            
            // Simple box blur for glow
            float glowRadius = 3.0 * uGlow;
            int samples = 0;
            
            for (float x = -glowRadius; x <= glowRadius; x += 1.0) {
              for (float y = -glowRadius; y <= glowRadius; y += 1.0) {
                vec2 offset = vec2(x, y) * texelSize;
                result += texture2D(uParticles, vUv + offset).r;
                samples++;
              }
            }
            
            result /= float(samples);
            
            gl_FragColor = vec4(result, result, result, result);
          }
        `,
        uniforms: {
          uParticles: { type: "Texture", value: "@particles.particles" },
          uResolution: { type: "vec2", value: "resolution" },
          uGlow: { type: "float", value: "@params.glow" },
        },
      },
      inputs: {
        particles: { type: "Texture" },
      },
      outputs: {
        glowedParticles: { type: "Texture" },
      },
    },
    // Composite Pass
    {
      id: "composite",
      type: "ShaderNode",
      params: {
        shader: `
          precision highp float;
          
          uniform sampler2D uSource;
          uniform sampler2D uParticles;
          uniform vec3 uColor;
          
          varying vec2 vUv;
          
          void main() {
            vec3 source = texture2D(uSource, vUv).rgb;
            float particles = texture2D(uParticles, vUv).r;
            
            // Additive blend particles
            vec3 particleColor = uColor * particles;
            vec3 result = source + particleColor;
            
            gl_FragColor = vec4(result, 1.0);
          }
        `,
        uniforms: {
          uSource: { type: "Texture", value: "@input.source" },
          uParticles: { type: "Texture", value: "@glow.glowedParticles" },
          uColor: { type: "vec3", value: "@params.color" },
        },
      },
      inputs: {
        source: { type: "Texture" },
        particles: { type: "Texture" },
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
    { from: "input", fromPin: "mask", to: "edge-detect", toPin: "mask" },
    { from: "edge-detect", fromPin: "edges", to: "particles", toPin: "edges" },
    { from: "particles", fromPin: "particles", to: "glow", toPin: "particles" },
    { from: "input", fromPin: "source", to: "composite", toPin: "source" },
    { from: "glow", fromPin: "glowedParticles", to: "composite", toPin: "particles" },
    { from: "composite", fromPin: "result", to: "output", toPin: "result" },
  ],

  metadata: {
    author: "Clypra Studio",
    tags: ["body", "mask", "particles", "animated", "magical", "edges", "aura"],
    thumbnail: "particle-aura-thumb.png",
    previewVideo: "particle-aura-preview.mp4",
    requiredFeatures: ["mask"],
  },

  capabilities: {
    temporal: true, // Animated over time
    stateful: false,
    spatial: true,
    geometry: false,
    inputsCount: 2, // source + mask
  },

  requirements: {
    temporalRadius: 0,
    preferredPrecision: "fp16",
    multipass: true, // 4 passes: edge-detect, particles, glow, composite
    supportsHalfResolution: false,
  },

  presets: [
    {
      id: "fairy-dust",
      name: "Fairy Dust",
      description: "Small, slow, white particles",
      parameters: {
        particleCount: 80,
        particleSize: 2.0,
        speed: 0.3,
        color: "#FFFFFF",
        spread: 8.0,
        glow: 0.4,
      },
    },
    {
      id: "energy-shield",
      name: "Energy Shield",
      description: "Large, fast, cyan particles",
      parameters: {
        particleCount: 120,
        particleSize: 4.0,
        speed: 0.8,
        color: "#00FFFF",
        spread: 15.0,
        glow: 0.5,
      },
    },
    {
      id: "fire-aura",
      name: "Fire Aura",
      description: "Medium, fast, orange particles",
      parameters: {
        particleCount: 100,
        particleSize: 3.5,
        speed: 1.2,
        color: "#FF6600",
        spread: 12.0,
        glow: 0.6,
      },
    },
    {
      id: "magical-sparkles",
      name: "Magical Sparkles",
      description: "Many small glowing particles",
      parameters: {
        particleCount: 150,
        particleSize: 1.5,
        speed: 0.5,
        color: "#FFDDAA",
        spread: 10.0,
        glow: 0.7,
      },
    },
  ],
};
