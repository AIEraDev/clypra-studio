export type SmartOverlayType =
  | "list"
  | "stat"
  | "comparison"
  | "quote"
  | "timeline"
  | "code"
  | "social"
  | "lower-third";

export interface ListOverlayItem {
  id: string;
  text: string;
  startTime: number; // relative to clip start time (seconds)
  endTime: number;   // relative to clip start time (seconds)
  icon?: string;
  active?: boolean;
}

export interface ListOverlayContent {
  title: string;
  items: ListOverlayItem[];
}

export interface StatOverlayContent {
  value: string;         // e.g. "$1.2M", "73%", "+142%"
  label: string;         // e.g. "Annual Recurring Revenue"
  delta?: string;        // e.g. "+15% YoY"
  icon?: string;         // e.g. "trending-up", "dollar-sign"
}

export interface ComparisonItem {
  title: string;
  subtitle?: string;
  points: string[];
  color?: string;
}

export interface ComparisonOverlayContent {
  title: string;
  left: ComparisonItem;
  right: ComparisonItem;
}

export interface QuoteOverlayContent {
  quote: string;
  author: string;
  title?: string;        // e.g. "CEO & Founder"
  avatarUrl?: string;
}

export interface TimelineNode {
  id: string;
  label: string;
  date?: string;
  time: number;          // relative to clip start time (seconds)
  description?: string;
}

export interface TimelineOverlayContent {
  title: string;
  nodes: TimelineNode[];
}

export interface CodeOverlayContent {
  title?: string;
  language: string;      // e.g. "typescript", "python", "bash"
  code: string;
  highlightLines?: number[];
}

export interface SocialOverlayContent {
  platform: "x" | "youtube" | "github" | "instagram" | "tiktok";
  handle: string;
  name: string;
  verified?: boolean;
  avatarUrl?: string;
  message?: string;
  metrics?: string;      // e.g. "1.2M Followers"
}

export interface LowerThirdOverlayContent {
  name: string;
  title: string;
  company?: string;
  accentColor?: string;
}

export type ListSmartOverlayContent = { type: "list"; data: ListOverlayContent };
export type StatSmartOverlayContent = { type: "stat"; data: StatOverlayContent };
export type ComparisonSmartOverlayContent = { type: "comparison"; data: ComparisonOverlayContent };
export type QuoteSmartOverlayContent = { type: "quote"; data: QuoteOverlayContent };
export type TimelineSmartOverlayContent = { type: "timeline"; data: TimelineOverlayContent };
export type CodeSmartOverlayContent = { type: "code"; data: CodeOverlayContent };
export type SocialSmartOverlayContent = { type: "social"; data: SocialOverlayContent };
export type LowerThirdSmartOverlayContent = { type: "lower-third"; data: LowerThirdOverlayContent };

export type SmartOverlayContentUnion =
  | ListSmartOverlayContent
  | StatSmartOverlayContent
  | ComparisonSmartOverlayContent
  | QuoteSmartOverlayContent
  | TimelineSmartOverlayContent
  | CodeSmartOverlayContent
  | SocialSmartOverlayContent
  | LowerThirdSmartOverlayContent;

export type SmartOverlayLayout = "full-screen" | "side-panel" | "lower-third" | "top-banner" | "center-card";
export type SmartOverlayAnimation = "scale-pop" | "slide-stagger" | "typewriter" | "fade" | "glow-pulse";

export interface SmartOverlayStyle {
  presetId: string;
  layout: SmartOverlayLayout;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  highlightColor: string;
  cardBackgroundColor: string;
  cardBorderColor?: string;
  cardOpacity: number; // 0.0 to 1.0
  animationStyle: SmartOverlayAnimation;
}

export interface SmartOverlayClip {
  id: string;
  kind: "smart-overlay";
  overlayType: SmartOverlayType;
  content: SmartOverlayContentUnion;
  style: SmartOverlayStyle;
  startTime: number;
  duration: number;
}

export interface SmartOverlayPreset {
  id: string;
  name: string;
  category: SmartOverlayType;
  description: string;
  previewThumbnail: string;
  defaultContent: SmartOverlayContentUnion;
  style: SmartOverlayStyle;
}
