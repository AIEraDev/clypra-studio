import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, RefreshCw } from "lucide-react";
import {
  performanceClient,
  type PreviewComparisonData,
} from "../../services/performanceClient";

export function PreviewPerformanceAdminPage() {
  const [workload, setWorkload] = useState("playback");
  const [data, setData] = useState<PreviewComparisonData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    const next = await performanceClient.getPreviewComparison(workload);
    setData(next);
    setRefreshing(false);
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(interval);
  }, [workload]);

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
                <p className="text-xs text-(--studio-muted)">{data.totalSampleSize.toLocaleString()} API samples · refreshes every 15 seconds</p>
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
                    <th className="px-5 py-3">Environment</th>
                    <th className="px-5 py-3">Samples</th>
                    <th className="px-5 py-3">Render P50 / P95 / P99</th>
                    <th className="px-5 py-3">Dropped P95</th>
                    <th className="px-5 py-3">Readback / Present P95</th>
                    <th className="px-5 py-3">Jank</th>
                    <th className="px-5 py-3">SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--studio-border)">
                  {data.cohorts.map((row) => (
                    <tr key={`${row.view}-${row.surface}-${row.runtimeEnvironment}`} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {row.view === "native" ? "Native surface" : "WebView / DOM canvas"}
                        <div className="text-[10px] font-normal text-(--studio-muted)">{row.surface}</div>
                      </td>
                      <td className="px-5 py-3.5 uppercase text-(--studio-muted)">{row.runtimeEnvironment}</td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">{row.sampleCount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-white">
                        {(row.p50RenderTimeUs / 1000).toFixed(1)} / {(row.p95RenderTimeUs / 1000).toFixed(1)} / {(row.p99RenderTimeUs / 1000).toFixed(1)} ms
                      </td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">{(row.droppedFrameRatioP95 * 100).toFixed(2)}%</td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">
                        {(row.p95ReadbackUs / 1000).toFixed(1)} / {(row.p95PresentUs / 1000).toFixed(1)} ms
                      </td>
                      <td className="px-5 py-3.5 text-(--studio-muted)">{row.jankEvents.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={row.meetsSLA ? "text-emerald-400" : "text-rose-400"}>
                          {row.meetsSLA ? "Passing" : "Violated"}
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

function EmptyState({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) px-5 py-16 text-center">
      <p className="text-sm font-semibold text-white">No performance data to display</p>
      <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-(--studio-muted)">{message}</p>
    </section>
  );
}

export default PreviewPerformanceAdminPage;
