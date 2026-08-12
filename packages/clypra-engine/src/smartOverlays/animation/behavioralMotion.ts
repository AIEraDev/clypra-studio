import type { SceneNode, NodeAnimationRules } from "../overlayDocumentSchema.js";

export type BehaviorKind =
  | "enter"
  | "exit"
  | "reveal"
  | "emphasize"
  | "attention"
  | "follow"
  | "connect";

export interface BehaviorSpec {
  kind: BehaviorKind;
  pattern?: "fade" | "slide" | "pop" | "typewriter" | "stagger" | "glow-pulse" | "scale-bounce";
  startTime?: number;
  duration?: number;
  delay?: number;
  targetNodeId?: string;
  intensity?: number; // 0.0 to 1.0
  easing?: "linear" | "ease-out" | "ease-in-out" | "elastic" | string;
}

/**
 * Pure compiler that resolves a high-level BehaviorSpec into deterministic NodeAnimationRules keyframe/preset tracks.
 * High-level authoring behavior -> low-level keyframe tracks.
 */
export function resolveBehaviorToAnimationSpec(
  behavior: BehaviorSpec,
  node?: SceneNode
): NodeAnimationRules {
  const duration = behavior.duration ?? 0.8;
  const delay = behavior.delay ?? 0.0;
  const pattern = behavior.pattern ?? "slide";

  switch (behavior.kind) {
    case "emphasize":
      return {
        entrance: {
          type: "pop",
          duration,
          delay,
          easing: (behavior.easing as any) || "ease-out"
        }
      };

    case "attention":
      return {
        entrance: {
          type: "glow-pulse",
          duration: duration * 1.5,
          delay,
          easing: "ease-in-out"
        }
      };

    case "reveal":
      return {
        entrance: {
          type: node?.type === "text" ? "typewriter" : "fade",
          duration,
          delay,
          easing: "ease-out"
        }
      };

    case "exit":
      return {
        exit: {
          type: pattern === "fade" ? "fade" : "slide",
          duration,
          delay,
          easing: "ease-in-out"
        }
      };

    case "enter":
    default:
      return {
        entrance: {
          type: pattern === "fade" ? "fade" : pattern === "pop" ? "pop" : "slide",
          duration,
          delay,
          easing: (behavior.easing as any) || "ease-out"
        }
      };
  }
}
