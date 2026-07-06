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
  uniform float uGridRes;
  uniform float uExplosionForce;
  uniform float uRotationAmount;

  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }

  void main() {
    vec2 uv = vNormalizedCoord;
    
    float minDist = 999.0;
    vec2 closestCell = vec2(-99.0);
    vec2 closestTransformedCenter = vec2(0.5);
    vec2 closestOriginalCenter = vec2(0.5);
    
    vec2 g = floor(uv * uGridRes);
    
    // 5x5 neighborhood search in destination space to find the closest transformed cell center
    for (float dx = -2.0; dx <= 2.0; dx += 1.0) {
      for (float dy = -2.0; dy <= 2.0; dy += 1.0) {
        vec2 cell = g + vec2(dx, dy);
        
        // Skip out-of-grid cells
        if (cell.x < 0.0 || cell.x >= uGridRes || cell.y < 0.0 || cell.y >= uGridRes) {
          continue;
        }
        
        vec2 rand = hash22(cell);
        vec2 origCenter = (cell + rand) / uGridRes;
        
        // Outward velocity vector relative to frame center with random variation
        vec2 toCenter = origCenter - vec2(0.5);
        vec2 velocity = (normalize(toCenter) + (rand - 0.5) * 0.3) * uExplosionForce;
        
        // Transformed center under quadratic acceleration
        vec2 transCenter = origCenter + velocity * uProgress * uProgress;
        
        float d = distance(uv, transCenter);
        if (d < minDist) {
          minDist = d;
          closestCell = cell;
          closestTransformedCenter = transCenter;
          closestOriginalCenter = origCenter;
        }
      }
    }
    
    // Calculate rotation for the selected cell
    vec2 randVal = hash22(closestCell);
    float randRot = (randVal.x - 0.5) * 2.0;
    float angle = randRot * uRotationAmount * uProgress * 4.0;
    
    // Rotate pixel relative to transformed center, then translate back to original cell space
    vec2 relUv = uv - closestTransformedCenter;
    float cosA = cos(-angle);
    float sinA = sin(-angle);
    vec2 rotatedUv = vec2(relUv.x * cosA - relUv.y * sinA, relUv.x * sinA + relUv.y * cosA);
    vec2 uvFrom = rotatedUv + closestOriginalCenter;
    
    // Check if the traced-back pixel uvFrom actually lands inside the same Voronoi cell
    bool inside = false;
    if (uvFrom.x >= 0.0 && uvFrom.x <= 1.0 && uvFrom.y >= 0.0 && uvFrom.y <= 1.0) {
      vec2 gFrom = floor(uvFrom * uGridRes);
      float minDistFrom = 999.0;
      vec2 closestCellFrom = vec2(-99.0);
      
      // 3x3 search in original space
      for (float dx = -1.0; dx <= 1.0; dx += 1.0) {
        for (float dy = -1.0; dy <= 1.0; dy += 1.0) {
          vec2 cell = gFrom + vec2(dx, dy);
          if (cell.x < 0.0 || cell.x >= uGridRes || cell.y < 0.0 || cell.y >= uGridRes) {
            continue;
          }
          vec2 rand = hash22(cell);
          vec2 origCenter = (cell + rand) / uGridRes;
          float d = distance(uvFrom, origCenter);
          if (d < minDistFrom) {
            minDistFrom = d;
            closestCellFrom = cell;
          }
        }
      }
      
      if (distance(closestCellFrom, closestCell) < 0.1) {
        inside = true;
      }
    }
    
    vec4 color;
    if (inside) {
      color = texture(uFrom, uvFrom);
    } else {
      // Reveal the incoming clip in the gaps
      color = texture(uTo, uv);
    }
    
    finalColor = color;
  }
`

export const ShatterBurstTransition: TransitionDefinition = {
  id: 'shatter-burst',
  name: 'Shatter Burst',
  category: 'physics-simulated',
  description: 'Breaks the outgoing clip into polygonal shards that explode outwards, revealing the incoming clip.',
  tags: ['physics', 'shatter', 'particles', 'creative'],
  defaultDurationMs: 1000,
  params: [
    { key: 'shardCount', label: 'Shard Count', type: 'range', value: 24, min: 8, max: 40, step: 1.0 },
    { key: 'explosionForce', label: 'Explosion Force', type: 'range', value: 1.5, min: 0.5, max: 3.0, step: 0.1 },
    { key: 'rotationAmount', label: 'Rotation Amount', type: 'range', value: 0.5, min: 0.0, max: 1.0, step: 0.05 }
  ],

  create(params: ParamValues): Filter {
    const shardVal = params.shardCount as number ?? 24.0
    // Precompute grid resolution: floor(sqrt(shardCount))
    const gridResVal = Math.floor(Math.sqrt(shardVal))
    const forceVal = params.explosionForce as number ?? 1.5
    const rotVal = params.rotationAmount as number ?? 0.5

    return Filter.from({
      gl: { vertex: defaultVertexShader, fragment },
      resources: {
        transitionUniforms: {
          uProgress: { value: 0.0, type: 'f32' },
          uGridRes: { value: gridResVal, type: 'f32' },
          uExplosionForce: { value: forceVal, type: 'f32' },
          uRotationAmount: { value: rotVal, type: 'f32' }
        }
      }
    })
  },

  updateProgress(filter: Filter, progress: number, params: ParamValues): void {
    const u = (filter as any).resources?.transitionUniforms?.uniforms
    if (u) {
      u.uProgress = progress
      const shardVal = params.shardCount as number ?? 24.0
      u.uGridRes = Math.floor(Math.sqrt(shardVal))
      u.uExplosionForce = params.explosionForce as number ?? 1.5
      u.uRotationAmount = params.rotationAmount as number ?? 0.5
    }
  }
}
