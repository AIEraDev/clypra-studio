/// <reference types="@webgpu/types" />

/**
 * @clypra-studio/runtime — WebGPU Execution Engine
 *
 * Core execution pipeline component for running dynamically compiled WGSL shader nodes
 * and intermediate .vefx effect graphs on the GPU.
 */

export interface EffectPipelineOptions {
  readonly uniformSize?: number; // Size in bytes, default 64 (16-byte aligned)
  readonly outputFormat?: GPUTextureFormat;
}

export class EffectPipelineEngine {
  private device!: GPUDevice;
  private pipeline!: GPURenderPipeline;
  private sampler!: GPUSampler;
  private uniformBuffer!: GPUBuffer;
  private bindGroupLayout!: GPUBindGroupLayout;
  private isInitialized = false;

  /**
   * Default fullscreen quad vertex shader if none provided in module
   */
  public static readonly DEFAULT_VERTEX_SHADER = /* wgsl */ `
    struct VertexOutput {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
    };

    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
      var pos = array<vec2f, 4>(
        vec2f(-1.0, -1.0),
        vec2f( 1.0, -1.0),
        vec2f(-1.0,  1.0),
        vec2f( 1.0,  1.0)
      );

      var uv = array<vec2f, 4>(
        vec2f(0.0, 1.0),
        vec2f(1.0, 1.0),
        vec2f(0.0, 0.0),
        vec2f(1.0, 0.0)
      );

      var output: VertexOutput;
      output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
      output.uv = uv[vertexIndex];
      return output;
    }
  `;

  /**
   * Initialize WebGPU pipeline, sampler, uniform buffers and shader modules
   */
  async initialize(
    device: GPUDevice,
    wgslShaderCode: string,
    options: EffectPipelineOptions = {}
  ): Promise<void> {
    this.device = device;

    // 1. Create Linear Sampler for Video Frames
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });

    // 2. Uniform Buffer for Exposed Parameters (Time, Resolution, Controls)
    // Aligned to 16-byte boundary requirement
    const rawSize = options.uniformSize || 64;
    const alignedSize = Math.ceil(rawSize / 16) * 16;

    this.uniformBuffer = device.createBuffer({
      size: alignedSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // 3. Compile WGSL Shader Module (Prepend vertex shader if missing vs_main)
    const fullShaderCode = wgslShaderCode.includes('vs_main')
      ? wgslShaderCode
      : `${EffectPipelineEngine.DEFAULT_VERTEX_SHADER}\n${wgslShaderCode}`;

    const shaderModule = device.createShaderModule({
      code: fullShaderCode,
    });

    // 4. Configure Bind Group Layout
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });

    // 5. Construct Render Pipeline
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    const format = options.outputFormat || 'rgba8unorm';

    this.pipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-strip',
      },
    });

    this.isInitialized = true;
  }

  /**
   * Helper to pack structured parameters into 16-byte aligned Float32Array for GPU uniform buffer
   */
  public packUniformBuffer(data: {
    time?: number;
    resolution?: [number, number];
    customValues?: number[];
  }): Float32Array {
    // 16 floats = 64 bytes
    const buffer = new Float32Array(16);
    buffer[0] = data.time || 0;
    if (data.resolution) {
      buffer[1] = data.resolution[0];
      buffer[2] = data.resolution[1];
    }
    buffer[3] = 0; // padding to 16 bytes

    if (data.customValues) {
      for (let i = 0; i < Math.min(data.customValues.length, 12); i++) {
        buffer[4 + i] = data.customValues[i];
      }
    }
    return buffer;
  }

  /**
   * Executes a single frame render pass onto output target view
   */
  renderFrame(
    commandEncoder: GPUCommandEncoder,
    inputTextureView: GPUTextureView,
    outputTargetView: GPUTextureView,
    uniformData: Float32Array
  ): void {
    if (!this.isInitialized) {
      throw new Error("EffectPipelineEngine must be initialized before rendering frames.");
    }

    // A. Update Uniforms (Time, Sliders, Keyframes)
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

    // B. Re-bind Input Texture View (Zero-copy GPU reference)
    const frameBindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.sampler },
        { binding: 1, resource: inputTextureView },
        { binding: 2, resource: { buffer: this.uniformBuffer } },
      ],
    });

    // C. Record GPU Render Pass
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: outputTargetView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, frameBindGroup);
    passEncoder.draw(4); // 4 vertices for full-screen quad
    passEncoder.end();
  }

  /**
   * Destroy and release GPU resources
   */
  destroy(): void {
    if (this.uniformBuffer) {
      this.uniformBuffer.destroy();
    }
    this.isInitialized = false;
  }
}
