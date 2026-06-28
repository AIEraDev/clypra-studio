import { Filter, ColorMatrixFilter, Texture } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

const DEFAULT_VERTEX_SHADER = `
  in vec2 aPosition;
  out vec2 vTextureCoord;

  uniform vec4 uInputSize;
  uniform vec4 uOutputFrame;

  vec4 filterVertexPosition(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    return vec4(position * uInputSize.zw * 2.0 - 1.0, 0.0, 1.0);
  }

  vec2 filterTextureCoord(void) {
    return aPosition * (uOutputFrame.zw * uInputSize.xy);
  }

  void main(void) {
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
  }
`

const LUT_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform sampler2D uLUT;
  uniform float uIntensity;

  vec4 sample3DLUT(sampler2D lutTex, vec3 color) {
    // 16x16x16 LUT mapping
    float blueColor = clamp(color.b, 0.0, 1.0) * 15.0;
    
    float quad1 = floor(blueColor);
    float quad2 = ceil(blueColor);
    
    vec2 texPos1;
    texPos1.x = (quad1 * 16.0 + clamp(color.r, 0.0, 1.0) * 15.0) / 256.0;
    texPos1.y = (clamp(color.g, 0.0, 1.0) * 15.0) / 16.0;
    
    vec2 texPos2;
    texPos2.x = (quad2 * 16.0 + clamp(color.r, 0.0, 1.0) * 15.0) / 256.0;
    texPos2.y = (clamp(color.g, 0.0, 1.0) * 15.0) / 16.0;
    
    vec4 newColor1 = texture(lutTex, texPos1);
    vec4 newColor2 = texture(lutTex, texPos2);
    
    return mix(newColor1, newColor2, fract(blueColor));
  }

  void main(void) {
    vec4 original = texture(uTexture, vTextureCoord);
    vec4 graded = sample3DLUT(uLUT, original.rgb);
    
    finalColor = vec4(mix(original.rgb, graded.rgb, uIntensity), original.a);
  }
`

// Generates a cinematic Orange/Teal LUT on a canvas to use as texture source
const createCinematicLUTTexture = (): Texture => {
  if (typeof document === 'undefined') {
    return Texture.WHITE
  }
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 16
  const ctx = canvas.getContext('2d')
  if (!ctx) return Texture.WHITE
  const imgData = ctx.createImageData(256, 16)
  
  for (let bx = 0; bx < 16; bx++) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = x / 15
        const g = y / 15
        const b = bx / 15
        
        // Procedurally generate cinematic color grading (warm highlights, cool/teal shadows)
        const adjustedR = Math.pow(r, 1.15) * 1.05
        const adjustedG = g * 0.96 + r * 0.04
        const adjustedB = Math.pow(b, 0.9) * 0.92
        
        const px = bx * 16 + x
        const idx = (y * 256 + px) * 4
        
        imgData.data[idx] = Math.min(255, Math.floor(adjustedR * 255))
        imgData.data[idx+1] = Math.min(255, Math.floor(adjustedG * 255))
        imgData.data[idx+2] = Math.min(255, Math.floor(adjustedB * 255))
        imgData.data[idx+3] = 255
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return Texture.from(canvas)
}

export const CinematicLUTEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'composite',
  id: 'cinematic-lut',
  name: 'Cinematic LUT',
  category: 'cinematic',
  description: 'Apply professional Orange & Teal grading using a 3D color lookup table combined with brightness and saturation matrix tweaks.',
  tags: ['lut', 'cinematic', 'color', 'grading', 'teal', 'orange'],
  thumbnail: 'https://clypra-worker-api.abdulkabirmusa.com/thumbnails/cinematic-lut.webp',

  params: [
    { key: 'lutIntensity', label: 'LUT Intensity', type: 'range',  value: 0.8,   min: 0,   max: 1.0,  step: 0.05 },
    { key: 'brightness',   label: 'Brightness',    type: 'range',  value: 1.0,   min: 0.5, max: 1.5,  step: 0.05 },
    { key: 'contrast',     label: 'Contrast',      type: 'range',  value: 1.0,   min: 0.5, max: 1.5,  step: 0.05 },
    { key: 'saturation',   label: 'Saturation',    type: 'range',  value: 1.0,   min: 0,   max: 2.0,  step: 0.05 },
  ],

  filterSpec: {
    create(params: ParamValues): Filter[] {
      // 1. Color grade via matrix
      const matrixFilter = new ColorMatrixFilter()
      matrixFilter.brightness(params.brightness as number, false)
      matrixFilter.contrast(params.contrast as number, false)
      matrixFilter.saturate(params.saturation as number, false)

      // 2. Custom LUT filter
      const lutTexture = createCinematicLUTTexture()
      const lutFilter = Filter.from({
        gl: { vertex: DEFAULT_VERTEX_SHADER, fragment: LUT_FRAGMENT_SHADER },
        resources: {
          uLUT: lutTexture.source,
          lutUniforms: {
            uIntensity: { value: params.lutIntensity as number, type: 'f32' },
          },
        },
      })

      return [matrixFilter, lutFilter]
    },

    updateUniforms(filters: Filter[], params: ParamValues): void {
      const [matrixFilter, lutFilter] = filters as [ColorMatrixFilter, Filter]
      if (!matrixFilter || !lutFilter) return

      // Update matrix properties
      matrixFilter.reset()
      matrixFilter.brightness(params.brightness as number, true)
      matrixFilter.contrast(params.contrast as number, true)
      matrixFilter.saturate(params.saturation as number, true)

      // Update custom LUT intensity
      const u = (lutFilter as any).resources?.lutUniforms?.uniforms
      if (u) {
        u.uIntensity = params.lutIntensity as number
      }
    },
  },
}
