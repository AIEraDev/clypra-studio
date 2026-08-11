import type { OverlayDocument, SceneNode, RepeaterNode, ComponentNode } from "./overlayDocumentSchema.js";

export class DataBindingEngine {
  /**
   * Evaluate a variable template string like "{{revenue}}" or "Growth: {{growth}}%"
   * Returns the interpolated string with all {{key}} tokens replaced.
   */
  public evaluateString(expr: string, context: Record<string, any>): string {
    if (!expr || typeof expr !== "string") return expr;
    return expr.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
      const val = this.resolvePath(key, context);
      return val !== undefined && val !== null ? String(val) : "";
    });
  }

  /**
   * Evaluate a typed expression against context and return the computed value.
   * Unlike evaluateString (which always returns a string), this returns the
   * actual JS value: number, boolean, string, etc.
   *
   * Examples:
   *   evaluateExpression("revenue / 1000000", { revenue: 1240000 }) => 1.24
   *   evaluateExpression("growth > 0", { growth: -5 }) => false
   *   evaluateExpression("firstName + ' ' + lastName", { firstName: "Alice", lastName: "Smith" }) => "Alice Smith"
   *
   * NOTE: Uses new Function() — acceptable for local authoring.
   * MUST be sandboxed (e.g. QuickJS / isolated-vm) before any server-side render path.
   */
  public evaluateExpression(expr: string, context: Record<string, any>): any {
    if (!expr || typeof expr !== "string") return expr;

    // Strip {{ }} wrapper if present
    const unwrapped = expr.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "");

    try {
      const keys = Object.keys(context);
      const vals = Object.values(context);
      // eslint-disable-next-line no-new-func
      const fn = new Function(...keys, `return (${unwrapped});`);
      return fn(...vals);
    } catch {
      // Fallback: string interpolation
      return this.evaluateString(expr, context);
    }
  }

  /**
   * Evaluate boolean condition expressions like "growth > 0" or "type == 'guest'"
   */
  public evaluateCondition(conditionExpr: string, context: Record<string, any>): boolean {
    if (!conditionExpr) return true;

    // Direct variable binding — strip {{ }} then evaluate
    const result = this.evaluateExpression(conditionExpr, context);
    if (result === undefined || result === null) return true;
    if (typeof result === "boolean") return result;
    if (typeof result === "number") return result !== 0;
    if (typeof result === "string") {
      if (result === "true" || result === "1") return true;
      if (result === "false" || result === "0" || result === "") return false;
      return true;
    }
    return Boolean(result);
  }

  /**
   * Expand a RepeaterNode for an array dataset context into instantiated nodes.
   * The key may be a raw variable name or a {{binding}} expression.
   */
  public expandRepeater(repeater: RepeaterNode, context: Record<string, any>): SceneNode[] {
    // Accept "items", "{{items}}", or "{{ items }}"
    const rawKey = repeater.datasetBinding.replace(/^\{\{\s*/, "").replace(/\s*\}\}$/, "").trim();
    const rawData = this.resolvePath(rawKey, context) ?? context[rawKey];
    const items: any[] = Array.isArray(rawData) ? rawData : [];

    if (items.length === 0) return [];

    const expandedNodes: SceneNode[] = [];
    const staggerDelay = repeater.staggerDelay ?? 0.1;
    const direction = repeater.direction ?? "vertical";
    const gap = repeater.layout?.gap ?? 10;

    items.forEach((itemData, idx) => {
      const itemContext = { ...context, item: itemData, index: idx };
      const clonedNode = JSON.parse(JSON.stringify(repeater.itemTemplate)) as SceneNode;

      clonedNode.id = `${repeater.id}-item-${idx}`;

      if (direction === "horizontal") {
        clonedNode.x = repeater.x + idx * (clonedNode.width + gap);
        clonedNode.y = repeater.y;
      } else {
        clonedNode.x = repeater.x;
        clonedNode.y = repeater.y + idx * (clonedNode.height + gap);
      }

      // Apply stagger animation offset
      if (clonedNode.animation?.entrance) {
        clonedNode.animation.entrance = {
          ...clonedNode.animation.entrance,
          delay: (clonedNode.animation.entrance.delay ?? 0) + idx * staggerDelay
        };
      }

      this.evaluateNodeBindings(clonedNode, itemContext);
      expandedNodes.push(clonedNode);
    });

    return expandedNodes;
  }

  /**
   * Recursively evaluate data bindings across a node tree.
   * Evaluates node.bindings rules, text content, and component props.
   */
  public evaluateNodeBindings(node: SceneNode, context: Record<string, any>): void {
    if (node.bindings && node.bindings.length > 0) {
      for (const binding of node.bindings) {
        const evaluated = this.evaluateExpression(binding.expression, context);
        this.setPath(node, binding.targetProperty, evaluated);
      }
    }

    if (node.type === "text") {
      node.text = this.evaluateString(node.text, context);
    } else if (node.type === "component") {
      for (const key of Object.keys(node.props)) {
        if (typeof node.props[key] === "string") {
          node.props[key] = this.evaluateString(node.props[key], context);
        }
      }
    }

    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.evaluateNodeBindings(child, context);
      }
    }
  }

  private resolvePath(path: string, obj: Record<string, any>): any {
    return path.split(".").reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
      obj
    );
  }

  private setPath(obj: any, path: string, value: any): void {
    const parts = path.split(".");
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!curr[parts[i]]) curr[parts[i]] = {};
      curr = curr[parts[i]];
    }
    curr[parts[parts.length - 1]] = value;
  }
}

export const dataBindingEngine = new DataBindingEngine();
