import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PerformanceAdminDashboard } from "../PerformanceAdminDashboard";
import { performanceClient } from "../../../services/performanceClient";

describe("PerformanceAdminDashboard Studio Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(performanceClient, "getOSComparison").mockResolvedValue(
      performanceClient.getTestFixtureOSComparison(),
    );
    vi.spyOn(performanceClient, "getHardwareComparison").mockResolvedValue(
      performanceClient.getTestFixtureHardwareComparison(),
    );
    vi.spyOn(performanceClient, "getAnomalies").mockResolvedValue(
      performanceClient.getTestFixtureAnomalies(),
    );
    vi.spyOn(performanceClient, "getFallbacks").mockResolvedValue(
      performanceClient.getTestFixtureFallbacks(),
    );
    vi.spyOn(performanceClient, "getReleaseRegression").mockResolvedValue(
      performanceClient.getTestFixtureReleaseRegression(),
    );
    vi.spyOn(performanceClient, "getExportComparison").mockResolvedValue(
      performanceClient.getTestFixtureExportComparison(),
    );
    vi.spyOn(performanceClient, "getSessionRollups").mockResolvedValue(
      performanceClient.getTestFixtureSessionRollups(),
    );
    vi.spyOn(performanceClient, "getPreviewComparison").mockResolvedValue({
      workloadMode: "playback",
      totalSampleSize: 0,
      totalApiSamples: 0,
      totalMeasuredFrames: 0,
      sourceCounts: { frontendSpan: 0, nativeSample: 0, sessionRollup: 0, legacy: 0 },
      cohorts: [],
    });
    vi.spyOn(performanceClient, "getBenchmarkSuites").mockResolvedValue({
      suites: [
        {
          suiteId: "test-suite-4k",
          name: "4K 60fps HEVC Cadence",
          description: "High stress playback test",
          targetResolution: "4k",
          targetFps: 60,
          testCasesCount: 4,
        },
      ],
    });
  });

  const renderDashboard = () =>
    render(
      <MemoryRouter>
        <PerformanceAdminDashboard />
      </MemoryRouter>,
    );

  it("renders top header, admin badges, and metric summary ribbon", async () => {
    renderDashboard();

    expect(
      screen.getByText("Production Performance & Telemetry Intelligence"),
    ).toBeInTheDocument();
    expect(screen.getByText("Admin Console")).toBeInTheDocument();
    expect(screen.getByText("Live Ingestion Active")).toBeInTheDocument();
    expect(screen.getByText("Total Ingested Sessions")).toBeInTheDocument();
    expect(screen.getByText("Global P95 Render Time")).toBeInTheDocument();
  });

  it("renders production telemetry transparency and zero PII notice", async () => {
    renderDashboard();

    expect(screen.getByText("Zero PII Policy")).toBeInTheDocument();
    expect(
      screen.getByText(/in development and production environments/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Zero video files, media content/i),
    ).toBeInTheDocument();
  });

  it("renders cross-OS table and switches to Edge Cases sub-tab", async () => {
    renderDashboard();

    // Verify OS matrix is visible
    expect(
      screen.getByText("Cross-OS Latency & Frame Pacing Matrix"),
    ).toBeInTheDocument();

    // Click Edge Cases tab
    const edgeCasesTab = screen.getByRole("button", { name: /Edge Cases/i });
    fireEvent.click(edgeCasesTab);

    expect(
      await screen.findByText(
        /Surfaced Production Edge Cases & Hardware Regressions/i,
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Intel Iris Xe with 4K HEVC/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Root Cause Hypothesis:/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Suggested Mitigation:/i).length).toBeGreaterThanOrEqual(1);
  });

  it("switches to GPU & Bottlenecks sub-tab", async () => {
    renderDashboard();

    const hardwareTab = screen.getByRole("button", { name: /GPU & Bottlenecks/i });
    fireEvent.click(hardwareTab);

    expect(
      await screen.findByText(
        /GPU Architecture Performance & Primary Bottleneck/i,
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("Apple M3 Pro")).toBeInTheDocument();
    expect(await screen.findByText("NVIDIA GeForce RTX 4070")).toBeInTheDocument();
  });

  it("switches to Export Pipeline sub-tab and renders throughput & RTF", async () => {
    renderDashboard();

    const exportsTab = screen.getByRole("button", { name: /Export Pipeline/i });
    fireEvent.click(exportsTab);

    expect(
      await screen.findByText(/Hardware Architecture Export Throughput & Pipeline Split/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Global Export Throughput")).toBeInTheDocument();
    expect(screen.getByText("Real-Time Factor (RTF)")).toBeInTheDocument();
  });

  it("switches to A/V Sync & Rollups sub-tab and renders drift metrics", async () => {
    renderDashboard();

    const sessionsTab = screen.getByRole("button", { name: /A\/V Sync & Rollups/i });
    fireEvent.click(sessionsTab);

    expect(
      await screen.findByText(/Dual-Tier Precision Accumulation Architecture/i),
    ).toBeInTheDocument();
    expect(screen.getByText("P95 A/V Playhead Drift")).toBeInTheDocument();
    expect(screen.getByText("Pacing Jank Events / Session")).toBeInTheDocument();
  });

  it("switches to Hardware Fallbacks sub-tab", async () => {
    renderDashboard();

    const fallbacksTab = screen.getByRole("button", { name: /Hardware Fallbacks/i });
    fireEvent.click(fallbacksTab);

    expect(
      await screen.findByText(/Hardware Fallback Transitions in Production/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/webgpu -> webgl2/i)).toBeInTheDocument();
  });

  it("switches to Benchmark Manifests sub-tab", async () => {
    renderDashboard();

    const suitesTab = screen.getByRole("button", { name: /Benchmark Manifests/i });
    fireEvent.click(suitesTab);

    expect(
      await screen.findByText(/Standard Synthetic Benchmark Manifests/i),
    ).toBeInTheDocument();
  });

  it("links to the dedicated Preview Paths API page", async () => {
    renderDashboard();

    expect(screen.getByRole("link", { name: /Preview Paths/i })).toHaveAttribute(
      "href",
      "/studio/admin/performance/preview",
    );
  });
});
