# @clypra-studio/ui

Shared UI components, developer panels, keyframe editors, and observatories for Clypra Studio. Built with React 19, TypeScript, and Tailwind CSS.

## Installation

```bash
pnpm add @clypra-studio/ui
```

## Component Overview

### Studio Diagnostics & Controls
- `StudioControlPanel` — Lab navigation & runtime controls
- `StudioDiagnosticsOverlay` — Real-time performance & diagnostic overlay

### Developer Inspectors & Observatories
- `GraphInspector` — Render graph node & edge visualization
- `PassInspector` — Render pass order & shader uniform inspection
- `ResourceInspector` — GPU texture & buffer allocation metrics
- `PerformanceMonitor` — Real-time FPS, frame timing, and GPU profiling
- `ValidationPanel` — Effect & graph validation issue log
- `RuntimeInspector` & `RuntimeObservatory` — Live runtime state & snapshot observation

### Curve & Keyframe Editors
- `BezierCurveEditor` & `KeyframePropertyInspector` — SVG Bezier easing curve manipulator
- `MultiKeyframeGraphEditor` & `VideoEditorInspector` — Multi-property timeline curve graph editor

### Studio Specialty Panels
- `ColorGradingStudioPanel` & `ColorWheel` — 3-way CDL color grading studio
- `BodyEffectsStudioPanel` — Masking, segmentation, and body effects studio
- `ResponsivePreviewCanvas` & `Timeline` — Interactive canvas & keyframe timeline

### Hooks
- Preview canvas components use the native preview boundary and do not initialize a browser renderer.

## Usage

```tsx
import {
  BezierCurveEditor,
  ColorGradingStudioPanel,
  RuntimeObservatory 
} from "@clypra-studio/ui";

function App() {
  return (
    <div>
      <ColorGradingStudioPanel />
      <BezierCurveEditor />
      <RuntimeObservatory />
    </div>
  );
}
```

## License

MIT
