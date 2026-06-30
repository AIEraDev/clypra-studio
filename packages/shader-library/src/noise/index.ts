/**
 * @clypra/shader-library — Noise Shaders
 *
 * Various noise generation functions for procedural effects
 */

/**
 * Film grain shader
 */
export const filmGrainShader = `
uniform sampler2D uTexture;
uniform float uIntensity;
uniform float uSize;
uniform float uTime;

float filmGrain(vec2 uv, float time) {
  vec2 p = uv * uSize;
  p += time * 1000.0;
  
  float n = hash(p);
  n = n * 2.0 - 1.0;
  
  return n * uIntensity;
}

void main() {
  vec2 uv = vTextureCoord;
  vec4 color = texture2D(uTexture, uv);
  
  float grain = filmGrain(uv, uTime);
  color.rgb += grain;
  
  gl_FragColor = color;
}
`;

/**
 * Perlin noise shader
 */
export const perlinNoiseShader = `
vec2 fade(vec2 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float perlinNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  
  vec2 u = fade(f);
  
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  
  return mix(
    mix(a, b, u.x),
    mix(c, d, u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 5; i++) {
    value += amplitude * perlinNoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}
`;

/**
 * Simplex noise (approximation)
 */
export const simplexNoiseShader = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float simplexNoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,  // (3.0-sqrt(3.0))/6.0
    0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
    -0.577350269189626, // -1.0 + 2.0 * C.x
    0.024390243902439   // 1.0 / 41.0
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

/**
 * Cellular/Worley noise
 */
export const cellularNoiseShader = `
vec2 random2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

float cellularNoise(vec2 p) {
  vec2 i_p = floor(p);
  vec2 f_p = fract(p);
  
  float minDist = 1.0;
  
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = random2(i_p + neighbor);
      
      vec2 diff = neighbor + point - f_p;
      float dist = length(diff);
      
      minDist = min(minDist, dist);
    }
  }
  
  return minDist;
}
`;

export const noiseShaders = {
  filmGrain: filmGrainShader,
  perlin: perlinNoiseShader,
  simplex: simplexNoiseShader,
  cellular: cellularNoiseShader,
};
