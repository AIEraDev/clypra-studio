import { describe, it, expect, beforeEach } from "vitest";
import { ProjectHelper, type ProjectManifestV2, type TrackDefinition } from "../project/types";
import { ProjectCompiler } from "./ProjectCompiler";
import { FrameGraphBuilder } from "../planner/FrameGraphBuilder";
import { NodeRegistry } from "../graph/NodeRegistry";
import { GraphValidator } from "../validation/GraphValidator";
import { GraphHelper, type MediaProcessingGraph } from "../graph/types";
import { NullBackend } from "../runtime/NullBackend";
import { CommandBufferBuilder } from "../runtime/CommandBufferBuilder";
import type { CommandBuffer } from "../runtime/types";

describe("V2 Pipeline Vertical Slice", () => {
  it("should compile manifest and build a frame graph for active clips", () => {
    // 1. Create a project manifest with a single video track, one clip, and an effect stack
    const initialManifest = ProjectHelper.createEmpty("test-proj", "Test Project");

    const testTrack: TrackDefinition = {
      id: "track-1",
      name: "Video Track 1",
      type: "video",
      enabled: true,
      clips: [
        {
          id: "clip-1",
          assetId: "asset-video-1",
          timelineStartMs: 0,
          timelineEndMs: 2000,
          sourceStartMs: 0,
          speed: 1.0,
          enabled: true,
        },
      ],
      effectStack: [
        {
          id: "eff-brightness",
          type: "Brightness",
          params: { brightness: 0.15 },
        },
        {
          id: "eff-blur",
          type: "GaussianBlur",
          params: { blur: 12.0 },
        },
      ],
    };

    const manifest = ProjectHelper.withTrack(initialManifest, testTrack);

    // 2. Compile Project Manifest into the MediaProcessingGraph
    const mpg = ProjectCompiler.compile(manifest);

    expect(mpg.nodes).toHaveLength(4); // TrackSourceManager + Brightness + Blur + OutputNode

    // Check that we have nodes of correct types
    const nodeTypes = mpg.nodes.map((n) => n.type);
    expect(nodeTypes).toContain("TrackSourceManager");
    expect(nodeTypes).toContain("Brightness");
    expect(nodeTypes).toContain("GaussianBlur");
    expect(nodeTypes).toContain("OutputNode");

    // 3. Build a FrameGraph for a specific timestamp (500ms)
    const frameGraph = FrameGraphBuilder.build(mpg, 500, 15, 1920, 1080);

    expect(frameGraph.frameNumber).toBe(15);
    expect(frameGraph.timelineTimeMs).toBe(500);

    // Verify that the output node chain is resolved
    expect(frameGraph.nodes).toHaveLength(4);

    // Verify GPU resource requests were planned
    const resourceIds = frameGraph.resourceRequests.map((r) => r.id);
    expect(resourceIds).toContain("res-src-frame");
    expect(resourceIds).toContain("res-final-frame");
    expect(resourceIds).toContain("res-track-source-track-1");
    expect(resourceIds).toContain("res-temp-h-track-track-1-effect-eff-blur"); // H blur temp buffer
    expect(resourceIds).toContain("res-blur-out-track-track-1-effect-eff-blur"); // Final blur buffer
    expect(resourceIds).toContain("res-out-track-track-1-effect-eff-brightness"); // Brightness buffer

    // Verify render passes (e.g. GaussianBlur is correctly split into horizontal and vertical passes)
    const passShaderIds = frameGraph.passes.map((p) => p.shaderId);
    expect(passShaderIds).toContain("blit-source");
    expect(passShaderIds).toContain("brightness");
    expect(passShaderIds).toContain("gaussian-blur-h");
    expect(passShaderIds).toContain("gaussian-blur-v");
    expect(passShaderIds).toContain("copy"); // Blit final output
  });

  it("should skip compiling nodes if clip is inactive at timeline time", () => {
    const initialManifest = ProjectHelper.createEmpty("test-proj-2", "Test Project 2");

    const testTrack: TrackDefinition = {
      id: "track-2",
      name: "Video Track 2",
      type: "video",
      enabled: true,
      clips: [
        {
          id: "clip-2",
          assetId: "asset-video-2",
          timelineStartMs: 1000,
          timelineEndMs: 2000,
          sourceStartMs: 0,
          speed: 1.0,
          enabled: true,
        },
      ],
      effectStack: [],
    };

    const manifest = ProjectHelper.withTrack(initialManifest, testTrack);
    const mpg = ProjectCompiler.compile(manifest);

    // Build FrameGraph at 500ms (where the clip is not yet active)
    const frameGraph = FrameGraphBuilder.build(mpg, 500, 15, 1920, 1080);

    // Only the OutputNode remains in the active list; TrackSourceManager is pruned because clip is inactive
    expect(frameGraph.nodes).toHaveLength(1);
    expect(frameGraph.nodes[0].type).toBe("OutputNode");
  });
});

describe("NodeRegistry", () => {
  let registry: NodeRegistry;

  beforeEach(() => {
    registry = NodeRegistry.createDefault();
  });

  it("should register and retrieve node definitions", () => {
    expect(registry.has("GaussianBlur")).toBe(true);
    expect(registry.has("Brightness")).toBe(true);
    expect(registry.has("UnknownEffect")).toBe(false);

    const blurDef = registry.getDefinition("GaussianBlur");
    expect(blurDef).toBeDefined();
    expect(blurDef?.name).toBe("Gaussian Blur");
    expect(blurDef?.capabilities.spatial).toBe(true);
    expect(blurDef?.requirements.multipass).toBe(true);
  });

  it("should retrieve execution planners", () => {
    const planner = registry.getPlanner("GaussianBlur");
    expect(planner).toBeDefined();

    const passes = planner!.planExecution("test-node", "GaussianBlur", { blur: 10.0 }, ["input-res"], "output-res", 1920, 1080);

    expect(passes).toHaveLength(2); // Horizontal and vertical passes
    expect(passes[0].shaderId).toBe("gaussian-blur-h");
    expect(passes[1].shaderId).toBe("gaussian-blur-v");
    expect(passes[0].uniforms.uBlurStrength).toBe(10.0);
  });

  it("should list all registered node types", () => {
    const types = registry.getAllTypes();
    expect(types).toContain("GaussianBlur");
    expect(types).toContain("Brightness");
    expect(types).toContain("Contrast");
    expect(types).toContain("AlphaBlend");
    expect(types).toContain("MotionBlur");
    expect(types).toContain("TrackSourceManager");
    expect(types).toContain("OutputNode");
  });

  it("should register custom effect and compile it successfully", () => {
    const customRegistry = new NodeRegistry();

    customRegistry.register(
      {
        type: "CustomVignette",
        name: "Custom Vignette",
        description: "A custom vignette effect",
        version: 1,
        capabilities: {
          temporal: false,
          stateful: false,
          spatial: false,
          geometry: false,
          inputsCount: 1,
        },
        requirements: {
          temporalRadius: 0,
          preferredPrecision: "fp16",
          multipass: false,
          supportsHalfResolution: true,
        },
        inputs: [{ id: "input", name: "Color Input", type: "Texture" }],
        outputs: [{ id: "output", name: "Color Output", type: "Texture" }],
        defaultParams: { intensity: 0.5 },
        paramSchema: {
          intensity: { type: "number", min: 0, max: 1, default: 0.5 },
        },
      },
      {
        planExecution(nodeId, nodeType, params, inputs, output, width, height) {
          return [
            {
              shaderId: "custom-vignette",
              name: "Apply Custom Vignette",
              inputs,
              output,
              uniforms: params,
            },
          ];
        },
      },
    );

    // Also register the built-in nodes
    const defaultRegistry = NodeRegistry.createDefault();
    for (const type of defaultRegistry.getAllTypes()) {
      const def = defaultRegistry.getDefinition(type);
      const planner = defaultRegistry.getPlanner(type);
      if (def && planner) {
        customRegistry.register(def, planner);
      }
    }

    expect(customRegistry.has("CustomVignette")).toBe(true);

    // Now compile a manifest using the custom effect
    const initialManifest = ProjectHelper.createEmpty("test-custom", "Custom Effect Test");
    const testTrack: TrackDefinition = {
      id: "track-1",
      name: "Video Track 1",
      type: "video",
      enabled: true,
      clips: [
        {
          id: "clip-1",
          assetId: "asset-1",
          timelineStartMs: 0,
          timelineEndMs: 1000,
          sourceStartMs: 0,
          speed: 1.0,
          enabled: true,
        },
      ],
      effectStack: [
        {
          id: "custom-eff",
          type: "CustomVignette",
          params: { intensity: 0.8 },
        },
      ],
    };

    const manifest = ProjectHelper.withTrack(initialManifest, testTrack);
    const graph = ProjectCompiler.compile(manifest, customRegistry);

    const nodeTypes = graph.nodes.map((n) => n.type);
    expect(nodeTypes).toContain("CustomVignette");
  });

  it("should throw error for unregistered node type", () => {
    const emptyRegistry = new NodeRegistry();

    // Register only the required system nodes
    const defaultRegistry = NodeRegistry.createDefault();
    emptyRegistry.register(defaultRegistry.getDefinition("TrackSourceManager")!, defaultRegistry.getPlanner("TrackSourceManager")!);
    emptyRegistry.register(defaultRegistry.getDefinition("OutputNode")!, defaultRegistry.getPlanner("OutputNode")!);

    const initialManifest = ProjectHelper.createEmpty("test-unknown", "Unknown Effect Test");
    const testTrack: TrackDefinition = {
      id: "track-1",
      name: "Video Track 1",
      type: "video",
      enabled: true,
      clips: [
        {
          id: "clip-1",
          assetId: "asset-1",
          timelineStartMs: 0,
          timelineEndMs: 1000,
          sourceStartMs: 0,
          speed: 1.0,
          enabled: true,
        },
      ],
      effectStack: [
        {
          id: "unknown-eff",
          type: "UnknownEffect",
          params: {},
        },
      ],
    };

    const manifest = ProjectHelper.withTrack(initialManifest, testTrack);

    expect(() => {
      ProjectCompiler.compile(manifest, emptyRegistry);
    }).toThrow("Unknown effect type: UnknownEffect");
  });
});

describe("GraphValidator", () => {
  let registry: NodeRegistry;
  let validator: GraphValidator;

  beforeEach(() => {
    registry = NodeRegistry.createDefault();
    validator = new GraphValidator(registry);
  });

  it("should validate a correct graph", () => {
    const initialManifest = ProjectHelper.createEmpty("test-valid", "Valid Graph Test");
    const testTrack: TrackDefinition = {
      id: "track-1",
      name: "Video Track 1",
      type: "video",
      enabled: true,
      clips: [
        {
          id: "clip-1",
          assetId: "asset-1",
          timelineStartMs: 0,
          timelineEndMs: 1000,
          sourceStartMs: 0,
          speed: 1.0,
          enabled: true,
        },
      ],
      effectStack: [
        {
          id: "brightness-eff",
          type: "Brightness",
          params: { brightness: 0.2 },
        },
      ],
    };

    const manifest = ProjectHelper.withTrack(initialManifest, testTrack);
    const graph = ProjectCompiler.compile(manifest, registry);
    const result = validator.validate(graph);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect type mismatches in pin connections", () => {
    // Manually construct a graph with a type mismatch
    let graph = GraphHelper.create("test-mismatch");

    graph = GraphHelper.withNode(graph, {
      id: "source",
      type: "TrackSourceManager",
      version: 1,
      params: {},
      inputs: {},
      outputs: {
        output: { id: "output", name: "Texture Output", type: "Texture" },
      },
      capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 0 },
      requirements: { temporalRadius: 0, preferredPrecision: "fp16", multipass: false, supportsHalfResolution: true },
      lifecycle: "Created",
    });

    graph = GraphHelper.withNode(graph, {
      id: "invalid-consumer",
      type: "Brightness",
      version: 1,
      params: {},
      inputs: {
        input: { id: "input", name: "Depth Input", type: "Depth" }, // Wrong type!
      },
      outputs: {
        output: { id: "output", name: "Output", type: "Texture" },
      },
      capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 1 },
      requirements: { temporalRadius: 0, preferredPrecision: "fp8", multipass: false, supportsHalfResolution: true },
      lifecycle: "Created",
    });

    graph = GraphHelper.withEdge(graph, "source", "output", "invalid-consumer", "input");

    const result = validator.validate(graph);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe("type_mismatch");
    expect(result.errors[0].message).toContain("Cannot connect Texture output to Depth input");
  });

  it("should detect cycles in the graph", () => {
    let graph = GraphHelper.create("test-cycle");

    graph = GraphHelper.withNode(graph, {
      id: "node-a",
      type: "Brightness",
      version: 1,
      params: {},
      inputs: {
        input: { id: "input", name: "Input", type: "Texture" },
      },
      outputs: {
        output: { id: "output", name: "Output", type: "Texture" },
      },
      capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 1 },
      requirements: { temporalRadius: 0, preferredPrecision: "fp8", multipass: false, supportsHalfResolution: true },
      lifecycle: "Created",
    });

    graph = GraphHelper.withNode(graph, {
      id: "node-b",
      type: "Contrast",
      version: 1,
      params: {},
      inputs: {
        input: { id: "input", name: "Input", type: "Texture" },
      },
      outputs: {
        output: { id: "output", name: "Output", type: "Texture" },
      },
      capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 1 },
      requirements: { temporalRadius: 0, preferredPrecision: "fp8", multipass: false, supportsHalfResolution: true },
      lifecycle: "Created",
    });

    // Create a cycle: node-a -> node-b -> node-a
    graph = GraphHelper.withEdge(graph, "node-a", "output", "node-b", "input");
    graph = GraphHelper.withEdge(graph, "node-b", "output", "node-a", "input");

    const result = validator.validate(graph);

    expect(result.valid).toBe(false);
    const cycleErrors = result.errors.filter((e) => e.type === "cycle_detected");
    expect(cycleErrors.length).toBeGreaterThan(0);
    expect(cycleErrors[0].message).toContain("Cycle detected");
  });

  it("should validate edge before adding it to graph", () => {
    let graph = GraphHelper.create("test-edge-validation");

    graph = GraphHelper.withNode(graph, {
      id: "source",
      type: "TrackSourceManager",
      version: 1,
      params: {},
      inputs: {},
      outputs: {
        output: { id: "output", name: "Output", type: "Texture" },
      },
      capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 0 },
      requirements: { temporalRadius: 0, preferredPrecision: "fp16", multipass: false, supportsHalfResolution: true },
      lifecycle: "Created",
    });

    graph = GraphHelper.withNode(graph, {
      id: "effect",
      type: "Brightness",
      version: 1,
      params: {},
      inputs: {
        input: { id: "input", name: "Input", type: "Texture" },
      },
      outputs: {
        output: { id: "output", name: "Output", type: "Texture" },
      },
      capabilities: { temporal: false, stateful: false, spatial: false, geometry: false, inputsCount: 1 },
      requirements: { temporalRadius: 0, preferredPrecision: "fp8", multipass: false, supportsHalfResolution: true },
      lifecycle: "Created",
    });

    // Valid edge
    const validError = validator.validateEdge(graph, "source", "output", "effect", "input");
    expect(validError).toBeNull();

    // Invalid pin
    const invalidPinError = validator.validateEdge(graph, "source", "invalid-pin", "effect", "input");
    expect(invalidPinError).not.toBeNull();
    expect(invalidPinError?.type).toBe("invalid_connection");

    // Missing node
    const missingNodeError = validator.validateEdge(graph, "non-existent", "output", "effect", "input");
    expect(missingNodeError).not.toBeNull();
    expect(missingNodeError?.type).toBe("missing_node");
  });
});

describe("NullBackend", () => {
  let backend: NullBackend;

  beforeEach(() => {
    backend = new NullBackend();
  });

  it("should initialize and destroy correctly", async () => {
    expect(backend.isInitialized()).toBe(false);

    await backend.init();
    expect(backend.isInitialized()).toBe(true);

    backend.destroy();
    expect(backend.isInitialized()).toBe(false);
  });

  it("should record resource allocations and releases", async () => {
    await backend.init();

    backend.allocateResource("res-1", "texture", 1920, 1080, "rgba8");
    backend.allocateResource("res-2", "buffer", 256, 256, "r8");

    expect(backend.hasResource("res-1")).toBe(true);
    expect(backend.hasResource("res-2")).toBe(true);

    const resources = backend.getAllocatedResources();
    expect(resources).toHaveLength(2);
    expect(resources[0].id).toBe("res-1");
    expect(resources[0].width).toBe(1920);
    expect(resources[0].height).toBe(1080);

    const allocationOrder = backend.getResourceAllocationOrder();
    expect(allocationOrder).toEqual(["res-1", "res-2"]);

    backend.releaseResource("res-1");
    expect(backend.hasResource("res-1")).toBe(false);

    const releaseOrder = backend.getResourceReleaseOrder();
    expect(releaseOrder).toEqual(["res-1"]);
  });

  it("should record shader compilations", async () => {
    await backend.init();

    backend.compileShader("blur-h", "shader source code here");
    backend.compileShader("blur-v", "shader source code here");

    expect(backend.hasShader("blur-h")).toBe(true);
    expect(backend.hasShader("blur-v")).toBe(true);

    const shaders = backend.getCompiledShaders();
    expect(shaders).toHaveLength(2);
    expect(shaders[0].shaderId).toBe("blur-h");
  });

  it("should record command buffer submissions", async () => {
    await backend.init();

    // Setup resources and shaders
    backend.allocateResource("input", "texture", 1920, 1080, "rgba8");
    backend.allocateResource("output", "texture", 1920, 1080, "rgba8");
    backend.compileShader("test-shader", "shader code");

    const commandBuffer: CommandBuffer = {
      frameNumber: 1,
      passes: [
        {
          pass: {
            id: "pass-1",
            name: "Test Pass",
            shaderId: "test-shader",
            inputs: ["input"],
            output: "output",
            uniforms: { brightness: 0.5 },
          },
          commands: [{ op: "bind_texture", resourceId: "input" }, { op: "bind_uniforms", params: { brightness: 0.5 } }, { op: "draw" }],
        },
      ],
    };

    await backend.submit(commandBuffer);

    const history = backend.getExecutionHistory();
    expect(history).toHaveLength(1);
    expect(history[0].commandBuffer.frameNumber).toBe(1);

    const lastExecution = backend.getLastExecution();
    expect(lastExecution).toBeDefined();
    expect(lastExecution?.commandBuffer.passes).toHaveLength(1);
  });

  it("should provide helper methods for test assertions", async () => {
    await backend.init();

    backend.allocateResource("input", "texture", 1920, 1080, "rgba8");
    backend.allocateResource("output", "texture", 1920, 1080, "rgba8");
    backend.compileShader("shader-1", "code");
    backend.compileShader("shader-2", "code");

    const commandBuffer: CommandBuffer = {
      frameNumber: 1,
      passes: [
        {
          pass: {
            id: "pass-1",
            name: "First Pass",
            shaderId: "shader-1",
            inputs: ["input"],
            output: "output",
            uniforms: {},
          },
          commands: [],
        },
        {
          pass: {
            id: "pass-2",
            name: "Second Pass",
            shaderId: "shader-2",
            inputs: ["output"],
            output: "input",
            uniforms: {},
          },
          commands: [],
        },
      ],
    };

    await backend.submit(commandBuffer);

    expect(backend.getLastPassCount()).toBe(2);
    expect(backend.getLastPassNames()).toEqual(["First Pass", "Second Pass"]);
    expect(backend.getLastShaderIds()).toEqual(["shader-1", "shader-2"]);
  });

  it("should throw error when submitting with non-existent resources", async () => {
    await backend.init();

    backend.compileShader("test-shader", "code");

    const commandBuffer: CommandBuffer = {
      frameNumber: 1,
      passes: [
        {
          pass: {
            id: "pass-1",
            name: "Test Pass",
            shaderId: "test-shader",
            inputs: ["non-existent-input"],
            output: "non-existent-output",
            uniforms: {},
          },
          commands: [],
        },
      ],
    };

    await expect(backend.submit(commandBuffer)).rejects.toThrow("non-existent input resource");
  });

  it("should allow reading pixels from allocated resources", async () => {
    await backend.init();

    backend.allocateResource("frame", "texture", 1920, 1080, "rgba8");

    const pixels = await backend.readPixels("frame");
    expect(pixels).toBeInstanceOf(Uint8Array);
    expect(pixels.length).toBe(1920 * 1080 * 4); // RGBA
  });

  it("should reset state correctly", async () => {
    await backend.init();

    backend.allocateResource("res", "texture", 100, 100, "rgba8");
    backend.compileShader("shader", "code");

    backend.reset();

    expect(backend.getAllocatedResources()).toHaveLength(0);
    expect(backend.getCompiledShaders()).toHaveLength(0);
    expect(backend.getExecutionHistory()).toHaveLength(0);
  });
});

describe("End-to-End: Null Execution Flow", () => {
  it("should compile, validate, plan, and execute through NullBackend", async () => {
    const registry = NodeRegistry.createDefault();
    const validator = new GraphValidator(registry);
    const backend = new NullBackend();

    // 1. Create project manifest
    const initialManifest = ProjectHelper.createEmpty("e2e-test", "End-to-End Test");
    const testTrack: TrackDefinition = {
      id: "track-1",
      name: "Video Track 1",
      type: "video",
      enabled: true,
      clips: [
        {
          id: "clip-1",
          assetId: "asset-1",
          timelineStartMs: 0,
          timelineEndMs: 2000,
          sourceStartMs: 0,
          speed: 1.0,
          enabled: true,
        },
      ],
      effectStack: [
        {
          id: "blur-eff",
          type: "GaussianBlur",
          params: { blur: 10.0 },
        },
      ],
    };

    const manifest = ProjectHelper.withTrack(initialManifest, testTrack);

    // 2. Compile to graph
    const graph = ProjectCompiler.compile(manifest, registry);

    // 3. Validate graph
    const validationResult = validator.validate(graph);
    expect(validationResult.valid).toBe(true);

    // 4. Build frame graph
    const frameGraph = FrameGraphBuilder.build(graph, 500, 15, 1920, 1080);

    // 5. Initialize backend
    await backend.init();

    // 6. Allocate all resources
    for (const req of frameGraph.resourceRequests) {
      backend.allocateResource(req.id, req.type, req.width, req.height, req.format);
    }

    // 7. Compile all shaders
    const uniqueShaders = new Set(frameGraph.passes.map((p) => p.shaderId));
    for (const shaderId of uniqueShaders) {
      backend.compileShader(shaderId, `// Mock shader code for ${shaderId}`);
    }

    // 8. Build command buffer from frame graph passes
    const commandBuffer = CommandBufferBuilder.fromFrameGraph(frameGraph);

    // 9. Submit to backend
    await backend.submit(commandBuffer);

    // 10. Verify execution
    const execution = backend.getLastExecution();
    expect(execution).toBeDefined();
    expect(execution?.commandBuffer.frameNumber).toBe(15);

    const passNames = backend.getLastPassNames();
    expect(passNames).toContain("Read Track Source Frame");
    expect(passNames).toContain("Gaussian Blur Horizontal");
    expect(passNames).toContain("Gaussian Blur Vertical");
    expect(passNames).toContain("Blit to Output");

    const expectedPassOrder = ["blit-source", "gaussian-blur-h", "gaussian-blur-v", "copy"];
    const actualPassOrder = backend.getLastShaderIds();
    expect(actualPassOrder).toEqual(expectedPassOrder);

    // Cleanup
    backend.destroy();
  });
});
