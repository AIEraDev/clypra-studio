import { Filter } from 'pixi.js'
import type { PixiEffectDefinition, ParamValues } from '../../videoEffects/EffectDefinition'

const ADJUSTMENTS_VERTEX_SHADER = `
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
`;

const ADJUSTMENTS_FRAGMENT_SHADER = `
  in vec2 vTextureCoord;
  out vec4 finalColor;

  uniform sampler2D uTexture;
  uniform float uExposure;          // -1.0 to 1.0
  uniform float uBrightness;        // -1.0 to 1.0
  uniform float uContrast;          // -1.0 to 1.0
  uniform float uSaturation;        // -1.0 to 1.0
  uniform vec3 uTemperatureColor;   // HSL temperature color
  uniform float uTemperatureWeight; // 0.0 to 1.0
  uniform vec3 uTintColor;          // tint color
  uniform float uTintWeight;        // 0.0 to 1.0
  uniform float uSepia;             // 0.0 to 1.0
  uniform float uGrayscale;         // 0.0 to 1.0
  uniform float uHueRotate;         // Radians (0.0 to 2*PI)
  uniform float uVignette;          // 0.0 to 1.0
  uniform float uInvert;            // 0.0 to 1.0

  vec3 hueRotate(vec3 color, float angle) {
      vec3 k = vec3(0.57735, 0.57735, 0.57735);
      float cosAngle = cos(angle);
      return color * cosAngle + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - cosAngle);
  }

  void main() {
      vec4 texColor = texture(uTexture, vTextureCoord);
      vec3 rgb = texColor.rgb;

      // Invert
      rgb = mix(rgb, 1.0 - rgb, uInvert);

      // Exposure
      rgb = rgb * pow(2.0, uExposure);

      // Brightness
      rgb = rgb + uBrightness;

      // Contrast
      rgb = (rgb - 0.5) * (1.0 + uContrast) + 0.5;

      // Saturation
      float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(vec3(luma), rgb, 1.0 + uSaturation);
      rgb = mix(rgb, vec3(luma), uGrayscale);

      // Sepia
      vec3 sepiaColor = vec3(
          dot(rgb, vec3(0.393, 0.769, 0.189)),
          dot(rgb, vec3(0.349, 0.686, 0.168)),
          dot(rgb, vec3(0.272, 0.534, 0.131))
      );
      rgb = mix(rgb, sepiaColor, uSepia);

      // Hue Rotate
      if (uHueRotate != 0.0) {
          rgb = hueRotate(rgb, uHueRotate);
      }

      // Temperature soft-light blend
      if (uTemperatureWeight > 0.0) {
          vec3 t = uTemperatureColor;
          rgb = mix(rgb, (1.0 - 2.0 * t) * rgb * rgb + 2.0 * t * rgb, uTemperatureWeight);
      }

      // Tint soft-light blend
      if (uTintWeight > 0.0) {
          vec3 t = uTintColor;
          rgb = mix(rgb, (1.0 - 2.0 * t) * rgb * rgb + 2.0 * t * rgb, uTintWeight);
      }

      // Vignette
      vec2 uv = vTextureCoord - 0.5;
      float dist = length(uv);
      float vignetteVal = smoothstep(0.45, 1.0, dist);
      rgb = mix(rgb, rgb * 0.0, vignetteVal * uVignette);

      finalColor = vec4(rgb, texColor.a);
  }
`;

export const ColorAdjustmentsEffect: PixiEffectDefinition = {
  backend: 'pixi',
  subtype: 'filter',
  id: 'color-adjustments',
  name: 'Color Adjustments',
  category: 'light',
  description: 'Adjust exposure, brightness, contrast, saturation, temperature, tint, sepia, grayscale, hue, invert, and vignette.',
  tags: ['color', 'adjustments', 'brightness', 'contrast', 'saturation', 'temperature', 'tint', 'vignette'],
  thumbnail: '',
  params: [
    { key: 'exposure', label: 'Exposure', type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'brightness', label: 'Brightness', type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'contrast', label: 'Contrast', type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'saturation', label: 'Saturation', type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'temperature', label: 'Temperature', type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'tint', label: 'Tint', type: 'range', value: 0.0, min: -1.0, max: 1.0, step: 0.01 },
    { key: 'sepia', label: 'Sepia', type: 'range', value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
    { key: 'grayscale', label: 'Grayscale', type: 'range', value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
    { key: 'hueRotate', label: 'Hue Rotate', type: 'range', value: 0.0, min: 0.0, max: 6.28318, step: 0.01 },
    { key: 'vignette', label: 'Vignette', type: 'range', value: 0.0, min: 0.0, max: 1.0, step: 0.01 },
    { key: 'invert', label: 'Invert', type: 'range', value: 0.0, min: 0.0, max: 1.0, step: 0.01 }
  ],
  filterSpec: {
    create(params: ParamValues): Filter {
      const tempWeight = Math.abs(params.temperature as number || 0.0)
      const tempColor = (params.temperature as number || 0.0) > 0.0 ? [1.0, 0.55, 0.16] : [0.16, 0.47, 1.0]

      const tintWeight = Math.abs(params.tint as number || 0.0)
      const tintColor = (params.tint as number || 0.0) > 0.0 ? [1.0, 0.16, 0.71] : [0.16, 1.0, 0.39]

      return Filter.from({
        gl: { vertex: ADJUSTMENTS_VERTEX_SHADER, fragment: ADJUSTMENTS_FRAGMENT_SHADER },
        resources: {
          uniforms: {
            uExposure: { value: params.exposure as number || 0.0, type: 'f32' },
            uBrightness: { value: params.brightness as number || 0.0, type: 'f32' },
            uContrast: { value: params.contrast as number || 0.0, type: 'f32' },
            uSaturation: { value: params.saturation as number || 0.0, type: 'f32' },
            uTemperatureColor: { value: tempColor, type: 'vec3<f32>' },
            uTemperatureWeight: { value: tempWeight, type: 'f32' },
            uTintColor: { value: tintColor, type: 'vec3<f32>' },
            uTintWeight: { value: tintWeight, type: 'f32' },
            uSepia: { value: params.sepia as number || 0.0, type: 'f32' },
            uGrayscale: { value: params.grayscale as number || 0.0, type: 'f32' },
            uHueRotate: { value: params.hueRotate as number || 0.0, type: 'f32' },
            uVignette: { value: params.vignette as number || 0.0, type: 'f32' },
            uInvert: { value: params.invert as number || 0.0, type: 'f32' }
          }
        }
      })
    },
    updateUniforms(filter: Filter, params: ParamValues): void {
      const uniforms = (filter as any).resources?.uniforms?.uniforms
      if (!uniforms) return

      const tempWeight = Math.abs(params.temperature as number || 0.0)
      const tempColor = (params.temperature as number || 0.0) > 0.0 ? [1.0, 0.55, 0.16] : [0.16, 0.47, 1.0]

      const tintWeight = Math.abs(params.tint as number || 0.0)
      const tintColor = (params.tint as number || 0.0) > 0.0 ? [1.0, 0.16, 0.71] : [0.16, 1.0, 0.39]

      uniforms.uExposure = params.exposure as number || 0.0
      uniforms.uBrightness = params.brightness as number || 0.0
      uniforms.uContrast = params.contrast as number || 0.0
      uniforms.uSaturation = params.saturation as number || 0.0
      uniforms.uTemperatureColor = tempColor
      uniforms.uTemperatureWeight = tempWeight
      uniforms.uTintColor = tintColor
      uniforms.uTintWeight = tintWeight
      uniforms.uSepia = params.sepia as number || 0.0
      uniforms.uGrayscale = params.grayscale as number || 0.0
      uniforms.uHueRotate = params.hueRotate as number || 0.0
      uniforms.uVignette = params.vignette as number || 0.0
      uniforms.uInvert = params.invert as number || 0.0
    }
  }
}
