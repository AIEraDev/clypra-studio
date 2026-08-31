import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PreviewPerformanceAdminPage } from "../PreviewPerformanceAdminPage";
import { performanceClient } from "../../../services/performanceClient";

describe("PreviewPerformanceAdminPage", () => {
  it("shows an empty live state and never invents performance values", async () => {
    vi.spyOn(performanceClient, "getPreviewComparison").mockResolvedValue({
      workloadMode: "playback",
      totalSampleSize: 0,
      totalApiSamples: 0,
      totalMeasuredFrames: 0,
      sourceCounts: { frontendSpan: 0, nativeSample: 0, sessionRollup: 0, legacy: 0 },
      cohorts: [],
    });

    render(
      <MemoryRouter>
        <PreviewPerformanceAdminPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("No performance data to display")).toBeInTheDocument();
    await waitFor(() => expect(performanceClient.getPreviewComparison).toHaveBeenCalled());
    expect(screen.queryByText(/184,200|Qualified comparison|Passing/)).not.toBeInTheDocument();
  });
});
