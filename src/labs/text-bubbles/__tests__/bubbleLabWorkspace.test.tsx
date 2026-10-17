import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BubbleLabWorkspace } from "../BubbleLabWorkspace";
import { validateBubblePreset } from "../services/bubblePresetService";
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

  it("loads seeded presets matching Desktop catalog", () => {
    render(<BubbleLabWorkspace />);

    // Signature presets present
    expect(screen.getAllByText("Torn Paper").length).toBeGreaterThan(0);
    expect(screen.getByText("Speech Balloon")).toBeInTheDocument();
    expect(screen.getByText("Dotted Cloud")).toBeInTheDocument();
  });

  it("switches active preset when clicked in the browser", () => {
    render(<BubbleLabWorkspace />);

    // Click "Speech Balloon" preset card
    const speechCard = screen.getByText("Speech Balloon");
    fireEvent.click(speechCard);

    // Inspector should update to show Speech Balloon metadata
    const nameInput = screen.getByDisplayValue("Speech Balloon");
    expect(nameInput).toBeInTheDocument();
  });

  it("filters presets using search input", () => {
    render(<BubbleLabWorkspace />);

    const searchInput = screen.getByPlaceholderText("Search bubble presets...");
    fireEvent.change(searchInput, { target: { value: "Torn" } });

    expect(screen.getAllByText("Torn Paper").length).toBeGreaterThan(0);
    expect(screen.queryByText("Speech Balloon")).not.toBeInTheDocument();
  });

  it("switches sizing mode between Auto-fit and Fixed", () => {
    render(<BubbleLabWorkspace />);

    const fixedBtn = screen.getByRole("button", { name: "Fixed" });
    fireEvent.click(fixedBtn);

    // Bottom HUD updates layout mode
    expect(screen.getByText("fixed")).toBeInTheDocument();
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
});
