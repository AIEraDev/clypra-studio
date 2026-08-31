import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Check, Clipboard, Database, Download, RefreshCw, Type, Volume2, Video } from "lucide-react";
import { Link } from "react-router-dom";
import {
  performanceClient,
  type TextComparisonData,
  type TextPerformanceCohort,
  type AudioComparisonData,
  type PreviewComparisonData,
} from "../../services/performanceClient";

const kindLabel: Record<TextPerformanceCohort["kind"], string> = {
  plain: "Normal text",
  effect: "Text effect",
  template: "Text template",
};

export function TextPerformanceAdminPage() {
  const [kind, setKind] = useState<"all" | TextPerformanceCohort["kind"]>("all");
  const [path, setPath] = useState<"all" | TextPerformanceCohort["rendererPath"]>("all");
  const [phase, setPhase] = useState<"all" | TextPerformanceCohort["phase"]>("all");
  const [operation, setOperation] = useState<"all" | TextPerformanceCohort["operation"]>("all");
  const [environment, setEnvironment] = useState<"all" | TextPerformanceCohort["runtimeEnvironment"]>("all");
  const [data, setData] = useState<TextComparisonData | null>(null);
  const [related, setRelated] = useState<{
    audio: AudioComparisonData | null;
    preview: PreviewComparisonData | null;
  }>({ audio: null, preview: null });
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    const runtimeEnvironment = environment === "all" ? undefined : environment;
    const [text, audio, preview] = await Promise.all([
      performanceClient.getTextComparison({
        kind: kind === "all" ? undefined : kind,
        rendererPath: path === "all" ? undefined : path,
        phase: phase === "all" ? undefined : phase,
        operation: operation === "all" ? undefined : operation,
        environment: runtimeEnvironment,
      }),
      performanceClient.getAudioComparison({ environment: runtimeEnvironment }),
      performanceClient.getPreviewComparison("playback", {
        scenario: "playback",
        runtimeEnvironment,
      }),
    ]);
    setData(text);
    setRelated({ audio, preview });
    setRefreshing(false);
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [kind, path, phase, operation, environment]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    source: "live-api",
    filters: {
      kind,
      rendererPath: path,
      phase,
      operation,
      environment,
    },
    text: data,
    relatedPlaybackContext: related,
  };

  const exportJson = () => JSON.stringify(exportPayload, null, 2);

  const downloadJson = () => {
    const blob = new Blob([exportJson()], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clypra-text-performance-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const copyJson = async () => {
    const json = exportJson();
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      // Clipboard permissions can be unavailable in a desktop webview. Keep
      // Copy JSON useful with a short-lived, non-rendered textarea fallback.
      const textarea = document.createElement("textarea");
      textarea.value = json;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const cohorts = data?.cohorts ?? [];
  const renderCount = cohorts.reduce((sum, row) => sum + row.renderCount, 0);
  const latest = cohorts.reduce((value, row) => Math.max(value, row.latestTimestampMs || 0), 0);

  return (
    <div className="h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain" style={{ background: "var(--studio-bg)", color: "var(--studio-text)" }}>
      <header className="sticky top-0 z-30 border-b border-(--studio-border) bg-(--studio-panel)/80 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/studio/admin/performance" className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--studio-border) bg-(--studio-control) text-(--studio-muted)" aria-label="Back"><ArrowLeft size={16} /></Link>
            <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400"><Type size={17} /></span><div><h1 className="text-sm font-bold text-white">Text Performance</h1><p className="text-[11px] text-(--studio-muted)">Normal text, Studio effects, and Studio templates · live API data only</p></div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select label="Text kind" value={kind} onChange={(value) => setKind(value as typeof kind)} options={[["all", "All text kinds"], ["plain", "Normal text"], ["effect", "Text effects"], ["template", "Text templates"]]} />
            <Select label="Renderer path" value={path} onChange={(value) => setPath(value as typeof path)} options={[["all", "All renderer paths"], ["native-raster", "Native raster"], ["webview-canvas", "WebView canvas"], ["studio-preview", "Studio preview"]]} />
            <Select label="Phase" value={phase} onChange={(value) => setPhase(value as typeof phase)} options={[["all", "All phases"], ["session-prewarm", "Session prewarm"], ["text-prefetch", "Text prefetch"], ["visible-playback", "Visible playback"], ["interactive-preview", "Interactive preview"]]} />
            <Select label="Operation" value={operation} onChange={(value) => setOperation(value as typeof operation)} options={[["all", "All operations"], ["render", "Render"], ["prefetch", "Prefetch"], ["entrance", "Entrance"], ["animation", "Animation"], ["exit", "Exit"], ["content-edit", "Typing/content"], ["property-edit", "Style property"], ["transform", "Transform"], ["resize", "Resize"]]} />
            <Select label="Environment" value={environment} onChange={(value) => setEnvironment(value as typeof environment)} options={[["all", "All environments"], ["development", "Development"], ["production", "Production"]]} />
            <button type="button" onClick={() => void copyJson()} disabled={!data || refreshing} className="flex items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" title="Copy the current filtered live API data as JSON">{copied ? <Check size={13} /> : <Clipboard size={13} />} {copied ? "Copied" : "Copy JSON"}</button>
            <button type="button" onClick={downloadJson} disabled={!data || refreshing} className="flex items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" title="Download the current filtered live API data as JSON"><Download size={13} /> Download JSON</button>
            <button type="button" onClick={() => void refresh()} disabled={refreshing} className="flex items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"><RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 px-6 py-8">
        <section className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-5"><h2 className="text-sm font-bold text-white">What this measures</h2><p className="mt-1.5 max-w-5xl text-xs leading-relaxed text-(--studio-muted)">Every row is a real bounded API window. Normal text, text effects, and templates are grouped separately, then split by Native raster, WebView canvas, or Studio preview. Stage values show where time is spent: font wait, compile, raster, readback, transfer, and paint.</p></section>
        {!data ? <EmptyState text="The performance API is unavailable. No local or mock values are shown." /> : cohorts.length === 0 ? <EmptyState text="No real text telemetry matches these filters yet. Render text, an effect, or a template in Clypra, then refresh." /> : <>
          <section className="grid gap-3 sm:grid-cols-3"><Metric icon={<Type size={15} />} label="Text renders" value={renderCount.toLocaleString()} detail={`${data.totalWindows.toLocaleString()} API windows`} /><Metric icon={<Database size={15} />} label="API observations" value={data.totalApiSamples.toLocaleString()} detail="deduplicated live windows" /><Metric icon={<RefreshCw size={15} />} label="Last received" value={latest ? new Date(latest).toLocaleTimeString() : "—"} detail="live API timestamp" /></section>
          <RelatedPerformance audio={related.audio} preview={related.preview} />
          <section className="overflow-hidden rounded-2xl border border-(--studio-border) bg-(--studio-panel)"><div className="border-b border-(--studio-border) px-5 py-4"><h2 className="text-sm font-bold text-white">Text rendering comparison</h2><p className="text-xs text-(--studio-muted)">{data.totalWindows.toLocaleString()} real windows · completed interactions are separate cohorts · SLA target is total P95 ≤16.67 ms</p></div><div className="min-w-0 overflow-x-auto"><table className="min-w-[1700px] w-full text-left text-xs"><thead className="border-b border-(--studio-border) text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)"><tr>{["Text kind / path", "Environment / phase", "Operation / property", "Windows / renders", "Total P50 / P95 / P99", "Stage P95 (ms)", "Cache hit", "Bottleneck", "Confidence / SLA"].map((heading) => <th key={heading} className="px-5 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-(--studio-border)">{cohorts.map((row) => <tr key={`${row.kind}-${row.rendererPath}-${row.runtimeEnvironment}-${row.phase}-${row.operation}-${row.property || "none"}`}><td className="px-5 py-4"><strong className="text-white">{kindLabel[row.kind]}</strong><div className="text-(--studio-muted)">{row.rendererPath}</div></td><td className="px-5 py-4 text-(--studio-muted)">{row.runtimeEnvironment}<br />{row.phase}</td><td className="px-5 py-4 text-(--studio-muted)">{row.operation}<br />{row.property || "—"}</td><td className="px-5 py-4 text-white">{row.sampleCount} windows<br /><span className="text-(--studio-muted)">{row.renderCount.toLocaleString()} renders</span></td><td className="px-5 py-4 font-semibold text-white">{ms(row.p50RenderTimeUs)} / {ms(row.p95RenderTimeUs)} / {ms(row.p99RenderTimeUs)}</td><td className="px-5 py-4 text-(--studio-muted)">Font {ms(row.p95FontWaitUs)} · Compile {ms(row.p95CompileUs)}<br />Raster {ms(row.p95RasterUs)} · Readback {ms(row.p95ReadbackUs)}<br />Transfer {ms(row.p95TransferUs)} · Paint {ms(row.p95PaintUs)}</td><td className="px-5 py-4 text-white">{(row.cacheHitRatio * 100).toFixed(1)}%</td><td className="px-5 py-4 font-semibold text-amber-200">{row.bottleneck}</td><td className={row.meetsSLA ? "px-5 py-4 font-semibold text-emerald-300" : "px-5 py-4 font-semibold text-rose-300"}><div>{row.confidence === "qualified" ? "Qualified" : row.confidence === "preliminary" ? "Preliminary" : "Insufficient data"}</div><div>{row.meetsSLA ? "Passing" : "Investigate"}</div></td></tr>)}</tbody></table></div></section>
        </>}
      </main>
    </div>
  );
}

function ms(value: number) { return `${(value / 1000).toFixed(2)} ms`; }
function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">{icon}{label}</div><div className="mt-2 text-2xl font-bold text-white">{value}</div><div className="mt-1 text-xs text-(--studio-muted)">{detail}</div></div>; }
function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: Array<[T, string]> }) { return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as T)} className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1.5 text-[11px] text-white">{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-(--studio-border) p-12 text-center text-sm text-(--studio-muted)">{text}</div>; }

function RelatedPerformance({
  audio,
  preview,
}: {
  audio: AudioComparisonData | null;
  preview: PreviewComparisonData | null;
}) {
  const audioRows = audio?.cohorts ?? [];
  const previewRows = preview?.cohorts ?? [];
  if (audioRows.length === 0 && previewRows.length === 0) return null;

  const audioP95 = audioRows.length > 0
    ? Math.max(...audioRows.map((row) => row.callbackP95Us))
    : null;
  const underruns = audioRows.reduce((sum, row) => sum + row.underruns, 0);
  const native = previewRows.find((row) => row.view === "native");
  const webview = previewRows.find((row) => row.view === "webview");

  return (
    <section className="rounded-2xl border border-sky-500/20 bg-sky-950/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Cross-system playback context</h2>
          <p className="mt-1 text-xs text-(--studio-muted)">
            Live API playback cohorts help distinguish a text bottleneck from a shared audio or preview stall.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-300">No synthetic values</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ContextCard
          icon={<Type size={15} />}
          label="Text"
          value="See rows below"
          detail="font, raster, readback, transfer, and paint"
        />
        <ContextCard
          icon={<Volume2 size={15} />}
          label="Audio"
          value={audioP95 === null ? "No data" : `${ms(audioP95)} callback P95`}
          detail={audioP95 === null ? "No audio playback cohort for this environment" : `${underruns} underruns in returned cohorts`}
        />
        <ContextCard
          icon={<Video size={15} />}
          label="Preview"
          value={native || webview ? "Native + WebView" : "No data"}
          detail={previewDetail(native, webview)}
        />
      </div>
    </section>
  );
}

function previewDetail(
  native: PreviewComparisonData["cohorts"][number] | undefined,
  webview: PreviewComparisonData["cohorts"][number] | undefined,
) {
  const parts = [
    native ? `Native ${ms(native.p95RenderTimeUs)}` : "Native —",
    webview ? `WebView ${ms(webview.p95RenderTimeUs)}` : "WebView —",
  ];
  return parts.join(" · ");
}

function ContextCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-(--studio-border) bg-(--studio-panel) p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">{icon}{label}</div><div className="mt-2 text-sm font-semibold text-white">{value}</div><div className="mt-1 text-[11px] leading-relaxed text-(--studio-muted)">{detail}</div></div>;
}

export default TextPerformanceAdminPage;
