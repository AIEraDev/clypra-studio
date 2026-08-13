import type {
  SceneNode,
  MotionPreset,
  OverlayDocument,
  TimelineMarker,
  AnimationStartSpec,
  SemanticAnimationConfig
} from "./overlayDocumentSchema.js";
import { propertyInterpolator } from "./propertyInterpolator.js";
import { motionPresetRegistry } from "./motionPresetRegistry.js";

export interface EvaluatedNodeState {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  visible: boolean;
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  blur: number;
  fillColor?: string;
  typewriterProgress: number; // 0 to 1
  numericValueOverride?: number;
}

export interface AnimationEvaluationOptions {
  doc?: OverlayDocument;
  /** Ephemeral preview phase override for authoring view (never stored on doc) */
  previewState?: "rest" | "enter" | "hold" | "exit";
  /** Inherited delay accumulated from parent frames/groups */
  inheritedDelay?: number;
  /** Absolute playhead time — used by evaluateScene() */
  currentTime?: number;
}

/**
 * Canonical output contract of the animation runtime.
 * PixiSceneProjection must consume ONLY this — no preset/marker/keyframe logic.
 */
export interface EvaluatedSceneState {
  time: number;
  nodes: Record<string, EvaluatedNodeState>;
}

export interface SnapResult {
  snappedTime: number;
  snappedMarker?: TimelineMarker;
}

export class AnimationRuntime {
  /**
   * Evaluate motion state for a node at a given currentTime (seconds).
   * Fully deterministic and pure — does NOT mutate node or document.
   */
  public evaluateNodeState(
    node: SceneNode,
    currentTime: number,
    clipDuration: number,
    options: AnimationEvaluationOptions = {}
  ): EvaluatedNodeState {
    const baseW = node.width;
    const baseH = node.height;
    const baseAbsX = node.x;
    const baseAbsY = node.y;

    const state: EvaluatedNodeState = {
      x: baseAbsX,
      y: baseAbsY,
      width: baseW,
      height: baseH,
      opacity: node.visible === false ? 0 : 1,
      visible: node.visible !== false,
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: node.rotation || 0,
      blur: node.style?.blurRadius || 0,
      fillColor: node.style?.fillColor,
      typewriterProgress: 1
    };

    // Preview state overrides for authoring
    if (options.previewState) {
      if (options.previewState === "rest") {
        state.opacity = 1;
        state.visible = true;
        return state;
      }
      if (options.previewState === "enter") {
        const ent = node.animation?.entrance;
        const delay = ent?.delay || 0;
        currentTime = delay + (ent?.duration || 0) * 0.5;
      } else if (options.previewState === "hold") {
        currentTime = clipDuration * 0.5;
      } else if (options.previewState === "exit") {
        const ext = node.animation?.exit;
        const extDur = ext?.duration || 0.5;
        currentTime = clipDuration - extDur * 0.5;
      }
    }

    if (!node.animation) return state;
    const anim = node.animation;

    // Resolve base start time (absolute or marker-relative)
    const baseStartTime = this.resolveStartTime(anim.start, options.doc) + (options.inheritedDelay || 0);

    // 1. Entrance Preset
    if (anim.entrance) {
      const ent = anim.entrance;
      const delay = (ent.delay || 0) + baseStartTime;
      const startTime = delay;
      const endTime = delay + ent.duration;

      if (currentTime < startTime) {
        state.opacity = 0;
      } else if (currentTime >= startTime && currentTime < endTime) {
        const progress = (currentTime - startTime) / ent.duration;
        const eased = this.applyEasing(progress, ent.easing || "ease-out");
        this.applyEntrancePreset(ent, eased, state, clipDuration);
      }
    }

    // 2. Exit Preset
    if (anim.exit) {
      const ext = anim.exit;
      const exitStartTime = clipDuration - ext.duration - (ext.delay || 0);

      if (currentTime >= exitStartTime) {
        const progress = Math.min(1, (currentTime - exitStartTime) / ext.duration);
        const eased = this.applyEasing(progress, ext.easing || "ease-out");
        state.opacity = Math.max(0, 1 - eased);
      }
    }

    // 3. Semantic Animation Layer
    if (anim.semanticAnimation) {
      this.evaluateSemanticAnimation(anim.semanticAnimation, currentTime, baseStartTime, state);
    }

    // 4. Keyframe Layer (Evaluates using PropertyInterpolator with shortest-path rotation)
    if (anim.keyframeTracks && anim.keyframeTracks.length > 0) {
      for (const track of anim.keyframeTracks) {
        const val = this.interpolateTrack(track, currentTime, clipDuration);
        if (val !== undefined) {
          (state as any)[track.property] = val;
        }
      }
    }

    if (state.opacity <= 0.001) state.visible = false;

    return state;
  }

  /**
   * Helper to compute child delays for parent-child animation inheritance.
   * Child order is deterministic based on scene tree array index.
   */
  public computeChildInheritedDelay(
    parentAnimation: SceneNode["animation"],
    childIndex: number,
    parentInheritedDelay = 0
  ): number {
    if (!parentAnimation) return parentInheritedDelay;
    const scope = parentAnimation.animationScope || "node";
    if (scope === "node") return parentInheritedDelay;

    const stagger = parentAnimation.staggerChildren || 0;
    const parentEntranceDelay = parentAnimation.entrance?.delay || 0;
    return parentInheritedDelay + parentEntranceDelay + childIndex * stagger;
  }

  /**
   * Evaluate the full document scene graph at a given time, producing a flat
   * node map. PixiSceneProjection should consume this exclusively.
   */
  public evaluateScene(
    doc: OverlayDocument,
    options: AnimationEvaluationOptions = {}
  ): EvaluatedSceneState {
    const nodes: Record<string, EvaluatedNodeState> = {};
    const clipDuration = doc.duration || 5;
    const currentTime = options.currentTime ?? 0;
    this.collectNodes(doc.nodes, doc, currentTime, clipDuration, nodes, { ...options, doc }, 0);
    return { time: currentTime, nodes };
  }

  private collectNodes(
    nodeList: SceneNode[],
    doc: OverlayDocument,
    currentTime: number,
    clipDuration: number,
    result: Record<string, EvaluatedNodeState>,
    options: AnimationEvaluationOptions,
    inheritedDelay: number
  ): void {
    nodeList.forEach((node, idx) => {
      const nodeDelay = this.computeChildInheritedDelay(
        (node as any)._parentAnimation,
        idx,
        inheritedDelay
      );
      const state = this.evaluateNodeState(node, currentTime, clipDuration, {
        ...options,
        inheritedDelay: nodeDelay
      });
      result[node.id] = state;

      const children = (node as any).children;
      if (Array.isArray(children) && children.length > 0) {
        const parentAnim = node.animation;
        children.forEach((child: SceneNode, childIdx: number) => {
          // Tag child with parent animation for grandchild stagger
          (child as any)._parentAnimation = parentAnim;
          const childDelay = this.computeChildInheritedDelay(parentAnim, childIdx, nodeDelay);
          const childState = this.evaluateNodeState(child, currentTime, clipDuration, {
            ...options,
            inheritedDelay: childDelay
          });
          result[child.id] = childState;
          // Recurse into grandchildren
          const grandchildren = (child as any).children;
          if (Array.isArray(grandchildren) && grandchildren.length > 0) {
            this.collectNodes(grandchildren, doc, currentTime, clipDuration, result, options, childDelay);
          }
        });
      }
    });
  }

  /**
   * Engine-level snap utility for magnetic snapping to timeline markers
   */
  public snapTime(time: number, markers: TimelineMarker[] = [], threshold = 0.1): SnapResult {
    let closestMarker: TimelineMarker | undefined = undefined;
    let minDistance = Infinity;

    for (const marker of markers) {
      const dist = Math.abs(time - marker.time);
      if (dist < threshold && dist < minDistance) {
        minDistance = dist;
        closestMarker = marker;
      }
    }

    if (closestMarker) {
      return { snappedTime: closestMarker.time, snappedMarker: closestMarker };
    }
    return { snappedTime: time };
  }

  private resolveStartTime(spec?: AnimationStartSpec, doc?: OverlayDocument): number {
    if (!spec) return 0;
    if (spec.type === "absolute") return spec.time;
    if (spec.type === "marker" && doc?.markers) {
      const marker = doc.markers.find((m) => m.id === spec.markerId);
      if (marker) {
        return marker.time + (spec.offset || 0);
      }
    }
    return 0;
  }

  private evaluateSemanticAnimation(
    config: SemanticAnimationConfig,
    currentTime: number,
    baseStartTime: number,
    state: EvaluatedNodeState
  ): void {
    const elapsed = currentTime - baseStartTime;

    switch (config.type) {
      case "count-up": {
        if (elapsed <= 0) {
          state.numericValueOverride = config.from;
        } else if (elapsed >= config.duration) {
          state.numericValueOverride = typeof config.to === "number" ? config.to : parseFloat(String(config.to)) || 0;
        } else {
          const progress = elapsed / config.duration;
          const target = typeof config.to === "number" ? config.to : parseFloat(String(config.to)) || 0;
          state.numericValueOverride = config.from + (target - config.from) * progress;
        }
        break;
      }

      case "typewriter": {
        if (elapsed <= 0) {
          state.typewriterProgress = 0;
        } else {
          state.typewriterProgress = Math.min(1, elapsed * (config.charsPerSecond / 20));
        }
        break;
      }

      case "repeater-stagger": {
        break;
      }
    }
  }

  private applyEntrancePreset(
    preset: MotionPreset,
    progress: number,
    state: EvaluatedNodeState,
    clipDuration: number
  ): void {
    // Check if a data-driven MotionPresetDefinition handles this preset
    const presetId = preset.type === "slide" ? `slide-${preset.direction || "up"}` : preset.type;
    const def = motionPresetRegistry.get(presetId);

    if (def) {
      const tracks = def.buildTracks(preset, clipDuration);
      for (const track of tracks) {
        const val = this.interpolateTrack(track, progress * preset.duration, preset.duration);
        if (val !== undefined) {
          (state as any)[track.property] = val;
        }
      }
      return;
    }

    // Fallback default preset handling
    switch (preset.type) {
      case "fade":
        state.opacity = progress;
        break;

      case "slide":
        state.opacity = progress;
        const dist = 40 * (1 - progress);
        if (preset.direction === "up") state.translateY = dist;
        else if (preset.direction === "down") state.translateY = -dist;
        else if (preset.direction === "left") state.translateX = dist;
        else state.translateX = -dist;
        break;

      case "scale":
      case "pop":
        state.opacity = progress;
        state.scaleX = 0.5 + 0.5 * progress;
        state.scaleY = 0.5 + 0.5 * progress;
        break;

      case "typewriter":
        state.opacity = 1;
        state.typewriterProgress = progress;
        break;

      case "glow-pulse":
        state.opacity = progress;
        state.blur = (1 - progress) * 8;
        break;

      default:
        state.opacity = progress;
        break;
    }
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case "ease-out":
        return 1 - Math.pow(1 - t, 3);
      case "ease-in-out":
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      case "elastic":
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
      case "linear":
      default:
        return t;
    }
  }

  private interpolateTrack(track: any, currentTime: number, duration: number): any {
    if (!track.keyframes || track.keyframes.length === 0) return undefined;
    const sorted = [...track.keyframes].sort((a, b) => a.time - b.time);

    if (currentTime <= sorted[0].time * duration) return sorted[0].value;
    if (currentTime >= sorted[sorted.length - 1].time * duration) return sorted[sorted.length - 1].value;

    for (let i = 0; i < sorted.length - 1; i++) {
      const k1 = sorted[i];
      const k2 = sorted[i + 1];
      const t1 = k1.time * duration;
      const t2 = k2.time * duration;

      if (currentTime >= t1 && currentTime <= t2) {
        const factor = (currentTime - t1) / (t2 - t1);
        return propertyInterpolator.interpolate(track.property, k1.value, k2.value, factor);
      }
    }
    return undefined;
  }
}

export const animationRuntime = new AnimationRuntime();
