import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  SUPPORTED_FONT_FAMILIES,
  isSupportedFontFamily,
  normalizeSupportedFontFamily,
  GOOGLE_FONTS,
  ALL_FONTS,
  SYSTEM_FONTS,
} from "../constants/fonts";
import { FontSpecimenSection } from "../components/text-effects/controls/sections/FontSpecimenSection";
import { FontControl } from "../components/OverlayStudioWorkspace/inspector/controls/FontControl";
import { FontSelector } from "../components/OverlayStudioWorkspace/inspector/controls/FontSelector";
import { defaultConfig } from "@clypra-studio/engine";

describe("Clypra Studio Supported Font Families", () => {
  const EXPECTED_21_FAMILIES = [
    "Inter",
    "Geist",
    "Outfit",
    "Space Grotesk",
    "Roboto",
    "Roboto Condensed",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Raleway",
    "Oswald",
    "Playfair Display",
    "Anton",
    "Bebas Neue",
    "Nunito",
    "Poppins",
    "Permanent Marker",
    "Bangers",
    "Press Start 2P",
    "Dancing Script",
    "Pacifico",
  ];

  it("exports exactly the 21 font families registered and supported by the editor and Rust engine", () => {
    expect(SUPPORTED_FONT_FAMILIES).toHaveLength(21);
    expect([...SUPPORTED_FONT_FAMILIES]).toEqual(EXPECTED_21_FAMILIES);
  });

  it("does not expose or include unregistered system or dev fonts", () => {
    const UNREGISTERED_FONTS = [
      "Arial",
      "Arial Black",
      "Arial Rounded MT Bold",
      "Georgia",
      "Times New Roman",
      "Courier New",
      "Impact",
      "Verdana",
      "Trebuchet MS",
      "Palatino",
      "Helvetica",
      "Fira Code",
      "Space Mono",
      "system-ui",
    ];

    for (const font of UNREGISTERED_FONTS) {
      expect(SUPPORTED_FONT_FAMILIES).not.toContain(font);
      expect(isSupportedFontFamily(font)).toBe(false);
      expect(GOOGLE_FONTS).not.toContain(font);
      expect(ALL_FONTS).not.toContain(font);
    }

    expect(SYSTEM_FONTS).toHaveLength(0);
  });

  it("validates supported font families and aliases with isSupportedFontFamily", () => {
    // Canonical names
    for (const family of EXPECTED_21_FAMILIES) {
      expect(isSupportedFontFamily(family)).toBe(true);
      expect(isSupportedFontFamily(family.toLowerCase())).toBe(true);
    }

    // Variable aliases registered in the native Rust engine
    expect(isSupportedFontFamily("Inter Variable")).toBe(true);
    expect(isSupportedFontFamily("Geist Variable")).toBe(true);
    expect(isSupportedFontFamily("Outfit Variable")).toBe(true);
    expect(isSupportedFontFamily("Space Grotesk Variable")).toBe(true);
    expect(isSupportedFontFamily("Montserrat Variable")).toBe(true);
    expect(isSupportedFontFamily("Roboto Variable")).toBe(true);
    expect(isSupportedFontFamily("Roboto Condensed Variable")).toBe(true);
    expect(isSupportedFontFamily("Open Sans Variable")).toBe(true);
    expect(isSupportedFontFamily("Raleway Variable")).toBe(true);
    expect(isSupportedFontFamily("Oswald Variable")).toBe(true);
    expect(isSupportedFontFamily("Playfair Display Variable")).toBe(true);
    expect(isSupportedFontFamily("Nunito Variable")).toBe(true);
    expect(isSupportedFontFamily("Dancing Script Variable")).toBe(true);

    // Invalid / unsupported fonts
    expect(isSupportedFontFamily("Arial")).toBe(false);
    expect(isSupportedFontFamily("Comic Sans")).toBe(false);
    expect(isSupportedFontFamily("")).toBe(false);
  });

  it("normalizes variable and alias font names to canonical supported families", () => {
    expect(normalizeSupportedFontFamily("Inter Variable")).toBe("Inter");
    expect(normalizeSupportedFontFamily("outfit variable")).toBe("Outfit");
    expect(normalizeSupportedFontFamily("space grotesk")).toBe("Space Grotesk");
    expect(normalizeSupportedFontFamily("Geist")).toBe("Geist");
    expect(normalizeSupportedFontFamily("Unregistered Font", "Inter")).toBe("Inter");
  });

  it("FontSpecimenSection renders only supported font families in its select", () => {
    const handleModify = vi.fn();
    const { container } = render(
      <FontSpecimenSection
        config={{ ...defaultConfig, fontFamily: "Inter" }}
        modifyConfig={handleModify}
        isCollapsed={false}
        onToggle={() => {}}
      />,
    );

    const select = container.querySelector("#select-font-family") as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const options = Array.from(select.querySelectorAll("option")).map((o) => o.value);
    expect(options).toHaveLength(21);
    expect(options).toEqual(EXPECTED_21_FAMILIES);

    // Verify system fonts are absent
    expect(options).not.toContain("Arial");
    expect(options).not.toContain("Georgia");
    expect(options).not.toContain("Times New Roman");
  });

  it("FontControl renders only supported font families in its select", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <FontControl value="Inter" onChange={handleChange} label="Font" />,
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const options = Array.from(select.querySelectorAll("option")).map((o) => o.value);
    expect(options).toHaveLength(21);
    expect(options).toEqual(EXPECTED_21_FAMILIES);

    expect(options).not.toContain("Fira Code");
    expect(options).not.toContain("Space Mono");
    expect(options).not.toContain("system-ui");
  });

  it("FontSelector renders only supported font families in its dropdown", () => {
    const handleCommand = vi.fn();
    const mockNode: any = {
      id: "node-1",
      name: "Text Node",
      type: "text",
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      style: { fontFamily: "Inter" },
    };

    const { container } = render(
      <FontSelector node={mockNode} onExecuteCommand={handleCommand} />,
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const options = Array.from(select.querySelectorAll("option")).map((o) => o.value);
    expect(options).toHaveLength(21);
    expect(options).toEqual(EXPECTED_21_FAMILIES);

    expect(options).not.toContain("Fira Code");
    expect(options).not.toContain("Arial");
    expect(options).not.toContain("Helvetica");
    expect(options).not.toContain("Georgia");
  });
});
