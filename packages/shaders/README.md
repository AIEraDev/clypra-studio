# @clypra-studio/shaders

Reusable GLSL shader library for video effects. A collection of high-performance shaders for common video processing tasks.

## Installation

```bash
npm install @clypra-studio/shaders
# or
pnpm add @clypra-studio/shaders
# or
yarn add @clypra-studio/shaders
```

## Usage

```typescript
import { createShader } from "@clypra-studio/shaders";
import { BlurShader } from "@clypra-studio/shaders/blur";
import { ColorShader } from "@clypra-studio/shaders/color";
import { NoiseShader } from "@clypra-studio/shaders/noise";
import { shaderUtils } from "@clypra-studio/shaders/utils";

// Use a pre-built shader
const blurShader = BlurShader.create({ radius: 10 });

// Combine shaders
const composite = shaderUtils.compose(ColorShader.saturation(1.2), BlurShader.gaussian(5));
```

## Features

- ✅ **Color Effects** - Saturation, hue, brightness, contrast
- ✅ **Blur Effects** - Gaussian, box, and directional blur
- ✅ **Distortion** - Warp, ripple, and displacement effects
- ✅ **Noise** - Perlin, simplex, and cellular noise
- ✅ **Composite** - Blend modes and compositing operations
- ✅ **Utils** - Shader composition and common utilities
- ✅ **TypeScript** - Full type definitions
- ✅ **Tree-shakeable** - Import only what you need

## Available Shaders

### Color Shaders (`/color`)

- Saturation adjustment
- Hue rotation
- Brightness control
- Contrast adjustment
- Color grading

### Blur Shaders (`/blur`)

- Gaussian blur
- Box blur
- Directional blur
- Radial blur

### Distortion Shaders (`/distortion`)

- Warp effects
- Ripple effects
- Displacement mapping

### Noise Shaders (`/noise`)

- Perlin noise
- Simplex noise
- Cellular noise
- Fractal noise

### Composite Shaders (`/composite`)

- Blend modes (multiply, screen, overlay, etc.)
- Alpha compositing
- Masking operations

### Utilities (`/utils`)

- Shader composition helpers
- Common GLSL functions
- Coordinate transformations

## Entry Points

- **`@clypra-studio/shaders`** - Main exports
- **`@clypra-studio/shaders/color`** - Color effects
- **`@clypra-studio/shaders/blur`** - Blur effects
- **`@clypra-studio/shaders/distortion`** - Distortion effects
- **`@clypra-studio/shaders/composite`** - Compositing operations
- **`@clypra-studio/shaders/noise`** - Noise generators
- **`@clypra-studio/shaders/utils`** - Utilities and helpers

## License

MIT

## Links

- [GitHub Repository](https://github.com/AIEraDev/clypra-studio)
- [Report Issues](https://github.com/AIEraDev/clypra-studio/issues)
- [npm Package](https://www.npmjs.com/package/@clypra-studio/shaders)

---

> **Note:** This package was previously published as `@clypra-studio/shader-library`. Use `@clypra-studio/shaders` for new projects.
