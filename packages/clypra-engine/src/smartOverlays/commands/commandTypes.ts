import type { OverlayDocument, SceneNode, DocumentVariable, DataPreviewSet, TimelineMarker, KeyframeTrack, AssetRef, FontRef, Breakpoint, ResponsiveNodeOverride } from "../overlayDocumentSchema.js";

export type CommandType =
  | "SET_DOCUMENT"
  | "ADD_NODE"
  | "DELETE_NODE"
  | "UPDATE_NODE_PROPERTY"
  | "UPDATE_NODE_STYLE"
  | "REORDER_NODES"
  | "ADD_VARIABLE"
  | "REMOVE_VARIABLE"
  | "UPDATE_VARIABLE"
  | "ADD_DATA_PREVIEW_SET"
  | "UPDATE_DATA_PREVIEW_SET"
  | "REMOVE_DATA_PREVIEW_SET"
  | "ADD_TIMELINE_MARKER"
  | "UPDATE_TIMELINE_MARKER"
  | "REMOVE_TIMELINE_MARKER"
  | "UPDATE_KEYFRAME_TRACKS"
  | "UPDATE_ANIMATION"
  | "GROUP_NODES"
  | "UNGROUP_NODES"
  | "DETACH_COMPONENT"
  | "UPDATE_CANVAS_SIZE"
  | "SET_BINDING"
  | "REGISTER_ASSET"
  | "REMOVE_ASSET"
  | "SET_ASSET_REF"
  | "SET_FONT_REF"
  | "ADD_BREAKPOINT"
  | "REMOVE_BREAKPOINT"
  | "SET_ACTIVE_BREAKPOINT"
  | "SET_RESPONSIVE_OVERRIDE"
  | "BATCH_COMMANDS";

export interface BaseCommand {
  type: CommandType;
  timestamp?: number;
}

export interface SetDocumentCommand extends BaseCommand {
  type: "SET_DOCUMENT";
  doc: OverlayDocument;
}

export interface AddNodeCommand extends BaseCommand {
  type: "ADD_NODE";
  node: SceneNode;
  parentId?: string;
  index?: number;
}

export interface DeleteNodeCommand extends BaseCommand {
  type: "DELETE_NODE";
  nodeId: string;
}

export interface UpdateNodePropertyCommand extends BaseCommand {
  type: "UPDATE_NODE_PROPERTY";
  nodeId: string;
  path: string;
  value: any;
  previousValue?: any;
}

export interface UpdateNodeStyleCommand extends BaseCommand {
  type: "UPDATE_NODE_STYLE";
  nodeId: string;
  stylePath: string;
  value: any;
  previousValue?: any;
}

export interface ReorderNodesCommand extends BaseCommand {
  type: "REORDER_NODES";
  sourceIndex: number;
  destinationIndex: number;
}

export interface AddVariableCommand extends BaseCommand {
  type: "ADD_VARIABLE";
  key: string;
  dataType: DocumentVariable["type"];
  defaultValue: any;
  label?: string;
}

export interface RemoveVariableCommand extends BaseCommand {
  type: "REMOVE_VARIABLE";
  key: string;
  previousVariable?: DocumentVariable;
}

export interface UpdateVariableCommand extends BaseCommand {
  type: "UPDATE_VARIABLE";
  key: string;
  patch: Partial<Omit<DocumentVariable, "key">>;
  previousPatch?: Partial<Omit<DocumentVariable, "key">>;
}

export interface AddDataPreviewSetCommand extends BaseCommand {
  type: "ADD_DATA_PREVIEW_SET";
  set: DataPreviewSet;
}

export interface UpdateDataPreviewSetCommand extends BaseCommand {
  type: "UPDATE_DATA_PREVIEW_SET";
  id: string;
  patch: Partial<Omit<DataPreviewSet, "id">>;
  previousPatch?: Partial<Omit<DataPreviewSet, "id">>;
}

export interface RemoveDataPreviewSetCommand extends BaseCommand {
  type: "REMOVE_DATA_PREVIEW_SET";
  id: string;
  previousSet?: DataPreviewSet;
}

export interface AddTimelineMarkerCommand extends BaseCommand {
  type: "ADD_TIMELINE_MARKER";
  marker: TimelineMarker;
}

export interface UpdateTimelineMarkerCommand extends BaseCommand {
  type: "UPDATE_TIMELINE_MARKER";
  markerId: string;
  patch: Partial<Omit<TimelineMarker, "id">>;
  previousPatch?: Partial<Omit<TimelineMarker, "id">>;
}

export interface RemoveTimelineMarkerCommand extends BaseCommand {
  type: "REMOVE_TIMELINE_MARKER";
  markerId: string;
  previousMarker?: TimelineMarker;
}

export interface UpdateKeyframeTracksCommand extends BaseCommand {
  type: "UPDATE_KEYFRAME_TRACKS";
  nodeId: string;
  tracks: KeyframeTrack[];
  previousTracks?: KeyframeTrack[];
}

export interface UpdateAnimationCommand extends BaseCommand {
  type: "UPDATE_ANIMATION";
  nodeId: string;
  animation: any;
  previousAnimation?: any;
}

export interface GroupNodesCommand extends BaseCommand {
  type: "GROUP_NODES";
  nodeIds: string[];
  frameName?: string;
}

export interface UngroupNodesCommand extends BaseCommand {
  type: "UNGROUP_NODES";
  frameId: string;
}

export interface BatchCommandsCommand extends BaseCommand {
  type: "BATCH_COMMANDS";
  commands: DocumentCommand[];
}

// ---------------------------------------------------------------------------
// Phase 4J — Responsive Layout Commands
// ---------------------------------------------------------------------------

export interface AddBreakpointCommand extends BaseCommand {
  type: "ADD_BREAKPOINT";
  breakpoint: Breakpoint;
}

export interface RemoveBreakpointCommand extends BaseCommand {
  type: "REMOVE_BREAKPOINT";
  breakpointId: string;
  /** Stored for undo */
  previousBreakpoint?: Breakpoint;
}

export interface SetActiveBreakpointCommand extends BaseCommand {
  type: "SET_ACTIVE_BREAKPOINT";
  breakpointId: string | null;
  previousBreakpointId?: string | null;
}

export interface SetResponsiveOverrideCommand extends BaseCommand {
  type: "SET_RESPONSIVE_OVERRIDE";
  nodeId: string;
  breakpointId: string;
  /**
   * Sparse patch to merge into node.responsive[breakpointId].
   * null = clear the entire override for this breakpoint on this node.
   */
  patch: Partial<ResponsiveNodeOverride> | null;
  /** Previous override value for undo */
  previousPatch?: Partial<ResponsiveNodeOverride> | null;
}

export interface DetachComponentCommand extends BaseCommand {
  type: "DETACH_COMPONENT";
  /** ID of the ComponentNode to convert into a FrameNode with children */
  nodeId: string;
}

export interface UpdateCanvasSizeCommand extends BaseCommand {
  type: "UPDATE_CANVAS_SIZE";
  width: number;
  height: number;
  previousWidth?: number;
  previousHeight?: number;
}

export interface SetBindingCommand extends BaseCommand {
  type: "SET_BINDING";
  nodeId: string;
  /** Property path on the node (e.g. 'props.accentColor' or 'text') */
  targetProperty: string;
  /** Binding expression e.g. '{{revenue}}', or null/empty to clear */
  expression: string;
  previousExpression?: string;
}

export interface RegisterAssetCommand extends BaseCommand {
  type: "REGISTER_ASSET";
  /** AssetRef to add to doc.assetManifest.assets */
  asset: AssetRef;
}

export interface RemoveAssetCommand extends BaseCommand {
  type: "REMOVE_ASSET";
  assetId: string;
  /** Stored for undo */
  previousAsset?: AssetRef;
}

export interface SetAssetRefCommand extends BaseCommand {
  type: "SET_ASSET_REF";
  /** ID of the PrimitiveMediaNode to update */
  nodeId: string;
  assetId: string;
  previousAssetId?: string;
}

export interface SetFontRefCommand extends BaseCommand {
  type: "SET_FONT_REF";
  nodeId: string;
  fontRef: FontRef;
  previousFontRef?: FontRef;
}

export type DocumentCommand =
  | SetDocumentCommand
  | AddNodeCommand
  | DeleteNodeCommand
  | UpdateNodePropertyCommand
  | UpdateNodeStyleCommand
  | ReorderNodesCommand
  | AddVariableCommand
  | RemoveVariableCommand
  | UpdateVariableCommand
  | AddDataPreviewSetCommand
  | UpdateDataPreviewSetCommand
  | RemoveDataPreviewSetCommand
  | AddTimelineMarkerCommand
  | UpdateTimelineMarkerCommand
  | RemoveTimelineMarkerCommand
  | UpdateKeyframeTracksCommand
  | UpdateAnimationCommand
  | GroupNodesCommand
  | UngroupNodesCommand
  | DetachComponentCommand
  | UpdateCanvasSizeCommand
  | SetBindingCommand
  | RegisterAssetCommand
  | RemoveAssetCommand
  | SetAssetRefCommand
  | SetFontRefCommand
  | AddBreakpointCommand
  | RemoveBreakpointCommand
  | SetActiveBreakpointCommand
  | SetResponsiveOverrideCommand
  | BatchCommandsCommand;
