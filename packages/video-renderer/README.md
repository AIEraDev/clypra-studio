# @clypra/video-renderer

**Professional PixiJS-based video rendering engine** - Single source of truth for Clypra Editor and Studio.

## Features

- 🎬 **Unified Video Rendering**: Consistent video rendering across Editor and Studio
- ⚡ **GPU-Accelerated**: WebGL-based rendering with PixiJS
- 🎨 **Media Overlay System**: Seamless compositing of video, images, text, and stickers
- 🔄 **Transition Engine**: Professional dual-channel video transitions
- 🎭 **Effect System**: Modular GPU filters and motion effects
- 📦 **Memory Efficient**: Frame-based lifecycle with automatic garbage collection
- 🎯 **Type-Safe**: Full TypeScript support

## Architecture

```
VideoRenderer (Core)
├── LayerManager (Media Overlays)
│   ├── VideoLayer
│   ├── ImageLayer
│   ├── TextLayer
│   └── StickerLayer
├── TransitionEngine
├── FilterEngine
└── TexturePool
```

## Quick Start

### Basic Setup

```typescript
import { VideoRenderer } from "@clypra/video-renderer";

const canvas = document.querySelector("canvas");
const renderer = new VideoRenderer({
  canvas,
  width: 1920,
  height: 1080,
  backgroundColor: 0x000000,
});

await renderer.initialize();
```

### Rendering Video

```typescript
// Set video source
const video = document.querySelector("video");
renderer.setVideoSource(video);

// Add filters
renderer.addFilter("blur", { strength: 10 });
renderer.addFilter("brightness", { value: 1.2 });

// Render frame
renderer.render();
```

### Overlaying Media

```typescript
import { TextLayer, StickerLayer } from "@clypra/video-renderer/layers";

// Add text overlay
const textLayer = new TextLayer({
  text: "Hello World",
  x: 100,
  y: 100,
  fontSize: 48,
  color: "#ffffff",
});

renderer.addLayer(textLayer);

// Add sticker (Lottie animation)
const stickerLayer = new StickerLayer({
  animationPath: "/stickers/confetti.json",
  x: 500,
  y: 300,
  width: 200,
  height: 200,
});

renderer.addLayer(stickerLayer);
```

### Transitions

```typescript
import { TransitionEngine } from "@clypra/video-renderer/transitions";

const transition = renderer.createTransition({
  type: "cross-dissolve",
  duration: 2000,
  fromSource: videoA,
  toSource: videoB,
});

// Update progress (0.0 to 1.0)
transition.setProgress(0.5);

// Render transition frame
renderer.renderTransition(transition);
```

### Custom GPU Filters

```typescript
import { Filter } from "@clypra/video-renderer/filters";

const customFilter = Filter.from({
  gl: {
    fragment: `
      precision mediump float;
      in vec2 vTextureCoord;
      out vec4 fragColor;
      uniform sampler2D uSampler;
      uniform float uTime;
      
      void main(void) {
        vec4 color = texture(uSampler, vTextureCoord);
        float wave = sin(vTextureCoord.y * 10.0 + uTime) * 0.1;
        fragColor = vec4(color.rgb + wave, color.a);
      }
    `,
  },
  resources: {
    customUniforms: {
      uTime: { value: 0.0, type: "f32" },
    },
  },
});

renderer.addCustomFilter(customFilter);
```

## API Reference

### VideoRenderer

#### Constructor Options

```typescript
interface VideoRendererConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: number;
  pixelRatio?: number;
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
}
```

#### Methods

- `initialize(): Promise<void>` - Initialize the renderer
- `setVideoSource(video: HTMLVideoElement): void` - Set active video source
- `setImageSource(image: HTMLImageElement | HTMLCanvasElement): void` - Set active image source
- `addLayer(layer: Layer): void` - Add media overlay layer
- `removeLayer(layerId: string): void` - Remove media overlay layer
- `addFilter(type: string, params: Record<string, any>): void` - Add GPU filter
- `removeFilter(filterId: string): void` - Remove GPU filter
- `render(): void` - Render current frame
- `resize(width: number, height: number): void` - Resize renderer
- `destroy(): void` - Clean up resources

### Layer Types

#### VideoLayer

```typescript
interface VideoLayerConfig {
  id: string;
  video: HTMLVideoElement;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  rotation?: number;
  filters?: Filter[];
}
```

#### TextLayer

```typescript
interface TextLayerConfig {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  opacity?: number;
  rotation?: number;
}
```

#### StickerLayer

```typescript
interface StickerLayerConfig {
  id: string;
  animationPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  rotation?: number;
  speed?: number;
  loop?: boolean;
}
```

## Performance

- **Frame-based Lifecycle**: Automatic sprite visibility management
- **Garbage Collection**: Releases unused sprites after 180 inactive frames (~3s at 60fps)
- **Texture Pooling**: Reuses RenderTextures to minimize allocations
- **Efficient Transitions**: Pre-renders to RenderTextures, composites on GPU
- **Smart Updates**: Only updates textures when content changes

## Best Practices

1. **Reuse Renderer Instances**: Create one renderer per canvas, reuse across renders
2. **Batch Filter Updates**: Update multiple filter params at once to minimize GPU calls
3. **Layer Ordering**: Set explicit z-index values for predictable layering
4. **Memory Management**: Call `destroy()` when done to prevent leaks
5. **Video Element Handling**: Check `readyState >= 2` before rendering video frames

## Integration Examples

### React Hook

```typescript
import { useEffect, useRef } from "react";
import { VideoRenderer } from "@clypra/video-renderer";

export function useVideoRenderer(canvas: HTMLCanvasElement | null) {
  const rendererRef = useRef<VideoRenderer | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const renderer = new VideoRenderer({
      canvas,
      width: 1920,
      height: 1080,
    });

    renderer.initialize().then(() => {
      rendererRef.current = renderer;
    });

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [canvas]);

  return rendererRef.current;
}
```

### Vue Composition API

```typescript
import { ref, onMounted, onUnmounted } from "vue";
import { VideoRenderer } from "@clypra/video-renderer";

export function useVideoRenderer() {
  const renderer = ref<VideoRenderer | null>(null);
  const canvas = ref<HTMLCanvasElement | null>(null);

  onMounted(async () => {
    if (!canvas.value) return;

    renderer.value = new VideoRenderer({
      canvas: canvas.value,
      width: 1920,
      height: 1080,
    });

    await renderer.value.initialize();
  });

  onUnmounted(() => {
    renderer.value?.destroy();
  });

  return { renderer, canvas };
}
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)
