/**
 * Phase 4J — Responsive Layout Resolver
 *
 * Pure, deterministic, side-effect-free functions that merge a node's
 * base properties with a breakpoint-specific sparse override patch.
 *
 * Architecture contract:
 *   Base property → responsive override → resolved property
 *
 * Identity fields (id, type, children) are NEVER overridden.
 * Only layout/style/geometry fields participate in breakpoint resolution.
 */

import type {
  OverlayDocument,
  SceneNode,
  FrameNode,
  RepeaterNode,
  ResponsiveNodeOverride,
  NodeLayoutRules,
  NodeStyleRules,
} from "./overlayDocumentSchema.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function deepMergeLayout(
  base: NodeLayoutRules | undefined,
  patch: Partial<NodeLayoutRules> | undefined
): NodeLayoutRules | undefined {
  if (!patch) return base;
  if (!base) return patch as NodeLayoutRules;
  return {
    ...base,
    ...patch,
    // Deep-merge padding and constraints sub-objects
    padding: patch.padding ?? base.padding,
    constraints:
      patch.constraints !== undefined
        ? { ...(base.constraints ?? {}), ...patch.constraints }
        : base.constraints,
  };
}

function deepMergeStyle(
  base: NodeStyleRules | undefined,
  patch: Partial<NodeStyleRules> | undefined
): NodeStyleRules | undefined {
  if (!patch) return base;
  if (!base) return patch as NodeStyleRules;
  return { ...base, ...patch };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Merge a node's base properties with the responsive override for the given
 * breakpoint. Returns a new object — does NOT mutate the original node.
 *
 * When breakpointId is null (base layout), the node is returned unchanged.
 * When breakpointId is non-null but the node has no override for it, the node
 * is returned unchanged (graceful fallback, no throw).
 */
export function resolveNodeForBreakpoint(
  node: SceneNode,
  breakpointId: string | null
): SceneNode {
  if (breakpointId === null) return node;

  const override: ResponsiveNodeOverride | undefined =
    node.responsive?.[breakpointId];

  // Build the resolved node — apply own override if present, otherwise keep base
  let resolved: SceneNode;
  if (override) {
    resolved = {
      ...node,
      ...(override.x !== undefined ? { x: override.x } : {}),
      ...(override.y !== undefined ? { y: override.y } : {}),
      ...(override.width !== undefined ? { width: override.width } : {}),
      ...(override.height !== undefined ? { height: override.height } : {}),
      ...(override.visible !== undefined ? { visible: override.visible } : {}),
      layout: deepMergeLayout(node.layout, override.layout),
      style: deepMergeStyle(node.style, override.style),
    } as SceneNode;
  } else {
    // No own override — start from base, but still recurse children below
    resolved = { ...node } as SceneNode;
  }

  // Always recurse children — a parent may lack an override while its children have one
  const children = (node as FrameNode).children;
  if (Array.isArray(children)) {
    let resolvedChildren = children.map((child) =>
      resolveNodeForBreakpoint(child, breakpointId)
    );

    // Apply layoutOrder reordering within the breakpoint if any child has it
    const hasOrder = resolvedChildren.some(
      (c) => c.responsive?.[breakpointId!]?.layoutOrder !== undefined
    );
    if (hasOrder) {
      resolvedChildren = [...resolvedChildren].sort((a, b) => {
        const orderA = a.responsive?.[breakpointId!]?.layoutOrder ?? Infinity;
        const orderB = b.responsive?.[breakpointId!]?.layoutOrder ?? Infinity;
        return orderA - orderB;
      });
    }

    (resolved as FrameNode).children = resolvedChildren;
  }

  // Recursively resolve repeater itemTemplate
  const repeater = node as RepeaterNode;
  if (repeater.type === "repeater" && repeater.itemTemplate) {
    (resolved as RepeaterNode).itemTemplate = resolveNodeForBreakpoint(
      repeater.itemTemplate,
      breakpointId
    ) as SceneNode;
  }

  return resolved;
}

/**
 * Produce a shallow-cloned OverlayDocument where:
 *   - `canvas` is replaced by the breakpoint's canvas dimensions
 *   - all nodes are recursively resolved for the breakpoint
 *
 * When breakpointId is null, the original document is returned unchanged.
 * When the breakpoint is not found in doc.breakpoints, the document is
 * returned unchanged (graceful fallback, no throw).
 *
 * The returned document is suitable as the direct input to
 * `LayoutEngine.computeLayout` and `AnimationRuntime.evaluateScene`.
 */
export function resolveDocumentForBreakpoint(
  doc: OverlayDocument,
  breakpointId: string | null
): OverlayDocument {
  if (breakpointId === null) return doc;

  const bp = doc.breakpoints?.breakpoints.find((b) => b.id === breakpointId);
  if (!bp) return doc; // unknown id → graceful fallback

  return {
    ...doc,
    canvas: {
      ...doc.canvas,
      width: bp.canvas.width,
      height: bp.canvas.height,
    },
    nodes: doc.nodes.map((node) =>
      resolveNodeForBreakpoint(node, breakpointId)
    ),
  };
}
