import { Filter } from 'pixi.js'
import type { TransitionDefinition } from '../../../types/TransitionDefinition'
import type { ParamValues } from '../../../videoEffects/EffectDefinition'
import { defaultVertexShader } from '../defaultVertexShader'

const fragment = `
  in vec2 vNormalizedCoord;
  out vec4 finalColor;

  uniform sampler2D uFrom;
  uniform sampler2D uTo;
  uniform float uProgress;
  uniform float uDropDistance;
  uniform float uBounceStrength;
  uniform float uGravity;

  // Standard ease-out bounce implementation
  float bounceCurve(float t) {
    float d1 = 2.75;
    if (t < 1.0 / d1) {
      return 7.5625 * t * t;
    } else if (t < 2.0 / d1) {
      float t2 = t - 1.5 / d1;
      return 1.0 - (0.25 - 7.5625 * t2 * t2);
    } else if (t < 2.5 / d1) {
      float t2 = t - 2.25 / d1;
      return 1.0 - (0.0625 - 7.5625 * t2 * t2);
    } else {
      float t2 = t - 2.625 / d1;
      return 1.0 - (0.015625 - 7.5625 * t2 * t2);
    }
  }

  void main() {
    float t = uProgress;
    
    // Outgoing clip moves downward under gravity (quadratic acceleration)
    float yOffsetFrom = t * t * uGravity * uDropDistance;
    vec2 uvFrom = vNormalizedCoord + vec2(0.0, yOffsetFrom);
    
    // Incoming clip settles with a bounce curve.
    // If bounce strength is 0, it behaves like a smooth quadratic ease-out.
    float smoothVal = t * (2.0 - t);
    float bounceVal = bounceCurve(t);
    float b = mix(smoothVal, bounceVal, uBounceStrength);
    
    // Incoming clip starts above the screen and moves down to center
    float yOffsetTo = -uDropDistance * (1.0 - b);
    vec2 uvTo = vNormalizedCoord + vec2(0.0, yOffsetTo);
    
    bool inTo = (uvTo.x >= 0.0 && uvTo.x <= 1.0 && uvTo.y >= 0.0 && uvTo.y <= 1.0);
    bool inFrom = (uvFrom.x >= 0.0 && uvFrom.x <= 1.0 && uvFrom.y >= 0.0 && uvFrom.y <= 1.0);
    
    vec4 color = vec4(0.0, 0.0, 0.0, 1.0); // Black background
    
    // Composite: incoming uTo on top
    if (inTo) {
      color = texture(uTo, uvTo);
    } else if (inFrom) {
      color = texture(uFrom, uvFrom);
    }
    
    finalColor = color;
  }
`

export const GravityDropTransition: TransitionDefinition = {
  id: 'gravity-drop',
  name: 'Gravity Drop',
  category: 'physics-simulated',
  description: 'The outgoing clip falls downward under gravity while the incoming clip drops in from the top with a physical bounce settle.',
  tags: ['physics', 'gravity', 'bounce', 'slide'],
  defaultDurationMs: 1000,
  params: [
    { key: 'dropDistance', label: 'Drop Distance', type: 'range', value: 1.0, min: 0.5, max: 2.0, step: 0.1 },
    { key: 'bounceStrength', label: 'Bounce Strength', type: 'range', value: 0.2, min: 0.0, max: 0.4, step: 0.05 },
    { key: 'gravity', label: 'Gravity', type: 'range', value: 1.5, min: 0.5, max: 3.0, step: 0.1 }
  ],

  create(params: ParamValues): Filter {
    const dropVal = params.dropDistance as number ?? 1.0
    const bounceVal = params.bounceStrength as number ?? 0.2
    const gravVal = params.gravity as number ?? 1.5

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uDropDistance: { value: dropVal, type: 'f32' },
          uBounceStrength: { value: bounceVal, type: 'f32' },
          uGravity: { value: gravVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      u.uDropDistance = params.dropDistance as number ?? 1.0
      u.uBounceStrength = params.bounceStrength as number ?? 0.2
      u.uGravity = params.gravity as number ?? 1.5
    }
  }
}
