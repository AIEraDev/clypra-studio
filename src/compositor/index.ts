import type { CompositorSettings } from "../engine/schema";

const VERTEX_SRC = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_texel;
uniform float u_blur;
uniform float u_bloom;
uniform float u_bloomThreshold;
out vec4 outColor;

void main() {
  vec4 c = texture(u_tex, v_uv);
  if (u_blur < 0.5 && u_bloom < 0.01) {
    outColor = c;
    return;
  }
  vec4 sum = c;
  float w = 0.0;
  if (u_blur >= 0.5) {
    sum = vec4(0.0);
    w = 0.0;
    for (int x = -2; x <= 2; x++) {
      for (int y = -2; y <= 2; y++) {
        vec2 off = vec2(float(x), float(y)) * u_texel * u_blur;
        vec4 s = texture(u_tex, v_uv + off);
        float weight = 1.0 / (1.0 + float(x*x + y*y));
        sum += s * weight;
        w += weight;
      }
    }
    sum /= w;
  }
  vec3 bloom = vec3(0.0);
  if (u_bloom > 0.01) {
    float lum = dot(sum.rgb, vec3(0.299, 0.587, 0.114));
    if (lum > u_bloomThreshold) {
      bloom = sum.rgb * u_bloom * (lum - u_bloomThreshold);
    }
  }
  outColor = vec4(clamp(sum.rgb + bloom, 0.0, 1.0), c.a);
}
`;

export class WebGLCompositor {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private texture: WebGLTexture | null = null;
  public readonly isSupported: boolean;

  constructor() {
    if (typeof document === "undefined") {
      this.isSupported = false;
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;
    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true });
    if (!gl) {
      this.isSupported = false;
      return;
    }
    this.gl = gl;
    this.isSupported = this.initProgram(gl);
  }

  private initProgram(gl: WebGL2RenderingContext): boolean {
    const vs = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    if (!vs || !fs) return false;

    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Compositor program link failed", gl.getProgramInfoLog(program));
      return false;
    }
    this.program = program;

    const positions = new Float32Array([
      -1, -1, 0, 1,
      1, -1, 1, 1,
      -1, 1, 0, 0,
      1, 1, 1, 0,
    ]);
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const locPos = gl.getAttribLocation(program, "a_pos");
    const locUv = gl.getAttribLocation(program, "a_uv");
    gl.enableVertexAttribArray(locPos);
    gl.vertexAttribPointer(locPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(locUv);
    gl.vertexAttribPointer(locUv, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);
    this.vao = vao;

    this.texture = gl.createTexture();
    return true;
  }

  private compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  renderToContext(
    targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    source: HTMLCanvasElement | OffscreenCanvas,
    settings: CompositorSettings
  ): void {
    const gl = this.gl;
    const program = this.program;
    if (!gl || !program || !this.isSupported) {
      targetCtx.clearRect(0, 0, source.width, source.height);
      targetCtx.drawImage(source as CanvasImageSource, 0, 0);
      return;
    }

    const w = source.width;
    const h = source.height;

    const canvas = gl.canvas as HTMLCanvasElement;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as TexImageSource);

    gl.uniform1i(gl.getUniformLocation(program, "u_tex"), 0);
    gl.uniform2f(gl.getUniformLocation(program, "u_texel"), 1 / w, 1 / h);
    gl.uniform1f(gl.getUniformLocation(program, "u_blur"), settings.blur ?? 0);
    gl.uniform1f(gl.getUniformLocation(program, "u_bloom"), settings.bloom ?? 0);
    gl.uniform1f(
      gl.getUniformLocation(program, "u_bloomThreshold"),
      settings.bloomThreshold ?? 0.6
    );

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);

    targetCtx.clearRect(0, 0, w, h);
    targetCtx.drawImage(canvas, 0, 0);
  }

  dispose(): void {
    const gl = this.gl;
    if (!gl) return;
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.program) gl.deleteProgram(this.program);
    if (this.vao) gl.deleteVertexArray(this.vao);
    this.gl = null;
  }
}
