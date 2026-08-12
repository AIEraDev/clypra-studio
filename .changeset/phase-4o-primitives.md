---
"@clypra-studio/types": minor
"@clypra-studio/engine": minor
"@clypra-studio/ui": patch
---

Phase 4O: compositional primitive node types and smart-overlay runtime expansion

**@clypra-studio/types**
- Add `primitives.ts` with 16 new node types: RichTextNode, GradientNode, IconNode, DividerNode, MetricNode, ProgressNode, ChartNode, TableNode, ContainerNode, CalloutNode, AvatarNode + extended ShapeKind union
- Add `overlay.ts` declarative authoring document schema (OverlayDocument, SceneNode, Breakpoints, Assets)
- Add `export.ts` production export pipeline contract types (ExportConfig, ExportJobRecord, MediaEncoder)
- Expose new `./primitives`, `./overlay`, `./export` subpath entry points

**@clypra-studio/engine**
- Add full `smartOverlays` subsystem: renderer, layout, animation runtime, data binding, pixi scene projection, snap engine, command history, validation, migrations, asset/font registry, export pipeline
- Add `overlayBridge` for PixiJS overlay layer rendering
- Extend `overlayDocumentSchema` and runtime with all 11 Phase 4O primitive node types
- Add `primitiveRegistry` with typed default-node factories for all 16 primitives
- Resolve `AssetKind` DTS ambiguity with v2 project types

**@clypra-studio/ui**
- Promote `usePixiRenderer` hook to shared package; remove per-lab duplicates
