# @clypra-studio/ui

Shared UI components, developer panels, keyframe editors, and observatories for Clypra Studio. Built with React 19, TypeScript, and Tailwind CSS.

## Installation

```bash
pnpm add @clypra-studio/ui
```

## Component Overview

### Studio Master & Harness
- `StudioMasterApp` — Full studio application harness
- `StudioControlPanel` — Lab navigation & master controls
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
- `usePixiRenderer` — React hook for PixiJS canvas initialization & frame loop management

## Usage

```tsx
import { 
  StudioMasterApp, 
  BezierCurveEditor, 
  ColorGradingStudioPanel,
  RuntimeObservatory 
} from "@clypra-studio/ui";

function App() {
  return (
    <StudioMasterApp>
      <ColorGradingStudioPanel />
      <BezierCurveEditor />
      <RuntimeObservatory />
    </StudioMasterApp>
  );
}
```

## License

MIT
