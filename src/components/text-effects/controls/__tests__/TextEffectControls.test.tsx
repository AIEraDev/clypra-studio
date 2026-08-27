import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { defaultConfig } from "@clypra-studio/engine";
import { TextEffectControls } from "../TextEffectControls";
import { TextConfigSection } from "../sections/TextConfigSection";
import { FontSpecimenSection } from "../sections/FontSpecimenSection";
import { CanvasLayoutSection } from "../sections/CanvasLayoutSection";

describe("TextEffectControls Modular Architecture", () => {
  const sampleConfig = {
    ...defaultConfig,
    text: "CLYPRA STUDIO",
    effectName: "StickerEffect",
    fontFamily: "Bangers",
  };

  it("renders all section headers in the modular controls panel", () => {
    render(
      <TextEffectControls
        config={sampleConfig}
        activeEffectId="effect-test-id"
        collapsedSections={{}}
        isGeneratingName={false}
        modifyConfig={() => {}}
        toggleSection={() => {}}
        handleGenerateAiEffectName={() => {}}
        applyCompositionPreset={() => {}}
        fitTextToComposition={() => {}}
      />,
    );

    expect(screen.getByText("1. Text Configuration")).toBeInTheDocument();
    expect(screen.getByText("2. Font Specimen")).toBeInTheDocument();
    expect(screen.getByText("3. Ink Brush Engine")).toBeInTheDocument();
    expect(screen.getByText("3. Text Fill Color")).toBeInTheDocument();
    expect(screen.getByText("4. Stroke Border")).toBeInTheDocument();
    expect(screen.getByText("5. Outer / Inner Glows")).toBeInTheDocument();
    expect(screen.getByText("6. Back Shadow")).toBeInTheDocument();
    expect(screen.getByText("7. 3D Extrusion Bevel")).toBeInTheDocument();
    expect(screen.getByText("7.5. Multi-Stack Layers")).toBeInTheDocument();
    expect(screen.getByText("8. Bounding Plate")).toBeInTheDocument();
    expect(screen.getByText("9. Studio Canvas Layout")).toBeInTheDocument();
  });

  it("TextConfigSection dispatches text updates when typing (debounced)", async () => {
    vi.useFakeTimers();
    const handleModify = vi.fn();
    render(
      <TextConfigSection
        config={sampleConfig}
        modifyConfig={handleModify}
        isCollapsed={false}
        onToggle={() => {}}
        activeEffectId="effect-test-id"
        isGeneratingName={false}
        handleGenerateAiEffectName={() => {}}
      />,
    );

    const textarea = screen.getByDisplayValue("CLYPRA STUDIO");
    fireEvent.change(textarea, { target: { value: "NEW TEXT" } });

    // modifyConfig is debounced — should NOT fire synchronously
    expect(handleModify).toHaveBeenCalledTimes(0);

    // Advance past the 50ms debounce
    await vi.runAllTimersAsync();

    expect(handleModify).toHaveBeenCalledTimes(1);
    expect(handleModify).toHaveBeenCalledWith(
      expect.objectContaining({ text: "NEW TEXT" }),
    );
    vi.useRealTimers();
  });

  it("FontSpecimenSection changes font family dropdown", () => {
    const handleModify = vi.fn();
    render(
      <FontSpecimenSection
        config={sampleConfig}
        modifyConfig={handleModify}
        isCollapsed={false}
        onToggle={() => {}}
      />,
    );

    const select = screen.getByDisplayValue("Bangers");
    fireEvent.change(select, { target: { value: "Inter" } });

    expect(handleModify).toHaveBeenCalledWith({ fontFamily: "Inter" });
  });

  it("CanvasLayoutSection dispatches composition preset application", () => {
    const handlePreset = vi.fn();
    render(
      <CanvasLayoutSection
        config={sampleConfig}
        modifyConfig={() => {}}
        isCollapsed={false}
        onToggle={() => {}}
        applyCompositionPreset={handlePreset}
        fitTextToComposition={() => {}}
      />,
    );

    const preset16x9Btn = screen.getByText("16:9");
    fireEvent.click(preset16x9Btn);

    expect(handlePreset).toHaveBeenCalledWith("youtube");
  });
});

describe("ControlColorPicker Studio Component", () => {
  it("renders unified hex input and swatch", async () => {
    const { ControlColorPicker } = await import("../common/ControlColorPicker");
    const handleChange = vi.fn();
    render(<ControlColorPicker value="#FFCE00" onChange={handleChange} label="Highlight Color" />);

    expect(screen.getByText("Highlight Color")).toBeInTheDocument();
    const input = screen.getByDisplayValue("#FFCE00");
    expect(input).toBeInTheDocument();
  });

  it("updates value when user inputs a valid hex code", async () => {
    const { ControlColorPicker } = await import("../common/ControlColorPicker");
    const handleChange = vi.fn();
    render(<ControlColorPicker value="#FFCE00" onChange={handleChange} />);

    const input = screen.getByDisplayValue("#FFCE00");
    fireEvent.change(input, { target: { value: "#00FF88" } });
    expect(handleChange).toHaveBeenCalledWith("#00FF88");
  });

  it("auto-normalizes hex without hash prefix", async () => {
    const { ControlColorPicker } = await import("../common/ControlColorPicker");
    const handleChange = vi.fn();
    render(<ControlColorPicker value="#FFFFFF" onChange={handleChange} />);

    const input = screen.getByDisplayValue("#FFFFFF");
    fireEvent.change(input, { target: { value: "FF5500" } });
    expect(handleChange).toHaveBeenCalledWith("#FF5500");
  });

  it("supports compact swatch-only mode without rendering input", async () => {
    const { ControlColorPicker } = await import("../common/ControlColorPicker");
    const handleChange = vi.fn();
    const { container } = render(<ControlColorPicker value="#123456" onChange={handleChange} showInput={false} />);

    expect(container.querySelector("input")).toBeNull();
    expect(container.querySelector(".clypra-swatch-trigger")).toBeInTheDocument();
  });
});

