<div align="center">

<img src="./apps/studio/public/clypra.svg" alt="Clypra Logo" width="100" height="100" />

# Clypra Studio

**Professional Effect Development Platform for Clypra Video Editor.**

Where visual effects, transitions, and shader filters are authored, benchmarked, and validated before reaching the editor runtime.

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![Native Rendering](https://img.shields.io/badge/Rendering-Native%20Pipeline-7C6FFF)](https://github.com/AIEraDev/clypra) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Architecture](#architecture) • [The Three Labs](#the-three-labs) • [Getting Started](#getting-started) • [Documentation](./docs/STUDIO_ARCHITECTURE.md) • [Contributing](CONTRIBUTING.md)

</div>

---

## Vision & Architecture

**Three Labs. One Runtime.**

Clypra Studio is built on a shared execution infrastructure (graph compilation, frame planning, and native GPU execution) powering specialized labs:

- 📽️ **Video Effect Lab** — Validates single-input frame rendering (Film Grain, VHS, Bloom, Chromatic Aberration, Heat Distortion).
- 🔀 **Transition Lab** — Validates dual-input temporal transitions (Cross Dissolve, Push, Zoom, Luma Wipe, Glitch).
- 👤 **Body Effect Lab** — Validates feature providers, person segmentation masks, and green screen keys (Neon Outline, Background Blur, Aura).

```
┌──────────────────────────────────────────────────────────┐
│                   CLYPRA STUDIO                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ Video Effect │  │  Transition   │  │ Body Effect  │  │
│  │     Lab      │  │      Lab      │  │     Lab      │  │
│  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘  │
│         └──────────────────┼─────────────────┘          │
│                            ▼                            │
│                 Shared Runtime Layer                    │
│          (Graph Builder → Planner → Native GPU)         │
└────────────────────────────┬────────────────────────────┘
                             ▼
                    @clypra/engine
```

---

## Key Packages

```
clypra-studio/
├── packages/
│   ├── clypra-engine/       # @clypra/engine - Effect registry & definitions
│   ├── runtime/             # Shared graph compilation & native execution
│   ├── shaders/             # Reusable GLSL shader library
│   ├── feature-providers/   # Segmentation & keying providers
│   └── ui/                  # Shared studio UI components
└── apps/
    └── studio/              # Studio web applications & labs
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup & Development

```bash
# Clone repository
git clone https://github.com/AIEraDev/clypra-studio.git
cd clypra-studio

# Install dependencies
pnpm install

# Start local development server
pnpm dev
```

### Scripts & Testing

```bash
pnpm build              # Build all monorepo packages
pnpm test               # Run unit & render tests
pnpm test:golden        # Run frame-accurate comparison tests
pnpm benchmark          # Run GPU performance benchmarks
pnpm validate           # Validate effect definitions
```

---

## Documentation & Contributing

- [Architecture Overview](./docs/STUDIO_ARCHITECTURE.md) — System design & graph execution
- [Feature Providers](./docs/FEATURE_PROVIDERS.md) — Extensibility guide
- [Publishing Pipeline](./docs/PUBLISHING_PIPELINE.md) — Quality gates & standards
- [Implementation Roadmap](./docs/IMPLEMENTATION_ROADMAP.md) — Feature roadmap
- [Contributing Guide](./CONTRIBUTING.md) — Contribution guidelines
- [License](./LICENSE) — Open source under the MIT License
