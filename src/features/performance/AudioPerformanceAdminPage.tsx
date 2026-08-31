import { useEffect, useState, type ReactNode } from "react";
import { Activity, AlertTriangle, ArrowLeft, Database, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { performanceClient, type AudioComparisonData, type AudioPerformanceCohort } from "../../services/performanceClient";

export function AudioPerformanceAdminPage() {
  const [backend, setBackend] = useState<"all" | AudioPerformanceCohort["backend"]>("all");
  const [environment, setEnvironment] = useState<"all" | "development" | "production">("all");
  const [data, setData] = useState<AudioComparisonData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    setData(await performanceClient.getAudioComparison({
      backend: backend === "all" ? undefined : backend,
      environment: environment === "all" ? undefined : environment,
    }));
    setRefreshing(false);
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [backend, environment]);

  const cohorts = data?.cohorts ?? [];
  const callbackCount = cohorts.reduce((sum, cohort) => sum + cohort.callbackCount, 0);
  const underruns = cohorts.reduce((sum, cohort) => sum + cohort.underruns, 0);
  const latest = cohorts.reduce((value, cohort) => Math.max(value, cohort.latestTimestampMs || 0), 0);

  return (
    <div className="h-[100dvh] max-h-[100dvh] min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain" style={{ background: "var(--studio-bg)", color: "var(--studio-text)" }}>
      <header className="sticky top-0 z-30 border-b border-(--studio-border) bg-(--studio-panel)/80 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/studio/admin/performance" className="flex h-8 w-8 items-center justify-center rounded-lg border border-(--studio-border) bg-(--studio-control) text-(--studio-muted)" aria-label="Back"><ArrowLeft size={16} /></Link>
            <div><h1 className="text-sm font-bold text-white">Audio Performance</h1><p className="text-[11px] text-(--studio-muted)">Native CPAL versus Web Audio · live API data only</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={backend} onChange={(event) => setBackend(event.target.value as typeof backend)} className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1.5 text-[11px] text-white" aria-label="Audio backend">
              <option value="all">Both backends</option><option value="native-cpal">Native CPAL</option><option value="web-audio">Web Audio</option>
            </select>
            <select value={environment} onChange={(event) => setEnvironment(event.target.value as typeof environment)} className="rounded-lg border border-(--studio-border) bg-(--studio-control) px-2.5 py-1.5 text-[11px] text-white" aria-label="Runtime environment">
              <option value="all">All environments</option><option value="development">Development</option><option value="production">Production</option>
            </select>
            <button type="button" onClick={() => void refresh()} disabled={refreshing} className="flex items-center gap-1.5 rounded-lg border border-(--studio-border) bg-(--studio-control) px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"><RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 px-6 py-8">
        <section className="rounded-2xl border border-sky-500/25 bg-sky-950/20 p-5"><h2 className="text-sm font-bold text-white">What this measures</h2><p className="mt-1.5 max-w-4xl text-xs leading-relaxed text-(--studio-muted)">Audio is sampled in five-second windows away from the real-time callback. Callback cost, mixer contention, buffer misses, underruns, seek response, and audio-clock drift are aggregated by actual backend. No idle windows or synthetic values are shown.</p></section>
        {!data ? <EmptyState text="The performance API is unavailable. No local or mock values are shown." /> : cohorts.length === 0 ? <EmptyState text="No real audio telemetry has reached the API yet. Play audio in the editor, then refresh." /> : <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={<Activity size={15} />} label="Telemetry windows" value={data.totalWindows.toLocaleString()} detail={`${data.totalApiSamples.toLocaleString()} API observations`} /><Metric icon={<Database size={15} />} label="Audio callbacks" value={callbackCount.toLocaleString()} detail="measured callback work" /><Metric icon={<AlertTriangle size={15} />} label="Underruns" value={underruns.toLocaleString()} detail="mixer contention/output gaps" /><Metric icon={<RefreshCw size={15} />} label="Last received" value={latest ? new Date(latest).toLocaleTimeString() : "—"} detail="live API timestamp" /></section>
          <section className="overflow-hidden rounded-2xl border border-(--studio-border) bg-(--studio-panel)"><div className="border-b border-(--studio-border) px-5 py-4"><h2 className="text-sm font-bold text-white">Audio backend comparison</h2><p className="text-xs text-(--studio-muted)">{data.totalWindows.toLocaleString()} real five-second windows · refreshes every 15 seconds</p></div><div className="min-w-0 overflow-x-auto"><table className="min-w-[1250px] w-full text-left text-xs"><thead className="border-b border-(--studio-border) text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)"><tr>{["Backend / environment", "Windows", "Audio work P50 / P95 / P99", "Underruns", "Buffer hit", "Stage P95", "Seek / drift", "Bottleneck", "SLA"].map((heading) => <th key={heading} className="px-5 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-(--studio-border)">{cohorts.map((cohort) => <tr key={`${cohort.backend}-${cohort.runtimeEnvironment}`}><td className="px-5 py-4"><strong className="text-white">{cohort.backend === "native-cpal" ? "Native CPAL" : "Web Audio"}</strong><div className="text-(--studio-muted)">{cohort.runtimeEnvironment}</div></td><td className="px-5 py-4 text-white">{cohort.sampleCount}</td><td className="px-5 py-4 text-white">{fmt(cohort.callbackP50Us)} / {fmt(cohort.callbackP95Us)} / {fmt(cohort.callbackP99Us)} ms</td><td className="px-5 py-4"><strong className={cohort.underruns ? "text-rose-300" : "text-white"}>{cohort.underruns.toLocaleString()}</strong><div className="text-(--studio-muted)">{cohort.mixerLockMisses.toLocaleString()} lock misses</div></td><td className="px-5 py-4 text-white">{(cohort.bufferHitRatio * 100).toFixed(1)}%</td><td className="px-5 py-4 text-(--studio-muted)">Decode {fmt(cohort.p95DecodeUs)} · Buffer {fmt(cohort.p95BufferWaitUs)}<br />Mixer {fmt(cohort.p95MixerUs)} · Output {fmt(cohort.p95OutputUs)} ms</td><td className="px-5 py-4 text-(--studio-muted)">{cohort.p95SeekMs.toFixed(1)} ms / {cohort.p95ClockDriftMs.toFixed(1)} ms</td><td className="px-5 py-4 font-semibold text-amber-200">{cohort.bottleneck}</td><td className={cohort.meetsSLA ? "px-5 py-4 font-semibold text-emerald-300" : "px-5 py-4 font-semibold text-rose-300"}>{cohort.meetsSLA ? "Passing" : "Investigate"}</td></tr>)}</tbody></table></div></section>
        </>}
      </main>
    </div>
  );
}

function fmt(value: number) { return (value / 1000).toFixed(2); }
function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) { return <div className="rounded-2xl border border-(--studio-border) bg-(--studio-panel) p-5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-(--studio-muted)">{icon}{label}</div><div className="mt-2 text-2xl font-bold text-white">{value}</div><div className="mt-1 text-xs text-(--studio-muted)">{detail}</div></div>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-(--studio-border) p-12 text-center text-sm text-(--studio-muted)">{text}</div>; }

export default AudioPerformanceAdminPage;
