import { Filter, Texture } from "pixi.js";

const VERTEX_SHADER = `
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;
  uniform vec4 uOutputTexture;

  vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
  }

  vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
  }

  void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
  }
`;

function hexToRgbNormalized(hex: string): [number, number, number] {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  const num = parseInt(clean, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

export function createGPUBodyOutlineFilter(maskTexture: Texture, colorHex: string, thickness: number): Filter {
  const fragmentShader = `
    precision mediump float;
    in vec2 vTextureCoord;
    out vec4 fragColor;
    uniform sampler2D uSampler;
    uniform sampler2D uMask;
    uniform vec4 uOutlineColor;
    uniform float uThickness;
    uniform vec4 uInputSize;

    void main(void) {
      vec4 base = texture(uSampler, vTextureCoord);
      float maskAlpha = texture(uMask, vTextureCoord).a;
      if (maskAlpha > 0.1) {
        fragColor = base;
        return;
      }
      float border = 0.0;
      vec2 texelSize = vec2(uThickness) * uInputSize.zw;
      for (float x = -1.0; x <= 1.0; x += 1.0) {
        for (float y = -1.0; y <= 1.0; y += 1.0) {
          if (x == 0.0 && y == 0.0) continue;
          float a = texture(uMask, vTextureCoord + vec2(x, y) * texelSize).a;
          if (a > 0.1) {
            border = 1.0;
            break;
          }
        }
      }
      if (border > 0.0) {
        fragColor = uOutlineColor;
      } else {
        fragColor = base;
      }
    }
  `;

  const rgb = hexToRgbNormalized(colorHex);

  const originalFilterFrom = Filter.from;
  Filter.from = function (options: any) {
    if (options && options.resources && !options.resources.uMask) {
      options.resources.uMask = maskTexture.source;
    }
    return originalFilterFrom.call(this, options);
  };

  try {
    const filter = Filter.from({
      gl: {
        vertex: VERTEX_SHADER,
        fragment: fragmentShader,
      },
      resources: {
        customUniforms: {
          uOutlineColor: { value: [...rgb, 1.0], type: "vec4<f32>" },
          uThickness: { value: thickness, type: "f32" },
        },
      },
    });

    (filter as any).resources.uMask = maskTexture.source;
    return filter;
  } finally {
    Filter.from = originalFilterFrom;
  }
}

export function createGPUBodyGlowFilter(maskTexture: Texture, colorHex: string, radius: number, intensity: number): Filter {
  const fragmentShader = `
    precision mediump float;
    in vec2 vTextureCoord;
    out vec4 fragColor;
    uniform sampler2D uSampler;
    uniform sampler2D uMask;
    uniform vec4 uGlowColor;
    uniform float uGlowRadius;
    uniform float uGlowIntensity;
    uniform vec4 uInputSize;

    void main(void) {
      vec4 base = texture(uSampler, vTextureCoord);
      float maskAlpha = texture(uMask, vTextureCoord).a;
      
      float blur = 0.0;
      float total = 0.0;
      vec2 texelSize = vec2(uGlowRadius) * uInputSize.zw;
      
      for (float x = -2.0; x <= 2.0; x += 1.0) {
        for (float y = -2.0; y <= 2.0; y += 1.0) {
          float weight = (3.0 - abs(x)) * (3.0 - abs(y));
          float a = texture(uMask, vTextureCoord + vec2(x, y) * texelSize * 0.5).a;
          blur += a * weight;
          total += weight;
        }
      }
      
      float glow = (blur / total) * uGlowIntensity;
      
      if (maskAlpha > 0.1) {
        fragColor = vec4(mix(base.rgb, uGlowColor.rgb, 0.15 * uGlowIntensity), base.a);
      } else {
        fragColor = vec4(mix(base.rgb, uGlowColor.rgb, glow), max(base.a, glow * uGlowColor.a));
      }
    }
  `;

  const rgb = hexToRgbNormalized(colorHex);

  const originalFilterFrom = Filter.from;
  Filter.from = function (options: any) {
    if (options && options.resources && !options.resources.uMask) {
      options.resources.uMask = maskTexture.source;
    }
    return originalFilterFrom.call(this, options);
  };

  try {
    const filter = Filter.from({
      gl: {
        vertex: VERTEX_SHADER,
        fragment: fragmentShader,
      },
      resources: {
        customUniforms: {
          uGlowColor: { value: [...rgb, 1.0], type: "vec4<f32>" },
          uGlowRadius: { value: radius, type: "f32" },
          uGlowIntensity: { value: intensity, type: "f32" },
        },
      },
    });

    (filter as any).resources.uMask = maskTexture.source;
    return filter;
  } finally {
    Filter.from = originalFilterFrom;
  }
}

export function createGPUBodyParticlesFilter(maskTexture: Texture, colorHex: string, particleCount: number, intensity: number, time: number): Filter {
  const fragmentShader = `
    precision mediump float;
    in vec2 vTextureCoord;
    out vec4 fragColor;
    uniform sampler2D uSampler;
    uniform sampler2D uMask;
    uniform vec4 uParticleColor;
    uniform float uTime;
    uniform float uIntensity;
    uniform float uCount;
    
    float rand(float n) { return fract(sin(n) * 43758.5453123); }
    
    void main(void) {
      vec4 base = texture(uSampler, vTextureCoord);
      vec4 maskVal = texture(uMask, vTextureCoord);
      
      float particleOverlay = 0.0;
      
      for (float i = 0.0; i < 40.0; i += 1.0) {
        if (i >= uCount) break;
        float seedX = i * 37.0;
        float seedY = i * 43.0;
        
        vec2 pPos = vec2(rand(seedX), rand(seedY));
        pPos.y -= fract(uTime * 0.1 + rand(i * 17.0)) * 0.4 * uIntensity;
        pPos.x += sin(uTime * 2.0 + i) * 0.015 * uIntensity;
        
        float d = distance(vTextureCoord, pPos);
        float size = 0.001 + rand(i * 53.0) * 0.003;
        
        if (d < size) {
          float maskAtParticle = texture(uMask, pPos).a;
          if (maskAtParticle > 0.1) {
            float alpha = smoothstep(size, size - 0.001, d);
            particleOverlay = max(particleOverlay, alpha);
          }
        }
      }
      
      if (particleOverlay > 0.0) {
        fragColor = vec4(mix(base.rgb, uParticleColor.rgb, particleOverlay), base.a);
      } else {
        fragColor = base;
      }
    }
  `;

  const rgb = hexToRgbNormalized(colorHex);

  const originalFilterFrom = Filter.from;
  Filter.from = function (options: any) {
    if (options && options.resources && !options.resources.uMask) {
      options.resources.uMask = maskTexture.source;
    }
    return originalFilterFrom.call(this, options);
  };

  try {
    const filter = Filter.from({
      gl: {
        vertex: VERTEX_SHADER,
        fragment: fragmentShader,
      },
      resources: {
        customUniforms: {
          uParticleColor: { value: [...rgb, 1.0], type: "vec4<f32>" },
          uTime: { value: time, type: "f32" },
          uIntensity: { value: intensity, type: "f32" },
          uCount: { value: Math.min(40, particleCount), type: "f32" },
        },
      },
    });

    (filter as any).resources.uMask = maskTexture.source;
    return filter;
  } finally {
    Filter.from = originalFilterFrom;
  }
}
