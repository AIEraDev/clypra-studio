<div align="center">
  <img src="./apps/studio/public/clypra.svg" alt="Clypra Logo" width="120" height="120" />
  <h1>Clypra Studio</h1>
  <p><strong>Professional Effect Development Platform</strong></p>
  <p>Where every visual feature is designed, tested, benchmarked, validated, versioned, and published before it reaches the editor.</p>
  
  <p>
    <a href="#-architecture">Architecture</a> • 
    <a href="#-the-three-labs">Labs</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="./docs/IMPLEMENTATION_ROADMAP.md">Roadmap</a> •
    <a href="./CONTRIBUTING.md">Contributing</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/PixiJS-8-E60010?logo=pixijs&logoColor=white" alt="PixiJS" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  </p>
</div>

---

## 🎯 Vision

**Clypra Studio is not three feature workspaces. It's three specialized editors built on one development platform.**

Each Lab validates a different aspect of the platform:

- **Video Effect Lab** — Can effects render correctly?
- **Transition Lab** — Do dual-input temporal effects work?
- **Body Effect Lab** — Is the feature provider system extensible?

But they all share the same infrastructure:

- Graph compilation
- Render planning
- GPU execution
- Performance monitoring
- Quality validation
- Publishing pipeline

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   CLYPRA STUDIO                           │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │                   Lab Layer                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │  │
│  │  │  Video   │  │Transition│  │  Body Effect │     │  │
│  │  │ Effect   │  │   Lab    │  │     Lab      │     │  │
│  │  │   Lab    │  │          │  │              │     │  │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘     │  │
│  └───────┼─────────────┼───────────────┼─────────────┘  │
│          │             │               │                 │
│  ┌───────┴─────────────┴───────────────┴─────────────┐  │
│  │              Shared Runtime Layer                  │  │
│  │                                                     │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │   Graph Builder → Planner → Pixi Backend    │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────────┐  │  │
│  │  │Inspector│  │Performance│  │   Validation    │  │  │
│  │  └─────────┘  └──────────┘  └─────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                          │                             │
└──────────────────────────┼─────────────────────────────┘
                           │
                           ▼
                   @clypra/engine
                  (Effect Registry)
                           │
                           ▼
              Desktop Rust Runtime (Tauri)
```

### Key Principle

**Three Labs. One Runtime.**

See [STUDIO_ARCHITECTURE.md](./docs/STUDIO_ARCHITECTURE.md) for complete details.

---

## 🔬 The Three Labs

### 1. Video Effect Lab

**Purpose:** Foundation for validating that effects render correctly.

**Features:**

- Live parameter editor
- Frame stepper
- Before/after comparison
- Graph inspector
- GPU profiling

**Initial Effects:**

1. Film Grain
2. VHS
3. Bloom
4. Chromatic Aberration
5. Heat Distortion

### 2. Transition Lab

**Purpose:** Specialized editor for dual-input temporal effects.

**Features:**

- Dual-input preview
- Progress slider (0.0 → 1.0)
- Duration control
- Easing selector
- Timeline scrubber

**Initial Effects:**

1. Cross Dissolve
2. Push
3. Zoom
4. Luma Wipe
5. Glitch

### 3. Body Effect Lab

**Purpose:** Future-proof effects through extensible feature providers.

**Features:**

- Feature provider selector
- Feature map visualization
- Multi-provider support
- Mask overlay
- Pose tracking preview

**Initial Effects:**

1. Neon Outline
2. Background Blur
3. Spotlight
4. Particle Aura
5. Color Isolation

**Feature Providers:**

- Segmentation (person mask)
- Chroma Key (green screen)
- **Future:** Pose, Face Mesh, Depth, Hair, Hands, etc.

See [FEATURE_PROVIDERS.md](./docs/FEATURE_PROVIDERS.md) for extensibility details.

---

## 🛠️ Shared Developer Tools

Every Lab exposes the same developer panels:

### Graph Inspector

- Node tree with dependencies
- Capability requirements
- Resource flow
- Optimization flags

### Pass Inspector

- Pass execution order
- Shader programs
- Uniform values
- Texture bindings

### Resource Inspector

- Texture allocation
- Uniform bindings
- Buffer usage
- Memory tracking

### Performance Panel

- GPU time per pass
- CPU overhead
- FPS measurement
- Pass breakdown

### Validation Panel

- Shader compilation
- Resource binding
- Graph validity
- Parameter schema

### Preset Manager

- Create/load/save presets
- Version control
- Export/import JSON
- Publishing

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (recommended for monorepo)
- **Gemini API Key** (for AI features)

### Installation

```bash
# Clone repository
git clone https://github.com/AIEraDev/clypra-studio.git
cd clypra-studio

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your GEMINI_API_KEY

# Run development server
pnpm dev
```

### Project Structure

```
clypra-studio/
├── packages/
│   ├── engine/              # @clypra/engine - Effect registry
│   ├── runtime/             # Shared execution engine
│   │   ├── graph/           # Graph builder
│   │   ├── planner/         # Frame graph planner
│   │   ├── pixi/            # Pixi.js backend
│   │   └── resources/       # Resource manager
│   ├── shader-library/      # Reusable GLSL shaders
│   └── feature-providers/   # Body effect providers
│
├── apps/
│   └── studio/
│       ├── labs/
│       │   ├── video/       # Video Effect Lab
│       │   ├── transition/  # Transition Lab
│       │   └── body/        # Body Effect Lab
│       └── shared/          # Shared UI components
│           ├── preview/
│           ├── graph/
│           ├── inspector/
│           ├── benchmark/
│           └── presets/
│
├── docs/
│   ├── STUDIO_ARCHITECTURE.md      # Architecture details
│   ├── FEATURE_PROVIDERS.md        # Extensibility guide
│   ├── PUBLISHING_PIPELINE.md      # Quality assurance
│   └── IMPLEMENTATION_ROADMAP.md   # 10-week roadmap
│
└── tests/
    ├── golden/              # Frame-accurate tests
    ├── benchmark/           # Performance tests
    └── validation/          # Effect validation
```

---

## 📋 Publishing Pipeline

Effects don't go directly to the desktop editor. They pass through quality gates:

```
Lab Development
    ↓
Validation (shader compile, resource check)
    ↓
Golden Tests (frame-accurate comparison)
    ↓
Benchmark (GPU/CPU profiling)
    ↓
Manual Approval
    ↓
Registry Publish
    ↓
Desktop Editor Import
```

### Quality Standards

- ✅ Shaders compile without errors
- ✅ All resources properly bound
- ✅ Frame output 99.9% similar to reference
- ✅ GPU time < 16ms @ 1080p/60fps
- ✅ Manual review complete

See [PUBLISHING_PIPELINE.md](./docs/PUBLISHING_PIPELINE.md) for details.

---

## 🗓️ Implementation Timeline

**10-week roadmap to production:**

- **Weeks 1-2:** Shared Runtime Foundation
- **Weeks 3-4:** Shared UI Components
- **Weeks 5-6:** Video Effect Lab + 5 effects
- **Week 7:** Transition Lab + 5 effects
- **Weeks 8-9:** Body Effect Lab + 5 effects
- **Week 10:** Publishing Pipeline

**Result:** Three Labs, One Runtime, 15 Production Effects

See [IMPLEMENTATION_ROADMAP.md](./docs/IMPLEMENTATION_ROADMAP.md) for complete details.

---

## 🎯 Success Metrics

**Not:**

- "We shipped 15 effects"

**Instead:**

- Every Lab shares the same runtime ✓
- Every effect passes validation ✓
- Every effect has golden tests ✓
- Every effect meets performance targets ✓
- Future effects are content work, not architecture work ✓

---

## 🧪 Development

### Build Commands

```bash
# Development
pnpm dev                 # Start dev server

# Build
pnpm build              # Build all packages
pnpm build:engine       # Build @clypra/engine only

# Testing
pnpm test               # Run all tests
pnpm test:golden        # Run golden tests
pnpm benchmark          # Run benchmarks

# Validation
pnpm validate           # Validate all effects
pnpm validate:effect -- --effect video/film-grain

# Publishing
pnpm publish:effect -- --effect video/film-grain --version 1.0.0
```

### Creating a New Effect

```typescript
// packages/engine/effects/video/my-effect.ts
export const myEffect: Effect = {
  id: "my-effect",
  name: "My Effect",
  category: "video",

  shader: `
    uniform sampler2D uInput;
    uniform float uIntensity;
    
    void main() {
      vec2 uv = vTextureCoord;
      vec4 color = texture2D(uInput, uv);
      
      // Your effect logic here
      
      gl_FragColor = color;
    }
  `,

  parameters: {
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      default: 0.5,
    },
  },
};
```

---

## 🤝 Contributing

We welcome contributions! Whether you're building effects, improving infrastructure, or writing documentation.

### Quick Start

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Run tests and validation (`pnpm test && pnpm validate`)
5. Commit using [conventional commits](https://www.conventionalcommits.org/)
6. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📚 Documentation

- [Architecture Overview](./docs/STUDIO_ARCHITECTURE.md) — System design and principles
- [Feature Providers](./docs/FEATURE_PROVIDERS.md) — Extensible body effects
- [Publishing Pipeline](./docs/PUBLISHING_PIPELINE.md) — Quality assurance
- [Implementation Roadmap](./docs/IMPLEMENTATION_ROADMAP.md) — 10-week plan
- [Contributing Guide](./CONTRIBUTING.md) — How to contribute
- [Code of Conduct](./CODE_OF_CONDUCT.md) — Community standards

---

## 🛡️ Tech Stack

- **Frontend** - React 19 + TypeScript
- **Build Tool** - Vite 6 (monorepo)
- **GPU Rendering** - PixiJS 8 + WebGL
- **Shader Filters** - pixi-filters + custom GLSL
- **AI Integration** - Google Gemini API
- **Testing** - Vitest + Golden Tests
- **Benchmarking** - Custom performance suite
- **Desktop Runtime** - Tauri 2 + Rust + FFmpeg

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI-powered design assistance
- **PixiJS Team** - GPU-accelerated rendering
- **React Team** - Frontend framework
- **Tauri Team** - Desktop runtime
- **The Clypra Community** - Feedback and contributions

---

## 📧 Contact

**Abdul Kabir Musa**

- Website: [abdulkabirmusa.com](https://abdulkabirmusa.com)
- GitHub: [@AIEraDev](https://github.com/AIEraDev)

---

<div align="center">
  <p>Made with ❤️ by the Clypra Team</p>
  <p>⭐ Star this repo if you believe in professional effect development!</p>
</div>
