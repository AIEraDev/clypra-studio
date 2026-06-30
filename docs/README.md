# Clypra Studio Documentation

Welcome to the Clypra Studio documentation. This guide will help you understand the architecture, implementation plan, and design decisions behind the unified platform.

## 📚 Documentation Index

### Getting Started

1. **[Executive Summary](./EXECUTIVE_SUMMARY.md)** ⭐ **Start Here**
   - High-level overview
   - Key insights and benefits
   - Timeline and deliverables
   - Perfect for stakeholders and team leads

### Architecture & Design

2. **[Studio Architecture](./STUDIO_ARCHITECTURE.md)**
   - Complete system design
   - Three Labs, One Runtime principle
   - Shared infrastructure details
   - Project structure

3. **[Feature Providers](./FEATURE_PROVIDERS.md)**
   - Extensible body effects system
   - Provider interface design
   - Feature map types
   - Future extensibility

4. **[Publishing Pipeline](./PUBLISHING_PIPELINE.md)**
   - Quality assurance process
   - Validation stages
   - Golden tests
   - Benchmarking
   - Registry deployment

### Implementation

5. **[Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)**
   - 10-week development plan
   - Phase-by-phase breakdown
   - Deliverables and milestones
   - Acceptance criteria

6. **[Migration Guide](./MIGRATION_GUIDE.md)**
   - Step-by-step migration from current state
   - Backward compatibility strategy
   - Risk mitigation
   - Testing strategy

## 🎯 Quick Navigation

### I want to understand...

**...the big picture** → Start with [Executive Summary](./EXECUTIVE_SUMMARY.md)

**...the architecture** → Read [Studio Architecture](./STUDIO_ARCHITECTURE.md)

**...how body effects work** → Read [Feature Providers](./FEATURE_PROVIDERS.md)

**...the development timeline** → Read [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)

**...how to migrate existing code** → Read [Migration Guide](./MIGRATION_GUIDE.md)

**...quality assurance** → Read [Publishing Pipeline](./PUBLISHING_PIPELINE.md)

## 🔑 Key Concepts

### Three Labs, One Runtime

Clypra Studio consists of three specialized editors:

1. **Video Effect Lab** - Single-input effects (color, blur, distortion)
2. **Transition Lab** - Dual-input temporal effects
3. **Body Effect Lab** - Feature-map-driven effects

All three share:

- Graph compilation
- Render planning
- GPU execution
- Performance monitoring
- Quality validation
- Publishing pipeline

### Feature Providers

Body effects don't hardcode segmentation. They consume **feature maps** from pluggable providers:

```typescript
interface FeatureProvider {
  outputs: FeatureMapType[]; // mask, pose, depth, etc.
  process(frame: VideoFrame): Promise<FeatureMap[]>;
}
```

This makes body effects **infinitely extensible**.

### Publishing Pipeline

Effects pass through quality gates:

```
Lab → Validation → Golden Tests → Benchmark → Approval → Registry
```

No effect reaches users without passing all gates.

## 📖 Reading Guide

### For Project Managers

1. [Executive Summary](./EXECUTIVE_SUMMARY.md) - Understand the vision
2. [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md) - Track progress
3. [Publishing Pipeline](./PUBLISHING_PIPELINE.md) - Understand quality

### For Architects

1. [Studio Architecture](./STUDIO_ARCHITECTURE.md) - System design
2. [Feature Providers](./FEATURE_PROVIDERS.md) - Extensibility patterns
3. [Migration Guide](./MIGRATION_GUIDE.md) - Implementation strategy

### For Developers

1. [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md) - Development phases
2. [Migration Guide](./MIGRATION_GUIDE.md) - Code migration steps
3. [Studio Architecture](./STUDIO_ARCHITECTURE.md) - Technical details

### For Effect Designers

1. [Executive Summary](./EXECUTIVE_SUMMARY.md) - Platform capabilities
2. [Feature Providers](./FEATURE_PROVIDERS.md) - Body effect system
3. [Publishing Pipeline](./PUBLISHING_PIPELINE.md) - Quality requirements

## 🎨 Architecture Diagram

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

## 🚀 Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

- Monorepo restructuring
- Shared runtime extraction
- Build pipeline setup

### Phase 2: Developer Tools (Weeks 3-4)

- Graph inspector
- Pass inspector
- Performance panel
- Preview canvas

### Phase 3: Video Lab (Weeks 5-6)

- Video Lab UI
- 5 video effects
- Parameter editor
- Golden tests

### Phase 4: Transition Lab (Week 7)

- Transition Lab UI
- 5 transitions
- Dual-input preview
- Progress control

### Phase 5: Body Lab (Weeks 8-9)

- Body Lab UI
- Feature provider system
- 5 body effects
- Feature map visualization

### Phase 6: Publishing (Week 10)

- Validation pipeline
- Benchmark suite
- Approval workflow
- Registry deployment

## 📊 Success Metrics

- ✅ Every Lab shares the same runtime
- ✅ Every effect passes validation
- ✅ Every effect has golden tests
- ✅ Every effect meets performance targets (<16ms GPU @ 1080p)
- ✅ Future effects are content work, not architecture work

## 🤝 Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

When working on documentation:

- Keep diagrams updated
- Ensure examples match implementation
- Link between related documents
- Update this index when adding docs

## 📞 Questions?

If you have questions about:

- **Architecture decisions** → See [STUDIO_ARCHITECTURE.md](./STUDIO_ARCHITECTURE.md)
- **Implementation details** → See [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
- **Migration strategy** → See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Quality process** → See [PUBLISHING_PIPELINE.md](./PUBLISHING_PIPELINE.md)

Still unclear? Open an issue or start a discussion on GitHub.

## 🔄 Document Updates

This documentation is a living resource. As the implementation progresses:

1. **Update implementation status** in roadmap
2. **Add lessons learned** to migration guide
3. **Document new patterns** in architecture
4. **Expand examples** based on real implementations

## 🎯 Next Steps

1. **Read** [Executive Summary](./EXECUTIVE_SUMMARY.md)
2. **Review** [Studio Architecture](./STUDIO_ARCHITECTURE.md)
3. **Study** [Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)
4. **Start** building!

---

**Remember:** We're not building three feature workspaces. We're building three specialized editors on one professional development platform.

**The platform is the investment. Effects are the return.**
