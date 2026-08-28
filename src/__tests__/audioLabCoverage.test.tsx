import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AudioLabView } from "../labs/audio/AudioLabView";
import { FALLBACK_CATALOG_TRACKS } from "../labs/audio/hooks/useAudioCatalog";

// Mock API config
vi.mock("../services/apiConfig", () => ({
  getStudioApiBaseUrl: () => "https://clypra-worker-api.abdulkabirmusa.com",
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Audio Lab — Architecture, Restructuring & Authoring Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock fetch for deterministic catalog responses
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/audio")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(FALLBACK_CATALOG_TRACKS),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    });
  });

  const renderAudioLab = () => {
    return render(
      <BrowserRouter>
        <AudioLabView />
      </BrowserRouter>,
    );
  };

  it("renders Audio Lab header with dual-view modes and workbench layout", () => {
    renderAudioLab();

    expect(screen.getByRole("heading", { name: "Audio Lab", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Studio Authoring")).toBeInTheDocument();
    expect(screen.getByText("Catalog Explorer")).toBeInTheDocument();
    expect(screen.getByText("Audio Workbench Preview")).toBeInTheDocument();
  });

  it("switches seamlessly between Studio Authoring and Catalog Explorer", async () => {
    renderAudioLab();

    // Starts in Studio Authoring
    expect(screen.getByText("1. Ingest Audio Source")).toBeInTheDocument();
    expect(screen.getByText("Metadata & Classification")).toBeInTheDocument();

    // Click Catalog Explorer
    const catalogTab = screen.getByText("Catalog Explorer");
    fireEvent.click(catalogTab);

    // Should now display catalog search and genre filters
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Search audio by title, genre, creator/i),
      ).toBeInTheDocument();
    });

    // Switch back to Studio Authoring
    const studioTab = screen.getByText("Studio Authoring");
    fireEvent.click(studioTab);

    expect(screen.getByText("1. Ingest Audio Source")).toBeInTheDocument();
  });

  it("handles track title editing and auto-generates kebab-case slug ID", () => {
    renderAudioLab();

    const nameInput = screen.getByPlaceholderText("e.g., Deep Cinematic Riser");
    const idInput = screen.getByPlaceholderText("auto-generated-slug-id");

    fireEvent.change(nameInput, { target: { value: "Epic Cyberpunk Blast" } });

    expect(nameInput).toHaveValue("Epic Cyberpunk Blast");
    expect(idInput).toHaveValue("epic-cyberpunk-blast");
  });

  it("allows category selection via category chips", () => {
    renderAudioLab();

    const cinematicBtns = screen.getAllByRole("button", { name: "cinematic" });
    fireEvent.click(cinematicBtns[0]);

    // The category elements update in document
    expect(screen.getAllByText("cinematic").length).toBeGreaterThan(0);
  });

  it("supports adding and toggling tags via quick-add chips", () => {
    renderAudioLab();

    const quickTagBtn = screen.getByRole("button", { name: "+ trailer" });
    fireEvent.click(quickTagBtn);

    const tagsInput = screen.getByPlaceholderText(/comma separated/i);
    expect(tagsInput).toHaveValue("trailer");

    // Clicking again toggles tag off
    const activeTagBtn = screen.getByRole("button", { name: "✓ trailer" });
    fireEvent.click(activeTagBtn);

    expect(tagsInput).toHaveValue("");
  });

  it("renders preflight checklist and dynamically verifies requirements", () => {
    renderAudioLab();

    // Initially audio file is missing, so audio check shows pending message
    expect(
      screen.getAllByText(/Please drop or select an audio file/i)[0],
    ).toBeInTheDocument();
    expect(screen.getByText("Author credit is required")).toBeInTheDocument();

    // Enter required fields
    const authorInput = screen.getByPlaceholderText("e.g., Composer Name or Studio Team");
    fireEvent.change(authorInput, { target: { value: "Clypra Master Composer" } });

    expect(screen.getByText("By: Clypra Master Composer")).toBeInTheDocument();
  });

  it("loads demo preset samples into the authoring workbench", () => {
    renderAudioLab();

    // Click Load Sample
    const loadSampleBtn = screen.getByRole("button", { name: /Load Sample/i });
    fireEvent.click(loadSampleBtn);

    // Select preset from dropdown
    const presetBtn = screen.getByText("Cinematic Deep Impact Riser");
    fireEvent.click(presetBtn);

    // Form should be populated with sample data
    const nameInput = screen.getByPlaceholderText("e.g., Deep Cinematic Riser");
    expect(nameInput).toHaveValue("Cinematic Deep Impact Riser");

    const idInput = screen.getByPlaceholderText("auto-generated-slug-id");
    expect(idInput).toHaveValue("cinematic-deep-impact-riser");

    // Audio duration calibrated
    expect(screen.getByText(/6.40 seconds calibrated/i)).toBeInTheDocument();
  });

  it("filters tracks in Catalog Explorer by search query and category", async () => {
    renderAudioLab();

    // Switch to Catalog Explorer
    fireEvent.click(screen.getByText("Catalog Explorer"));

    const searchInput = await screen.findByPlaceholderText(/Search audio by title, genre/i);
    fireEvent.change(searchInput, { target: { value: "Aurora" } });

    // Should match Ambient Aurora track
    await waitFor(() => {
      expect(screen.getByText("Ambient Aurora Meditation")).toBeInTheDocument();
    });
  });

  it("resets workbench to pristine state when reset button is clicked", () => {
    renderAudioLab();

    const nameInput = screen.getByPlaceholderText("e.g., Deep Cinematic Riser");
    fireEvent.change(nameInput, { target: { value: "Temporary Track" } });
    expect(nameInput).toHaveValue("Temporary Track");

    const resetBtn = screen.getByTitle("Clear current track and reset form");
    fireEvent.click(resetBtn);

    expect(nameInput).toHaveValue("");
  });
});
