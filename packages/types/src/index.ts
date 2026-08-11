/**
 * @clypra-studio/types
 *
 * Single source of truth for all type definitions in Clypra Studio.
 * This package is the contract between all other packages.
 *
 * Modules:
 *   .            — Full barrel re-export (all domains)
 *   ./overlay    — Overlay Document authoring schema & base node types
 *   ./primitives — Second generation compositional primitive node types
 *   ./export     — Production export pipeline contract types
 *   ./effect     — Effect definitions and capabilities
 *   ./graph      — Media processing graph node types
 *   ./frame      — Frame graph and render pass types
 *   ./job        — Render job, execution, and resource types
 *   ./snapshot   — Runtime snapshot and diagnostic types
 *   ./vefx       — .vefx plugin bridge and shader node types
 *
 * @packageDocumentation
 */

/** Package version */
export const VERSION = "0.1.0";

/** Package name */
export const PACKAGE_NAME = "@clypra-studio/types";

// ---------------------------------------------------------------------------
// Overlay Document & Authoring Schema (base node types)
// ---------------------------------------------------------------------------
export type {
  SceneNodeType,
  LayoutMode,
  SizingMode,
  ShapePrimitiveType,
  MediaKind,
  NodePadding,
  NodeConstraints,
  NodeLayout,
  NodeDropShadow,
  NodeFillGradient,
  NodeStyle,
  NodePropertyBinding,
  NodeAnimationStart,
  NodeEntranceAnimation,
  NodeExitAnimation,
  SemanticAnimationConfig,
  NodeAnimationConfig,
  ResponsiveNodeOverride,
  SceneNodeBase,
  PrimitiveTextNode,
  PrimitiveShapeNode,
  PrimitiveMediaNode,
  ComponentNode,
  FrameNode,
  RepeaterNode,
  SceneNode,
  DocumentVariable,
  DataPreviewSet,
  TimelineMarker,
  AssetRef,
  AssetManifest,
  FontRef,
  FontManifest,
  Breakpoint,
  BreakpointSet,
  CanvasConfig,
  OverlayDocument,
} from "./overlay.js";

// ---------------------------------------------------------------------------
// Second Generation Compositional Primitives (Phase 4O)
// ---------------------------------------------------------------------------
export type {
  ShapeKind,
  RichTextSpan,
  RichTextNode,
  GradientStop,
  GradientNode,
  IconNode,
  DividerNode,
  MetricNode,
  ProgressNode,
  ChartType,
  ChartSeries,
  ChartNode,
  TableColumn,
  TableNode,
  ContainerNode,
  CalloutNode,
  AvatarNode,
  PrimitiveDefinition,
} from "./primitives.js";

// ---------------------------------------------------------------------------
// Production Export Pipeline Contract
// ---------------------------------------------------------------------------
export type {
  ExportProfile,
  ProfileCanvasDimensions,
  ExportFormat,
  ExportConfig as SmartOverlayExportConfig,
  ExportDiagnosticSeverity,
  ExportDiagnosticCode,
  ExportValidationDiagnostic,
  EvaluatedExportFrame,
  ExportFrameDescriptor,
  ExportProgress,
  JobStatus,
  EncodedFileEntry,
  EncodedOutput,
  MediaEncoder,
  ExportJobRecord,
} from "./export.js";

// ---------------------------------------------------------------------------
// Effect Definitions & Capabilities
// ---------------------------------------------------------------------------
export type {
  EffectDefinition,
  EffectInstance,
  EffectCapabilities,
  EffectRequirements,
  EffectProfile,
  EffectMetadata,
  EffectPreset,
  AppliedEffect,
  EffectParameters,
  EffectValidationResult,
  EffectCategory,
  EffectManifest,
} from "./effect.js";

// ---------------------------------------------------------------------------
// Media Processing Graph
// ---------------------------------------------------------------------------
export type {
  GraphNode,
  GraphEdge,
  NodeLifecycleState,
  MediaProcessingGraph,
  GraphDataType,
  GraphValue,
  GraphPin,
  NodeCapabilities,
  NodeRequirements,
} from "./graph.js";
export { GraphHelper } from "./graph.js";

// ---------------------------------------------------------------------------
// Frame Graph & Render Planner
// ---------------------------------------------------------------------------
export type { FrameGraph, RenderPass, ResourceRequest, PlannerConfig } from "./frame.js";

// ---------------------------------------------------------------------------
// Render Job, Execution & Resources
// ---------------------------------------------------------------------------
export type {
  RenderJob,
  PassDescriptor,
  ResourceReference,
  BlendMode,
  ResourceDescriptor,
  ResourceUsage,
  ExecutionPolicy,
  JobDependencyGraph,
  JobNode,
  JobEdge,
  JobMetadata,
  ExecutionResult,
  PassExecutionResult,
  ResourceUsageResult,
  ResourceUsageDetail,
  CacheStatistics,
  ReplayPacket,
  EvaluationContext,
  SourceDataSnapshot,
  VideoSnapshot,
  ImageSnapshot,
  AudioSnapshot,
} from "./job.js";

// ---------------------------------------------------------------------------
// Runtime Snapshots & Diagnostics
// ---------------------------------------------------------------------------
export type {
  RuntimeSnapshot,
  GraphSnapshot,
  PassDependencyGraph,
  PassNode,
  PassEdge,
  Optimization,
  ExecutionSnapshot,
  PassResult,
  ResourceBinding,
  SchedulingState,
  BackendInfo,
  ResourceSnapshot,
  LogicalResource,
  PhysicalAllocation,
  AliasingInfo,
  AliasMappingentry,
  PerformanceSnapshot,
  CachePerformance,
  DiagnosticSnapshot,
  DiagnosticMessage,
  FrameHistory,
  ResourceLifetimeTimeline,
  ResourceLifetimeBar,
  ExecutionTimeline,
  TimelineStage,
} from "./snapshot.js";

// ---------------------------------------------------------------------------
// .vefx Plugin Bridge, Shader Nodes & Studio State
// ---------------------------------------------------------------------------
export type {
  VefxInputType,
  VefxInputOption,
  VefxExposedInput,
  VefxNode,
  VefxConnection,
  VefxGraph,
  VefxEffectSpec,
  FrameContext,
  RenderTarget,
  ParameterValues,
  ClypraPluginEngineConfig,
  ClypraPluginManifest,
  ClypraVideoPlugin,
  PluginIPCMessageType,
  PluginIPCMessage,
  DataType,
  NodePin,
  ShaderNodeUniformSpec,
  ShaderNode,
  GraphConnection,
  NodeGraph,
  CompilationResult,
  EasingMode,
  Keyframe,
  AnimatedProperty,
  FrequencyBand,
  AudioBinding,
  BakedFrameSpectrum,
  HandleMode,
  KeyframePoint,
  TimelineViewport,
  ExportConfig,
  BakeTaskMessage,
  BakedFrameResult,
  EngineTelemetryStats,
  VefxPresetTemplate,
  StudioTabMode,
  ColorWheelState,
  BodyEffectState,
} from "./vefx.js";
