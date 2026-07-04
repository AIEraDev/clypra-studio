# @clypra-studio/runtime

Shared runtime infrastructure for all Clypra Studio Labs. Provides graph management, execution planning, state management, and rendering backends.

## Installation

```bash
npm install @clypra-studio/runtime
# or
pnpm add @clypra-studio/runtime
# or
yarn add @clypra-studio/runtime
```

## Usage

```typescript
import { GraphBuilder } from "@clypra-studio/runtime/graph";
import { Planner } from "@clypra-studio/runtime/planner";
import { JobExecutor } from "@clypra-studio/runtime/executor";
import { PixiRenderer } from "@clypra-studio/runtime/pixi";
import { StateManager } from "@clypra-studio/runtime/state";

// Build a render graph
const graph = new GraphBuilder().addNode("source", { type: "video" }).addNode("effect", { type: "blur" }).connect("source", "effect").build();

// Execute the graph
const executor = new JobExecutor(renderer);
await executor.execute(graph);
```

## Features

- ✅ **Graph Management** - Build and validate render graphs
- ✅ **Execution Planning** - Optimize render pass execution
- ✅ **Job Execution** - Run render jobs efficiently
- ✅ **State Management** - Track and manage rendering state
- ✅ **Pixi Renderer** - GPU-accelerated rendering with PixiJS
- ✅ **Null Renderer** - Testing and validation renderer
- ✅ **Resource Management** - Handle textures and buffers
- ✅ **Validation** - Runtime validation and error checking
- ✅ **Telemetry** - Performance monitoring and metrics

## Entry Points

- **`@clypra-studio/runtime`** - Main runtime exports
- **`@clypra-studio/runtime/graph`** - Graph building and management
- **`@clypra-studio/runtime/planner`** - Execution planning
- **`@clypra-studio/runtime/job`** - Job execution
- **`@clypra-studio/runtime/executor`** - Executor implementation
- **`@clypra-studio/runtime/state`** - State management
- **`@clypra-studio/runtime/pixi`** - PixiJS renderer
- **`@clypra-studio/runtime/null`** - Null renderer
- **`@clypra-studio/runtime/resources`** - Resource management
- **`@clypra-studio/runtime/validation`** - Validation utilities
- **`@clypra-studio/runtime/telemetry`** - Telemetry and metrics

## License

MIT

## Links

- [GitHub Repository](https://github.com/AIEraDev/clypra-studio)
- [Report Issues](https://github.com/AIEraDev/clypra-studio/issues)
- [npm Package](https://www.npmjs.com/package/@clypra-studio/runtime)
