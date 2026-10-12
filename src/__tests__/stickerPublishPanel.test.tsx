import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  StickerPublishPanel,
  STICKER_CATEGORIES,
  SPDX_LICENSES,
} from "../components/panels/StickerPublishPanel";

// Mock @lottiefiles/react-lottie-player
vi.mock("@lottiefiles/react-lottie-player", () => ({
  Player: () => <div data-testid="mock-lottie-player" />,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("StickerPublishPanel — Studio Sticker Builder Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 3 sections of the sticker pipeline builder", () => {
    render(<StickerPublishPanel variant="workspace" />);

    expect(screen.getByText("1. Asset Upload & Metadata")).toBeDefined();
    expect(screen.getByText("2. Interactive Preview & Thumbnail")).toBeDefined();
    expect(screen.getByText("3. Mandatory Licensing & Rights Gate")).toBeDefined();
    expect(screen.getByText("Stage to R2 & Generate Manifest")).toBeDefined();
  });

  it("exposes all 11 canonical v1 categories in the category select", () => {
    render(<StickerPublishPanel variant="workspace" />);

    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects.length).toBeGreaterThanOrEqual(2);
    // Look for category options
    for (const cat of STICKER_CATEGORIES) {
      expect(screen.getByRole("option", { name: cat })).toBeDefined();
    }
    expect(STICKER_CATEGORIES).toHaveLength(11);
  });

  it("auto-generates canonical slug ID from sticker name and category", () => {
    render(<StickerPublishPanel variant="workspace" />);

    const nameInput = screen.getByPlaceholderText("e.g. Glowing Fire") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Super Cool Fire" } });

    const idInput = screen.getByPlaceholderText("sticker-category-name") as HTMLInputElement;
    expect(idInput.value).toBe("sticker-reaction-super-cool-fire");
  });

  it("includes all required SPDX licenses and flags CC-BY attribution", () => {
    render(<StickerPublishPanel variant="workspace" />);

    expect(SPDX_LICENSES.map((l) => l.id)).toEqual([
      "CC-BY-4.0",
      "CC0-1.0",
      "LicenseRef-Clypra-Original",
      "LicenseRef-Contributor-Grant",
      "Apache-2.0",
      "MIT",
      "CC-BY-SA-4.0",
    ]);

    const ccBy = SPDX_LICENSES.find((l) => l.id === "CC-BY-4.0");
    expect(ccBy?.requiresAttribution).toBe(true);
    expect(ccBy?.requiresSource).toBe(true);
  });

  it("provides background mode toggles (Dark, Light, Grid)", () => {
    render(<StickerPublishPanel variant="workspace" />);

    const darkBtn = screen.getByRole("button", { name: "Dark" });
    const lightBtn = screen.getByRole("button", { name: "Light" });
    const gridBtn = screen.getByRole("button", { name: "Grid" });

    expect(darkBtn).toBeDefined();
    expect(lightBtn).toBeDefined();
    expect(gridBtn).toBeDefined();

    fireEvent.click(lightBtn);
    expect(lightBtn.className).toContain("bg-[#7C6FFF]");

    fireEvent.click(gridBtn);
    expect(gridBtn.className).toContain("bg-[#7C6FFF]");
  });

  it("prevents staging when no asset file is provided", () => {
    render(<StickerPublishPanel variant="workspace" />);

    const submitBtn = screen.getByRole("button", {
      name: /Stage to R2 & Generate Manifest/i,
    }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });
});
