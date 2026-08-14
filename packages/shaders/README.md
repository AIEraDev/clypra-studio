# @clypra-studio/shaders

Reusable GLSL shader library, noise generators, and composition utilities for video effects in Clypra Studio.

## Installation

```bash
pnpm add @clypra-studio/shaders
```

## Modules

- **`./noise`** — GLSL noise functions (Perlin, Simplex, Cellular, Fractal noise).
- **`./utils`** — Shader composition helpers, uniform binding builders, and GLSL utility functions.

## Usage

```typescript
import { createNoiseShader } from "@clypra-studio/shaders/noise";
import { composeShaders } from "@clypra-studio/shaders/utils";
```

## License

MIT
