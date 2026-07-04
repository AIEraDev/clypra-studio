# @clypra-studio/engine

The rendering and animation engine powering [Clypra Studio](https://github.com/AIEraDev/clypra-studio) — a high-performance Canvas 2D text effects system with GPU-accelerated PixiJS video effects, full Lottie JSON tooling, keyframe animation, and CapCut-style timeline capabilities.

## Installation

```bash
npm install @clypra-studio/engine
# or
pnpm add @clypra-studio/engine
# or
yarn add @clypra-studio/engine
```

## Usage

```typescript
import { EffectRenderer } from "@clypra-studio/engine";
import { TransitionRenderer } from "@clypra-studio/engine/transitions";
import { TextEffectConfig } from "@clypra-studio/engine/textEffects";
import { PixiRenderBackend } from "@clypra-studio/engine/v2/backends";

// Create an effect renderer
const renderer = new EffectRenderer(canvas, effect);

// Render a frame
await renderer.render(frame);
```

## Features

- ✅ **Text Effects** - Canvas 2D text rendering with advanced effects
- ✅ **Video Effects** - GPU-accelerated effects using PixiJS
- ✅ **Transitions** - Professional transition effects
- ✅ **Lottie Support** - Full Lottie JSON animation tooling
- ✅ **Keyframe Animation** - Timeline-based animation system
- ✅ **Render Backends** - Pixi.js GPU rendering support

## Entry Points

- **`@clypra-studio/engine`** - Main engine exports
- **`@clypra-studio/engine/transitions`** - Transition effects
- **`@clypra-studio/engine/videoEffects`** - Video effect definitions
- **`@clypra-studio/engine/textEffects`** - Text effect system
- **`@clypra-studio/engine/v2/backends`** - Rendering backends
- **`@clypra-studio/engine/v2/contract`** - V2 API contracts

## License

MIT

## Links

- [GitHub Repository](https://github.com/AIEraDev/clypra-studio)
- [Documentation](https://github.com/AIEraDev/clypra-studio/tree/main/packages/clypra-engine#readme)
- [Report Issues](https://github.com/AIEraDev/clypra-studio/issues)
- [npm Package](https://www.npmjs.com/package/@clypra-studio/engine)
