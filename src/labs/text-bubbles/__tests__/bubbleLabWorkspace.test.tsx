import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BubbleLabWorkspace } from "../BubbleLabWorkspace";
import { createCustomPreset, loadBubblePresets, saveBubblePresets, validateBubblePreset } from "../services/bubblePresetService";
import { DEFAULT_BUBBLE_CATALOG } from "../data/defaultBubbleCatalog";

// Mock Canvas context for testing environment
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    scale: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    rect: vi.fn(),
    arc: vi.fn(),
    roundRect: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 80 })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    setLineDash: vi.fn(),
    translate: vi.fn(),
  })) as any;
});

describe("Text Bubble Studio Workspace (clypra-studio)", () => {
  it("renders 3-pane authoring workspace with browser, stage, and inspector", () => {
    render(<BubbleLabWorkspace />);

    // Top action bar
    expect(screen.getByText("Export JSON")).toBeInTheDocument();
    expect(screen.getByText("Save Draft")).toBeInTheDocument();
    expect(screen.getByText("Publish Preset")).toBeInTheDocument();

    // Left pane: Preset browser with search & category pills
    expect(screen.getByPlaceholderText("Search bubble presets...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paper" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Speech" })).toBeInTheDocument();

    // Center pane: Interactive stage preview
    expect(screen.getByPlaceholderText("Sample text...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Auto-fit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fixed" })).toBeInTheDocument();

    // Right pane: Layout & bounds inspector
    expect(screen.getByText("Content Bounds & Padding")).toBeInTheDocument();
    expect(screen.getByText("Text Safe Padding (T / R / B / L)")).toBeInTheDocument();
  });

  it("loads the intentionally small, cross-category curated catalog", () => {
    render(<BubbleLabWorkspace />);

    expect(DEFAULT_BUBBLE_CATALOG).toHaveLength(3);
    expect(new Set(DEFAULT_BUBBLE_CATALOG.map((preset) => preset.category))).toEqual(
      new Set(["speech", "comic", "cute"]),
    );
    expect(screen.getAllByText("Rose Chalk Dialogue").length).toBeGreaterThan(0);
    expect(screen.getByText("Ink Pop!")).toBeInTheDocument();
    expect(screen.getByText("Daydream Cloud")).toBeInTheDocument();
  });

  it("switches active preset when clicked in the browser", () => {
    render(<BubbleLabWorkspace />);

    const comicCard = screen.getByText("Ink Pop!");
    fireEvent.click(comicCard);

    const nameInput = screen.getByDisplayValue("Ink Pop!");
    expect(nameInput).toBeInTheDocument();
  });

  it("loads the selected preset's authored sample text into the stage", () => {
    render(<BubbleLabWorkspace />);

    fireEvent.click(screen.getByText("Daydream Cloud"));

    expect(screen.getByPlaceholderText("Sample text...")).toHaveValue("Thinking of you");
  });

  it("filters presets using search input", () => {
    render(<BubbleLabWorkspace />);

    const searchInput = screen.getByPlaceholderText("Search bubble presets...");
    fireEvent.change(searchInput, { target: { value: "Rose" } });

    expect(screen.getAllByText("Rose Chalk Dialogue").length).toBeGreaterThan(0);
    expect(screen.queryByText("Ink Pop!")).not.toBeInTheDocument();
  });

  it("switches sizing mode between Auto-fit and Fixed", () => {
    render(<BubbleLabWorkspace />);

    const fixedBtn = screen.getByRole("button", { name: "Fixed" });
    fireEvent.click(fixedBtn);

    // Bottom HUD updates layout mode
    expect(screen.getByText("fixed")).toBeInTheDocument();
  });

  it("creates a portable custom bubble with one editable vector definition", () => {
    render(<BubbleLabWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "New Clean Bubble" }));

    const tailSide = screen.getByLabelText("Vector tail side");
    expect(tailSide).toHaveValue("bottom");
    fireEvent.change(tailSide, { target: { value: "right" } });
    expect(tailSide).toHaveValue("right");
    expect(screen.getByLabelText("Bubble fill color")).toBeInTheDocument();
    expect(screen.getByLabelText("Fill opacity")).toBeInTheDocument();
  });

  it("converts an authored bubble to an editable freeform SVG silhouette", () => {
    render(<BubbleLabWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "New Clean Bubble" }));
    fireEvent.click(screen.getByRole("button", { name: "Convert to freeform silhouette" }));

    expect(screen.getByLabelText("Editable freeform bubble preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Return to parametric shape" })).toBeInTheDocument();
  });

  it("starts a new asset directly in the freeform node workspace", () => {
    render(<BubbleLabWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "New Vector Path Bubble" }));

    expect(screen.getByLabelText("Editable freeform bubble preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add node" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete node" })).toBeInTheDocument();
  });

  it("applies a deterministic Rough.js comic style without changing the authored path", () => {
    render(<BubbleLabWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "New Vector Path Bubble" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Comic" }).at(-1)!);

    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByLabelText("Editable freeform bubble preview")).toBeInTheDocument();
  });

  it("starts a Rough.js hand-drawn bubble without requiring manual nodes", () => {
    render(<BubbleLabWorkspace />);

    fireEvent.click(screen.getByRole("button", { name: "New Hand-Drawn Bubble" }));

    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getAllByText("Hand-Drawn Bubble 4").length).toBeGreaterThan(0);
  });

  it("validates preset schema correctly in bubblePresetService", () => {
    const validPreset = DEFAULT_BUBBLE_CATALOG[0];
    const validation = validateBubblePreset(validPreset);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const invalidPreset = {
      ...validPreset,
      name: "",
      layout: { ...validPreset.layout, minWidth: -10 },
    };
    const invalidRes = validateBubblePreset(invalidPreset);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.errors.length).toBeGreaterThan(0);
  });

  it("persists an authored vector definition while retiring legacy catalog entries", () => {
    const custom = createCustomPreset("comic", 1);
    if (custom.definition?.geometry.kind === "parametric-path") custom.definition.geometry.tail.side = "left";
    custom.definition!.layers.accent = { color: "#ffffff", opacity: 0.2, texture: "hatch" };
    expect(saveBubblePresets([DEFAULT_BUBBLE_CATALOG[0], custom])).toBe(true);

    const loaded = loadBubblePresets();
    expect(loaded.find((preset) => preset.id === custom.id)?.definition).toMatchObject({
      geometry: { tail: { side: "left" } },
      layers: { accent: { texture: "hatch" } },
    });
  });
});
