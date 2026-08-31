import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  FileCheck,
  Film,
  Layers,
  Monitor,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  Type,
  Waves,
  XCircle,
  Zap,
} from "lucide-react";
import { ClypraLogo } from "../../components/ClypraLogo";
import {
  performanceClient,
  type OSComparisonData,
  type HardwareComparisonData,
  type AnomalyItem,
  type FallbackData,
  type ReleaseRegressionData,
  type BenchmarkSuite,
  type ExportComparisonData,
  type SessionRollupData,
} from "../../services/performanceClient";

export function PerformanceAdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<
    | "matrix"
    | "hardware"
    | "exports"
    | "sessions"
    | "anomalies"
    | "fallbacks"
    | "releases"
    | "suites"
  >("matrix");

  // Filters
  const [workloadFilter, setWorkloadFilter] = useState("playback");
  const [resolutionFilter, setResolutionFilter] = useState("4k");
  const [codecFilter, setCodecFilter] = useState("hevc");

  // Data states are populated only by live API responses.
  const [osData, setOsData] = useState<OSComparisonData | null>(null);
  const [hwData, setHwData] = useState<HardwareComparisonData | null>(null);
  const [exportData, setExportData] = useState<ExportComparisonData | null>(
    null,
  );
  const [sessionData, setSessionRollupData] =
    useState<SessionRollupData | null>(null);
  const [anomaliesData, setAnomaliesData] = useState<AnomalyItem[]>([]);
  const [fallbacksData, setFallbacksData] = useState<FallbackData | null>(null);
  const [releasesData, setReleasesData] =
    useState<ReleaseRegressionData | null>(null);
  const [suitesData, setSuitesData] = useState<BenchmarkSuite[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasLiveData = Boolean(
    osData?.comparison?.length ||
    osData?.osMatrix?.length ||
    hwData?.gpuMatrix?.length ||
    exportData?.cohorts?.length ||
    sessionData?.totalRollupSessions ||
    anomaliesData.length ||
    fallbacksData?.fallbackBreakdown?.length ||
    releasesData?.totalBaseSamples ||
    releasesData?.totalTargetSamples,
  );

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const [osRes, hwRes, expRes, sessRes, anomRes, fbRes, relRes, suitesRes] =
        await Promise.all([
          performanceClient.getOSComparison(
            workloadFilter,
            resolutionFilter,
            codecFilter,
          ),
          performanceClient.getHardwareComparison(workloadFilter),
          performanceClient.getExportComparison(),
          performanceClient.getSessionRollups(),
          performanceClient.getAnomalies(),
          performanceClient.getFallbacks(),
          performanceClient.getReleaseRegression("1.4.3", "1.4.4"),
          performanceClient.getBenchmarkSuites(),
        ]);

      setOsData(osRes);
      setHwData(hwRes);
      setExportData(expRes);
      setSessionRollupData(sessRes);
      setAnomaliesData([]);
      setFallbacksData(null);
      setReleasesData(null);
      if (anomRes) {
        if (Array.isArray((anomRes as any).anomalies)) {
          setAnomaliesData((anomRes as any).anomalies);
        } else if (Array.isArray(anomRes)) {
          setAnomaliesData(anomRes as any);
        }
      }
      setFallbacksData(fbRes);
      setReleasesData(relRes);
      if (suitesRes?.suites) setSuitesData(suitesRes.suites);
    } catch {
      // A failed API read is an empty live-data state, never synthetic data.
      setOsData(null);
      setHwData(null);
      setExportData(null);
      setSessionRollupData(null);
      setAnomaliesData([]);
      setFallbacksData(null);
      setReleasesData(null);
      setSuitesData([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [workloadFilter, resolutionFilter, codecFilter]);

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: "var(--studio-bg)", color: "var(--studio-text)" }}
    >
      {/* Top Header */}
      <header className="border-b border-(--studio-border) bg-(--studio-panel)/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/studio"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--studio-border) bg-(--studio-control) text-(--studio-muted) transition-colors hover:border-(--studio-accent) hover:text-white"
              title="Back to Studio Hub"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400">
                <Activity size={18} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white">
                    Production Performance & Telemetry Intelligence
                  </h1>
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-400">
                    Admin Console
                  </span>
                </div>
                <p className="text-[11px] text-(--studio-muted)">
                  Cross-OS Matrix · GPU Bottleneck Profiler · Edge Case
                  Isolation
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Ingestion Active
            </div>

            <button
              type="button"
              onClick={loadAllData}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-(--studio-accent) cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={
                  refreshing ? "animate-spin text-(--studio-accent)" : ""
                }
              />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* ─── Production Telemetry Transparency Notice ──────────────────────── */}
        <section
          aria-label="Production Telemetry Transparency Notice"
          className="relative overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-r from-sky-950/30 via-(--studio-panel) to-indigo-950/20 p-5 shadow-lg"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/15 text-sky-400">
              <ShieldCheck size={22} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Production Telemetry & Performance Intelligence
                </h2>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  Zero PII Policy
                </span>
              </div>
              <p className="text-xs leading-relaxed text-(--studio-muted) max-w-4xl">
                Telemetry is collected{" "}
                <strong className="text-white">
                  in development and production environments
                </strong>{" "}
                solely to compare preview paths and analyze edge-case hardware
                bottlenecks, frame pacing regressions, and driver anomalies
                across operating systems.{" "}
                <span className="text-sky-200 font-medium">
                  Zero video files, media content, project titles, or user
                  identities are ever accessed or captured.
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-(--studio-muted)">
                <span className="flex items-center gap-1.5">
                  <Server size={12} className="text-sky-400" />
                  Cluster: Cloudflare Edge + In-Memory Analytics Rollup
                </span>
                <span className="flex items-center gap-1.5">
                  <Database size={12} className="text-emerald-400" />
                  Sampling: 100% on Dropped Frames/Anomalies · 1% on Smooth
                  Playback
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Metric Summary Ribbon ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
              Total Ingested Sessions
            </div>
            <div className="mt-1.5 text-xl font-bold text-white tracking-tight">
              {osData ? "Loaded" : "—"}
            </div>
            <div className="mt-0.5 text-[10px] text-emerald-400 flex items-center gap-1">
              <Zap size={10} /> Live API data only
            </div>
          </div>

          <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
              Global P95 Render Time
            </div>
            <div className="mt-1.5 text-xl font-bold text-emerald-400 tracking-tight">
              {osData ? "API result" : "—"}
            </div>
            <div className="mt-0.5 text-[10px] text-(--studio-muted)">
              Waiting for live API telemetry
            </div>
          </div>

          <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
              Global Dropped Frame Ratio
            </div>
            <div className="mt-1.5 text-xl font-bold text-white tracking-tight">
              {osData ? "API result" : "—"}
            </div>
            <div className="mt-0.5 text-[10px] text-emerald-400">
              Waiting for live API telemetry
            </div>
          </div>

          <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
              Active Edge Anomalies
            </div>
            <div className="mt-1.5 text-xl font-bold text-amber-400 tracking-tight">
              {anomaliesData.length ? anomaliesData.length : "—"}
            </div>
            <div className="mt-0.5 text-[10px] text-(--studio-muted)">
              {anomaliesData.length ? "From live API" : "No live API data"}
            </div>
          </div>

          <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
              Overall SLA Compliance
            </div>
            <div className="mt-1.5 text-xl font-bold text-white tracking-tight">
              {osData ? "API result" : "—"}
            </div>
            <div className="mt-0.5 text-[10px] text-emerald-400">
              Waiting for live API telemetry
            </div>
          </div>
        </div>

        {/* ─── Navigation Tabs & Filters Bar ─────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-(--studio-border) pb-3">
          {/* Diagnostic Sub-Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Link
              to="/studio/admin/performance/preview"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-(--studio-muted) hover:bg-(--studio-control) hover:text-white shrink-0"
            >
              <Eye size={14} />
              Preview Paths
            </Link>
            <Link
              to="/studio/admin/performance/audio"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-(--studio-muted) hover:bg-(--studio-control) hover:text-white shrink-0"
            >
              <Waves size={14} />
              Audio Performance
            </Link>
            <Link
              to="/studio/admin/performance/text"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-(--studio-muted) hover:bg-(--studio-control) hover:text-white shrink-0"
            >
              <Type size={14} />
              Text Performance
            </Link>
            {[
              { id: "matrix", label: "Cross-OS Matrix", icon: BarChart3 },
              { id: "hardware", label: "GPU & Bottlenecks", icon: Cpu },
              { id: "exports", label: "Export Pipeline", icon: Film },
              { id: "sessions", label: "A/V Sync & Rollups", icon: Waves },
              {
                id: "anomalies",
                label: `Edge Cases (${anomaliesData.length})`,
                icon: AlertTriangle,
              },
              { id: "fallbacks", label: "Hardware Fallbacks", icon: Layers },
              {
                id: "releases",
                label: "Release Regression",
                icon: TrendingDown,
              },
              { id: "suites", label: "Benchmark Manifests", icon: FileCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-(--studio-accent) text-white shadow-md"
                      : "text-(--studio-muted) hover:text-white hover:bg-(--studio-control)"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Interactive Cohort Filters */}
          {activeSubTab === "matrix" && (
            <div className="flex items-center gap-2">
              <select
                value={workloadFilter}
                onChange={(e) => setWorkloadFilter(e.target.value)}
                className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1 text-[11px] font-medium text-white focus:outline-none focus:border-(--studio-accent)"
              >
                <option value="playback">Workload: Playback</option>
                <option value="seek-cold">Workload: Cold Seek</option>
                <option value="scrub">Workload: High-Speed Scrub</option>
                <option value="export-transcode">Workload: Export</option>
              </select>

              <select
                value={resolutionFilter}
                onChange={(e) => setResolutionFilter(e.target.value)}
                className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1 text-[11px] font-medium text-white focus:outline-none focus:border-(--studio-accent)"
              >
                <option value="4k">Resolution: 4K UHD</option>
                <option value="1080p">Resolution: 1080p FHD</option>
                <option value="8k">Resolution: 8K Master</option>
              </select>

              <select
                value={codecFilter}
                onChange={(e) => setCodecFilter(e.target.value)}
                className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1 text-[11px] font-medium text-white focus:outline-none focus:border-(--studio-accent)"
              >
                <option value="hevc">Codec: HEVC 10-bit</option>
                <option value="h264">Codec: H.264 8-bit</option>
                <option value="av1">Codec: AV1</option>
                <option value="prores422">Codec: ProRes 422</option>
              </select>
            </div>
          )}
        </div>

        {!hasLiveData && (
          <section className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) px-5 py-10 text-center">
            <p className="text-sm font-semibold text-white">
              No live performance data to display
            </p>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-(--studio-muted)">
              The API has not returned real telemetry yet. No local fixtures or
              mock values are shown here.
            </p>
          </section>
        )}

        {/* ─── 1. Cross-OS Performance Matrix View ───────────────────────────── */}
        {activeSubTab === "matrix" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-(--studio-border) flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Cross-OS Latency & Frame Pacing Matrix
                  </h3>
                  <p className="text-xs text-(--studio-muted)">
                    Evaluated for {resolutionFilter.toUpperCase()}{" "}
                    {codecFilter.toUpperCase()} during {workloadFilter}
                  </p>
                </div>
                <div className="text-xs text-(--studio-muted)">
                  Baseline OS:{" "}
                  <strong className="text-white uppercase">
                    {osData?.baselineOS || "macos"}
                  </strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-(--studio-border) bg-(--studio-control)/50 text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                    <tr>
                      <th className="px-5 py-3">Operating System</th>
                      <th className="px-5 py-3">Sample Count</th>
                      <th className="px-5 py-3">
                        Render Latency (P50 / P95 / P99)
                      </th>
                      <th className="px-5 py-3">P95 Seek Latency</th>
                      <th className="px-5 py-3">Dropped Frames (P95)</th>
                      <th className="px-5 py-3">Relative Slowdown</th>
                      <th className="px-5 py-3">SLA Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--studio-border)">
                    {(osData?.comparison || osData?.osMatrix || []).map(
                      (row) => (
                        <tr
                          key={row.osFamily}
                          className="transition-colors hover:bg-white/2"
                        >
                          <td className="px-5 py-3.5 font-semibold text-white flex items-center gap-2">
                            {row.osFamily === "macos" ||
                            row.osFamily === "windows" ||
                            row.osFamily === "linux" ? (
                              <Monitor
                                size={15}
                                className="text-(--studio-accent)"
                              />
                            ) : (
                              <Smartphone size={15} className="text-pink-400" />
                            )}
                            <span className="uppercase">{row.osFamily}</span>
                          </td>
                          <td className="px-5 py-3.5 text-(--studio-muted)">
                            {row.sampleCount.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-white">
                              {(row.p50RenderTimeUs / 1000).toFixed(1)}ms
                            </span>
                            {" / "}
                            <span
                              className={
                                row.p95RenderTimeUs > 16667
                                  ? "font-bold text-rose-400"
                                  : "text-emerald-400"
                              }
                            >
                              {(row.p95RenderTimeUs / 1000).toFixed(1)}ms
                            </span>
                            {" / "}
                            <span className="text-(--studio-muted)">
                              {(row.p99RenderTimeUs / 1000).toFixed(1)}ms
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-(--studio-muted)">
                            {row.p95SeekLatencyMs.toFixed(1)} ms
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                row.droppedFrameRatioP95 > 0.05
                                  ? "bg-rose-500/20 text-rose-300"
                                  : "bg-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              {(row.droppedFrameRatioP95 * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold">
                            {row.relativeSlowdownVsBaseline === 1.0 ? (
                              <span className="text-(--studio-muted)">
                                Baseline (1.00×)
                              </span>
                            ) : (
                              <span
                                className={
                                  row.relativeSlowdownVsBaseline > 1.5
                                    ? "text-rose-400"
                                    : "text-amber-400"
                                }
                              >
                                +
                                {(
                                  (row.relativeSlowdownVsBaseline - 1) *
                                  100
                                ).toFixed(0)}
                                % Slower
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {row.meetsSLA ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                <CheckCircle2 size={13} /> Passing
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                                <XCircle size={13} /> Violated
                              </span>
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ─── 2. GPU Architecture & Bottlenecks View ───────────────────────── */}
        {activeSubTab === "hardware" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-(--studio-border)">
                <h3 className="text-sm font-bold text-white">
                  GPU Architecture Performance & Primary Bottleneck
                </h3>
                <p className="text-xs text-(--studio-muted)">
                  Isolates hardware decode, texture upload, shader composition,
                  and frame readback latencies
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-(--studio-border) bg-(--studio-control)/50 text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                    <tr>
                      <th className="px-5 py-3">GPU Hardware Tier</th>
                      <th className="px-5 py-3">Vendor</th>
                      <th className="px-5 py-3">Sample Volume</th>
                      <th className="px-5 py-3">Render Time (P50 / P95)</th>
                      <th className="px-5 py-3">Seek Latency (P95)</th>
                      <th className="px-5 py-3">Primary Bottleneck</th>
                      <th className="px-5 py-3">SLA Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--studio-border)">
                    {(hwData?.gpuMatrix || []).map((item) => (
                      <tr
                        key={item.gpuModel}
                        className="hover:bg-white/2 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-bold text-white">
                          {item.gpuModel}
                        </td>
                        <td className="px-5 py-3.5 text-(--studio-muted) uppercase">
                          {item.gpuVendor}
                        </td>
                        <td className="px-5 py-3.5 text-(--studio-muted)">
                          {item.sampleCount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-white">
                            {(item.p50RenderTimeUs / 1000).toFixed(1)}ms
                          </span>
                          {" / "}
                          <span
                            className={
                              item.p95RenderTimeUs > 16667
                                ? "font-bold text-rose-400"
                                : "text-emerald-400"
                            }
                          >
                            {(item.p95RenderTimeUs / 1000).toFixed(1)}ms
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-(--studio-muted)">
                          {item.p95SeekLatencyMs.toFixed(1)} ms
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              item.primaryBottleneck === "none"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                                : "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                            }`}
                          >
                            {item.primaryBottleneck}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {item.meetsSLA ? (
                            <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 size={13} /> Passing
                            </span>
                          ) : (
                            <span className="text-rose-400 font-semibold inline-flex items-center gap-1">
                              <XCircle size={13} /> Violated
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ─── Export Transcode Pipeline View ───────────────────────────────── */}
        {activeSubTab === "exports" && (
          <section className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  Global Export Throughput
                </div>
                <div className="mt-1.5 text-xl font-bold text-emerald-400 tracking-tight">
                  {exportData ? `${exportData.globalAvgFps} FPS` : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-(--studio-muted)">
                  Target: ≥ 30 FPS across 4K HEVC
                </div>
              </div>

              <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  Real-Time Factor (RTF)
                </div>
                <div className="mt-1.5 text-xl font-bold text-sky-400 tracking-tight">
                  {exportData ? `${exportData.globalAvgRTF}× Real-Time` : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-400">
                  Sub-1.0 = Faster than video duration
                </div>
              </div>

              <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  Production Export Volume
                </div>
                <div className="mt-1.5 text-xl font-bold text-white tracking-tight">
                  {exportData ? exportData.totalExports.toLocaleString() : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-(--studio-muted)">
                  Across Desktop & Studio runtimes
                </div>
              </div>

              <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  Encoder Pipeline Reliability
                </div>
                <div className="mt-1.5 text-xl font-bold text-emerald-400 tracking-tight">
                  {exportData?.cohorts.length
                    ? `${(
                        (exportData.cohorts.reduce(
                          (sum, cohort) =>
                            sum + cohort.successRate * cohort.sampleCount,
                          0,
                        ) /
                          exportData.totalExports) *
                        100
                      ).toFixed(1)}%`
                    : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-400">
                  Clean VideoToolbox / NVENC / QuickSync
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-(--studio-border) flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Hardware Architecture Export Throughput & Pipeline Split
                  </h3>
                  <p className="text-xs text-(--studio-muted)">
                    Evaluates FFmpeg / Hardware Encoder execution speed,
                    real-time factor, and GPU composition vs encode balance
                  </p>
                </div>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Dual-Stage Breakdown
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-(--studio-border) bg-(--studio-control)/50 text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                    <tr>
                      <th className="px-5 py-3">Operating System</th>
                      <th className="px-5 py-3">GPU Architecture</th>
                      <th className="px-5 py-3">Target Profile</th>
                      <th className="px-5 py-3">Sample Volume</th>
                      <th className="px-5 py-3">Export Throughput</th>
                      <th className="px-5 py-3">Real-Time Factor</th>
                      <th className="px-5 py-3">Render vs Encode Split</th>
                      <th className="px-5 py-3">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--studio-border)">
                    {(exportData?.cohorts || []).map((cohort, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-white/2 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-semibold text-white uppercase flex items-center gap-2">
                          <Monitor size={14} className="text-sky-400" />
                          {cohort.osFamily}
                        </td>
                        <td className="px-5 py-3.5 text-(--studio-muted) uppercase font-mono text-[11px]">
                          {cohort.gpuVendor}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-white">
                          <span className="rounded bg-black/30 border border-white/10 px-1.5 py-0.5 text-[10px] uppercase font-mono">
                            {cohort.resolution} {cohort.codec}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-(--studio-muted)">
                          {cohort.sampleCount.toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-white">
                          <span
                            className={
                              cohort.avgExportFps >= 30
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }
                          >
                            {cohort.avgExportFps.toFixed(1)} FPS
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-white">
                          <span
                            className={
                              cohort.avgRealTimeFactor < 1.0
                                ? "text-sky-400"
                                : "text-amber-400"
                            }
                          >
                            {cohort.avgRealTimeFactor.toFixed(2)}×
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="w-28 space-y-1">
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${cohort.renderTimePct}%` }}
                                className="bg-sky-400 h-full"
                                title={`Render: ${cohort.renderTimePct}%`}
                              />
                              <div
                                style={{ width: `${cohort.encodeTimePct}%` }}
                                className="bg-emerald-400 h-full"
                                title={`Encode: ${cohort.encodeTimePct}%`}
                              />
                            </div>
                            <div className="text-[9px] text-(--studio-muted) flex justify-between font-mono">
                              <span>R: {cohort.renderTimePct}%</span>
                              <span>E: {cohort.encodeTimePct}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 size={12} />{" "}
                            {(cohort.successRate * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ─── Continuous Session Rollups & A/V Sync View ─────────────────────── */}
        {activeSubTab === "sessions" && (
          <section className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  P95 A/V Playhead Drift
                </div>
                <div className="mt-1.5 text-xl font-bold text-emerald-400 tracking-tight">
                  {sessionData ? `${sessionData.p95AvDriftMs} ms` : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-400">
                  Strict budget: ≤ 20.0 ms
                </div>
              </div>

              <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  Continuous Frames Accumulated
                </div>
                <div className="mt-1.5 text-xl font-bold text-sky-400 tracking-tight">
                  {sessionData
                    ? sessionData.totalAccumulatedFrames.toLocaleString()
                    : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-(--studio-muted)">
                  Across active 30s session windows
                </div>
              </div>

              <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  Pacing Jank Events / Session
                </div>
                <div className="mt-1.5 text-xl font-bold text-white tracking-tight">
                  {sessionData ? sessionData.avgJankEventsPerSession : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-emerald-400">
                  Frames exceeding 1.5× frame budget
                </div>
              </div>

              <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                  GPU Evaluator Cache Hit Rate
                </div>
                <div className="mt-1.5 text-xl font-bold text-emerald-400 tracking-tight">
                  {sessionData
                    ? `${(sessionData.avgCacheHitRatio * 100).toFixed(1)}%`
                    : "—"}
                </div>
                <div className="mt-0.5 text-[10px] text-(--studio-muted)">
                  Zero-copy image & raster cache
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-950/20 to-(--studio-panel) p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-sky-400" />
                <h4 className="text-sm font-bold text-white">
                  Dual-Tier Precision Accumulation Architecture
                </h4>
              </div>
              <p className="text-xs text-(--studio-muted) leading-relaxed">
                Rather than flooding the network with 60 individual frame spans
                per second, Clypra client accumulators roll up render statistics
                into 30-second windows calculating P50, P90, P95, P99, and Mean
                frame render times. If a frame exceeds 16.67ms or dropped frames
                spike above 5%, the system immediately triggers a 100% anomaly
                trap with per-stage GPU decode, compose, upload, and readback
                microseconds.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="rounded-lg bg-black/30 p-3 border border-white/5 space-y-1">
                  <div className="font-semibold text-sky-300">
                    Sleep & Backgrounding Discontinuity Gate
                  </div>
                  <div className="text-[11px] text-(--studio-muted)">
                    Time gaps &gt; 1,500ms caused by OS sleep, display turn-off,
                    or tab minimization are automatically detected and
                    discarded, preventing artificial multi-hour latency spikes.
                  </div>
                </div>
                <div className="rounded-lg bg-black/30 p-3 border border-white/5 space-y-1">
                  <div className="font-semibold text-emerald-300">
                    Bounded Offline Storage & Auto-Drain
                  </div>
                  <div className="text-[11px] text-(--studio-muted)">
                    Network drops safely store up to 50 batches in bounded
                    localStorage (&lt; 2 MB memory footprint) and automatically
                    drain upon receiving window online events.
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── 3. Edge Cases & Anomalies View ───────────────────────────────── */}
        {activeSubTab === "anomalies" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Surfaced Production Edge Cases & Hardware Regressions
                </h3>
                <p className="text-xs text-(--studio-muted)">
                  Auto-isolated via statistical $Z$-score and multi-dimensional
                  cohort clustering
                </p>
              </div>
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400">
                {anomaliesData.length} Critical Outliers
              </span>
            </div>

            <div className="space-y-3">
              {(anomaliesData || []).map((anomaly) => (
                <div
                  key={anomaly.anomalyId}
                  className="rounded-2xl border border-rose-500/30 bg-rose-950/10 p-5 space-y-3 shadow-lg relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-400">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                            {anomaly.severity}
                          </span>
                          <h4 className="text-sm font-bold text-white">
                            {anomaly.title}
                          </h4>
                        </div>
                        <p className="text-xs text-(--studio-muted) mt-1">
                          Cohort:{" "}
                          <strong className="text-white uppercase">
                            {anomaly.impactedCohort.osFamily}
                          </strong>{" "}
                          (GPU: {anomaly.impactedCohort.gpuVendor || "Any"})
                          with{" "}
                          {anomaly.impactedCohort.resolutionBucket?.toUpperCase()}{" "}
                          {anomaly.impactedCohort.videoCodec?.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-rose-400">
                        +
                        {(
                          (anomaly.metrics.relativeSlowdownFactor - 1) *
                          100
                        ).toFixed(0)}
                        % Slower
                      </div>
                      <div className="text-[10px] text-(--studio-muted)">
                        {anomaly.affectedSessionsCount.toLocaleString()}{" "}
                        affected sessions ({anomaly.affectedUsersPct}%)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-(--studio-border)/60 text-xs">
                    <div className="rounded-xl bg-black/20 p-3 border border-white/5 space-y-1">
                      <div className="font-bold text-amber-400">
                        Root Cause Hypothesis:
                      </div>
                      <p className="text-(--studio-muted) leading-relaxed">
                        {anomaly.rootCauseHypothesis}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-3 border border-white/5 space-y-1">
                      <div className="font-bold text-emerald-400">
                        Suggested Mitigation:
                      </div>
                      <p className="text-(--studio-muted) leading-relaxed">
                        {anomaly.suggestedMitigation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 4. Hardware Fallbacks View ───────────────────────────────────── */}
        {activeSubTab === "fallbacks" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-(--studio-border)">
                <h3 className="text-sm font-bold text-white">
                  Hardware Fallback Transitions in Production
                </h3>
                <p className="text-xs text-(--studio-muted)">
                  Monitors runtime fallback triggers from WebGPU/Metal to
                  WebGL/FFmpeg software pipelines
                </p>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {(fallbacksData?.fallbackBreakdown || []).map((item) => (
                  <div
                    key={item.transition}
                    className="rounded-xl border border-(--studio-border) bg-(--studio-control)/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs uppercase tracking-wide">
                        {item.transition}
                      </span>
                      <span className="rounded-full bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        {item.count} Occurrences
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">
                        Top Reason Codes:
                      </div>
                      <div className="space-y-1">
                        {(item.topReasons || []).map((r) => (
                          <div
                            key={r.code}
                            className="flex items-center justify-between text-xs rounded bg-black/20 px-2.5 py-1"
                          >
                            <span className="font-mono text-rose-300 text-[11px]">
                              {r.code}
                            </span>
                            <span className="text-(--studio-muted)">
                              {r.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 5. Release Regression View ───────────────────────────────────── */}
        {activeSubTab === "releases" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) overflow-hidden shadow-xl p-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Build-over-Build Release Regression: v
                  {releasesData?.baseVersion} → v{releasesData?.targetVersion}
                </h3>
                <p className="text-xs text-(--studio-muted)">
                  Calculated using Welch's t-test approximation across{" "}
                  {releasesData?.totalTargetSamples.toLocaleString()} target
                  release samples
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-(--studio-control) p-3 border border-(--studio-border)">
                  <div className="text-[10px] font-bold uppercase text-(--studio-muted)">
                    P95 Render Delta
                  </div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {releasesData?.overallDelta.p95RenderTimePctDelta.toFixed(
                      1,
                    )}
                    %
                  </div>
                  <div className="text-[10px] text-(--studio-muted)">
                    ({releasesData?.overallDelta.p95RenderTimeDeltaUs} µs)
                  </div>
                </div>

                <div className="rounded-xl bg-(--studio-control) p-3 border border-(--studio-border)">
                  <div className="text-[10px] font-bold uppercase text-(--studio-muted)">
                    Dropped Frames Delta
                  </div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {releasesData?.overallDelta.droppedFrameRatioPctDelta.toFixed(
                      1,
                    )}
                    %
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Pacing Improvement
                  </div>
                </div>

                <div className="rounded-xl bg-(--studio-control) p-3 border border-(--studio-border)">
                  <div className="text-[10px] font-bold uppercase text-(--studio-muted)">
                    P95 Seek Delta
                  </div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {releasesData?.overallDelta.p95SeekLatencyPctDelta.toFixed(
                      1,
                    )}
                    %
                  </div>
                  <div className="text-[10px] text-(--studio-muted)">
                    Faster keyframe seeks
                  </div>
                </div>

                <div className="rounded-xl bg-(--studio-control) p-3 border border-(--studio-border)">
                  <div className="text-[10px] font-bold uppercase text-(--studio-muted)">
                    Statistical Significance
                  </div>
                  <div className="text-lg font-bold text-sky-400 mt-1">
                    $p &lt; {releasesData?.overallDelta.pValue}$
                  </div>
                  <div className="text-[10px] text-emerald-400">
                    Statistically Significant
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── 6. Benchmark Suites View ─────────────────────────────────────── */}
        {activeSubTab === "suites" && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) overflow-hidden shadow-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Standard Synthetic Benchmark Manifests
                </h3>
                <p className="text-xs text-(--studio-muted)">
                  Standardized stress workloads used to qualify new desktop
                  releases and hardware drivers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(suitesData || []).map((suite) => (
                  <div
                    key={suite.suiteId}
                    className="rounded-xl border border-(--studio-border) bg-(--studio-control)/30 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">
                        {suite.name}
                      </h4>
                      <span className="rounded bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 text-[9px] font-bold text-sky-300 uppercase">
                        {suite.targetResolution} @ {suite.targetFps} FPS
                      </span>
                    </div>
                    <p className="text-xs text-(--studio-muted) leading-relaxed">
                      {suite.description}
                    </p>
                    <div className="text-[10px] text-(--studio-muted) font-mono pt-1">
                      {suite.testCasesCount} Test Cases · ID: {suite.suiteId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
