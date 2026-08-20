# @clypra-studio/engine

Core effect registry, Canvas 2D text layout engine, Lottie JSON tooling, video/body effects, transitions, and smart overlays.

## Installation

```bash
pnpm add @clypra-studio/engine
```

## Features & Subsystems

- 🔤 **Text Layout & Effects**: Canvas 2D per-character fill, typography layout, text effects recipes, and animatable parameters.
- 🎨 **Lottie JSON Tooling**: Full Lottie parser, injector, text style editor, template presets, Google Fonts integration, and Lottie export.
- 📽️ **Video & Body Effects**: Built-in video filters, green screen chroma keying, body segmentation masks, and effect definitions.
- 🔀 **Transitions**: Dual-input temporal transition renderers and definitions.
- 🖌️ **Procedural Engines**: Procedural `InkBrushEngine` and canvas rasterization utilities.
- 🖼️ **Smart Overlays**: Declarative canvas templates, keyframe presets, and overlay document renderer.
- ⚡ **Native pipeline**: Media processing graph node registry and frame graph builder for the shared native runtime.

## Usage

```typescript
import { EffectRenderer } from "@clypra-studio/engine";
import { InkBrushEngine } from "@clypra-studio/engine";
import { TemplateRenderer } from "@clypra-studio/engine";
```

## License

MIT
