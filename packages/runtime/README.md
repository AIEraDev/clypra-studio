# @clypra-studio/runtime

Core execution engine and shared runtime infrastructure powering Clypra Studio and Clypra Desktop Editor.

## Installation

```bash
pnpm add @clypra-studio/runtime
```

## Architectural Subsystems

- **Graph & Compiler**: Media processing graph builder, validation engine, and NLE project-to-graph compiler (`./graph`, `./compiler`, `./project`).
- **Planner & Executor**: Frame graph planner, render job builder, and job execution engine (`./planner`, `./job`, `./executor`).
- **Render Backends**: GPU-accelerated PixiJS renderer and Headless Null renderer (`./pixi`, `./null`).
- **WebGPU Pipeline**: Hardware-accelerated WebGPU execution pipeline (`./webgpu`).
- **Host Plugin Bridge & SDK**: `.vefx` plugin bridge and host communication protocol (`./bridge`).
- **Keyframe & Animation Engine**: Bezier curve interpolation and keyframe property animation (`./keyframe`).
- **Audio Spectrum Engine**: Real-time audio spectrum binding and frequency band extraction (`./audio`).
- **Testing & Validation**: Golden frame comparison suite, GPU benchmark runner, and effect validation (`./testing`, `./validation`).

## Usage

```typescript
import { FrameGraphPlanner } from "@clypra-studio/runtime/planner";
import { PixiRenderer } from "@clypra-studio/runtime/pixi";
import { KeyframeEvaluator } from "@clypra-studio/runtime/keyframe";

// Create frame planner & renderer
const planner = new FrameGraphPlanner({ targetWidth: 1920, targetHeight: 1080 });
const renderer = new PixiRenderer();
```

## License

MIT
