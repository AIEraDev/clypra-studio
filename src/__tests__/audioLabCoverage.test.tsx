import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AudioLabView } from "../labs/audio/AudioLabView";
import { FALLBACK_CATALOG_TRACKS } from "../labs/audio/hooks/useAudioCatalog";
import { AUTH_TOKEN_KEY, getUserFromToken } from "../services/authSession";
import { toast } from "sonner";

function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mockSignature`;
}

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

// Mock ffmpeg / extractAudio so useAudioIngest doesn't attempt dynamic imports in JSDOM
vi.mock("../labs/audio/lib/extractAudio", () => ({
  extractAudio: vi.fn(),
  isVideoFile: vi.fn(() => false),
  isAudioFile: vi.fn(() => true),
  NoAudioTrackError: class NoAudioTrackError extends Error {},
  FileTooLargeError: class FileTooLargeError extends Error {},
  MAX_VIDEO_SIZE_MB: 500,
}));

describe("Audio Lab — Exact UI & Admin Protection Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mock as admin user
    const adminToken = createMockJwt({
      id: 1,
      username: "admin",
      email: "admin@clypra.com",
      isAdmin: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem(AUTH_TOKEN_KEY, adminToken);

    // Mock fetch
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/audio/upload")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              message: "Audio published successfully to catalog",
            }),
        });
      }
      if (String(url).includes("/audio")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(FALLBACK_CATALOG_TRACKS),
        });
      }
      if (String(url).includes("/ai/audio-metadata")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              name: "Synthesized Pulse",
              description: "AI-generated energetic synthwave audio.",
              category: "music",
              bpm: 128,
              loopable: true,
            }),
        });
      }
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const isUserAdmin = token ? Boolean(getUserFromToken(token)?.isAdmin) : false;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: { id: 1, isAdmin: isUserAdmin } }),
      });
    });
  });

  const renderAudioLab = () => {
    return render(
      <MemoryRouter>
        <AudioLabView />
      </MemoryRouter>
    );
  };

  it("renders Audio Lab header with exact breadcrumb, navigation, reset, and avatar", () => {
    renderAudioLab();

    expect(screen.getByText("Studio")).toBeInTheDocument();
    expect(screen.getByText("Audio Lab")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Catalog" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("renders the File section with unified audio+video dropzone", () => {
    renderAudioLab();

    // Updated section subtitle for unified audio+video dropzone
    expect(screen.getByText("Audio or video master & artwork")).toBeInTheDocument();
    // Unified dropzone helper text
    expect(screen.getByText(/Drop an audio or video file/i)).toBeInTheDocument();
    expect(screen.getByText("Cover art")).toBeInTheDocument();

    // In idle state the file-row is hidden, not visible
    const fileRow = document.getElementById("file-row");
    expect(fileRow).toBeInTheDocument();
    expect(fileRow?.classList.contains("hidden")).toBe(true);

    // Remove button should still be in DOM (hidden)
    expect(document.getElementById("remove-file-btn")).toBeInTheDocument();
  });

  it("renders the Details form with empty defaults and handles title change with slug auto-generation", () => {
    renderAudioLab();

    const nameInput = screen.getByPlaceholderText("e.g. Sub Pulse Alpha") as HTMLInputElement;
    expect(nameInput.value).toBe("");

    // Change title — slug should auto-generate
    fireEvent.change(nameInput, { target: { value: "Cosmic Odyssey" } });
    expect(nameInput.value).toBe("Cosmic Odyssey");

    const slugInput = document.getElementById("track-slug") as HTMLInputElement;
    expect(slugInput.value).toBe("cosmic-odyssey");
  });

  it("allows selecting category chips and updates visual selected state", () => {
    renderAudioLab();

    // Categories are now lowercase slugs: music (default), sound-effects, transitions, ambient, ui-interface
    // The first chip (music) starts selected; find any non-selected one by data-selected attribute
    const allChips = document.querySelectorAll(".cat-chip");
    expect(allChips.length).toBeGreaterThan(1);

    // Find the first chip that is not selected
    const unselectedChip = Array.from(allChips).find(
      (c) => c.getAttribute("data-selected") === "false"
    ) as HTMLButtonElement;
    expect(unselectedChip).toBeTruthy();

    fireEvent.click(unselectedChip);
    expect(unselectedChip).toHaveAttribute("data-selected", "true");

    // Previously selected chip (music) should now be deselected
    const musicChip = Array.from(allChips).find(
      (c) => c.getAttribute("data-selected") === "true" && c !== unselectedChip
    );
    expect(musicChip).toBeUndefined(); // only one selected at a time
  });

  it("updates character counter as description is typed", () => {
    renderAudioLab();

    const descTextarea = screen.getByPlaceholderText(/Key characteristics, instrumentation, feel/i);
    const counter = document.getElementById("char-counter");

    expect(counter).toBeInTheDocument();
    // Starts empty
    expect(counter?.textContent).toBe("0 / 300");

    fireEvent.change(descTextarea, { target: { value: "Short punchy cinematic riser." } });
    expect(counter?.textContent).toBe("29 / 300");
  });

  it("collapsible advanced details section contains tempo, loop switch, and license deed URL", () => {
    renderAudioLab();

    expect(screen.getByText(/Advanced details/i)).toBeInTheDocument();

    const tempoInput = document.getElementById("track-tempo") as HTMLInputElement;
    expect(tempoInput).toBeInTheDocument();
    // Starts empty (no pre-populated value)
    expect(tempoInput.value).toBe("");

    const loopCheckbox = document.getElementById("seamless-loop") as HTMLInputElement;
    expect(loopCheckbox).toBeInTheDocument();
    // Default is unchecked
    expect(loopCheckbox.checked).toBe(false);

    const deedInput = document.getElementById("license-deed") as HTMLInputElement;
    expect(deedInput).toBeInTheDocument();
  });

  it("shows idle status text on initial render and footer upload button is present", () => {
    renderAudioLab();

    const statusText = document.getElementById("status-text");
    // Component starts in idle state — no file selected yet
    expect(statusText?.textContent).toBe("Select an audio or video file to begin");

    const uploadBtn = document.getElementById("upload-button");
    expect(uploadBtn).toBeInTheDocument();
    // Button is disabled when no file is loaded
    expect((uploadBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("switches seamlessly between Upload and Catalog view modes and loads tracks into studio", async () => {
    renderAudioLab();

    const catalogTab = screen.getByRole("button", { name: "Catalog" });
    fireEvent.click(catalogTab);

    // Should display catalog search input
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Search audio by title, genre, creator, or tags/i)
      ).toBeInTheDocument();
    });

    // Check catalog track cards exist
    expect(screen.getByText("Cinematic Deep Impact Riser")).toBeInTheDocument();

    // Click "Load into Studio"
    const loadButtons = screen.getAllByRole("button", { name: /Load into Studio/i });
    fireEvent.click(loadButtons[0]);

    // Switches back to Upload mode with loaded track name
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText("e.g. Sub Pulse Alpha") as HTMLInputElement;
      expect(nameInput.value).toBe("Cinematic Deep Impact Riser");
    });
  });

  it("resets form when reset button is clicked", () => {
    renderAudioLab();

    // First fill in the name field
    const nameInput = screen.getByPlaceholderText("e.g. Sub Pulse Alpha") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Test Track" } });
    expect(nameInput.value).toBe("Test Track");

    const resetBtn = screen.getByRole("button", { name: "Reset" });
    fireEvent.click(resetBtn);

    expect(nameInput.value).toBe("");

    // After reset status goes to idle — file-row stays in DOM but remains hidden
    const fileRow = document.getElementById("file-row");
    expect(fileRow).toBeInTheDocument();
    expect(fileRow?.classList.contains("hidden")).toBe(true);
  });

  it("prevents non-admin user from viewing catalog and uploading audio", async () => {
    // Non-admin token
    const creatorToken = createMockJwt({
      id: 88,
      username: "creator",
      email: "creator@example.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem(AUTH_TOKEN_KEY, creatorToken);

    renderAudioLab();

    // Switch to catalog — should be blocked with Admin Access Required
    const catalogTab = screen.getByRole("button", { name: "Catalog" });
    fireEvent.click(catalogTab);

    await waitFor(() => {
      expect(screen.getByText("Admin Access Required")).toBeInTheDocument();
    });

    // Tracks should NOT be visible to non-admin
    expect(
      screen.queryByText("Cinematic Deep Impact Riser"),
    ).not.toBeInTheDocument();

    // Click back to studio upload
    const backBtn = screen.getByRole("button", {
      name: /Back to Studio Upload/i,
    });
    fireEvent.click(backBtn);

    // In upload mode, select an audio file and complete the form
    const audioInput = document.getElementById(
      "media-input",
    ) as HTMLInputElement;
    const testFile = new File(["dummy audio content"], "test-beat.mp3", {
      type: "audio/mpeg",
    });
    fireEvent.change(audioInput, { target: { files: [testFile] } });

    // Populate required fields
    fireEvent.change(screen.getByPlaceholderText("e.g. Sub Pulse Alpha"), {
      target: { value: "Creator Track" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Artist / Producer name"),
      {
        target: { value: "Test Artist" },
      },
    );
    fireEvent.change(
      screen.getByPlaceholderText("e.g. Splice, Freesound, Epidemic"),
      { target: { value: "Freesound" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText("https://freesound.org/s/..."),
      { target: { value: "https://example.com/audio" } },
    );

    const uploadBtn = document.getElementById(
      "upload-button",
    ) as HTMLButtonElement;
    await waitFor(() => {
      expect(uploadBtn.disabled).toBe(false);
    });

    fireEvent.click(uploadBtn);

    // handleUploadClick guards with isAdmin check and calls toast.error
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Admin access required"),
    );
  });

  it("allows admin to view catalog, filter by status, and toggle publish/unpublish", async () => {
    renderAudioLab();

    const catalogTab = screen.getByRole("button", { name: "Catalog" });
    fireEvent.click(catalogTab);

    await waitFor(() => {
      expect(screen.getByText("Master Music Catalog")).toBeInTheDocument();
      expect(screen.getByText("Admin Only")).toBeInTheDocument();
    });

    // Check status filter buttons exist
    expect(
      screen.getByRole("button", { name: "Filter all tracks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter published tracks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter draft tracks" }),
    ).toBeInTheDocument();

    // Toggle publish button should be present for tracks
    const unpublishButtons = screen.getAllByRole("button", {
      name: /Unpublish/i,
    });
    expect(unpublishButtons.length).toBeGreaterThan(0);

    // Click Unpublish on the first track
    fireEvent.click(unpublishButtons[0]);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("unpublished successfully"),
      );
    });
  });
});
