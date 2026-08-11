/**
 * @clypra-studio/types
 *
 * Single source of truth for all type definitions in Clypra Studio.
 * This package is the contract between all other packages.
 *
 * @packageDocumentation
 */

/** Package version */
export const VERSION = "0.1.0";

/** Package name */
export const PACKAGE_NAME = "@clypra-studio/types";

// Effect types
export type { EffectDefinition, EffectInstance, EffectCapabilities, EffectRequirements, EffectProfile, EffectMetadata, EffectPreset, AppliedEffect, EffectParameters, EffectValidationResult, EffectCategory, EffectManifest } from "./effect";

// Graph types
export type { GraphNode, GraphEdge, NodeLifecycleState, MediaProcessingGraph, GraphDataType, GraphValue, GraphPin, NodeCapabilities, NodeRequirements } from "./graph";
export { GraphHelper } from "./graph";

// Frame types
export type { FrameGraph, RenderPass, ResourceRequest, PlannerConfig } from "./frame";

// Job types
export type { RenderJob, PassDescriptor, ResourceReference, BlendMode, ResourceDescriptor, ResourceUsage, ExecutionPolicy, JobDependencyGraph, JobNode, JobEdge, JobMetadata, ExecutionResult, PassExecutionResult, ResourceUsageResult, ResourceUsageDetail, CacheStatistics, ReplayPacket, EvaluationContext, SourceDataSnapshot, VideoSnapshot, ImageSnapshot, AudioSnapshot } from "./job";

// Snapshot types
export type { RuntimeSnapshot, GraphSnapshot, PassDependencyGraph, PassNode, PassEdge, Optimization, ExecutionSnapshot, PassResult, ResourceBinding, SchedulingState, BackendInfo, ResourceSnapshot, LogicalResource, PhysicalAllocation, AliasingInfo, AliasMappingentry, PerformanceSnapshot, CachePerformance, DiagnosticSnapshot, DiagnosticMessage, FrameHistory, ResourceLifetimeTimeline, ResourceLifetimeBar, ExecutionTimeline, TimelineStage } from "./snapshot";

// .vefx & Plugin Bridge types
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
} from "./vefx";

// Overlay Document & Authoring Schema types
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
} from "./overlay";

// Production Export Pipeline Contract types
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
} from "./export";



