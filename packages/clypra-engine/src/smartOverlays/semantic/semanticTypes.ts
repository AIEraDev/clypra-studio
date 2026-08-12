export type SemanticIntent =
  | "inform"
  | "explain"
  | "compare"
  | "emphasize"
  | "identify"
  | "quote"
  | "summarize"
  | "enumerate"
  | "warn"
  | "demonstrate"
  | "annotate"
  | "transition";

export interface SemanticSlotDefinition {
  id: string;
  name: string;
  type: "text" | "metric" | "image" | "code" | "list" | "comparison-pair";
  required?: boolean;
  defaultValue?: any;
}

export interface SemanticBehaviorConfig {
  entrancePattern?: "fade" | "slide-up" | "stagger-children" | "typewriter" | "pop";
  emphasisTarget?: string;
  exitPattern?: "fade" | "slide-down";
  duration?: number;
}

export interface SemanticSpatialConstraints {
  anchorTarget?: string; // e.g. "speaker", "subject.primary", "chart.bar[0]"
  preferredPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "lower-third";
  avoidRegions?: Array<"face" | "subtitle" | "watermark">;
  collisionPolicy?: "avoid" | "push" | "stack";
  offsetPixelX?: number;
  offsetPixelY?: number;
}

export interface SemanticOverlayDefinition {
  id: string;
  name: string;
  intent: SemanticIntent;
  description?: string;
  slots: SemanticSlotDefinition[];
  defaultBehavior?: SemanticBehaviorConfig;
  spatialConstraints?: SemanticSpatialConstraints;
  canvasDefaults?: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
}

export interface SemanticContent {
  templateId: string;
  values: Record<string, any>;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
  };
}
