# Transition Lab

Professional transition effects workspace for creating, testing, and publishing video transitions.

## Features

### 🎬 Live Preview Canvas

- Real-time transition rendering between two clips
- Canvas-based rendering engine
- Playback controls (play, pause, reset, scrub)
- Loop toggle for continuous preview
- Upload custom clips for testing

### 📚 Transition Library

- 20+ professional presets across 6 categories:
  - **Fade**: Simple fade, fade to black/white, dissolve with blur
  - **Slide**: Directional slides, push effects
  - **Wipe**: Horizontal, vertical, diagonal, circular, clock wipes
  - **Zoom**: Zoom in/out, zoom with blur
  - **Dissolve**: Cross-dissolve with motion blur
  - **Creative**: Pixelate, blur dissolve effects

- Search & filter by category
- Click to apply and preview instantly

### ⚙️ Transition Parameters

- **Duration**: Adjust transition length (0.1s - 10s)
- **Easing**: Linear, easeIn, easeOut, easeInOut
- **Alignment**: Start, center, or end alignment
- **Type-specific params**: Direction, blur amount, scale, etc.

### 📤 Publishing

- Publish transitions directly to the API
- Auto-generate thumbnails from canvas
- Admin approval workflow
- Instant integration with main Clypra editor

## Architecture

```
transition/
├── transitionPresets.ts      # Preset definitions
├── transitionRenderer.ts     # Canvas rendering engine
├── TransitionWorkspace.tsx   # Main UI component
└── index.ts                  # Module exports
```

## Transition Rendering

Transitions are rendered using canvas-based algorithms:

```typescript
renderTransition(
  ctx: CanvasRenderingContext2D,
  clipA: HTMLVideoElement | HTMLImageElement,
  clipB: HTMLVideoElement | HTMLImageElement,
  transition: TransitionPreset,
  progress: number, // 0-1
  duration: number
)
```

### Supported Transition Types

- **fade**: Opacity-based crossfades with optional color overlay
- **slide**: Directional slides with optional push
- **wipe**: Various wipe patterns (horizontal, vertical, diagonal, circular, clock)
- **zoom**: Scale-based transitions with optional blur
- **blur**: Motion blur dissolve
- **pixelate**: Pixel grid dissolution

### Easing Functions

- `linear`: Constant speed
- `easeIn`: Accelerating
- `easeOut`: Decelerating
- `easeInOut`: Smooth start and end

## Adding New Transitions

1. Add preset to `transitionPresets.ts`:

```typescript
{
  id: "my-transition",
  name: "My Transition",
  category: "creative",
  description: "Cool new effect",
  tags: ["cool", "new"],
  defaultDuration: 1.0,
  defaultAlignment: "center",
  defaultEasing: "easeInOut",
  renderer: "canvas",
  type: "fade", // or create new type
  params: {
    // Custom parameters
  }
}
```

2. If using new type, add renderer to `transitionRenderer.ts`

3. Test in workspace preview

4. Publish to API

## Integration with Clypra Editor

Once published, transitions are available in the main editor:

1. User adds two clips to timeline
2. Right-click between clips → "Add Transition"
3. Browse transition library
4. Select transition and adjust parameters
5. Real-time preview in program monitor

## API Endpoints

```
GET  /transitions/manifest           # Categories & counts
GET  /transitions/:category          # List by category
GET  /transitions/:category/:id      # Get specific transition
GET  /transitions/search?q=fade      # Search transitions
POST /transitions/upload              # Publish new transition
```

## Future Enhancements

- [ ] AI-powered transition generation
- [ ] Custom shader support (WebGL)
- [ ] Transition timeline with keyframes
- [ ] Advanced easing curve editor
- [ ] Video export of transition preview
- [ ] Before/after split view comparison
- [ ] Thumbnail auto-generation improvements
- [ ] More creative transition types (film burn, light leak, glitch)

## Development

Run the studio:

```bash
npm run dev
```

Access Transition Lab:

1. Open Clypra Studio
2. Click "Transitions" icon in left rail
3. Select a preset or create new
4. Upload test clips
5. Preview and adjust parameters
6. Publish to API

## Credits

Built with React, TypeScript, and Canvas 2D API for maximum performance and compatibility.
