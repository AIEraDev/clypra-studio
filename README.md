<div align="center">

<img src="./apps/studio/public/clypra.svg" alt="Clypra Logo" width="100" height="100" />

# Clypra Studio

**Professional Effect Development & Performance Intelligence Platform for Clypra Video Editor.**

Where visual effects, transitions, shader filters, and **production performance telemetry** are authored, benchmarked, and diagnosed before and after reaching the editor runtime.

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org) [![Native Rendering](https://img.shields.io/badge/Rendering-Native%20Pipeline-7C6FFF)](https://github.com/AIEraDev/clypra) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Architecture](#vision--architecture) • [Creative Labs](#the-creative-labs) • [⚡ Performance Intelligence](#-performance-intelligence--admin-console) • [Getting Started](#getting-started) • [Contributing](CONTRIBUTING.md)

</div>

---

## Vision & Architecture

**Creative Authoring. Cross-OS Matrix Analytics. One Ecosystem.**

Clypra Studio combines specialized effect authoring labs with an enterprise-grade administration hub to inspect real-world production performance across operating systems:

- 📽️ **Video Effect Lab** (`/studio/video-lab`) — Validates single-input frame rendering (Film Grain, VHS, Bloom, Chromatic Aberration).
- 🔀 **Transition Lab** (`/studio/transition-lab`) — Validates dual-input temporal transitions (Cross Dissolve, Push, Zoom, Luma Wipe).
- 👤 **Body Effect Lab** (`/studio/body-lab`) — Validates feature providers, person segmentation masks, and green screen keys.
- 🎨 **Filter & Color Grading Labs** (`/studio/filter-lab`, `/studio/color-grading`) — Author reusable looks and LUT color treatments.
- ⚡ **Performance Intelligence Console** (`/studio/admin`) — Admin workspace for analyzing production telemetry, cross-OS frame pacing matrices, GPU bottlenecks, and isolated edge-case regressions.

```
┌──────────────────────────────────────────────────────────┐
│                   CLYPRA STUDIO                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ Video Effect │  │  Transition   │  │ Performance  │  │
│  │     Lab      │  │      Lab      │  │ Intelligence │  │
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

## ⚡ Performance Intelligence & Admin Console

Located at **`/studio/admin`** (or `/studio/admin/performance`), the Performance Intelligence Console allows Clypra engineers and administrators to monitor real-time playback health and multi-platform telemetry collected from the production desktop application:

1. **Cross-OS Performance Matrix**: Compares render latencies ($P_{50}, P_{90}, P_{95}, P_{99}$), P95 seek times, and dropped frame ratios across macOS (Metal), Windows (DirectX 12), Linux (Vulkan), iOS, and Android.
2. **GPU & Bottleneck Profiler**: Hardware architecture rankings isolating primary latency bottlenecks (`decode`, `compose`, `conversionUpload`, `readback`).
3. **Surfaced Edge-Case Anomalies**: Outlier cohorts automatically flagged using statistical $Z$-score and clustering algorithms (e.g. *Intel Iris Xe Gen12 DXVA decoder context thrashing during concurrent 4K HEVC 10-bit RGBA composition*) with root-cause hypotheses and recommended mitigations.
4. **Hardware Fallback Diagnostics**: Tracks fallback transitions (WebGPU $\to$ WebGL, HW decode $\to$ Software FFmpeg) and root reason codes.
5. **Release-over-Release Regression**: Version-over-version delta calculator computing percentage changes and statistical significance ($p$-values via Welch's t-test).
6. **Zero PII Policy**: Telemetry is strictly numerical and anonymous. Zero video frames, media files, project names, or user identities are ever collected.

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
    └── studio/              # Studio web application, creative labs & admin console
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
pnpm typecheck          # Run TypeScript typechecks
pnpm test:golden        # Run frame-accurate comparison tests
pnpm benchmark          # Run GPU performance benchmarks
pnpm validate           # Validate effect definitions
```

---

## Documentation & Contributing

- [Architecture Overview](./docs/STUDIO_ARCHITECTURE.md) — System design & graph execution
- [Feature Providers](./docs/FEATURE_PROVIDERS.md) — Extensibility guide
- [Publishing Pipeline](./docs/PUBLISHING_PIPELINE.md) — Quality gates & standards
- [Contributing Guide](./CONTRIBUTING.md) — Contribution guidelines
- [License](./LICENSE) — Open source under the MIT License
