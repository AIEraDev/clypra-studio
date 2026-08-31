import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, Database, Eye, RefreshCw } from "lucide-react";
import {
  performanceClient,
  type PreviewComparisonCohort,
  type PreviewComparisonData,
} from "../../services/performanceClient";

export function PreviewPerformanceAdminPage() {
  const [workload, setWorkload] = useState("playback");
  const [scenario, setScenario] = useState<"all" | "playback" | "seek" | "scrub" | "paused-interaction" | "qualification">("all");
  const [path, setPath] = useState<"all" | "native" | "webview">("all");
  const [environment, setEnvironment] = useState<"all" | "development" | "production">("all");
  const [source, setSource] = useState<"all" | "frontend-span" | "native-sample" | "session-rollup">("all");
  const [data, setData] = useState<PreviewComparisonData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    const next = await performanceClient.getPreviewComparison(workload, {
      scenario: scenario === "all" ? undefined : scenario,
      view: path === "all" ? undefined : path,
      runtimeEnvironment: environment === "all" ? undefined : environment,
      measurementSource: source === "all" ? undefined : source,
    });
    setData(next);
    setRefreshing(false);
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(interval);
  }, [workload, scenario, path, environment, source]);

  const summary = data ? summarizeVisibleCohorts(data.cohorts) : null;

  return (
    <div
      className="h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain"
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
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
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
              value={path}
              onChange={(event) => setPath(event.target.value as typeof path)}
              className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1.5 text-[11px] font-medium text-white focus:border-(--studio-accent) focus:outline-none"
              aria-label="Preview path"
            >
              <option value="all">Both paths</option>
              <option value="native">Native surface</option>
              <option value="webview">WebView canvas</option>
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
            <select
              value={environment}
              onChange={(event) => setEnvironment(event.target.value as typeof environment)}
              className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1.5 text-[11px] font-medium text-white focus:border-(--studio-accent) focus:outline-none"
              aria-label="Runtime environment"
            >
              <option value="all">All environments</option>
              <option value="development">Development</option>
              <option value="production">Production</option>
            </select>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as typeof source)}
              className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1.5 text-[11px] font-medium text-white focus:border-(--studio-accent) focus:outline-none"
              aria-label="Measurement source"
            >
              <option value="all">All sources</option>
              <option value="session-rollup">Session rollups</option>
              <option value="frontend-span">Frontend samples</option>
              <option value="native-sample">Native samples</option>
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
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={<Activity size={15} />} label="Measured frames" value={summary!.measuredFrames.toLocaleString()} detail={`${summary!.apiSamples.toLocaleString()} API observations`} />
              <MetricCard icon={<Database size={15} />} label="API observations" value={summary!.apiSamples.toLocaleString()} detail={`${summary!.sourceCounts.sessionRollup.toLocaleString()} rollups · ${summary!.sourceCounts.nativeSample.toLocaleString()} native · ${summary!.sourceCounts.frontendSpan.toLocaleString()} frontend · ${summary!.sourceCounts.legacy.toLocaleString()} legacy`} />
              <MetricCard icon={<AlertTriangle size={15} />} label="Dropped frames" value={summary!.droppedFrames.toLocaleString()} detail={`${(summary!.droppedFrames / Math.max(1, summary!.measuredFrames) * 100).toFixed(2)}% of measured frames`} />
              <MetricCard icon={<RefreshCw size={15} />} label="Last received" value={formatTimestamp(summary!.latestTimestampMs)} detail="Live API timestamp" />
            </section>
            <section className="overflow-hidden rounded-2xl border border-(--studio-border) bg-(--studio-panel) shadow-xl">
            <div className="flex items-center justify-between border-b border-(--studio-border) px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-white">Preview Path Comparison</h2>
                <p className="text-xs text-(--studio-muted)">{summary!.measuredFrames.toLocaleString()} measured frames from {summary!.apiSamples.toLocaleString()} API observations · refreshes every 15 seconds</p>
              </div>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Live
              </span>
            </div>
            <div className="min-w-0 overflow-x-auto overscroll-x-contain">
              <table className="min-w-[1450px] w-full text-left text-xs">
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
                        <div className="text-[10px]">{row.sampleCount.toLocaleString()} selected observations</div>
                        <div className="text-[10px]">{row.totalFrames.toLocaleString()} frames · {row.durationMs > 0 ? `${(row.durationMs / 1000).toFixed(1)}s` : "duration n/a"}</div>
                      </td>
                      <td className="px-5 py-3.5 text-white">
                        {(row.p50RenderTimeUs / 1000).toFixed(1)} / {(row.p95RenderTimeUs / 1000).toFixed(1)} / {(row.p99RenderTimeUs / 1000).toFixed(1)} ms
                      </td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">{(row.droppedFrameRatio * 100).toFixed(2)}%
                        <div className="text-[10px]">{row.droppedFrames} dropped · {row.staleFrames} stale · {row.cancelledFrames} cancelled</div>
                      </td>
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
          </>
        )}
      </main>
    </div>
  );
}

function summarizeVisibleCohorts(cohorts: PreviewComparisonCohort[]) {
  return cohorts.reduce(
    (summary, cohort) => {
      summary.measuredFrames += cohort.measuredFrameCount;
      summary.droppedFrames += cohort.droppedFrames;
      summary.apiSamples += Object.values(cohort.sourceCounts).reduce(
        (total, count) => total + count,
        0,
      );
      summary.sourceCounts.frontendSpan += cohort.sourceCounts.frontendSpan;
      summary.sourceCounts.nativeSample += cohort.sourceCounts.nativeSample;
      summary.sourceCounts.sessionRollup += cohort.sourceCounts.sessionRollup;
      summary.sourceCounts.legacy += cohort.sourceCounts.legacy;
      summary.latestTimestampMs = Math.max(
        summary.latestTimestampMs,
        cohort.latestTimestampMs ?? 0,
      );
      return summary;
    },
    {
      measuredFrames: 0,
      droppedFrames: 0,
      apiSamples: 0,
      latestTimestampMs: 0,
      sourceCounts: {
        frontendSpan: 0,
        nativeSample: 0,
        sessionRollup: 0,
        legacy: 0,
      },
    },
  );
}

function MetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <section className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) px-4 py-3.5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
        <span className="text-sky-400">{icon}</span>{label}
      </div>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] text-(--studio-muted)">{detail}</p>
    </section>
  );
}

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
