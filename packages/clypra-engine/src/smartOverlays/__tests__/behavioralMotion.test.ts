import { describe, it, expect } from "vitest";
import { resolveBehaviorToAnimationSpec } from "../animation/behavioralMotion.js";
import type { SceneNode } from "../overlayDocumentSchema.js";

describe("Ticket 6: Behavioral Motion System", () => {
  it("should compile high-level 'emphasize' behavior into a pop entrance animation preset", () => {
    const spec = resolveBehaviorToAnimationSpec({
      kind: "emphasize",
      duration: 1.0,
      easing: "ease-out"
    });

    expect(spec).toBeDefined();
    expect(spec.entrance?.type).toBe("pop");
    expect(spec.entrance?.duration).toBe(1.0);
    expect(spec.entrance?.easing).toBe("ease-out");
  });

  it("should compile high-level 'reveal' behavior for text nodes into typewriter preset", () => {
    const textNode: SceneNode = {
      id: "node-1",
      type: "text",
      x: 100,
      y: 100,
      width: 300,
      height: 50,
      text: "Revealed text"
    };

    const spec = resolveBehaviorToAnimationSpec(
      { kind: "reveal", duration: 1.2 },
      textNode
    );

    expect(spec).toBeDefined();
    expect(spec.entrance?.type).toBe("typewriter");
    expect(spec.entrance?.duration).toBe(1.2);
  });

  it("should compile high-level 'attention' behavior into a glow-pulse preset", () => {
    const spec = resolveBehaviorToAnimationSpec({
      kind: "attention",
      duration: 0.8
    });

    expect(spec).toBeDefined();
    expect(spec.entrance?.type).toBe("glow-pulse");
    expect(spec.entrance?.duration).toBeCloseTo(1.2);
  });
});
