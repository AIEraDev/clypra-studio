import { Filter } from 'pixi.js'
import type { TransitionDefinition } from '../../../types/TransitionDefinition'
import type { ParamValues } from '../../../videoEffects/EffectDefinition'
import { defaultVertexShader } from '../defaultVertexShader'

const fragment = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform float uProgress;
  uniform float uIntensity;
  uniform float uBlockSize;
  uniform float uRgbShift;
  uniform float uNoise;
  uniform vec2 uResolution;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float blockRand(vec2 uv, float blockSize) {
    vec2 block = floor(uv * uResolution / blockSize);
    return rand(block + vec2(uProgress * 10.0));
  }

  void main(void) {
    vec2 uv = vTextureCoord;
    float t = uProgress;
    
    // Glitch intensity peaks at mid-transition
    float glitchAmount = uIntensity * (1.0 - abs(t * 2.0 - 1.0));
    
    // Block-based displacement
    float blockR = blockRand(uv, uBlockSize);
    
    if (blockR < glitchAmount) {
      // Random horizontal displacement
      float displacement = (rand(vec2(blockR, t)) - 0.5) * glitchAmount * 0.3;
      uv.x += displacement;
      
      // Random vertical jitter (smaller)
      float jitter = (rand(vec2(blockR + 1.0, t)) - 0.5) * glitchAmount * 0.1;
      uv.y += jitter;
    }
    
    uv = clamp(uv, 0.0, 1.0);
    
    vec4 colorA, colorB;
    
    if (uRgbShift > 0.5 && glitchAmount > 0.1) {
      float shiftAmount = glitchAmount * 0.01;
      
      float rA = texture(uFrom, uv + vec2(shiftAmount, 0.0)).r;
      float gA = texture(uFrom, uv).g;
      float bA = texture(uFrom, uv - vec2(shiftAmount, 0.0)).b;
      colorA = vec4(rA, gA, bA, 1.0);
      
      float rB = texture(uTo, uv + vec2(shiftAmount, 0.0)).r;
      float gB = texture(uTo, uv).g;
      float bB = texture(uTo, uv - vec2(shiftAmount, 0.0)).b;
      colorB = vec4(rB, gB, bB, 1.0);
    } else {
      colorA = texture(uFrom, uv);
      colorB = texture(uTo, uv);
    }
    
    float blockSwitch = blockRand(vTextureCoord, uBlockSize * 0.5);
    float threshold = mix(t, 0.5, glitchAmount);
    
    vec4 color;
    if (blockSwitch < threshold) {
      color = colorB;
    } else {
      color = mix(colorA, colorB, t);
    }
    
    if (uNoise > 0.5 && glitchAmount > 0.2) {
      float noiseVal = rand(vTextureCoord * 500.0 + vec2(t * 100.0));
      if (noiseVal > 0.95) {
        color.rgb = vec3(noiseVal);
      }
    }
    
    if (glitchAmount > 0.4) {
      float corruptionChance = rand(vec2(floor(t * 60.0)));
      if (corruptionChance < glitchAmount * 0.1) {
        color.rgb = 1.0 - color.rgb;
      }
    }
    
    finalColor = color;
  }
`

export const GlitchTransition: TransitionDefinition = {
  id: 'glitch',
  name: 'Glitch',
  category: 'temporal',
  description: 'Chaotic digital glitch with block displacement, RGB shifting, and noise artifacts.',
  tags: ['glitch', 'digital', 'chaos', 'corruption', 'artifacts'],
  defaultDurationMs: 500, // Short strobe/glitch style duration
  params: [
    { key: 'intensity', label: 'Intensity', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 },
    { key: 'blockSize', label: 'Block Size', type: 'range', value: 10.0, min: 1.0, max: 50.0, step: 1.0 },
    { key: 'rgbShift', label: 'RGB Shift', type: 'toggle', value: true },
    { key: 'noise', label: 'Noise', type: 'toggle', value: true }
  ],

  create(params: ParamValues): Filter {
    const rgbShiftVal = (params.rgbShift as boolean ?? true) ? 1.0 : 0.0
    const noiseVal = (params.noise as boolean ?? true) ? 1.0 : 0.0

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uIntensity: { value: params.intensity as number ?? 0.5, type: 'f32' },
          uBlockSize: { value: params.blockSize as number ?? 10.0, type: 'f32' },
          uRgbShift: { value: rgbShiftVal, type: 'f32' },
          uNoise: { value: noiseVal, type: 'f32' },
          uResolution: { value: [1280.0, 720.0], type: 'vec2<f32>' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uIntensity = params.intensity as number ?? 0.5
      u.uBlockSize = params.blockSize as number ?? 10.0
      u.uRgbShift = (params.rgbShift as boolean ?? true) ? 1.0 : 0.0
      u.uNoise = (params.noise as boolean ?? true) ? 1.0 : 0.0
    }
  }
}
