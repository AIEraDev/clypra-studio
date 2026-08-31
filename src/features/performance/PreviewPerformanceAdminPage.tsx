import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, RefreshCw } from "lucide-react";
import {
  performanceClient,
  type PreviewComparisonCohort,
  type PreviewComparisonData,
} from "../../services/performanceClient";

export function PreviewPerformanceAdminPage() {
  const [workload, setWorkload] = useState("playback");
  const [scenario, setScenario] = useState<"all" | "playback" | "seek" | "scrub" | "paused-interaction" | "qualification">("all");
  const [data, setData] = useState<PreviewComparisonData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    const next = await performanceClient.getPreviewComparison(workload, {
      scenario: scenario === "all" ? undefined : scenario,
    });
    setData(next);
    setRefreshing(false);
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(interval);
  }, [workload, scenario]);

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: "var(--studio-bg)", color: "var(--studio-text)" }}
    >
      <header className="sticky top-0 z-30 border-b border-(--studio-border) bg-(--studio-panel)/80 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/studio/admin/performance"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--studio-border) bg-(--studio-control) text-(--studio-muted) hover:border-(--studio-accent) hover:text-white"
              title="Back to Performance Intelligence"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
                <Eye size={18} />
              </span>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white">
                  Program Preview Performance
                </h1>
                <p className="text-[11px] text-(--studio-muted)">
                  WebView readback versus Native surface · live API data only
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={workload}
              onChange={(event) => setWorkload(event.target.value)}
              className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1.5 text-[11px] font-medium text-white focus:border-(--studio-accent) focus:outline-none"
            >
              <option value="playback">Playback</option>
              <option value="scrub">Scrub</option>
              <option value="frame-step">Frame step</option>
            </select>
            <select
              value={scenario}
              onChange={(event) => setScenario(event.target.value as typeof scenario)}
              className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1.5 text-[11px] font-medium text-white focus:border-(--studio-accent) focus:outline-none"
              aria-label="Preview scenario"
            >
              <option value="all">All scenarios</option>
              <option value="playback">Continuous playback</option>
              <option value="qualification">Qualification run</option>
              <option value="seek">Seek</option>
              <option value="scrub">Scrub</option>
              <option value="paused-interaction">Paused interaction</option>
            </select>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-3 py-1.5 text-xs font-semibold text-white hover:border-(--studio-accent) disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-6 py-8">
        <section className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-5">
          <h2 className="text-sm font-bold text-white">What this compares</h2>
          <p className="mt-1.5 max-w-4xl text-xs leading-relaxed text-(--studio-muted)">
            Each cohort is tagged by the actual presentation path and build environment. WebView means the frame was read back and painted into the DOM canvas; Native means it was presented by the native child surface. Values below come from the API, not local fixtures.
          </p>
        </section>

        {!data ? (
          <EmptyState message="The performance API is unavailable right now. No local or mock values are shown." />
        ) : data.cohorts.length === 0 ? (
          <EmptyState message="No real tagged preview samples have reached the API yet. Run the same timeline through both paths, then refresh." />
        ) : (
          <section className="overflow-hidden rounded-2xl border border-(--studio-border) bg-(--studio-panel) shadow-xl">
            <div className="flex items-center justify-between border-b border-(--studio-border) px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-white">Preview Path Comparison</h2>
                <p className="text-xs text-(--studio-muted)">{data.totalSampleSize.toLocaleString()} measured frames · refreshes every 15 seconds</p>
              </div>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Live
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-(--studio-border) bg-(--studio-control)/50 text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  <tr>
                    <th className="px-5 py-3">Path</th>
                    <th className="px-5 py-3">Environment / scenario</th>
                    <th className="px-5 py-3">Frames / samples</th>
                    <th className="px-5 py-3">Render P50 / P95 / P99</th>
                    <th className="px-5 py-3">Dropped ratio</th>
                    <th className="px-5 py-3">Stage P95</th>
                    <th className="px-5 py-3">Readback / transfer / paint</th>
                    <th className="px-5 py-3">Jank</th>
                    <th className="px-5 py-3">Confidence / SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--studio-border)">
                  {data.cohorts.map((row) => (
                    <tr key={`${row.view}-${row.surface}-${row.runtimeEnvironment}-${row.scenario ?? "unknown"}-${row.qualificationRunId ?? ""}`} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {row.view === "native" ? "Native surface" : "WebView / DOM canvas"}
                        <div className="text-[10px] font-normal text-(--studio-muted)">{row.surface}</div>
                      </td>
                      <td className="px-5 py-3.5 uppercase text-(--studio-muted)">
                        {row.runtimeEnvironment}
                        <div className="normal-case text-[10px]">{scenarioLabel(row.scenario)}</div>
                        {row.qualificationRunId ? <div className="normal-case text-[10px] text-sky-300">Run {row.qualificationRunId.slice(0, 12)}</div> : null}
                      </td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">
                        {row.measuredFrameCount.toLocaleString()}
                        <div className="text-[10px]">{row.sampleCount.toLocaleString()} API samples</div>
                      </td>
                      <td className="px-5 py-3.5 text-white">
                        {(row.p50RenderTimeUs / 1000).toFixed(1)} / {(row.p95RenderTimeUs / 1000).toFixed(1)} / {(row.p99RenderTimeUs / 1000).toFixed(1)} ms
                      </td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">{(row.droppedFrameRatio * 100).toFixed(2)}%</td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">
                        {row.primaryBottleneck === "none" ? "None" : `${stageLabel(row.primaryBottleneck)} ${(stageValue(row) / 1000).toFixed(1)} ms`}
                        <div className="whitespace-nowrap text-[10px]">Decode {(row.p95DecodeUs / 1000).toFixed(1)} · Compose {(row.p95ComposeUs / 1000).toFixed(1)} · GPU wait {(row.p95GpuQueueWaitUs / 1000).toFixed(1)} ms</div>
                      </td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">
                        {(row.p95ReadbackUs / 1000).toFixed(1)} / {(row.p95TransferUs / 1000).toFixed(1)} / {(row.p95CanvasPaintUs / 1000).toFixed(1)} ms
                        <div className="text-[10px]">Native present: {(row.p95PresentUs / 1000).toFixed(1)} ms</div>
                      </td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">{row.jankEvents.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{confidenceLabel(row.confidence)}</div>
                        <span className={row.confidence === "insufficient" ? "text-amber-300" : row.meetsSLA ? "text-emerald-400" : "text-rose-400"}>
                          {row.confidence === "insufficient" ? "Not qualified" : row.meetsSLA ? "Passing" : "Violated"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function scenarioLabel(scenario?: PreviewComparisonCohort["scenario"]): string {
  if (!scenario) return "Legacy / unspecified scenario";
  return scenario.replaceAll("-", " ");
}

function confidenceLabel(confidence?: PreviewComparisonCohort["confidence"]): string {
  if (confidence === "qualified") return "Qualified comparison";
  if (confidence === "preliminary") return "Preliminary";
  return "Insufficient data";
}

function stageLabel(stage: PreviewComparisonCohort["primaryBottleneck"]): string {
  return stage.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function stageValue(row: PreviewComparisonCohort): number {
  const values: Record<string, number> = {
    decode: row.p95DecodeUs,
    decoderMutexWait: row.p95DecoderMutexWaitUs,
    conversionUpload: row.p95ConversionUploadUs,
    compose: row.p95ComposeUs,
    surfaceAcquire: row.p95SurfaceAcquireUs,
    gpuQueueWait: row.p95GpuQueueWaitUs,
    readback: row.p95ReadbackUs,
    transfer: row.p95TransferUs,
    canvasPaint: row.p95CanvasPaintUs,
    submitPresent: row.p95PresentUs,
    schedulerWait: row.p95SchedulerWaitUs,
    ipcWait: row.p95IpcWaitUs,
  };
  return values[row.primaryBottleneck] || 0;
}

function EmptyState({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) px-5 py-16 text-center">
      <p className="text-sm font-semibold text-white">No performance data to display</p>
      <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-(--studio-muted)">{message}</p>
    </section>
  );
}

export default PreviewPerformanceAdminPage;
