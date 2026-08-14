/**
 * Phase 4R.2 / 4R.3 — Domain-Specific Visualization Inspector Control
 *
 * Provides a structured, domain-specific authoring panel for ChartNode, GaugeNode,
 * MetricNode, TableNode, TimelineNode, ConnectorNode, LineNode, IconNode,
 * VideoNode, AudioNode, and LottieNode in Clypra Studio.
 */

import React from "react";
import type {
  SceneNode,
  ChartNode,
  GaugeNode,
  TimelineNode,
  ConnectorNode,
  LineNode,
  IconNode,
  MetricNode,
  TableNode,
  VideoNode,
  AudioNode,
  LottieNode,
  ChartSeries,
  DocumentCommand,
} from "@clypra-studio/engine";
import {
  BarChart3,
  LineChart,
  PieChart,
  Gauge as GaugeIcon,
  Clock,
  Plus,
  Trash2,
  Sliders,
  Palette,
  Eye,
  ArrowRight,
  TrendingUp,
  Table as TableIcon,
  Sparkles,
  Video,
  Volume2,
  Film,
  Zap,
} from "lucide-react";

interface VisualizationControlProps {
  node: SceneNode;
  onExecuteCommand: (command: DocumentCommand) => void;
}

const INPUT_CLS =
  "w-full bg-[#1C1C22] border border-white/6 rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors placeholder:text-gray-600";

const LABEL_CLS =
  "block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1";

export function VisualizationControl({
  node,
  onExecuteCommand,
}: VisualizationControlProps) {
  const isChart = node.type === "chart";
  const isGauge = node.type === "gauge";
  const isMetric = node.type === "metric";
  const isTable = node.type === "table";
  const isTimeline = node.type === "timeline";
  const isConnector = node.type === "connector";
  const isLine = node.type === "line";
  const isIcon = node.type === "icon";
  const isVideo = node.type === "video";
  const isAudio = node.type === "audio";
  const isLottie = node.type === "lottie";

  const chartNode = isChart ? (node as ChartNode) : null;
  const gaugeNode = isGauge ? (node as GaugeNode) : null;
  const metricNode = isMetric ? (node as MetricNode) : null;
  const tableNode = isTable ? (node as TableNode) : null;
  const timelineNode = isTimeline ? (node as TimelineNode) : null;
  const connectorNode = isConnector ? (node as ConnectorNode) : null;
  const lineNode = isLine ? (node as LineNode) : null;
  const iconNode = isIcon ? (node as IconNode) : null;
  const videoNode = isVideo ? (node as VideoNode) : null;
  const audioNode = isAudio ? (node as AudioNode) : null;
  const lottieNode = isLottie ? (node as LottieNode) : null;

  const updateNode = (changes: Partial<SceneNode>) => {
    Object.entries(changes).forEach(([path, value]) => {
      onExecuteCommand({
        type: "UPDATE_NODE_PROPERTY",
        nodeId: node.id,
        path,
        value,
      });
    });
  };

  // ---------------------------------------------------------------------------
  // 1. Metric Inspector
  // ---------------------------------------------------------------------------
  if (isMetric && metricNode) {
    return (
      <div className="space-y-3.5">
        <div>
          <label className={LABEL_CLS}>Metric Value & Formatting</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Primary Value</span>
              <input
                type="number"
                value={typeof metricNode.value === "number" ? metricNode.value : 0}
                onChange={(e) => updateNode({ value: parseFloat(e.target.value) || 0 } as any)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Format Type</span>
              <select
                value={metricNode.format || "currency"}
                onChange={(e) => updateNode({ format: e.target.value as any } as any)}
                className={INPUT_CLS}
              >
                <option value="currency">Currency ($1,250,000)</option>
                <option value="percent">Percentage (14.2%)</option>
                <option value="compact">Compact (1.25M)</option>
                <option value="number">Standard Number (1,250)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Prefix</span>
            <input
              type="text"
              value={metricNode.prefix || ""}
              onChange={(e) => updateNode({ prefix: e.target.value } as any)}
              className={INPUT_CLS}
              placeholder="$"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Suffix</span>
            <input
              type="text"
              value={metricNode.suffix || ""}
              onChange={(e) => updateNode({ suffix: e.target.value } as any)}
              className={INPUT_CLS}
              placeholder="/mo"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Decimals</span>
            <input
              type="number"
              min={0}
              max={4}
              value={metricNode.decimals ?? 0}
              onChange={(e) => updateNode({ decimals: parseInt(e.target.value) || 0 } as any)}
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <span className="text-[10px] text-gray-500 font-medium block mb-1">Label / Title</span>
          <input
            type="text"
            value={metricNode.label || ""}
            onChange={(e) => updateNode({ label: e.target.value } as any)}
            className={INPUT_CLS}
            placeholder="Total Revenue"
          />
        </div>

        {/* Delta Calculation */}
        <div className="bg-[#141419] p-3 rounded-lg border border-white/6 space-y-2.5">
          <span className="text-[11px] font-bold text-gray-300 block">Delta & Trend Evaluation</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Previous Period</span>
              <input
                type="number"
                value={metricNode.previousValue ?? 0}
                onChange={(e) => updateNode({ previousValue: parseFloat(e.target.value) || 0 } as any)}
                className={INPUT_CLS}
                placeholder="1000000"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Manual Trend (%)</span>
              <input
                type="number"
                value={metricNode.trend ?? 0}
                onChange={(e) => updateNode({ trend: parseFloat(e.target.value) || 0 } as any)}
                className={INPUT_CLS}
                placeholder="12.5"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-gray-400">Show Trend Indicator</span>
            <input
              type="checkbox"
              checked={metricNode.showTrend !== false}
              onChange={(e) => updateNode({ showTrend: e.target.checked } as any)}
              className="rounded border-gray-700 text-emerald-500 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Count-Up Animation</span>
            <input
              type="checkbox"
              checked={metricNode.countUp !== false}
              onChange={(e) => updateNode({ countUp: e.target.checked } as any)}
              className="rounded border-gray-700 text-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Table / Data Grid Inspector
  // ---------------------------------------------------------------------------
  if (isTable && tableNode) {
    const columns = tableNode.columns || [];
    return (
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <label className={LABEL_CLS}>Columns ({columns.length})</label>
          <button
            type="button"
            onClick={() => {
              const newCol = { key: `col_${columns.length + 1}`, label: `Column ${columns.length + 1}`, width: 120 };
              updateNode({ columns: [...columns, newCol] } as any);
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus size={11} /> Add Column
          </button>
        </div>

        <div className="space-y-2">
          {columns.map((col, idx) => (
            <div key={col.key || idx} className="bg-[#141419] p-2.5 rounded-lg border border-white/6 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={col.label}
                  placeholder="Header Label"
                  onChange={(e) => {
                    const nextCols = [...columns];
                    nextCols[idx] = { ...nextCols[idx], label: e.target.value };
                    updateNode({ columns: nextCols } as any);
                  }}
                  className={INPUT_CLS}
                />
                <input
                  type="text"
                  value={col.key}
                  placeholder="Data Key"
                  onChange={(e) => {
                    const nextCols = [...columns];
                    nextCols[idx] = { ...nextCols[idx], key: e.target.value };
                    updateNode({ columns: nextCols } as any);
                  }}
                  className={INPUT_CLS}
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextCols = columns.filter((_, i) => i !== idx);
                    updateNode({ columns: nextCols } as any);
                  }}
                  className="text-gray-500 hover:text-rose-400 p-1 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <span className="text-[10px] text-gray-500 font-medium block mb-1">Bound Data Source</span>
          <input
            type="text"
            value={tableNode.dataSource || ""}
            onChange={(e) => updateNode({ dataSource: e.target.value } as any)}
            className={INPUT_CLS}
            placeholder="{{transactions}}"
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Chart Inspector
  // ---------------------------------------------------------------------------
  if (isChart && chartNode) {
    const seriesList = chartNode.series ?? [];
    const chartType = chartNode.chartType ?? "bar";
    const animConf = chartNode.chartAnimation ?? {
      mode: "grow",
      duration: 1.2,
      countUpLabels: true,
    };
    const axisConf = chartNode.axis ?? {
      min: 0,
      tickCount: 5,
      showGrid: true,
      showLabels: true,
    };

    return (
      <div className="space-y-4">
        {/* Chart Type Selector */}
        <div>
          <label className={LABEL_CLS}>Chart Type</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { type: "bar", label: "Bar", icon: <BarChart3 size={13} /> },
              { type: "line", label: "Line", icon: <LineChart size={13} /> },
              { type: "donut", label: "Donut", icon: <PieChart size={13} /> },
            ].map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => updateNode({ chartType: t.type } as any)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                  chartType === t.type
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "bg-[#141419] border-white/6 text-gray-400 hover:text-white"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Series Configuration */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={LABEL_CLS}>Series ({seriesList.length})</label>
            <button
              type="button"
              onClick={() => {
                const newSeries: ChartSeries = {
                  id: `series_${seriesList.length + 1}`,
                  name: `Series ${seriesList.length + 1}`,
                  color: "#A78BFA",
                  data: [50, 75],
                };
                updateNode({ series: [...seriesList, newSeries] } as any);
              }}
              className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-300"
            >
              <Plus size={11} /> Add Series
            </button>
          </div>

          <div className="space-y-2">
            {seriesList.map((s, idx) => (
              <div key={s.id || idx} className="bg-[#141419] p-2.5 rounded-lg border border-white/6 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) => {
                      const next = [...seriesList];
                      next[idx] = { ...next[idx], color: e.target.value };
                      updateNode({ series: next } as any);
                    }}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => {
                      const next = [...seriesList];
                      next[idx] = { ...next[idx], name: e.target.value };
                      updateNode({ series: next } as any);
                    }}
                    className={INPUT_CLS}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = seriesList.filter((_, i) => i !== idx);
                      updateNode({ series: next } as any);
                    }}
                    className="text-gray-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Axis & Animation Controls */}
        <div className="bg-[#141419] p-3 rounded-lg border border-white/6 space-y-2.5">
          <span className="text-[11px] font-bold text-gray-300 block">Axis & Grid Options</span>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Show Grid Lines</span>
            <input
              type="checkbox"
              checked={axisConf.showGrid !== false}
              onChange={(e) =>
                updateNode({
                  axis: { ...axisConf, showGrid: e.target.checked },
                } as any)
              }
              className="rounded border-gray-700 text-violet-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Count-Up Labels</span>
            <input
              type="checkbox"
              checked={animConf.countUpLabels !== false}
              onChange={(e) =>
                updateNode({
                  chartAnimation: { ...animConf, countUpLabels: e.target.checked },
                } as any)
              }
              className="rounded border-gray-700 text-violet-600"
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Gauge Inspector
  // ---------------------------------------------------------------------------
  if (isGauge && gaugeNode) {
    return (
      <div className="space-y-3.5">
        <label className={LABEL_CLS}>Gauge Settings</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Current Value</span>
            <input
              type="number"
              value={gaugeNode.value}
              onChange={(e) => updateNode({ value: parseFloat(e.target.value) || 0 } as any)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Style</span>
            <select
              value={gaugeNode.gaugeStyle ?? "semicircle"}
              onChange={(e) => updateNode({ gaugeStyle: e.target.value as any } as any)}
              className={INPUT_CLS}
            >
              <option value="semicircle">Semicircle (180°)</option>
              <option value="arc">Dashboard Arc (240°)</option>
              <option value="full">Full Radial (360°)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Fill Color</span>
            <input
              type="color"
              value={gaugeNode.fillColor || "#3B82F6"}
              onChange={(e) => updateNode({ fillColor: e.target.value } as any)}
              className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Track Color</span>
            <input
              type="color"
              value={gaugeNode.trackColor || "#1F2937"}
              onChange={(e) => updateNode({ trackColor: e.target.value } as any)}
              className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 font-medium block mb-1">Label</span>
          <input
            type="text"
            value={gaugeNode.label || ""}
            onChange={(e) => updateNode({ label: e.target.value } as any)}
            className={INPUT_CLS}
            placeholder="System Health"
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Timeline Inspector
  // ---------------------------------------------------------------------------
  if (isTimeline && timelineNode) {
    const events = timelineNode.events ?? [];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={LABEL_CLS}>Timeline Events ({events.length})</label>
          <button
            type="button"
            onClick={() => {
              const newEv = { id: `e_${events.length + 1}`, label: `Milestone ${events.length + 1}`, time: (events.length + 1) * 25, color: "#45FF72" };
              updateNode({ events: [...events, newEv] } as any);
            }}
            className="flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300"
          >
            <Plus size={11} /> Add Event
          </button>
        </div>
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={ev.id ?? i} className="bg-[#141419] p-2.5 rounded-lg border border-white/6 space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={ev.color || "#45FF72"}
                  onChange={(e) => {
                    const updated = [...events];
                    updated[i] = { ...updated[i], color: e.target.value };
                    updateNode({ events: updated } as any);
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={ev.label}
                  onChange={(e) => {
                    const updated = [...events];
                    updated[i] = { ...updated[i], label: e.target.value };
                    updateNode({ events: updated } as any);
                  }}
                  className={INPUT_CLS}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = events.filter((_, idx) => idx !== i);
                    updateNode({ events: updated } as any);
                  }}
                  className="text-gray-500 hover:text-rose-400 p-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Icon Inspector
  // ---------------------------------------------------------------------------
  if (isIcon && iconNode) {
    return (
      <div className="space-y-3">
        <label className={LABEL_CLS}>Icon Settings</label>
        <div>
          <span className="text-[10px] text-gray-500 font-medium block mb-1">Icon Name</span>
          <select
            value={iconNode.iconName || "check-circle"}
            onChange={(e) => updateNode({ iconName: e.target.value } as any)}
            className={INPUT_CLS}
          >
            <option value="check-circle">Check Circle</option>
            <option value="zap">Zap / Lightning</option>
            <option value="trending-up">Trending Up</option>
            <option value="star">Star</option>
            <option value="activity">Activity</option>
            <option value="shield">Shield</option>
            <option value="alert-circle">Alert Circle</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Stroke Width</span>
            <input
              type="number"
              min={1}
              max={8}
              value={iconNode.strokeWidth ?? 2}
              onChange={(e) => updateNode({ strokeWidth: parseFloat(e.target.value) || 2 } as any)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Color</span>
            <input
              type="color"
              value={(iconNode.style?.fillColor as string) || "#10B981"}
              onChange={(e) => updateNode({ style: { ...iconNode.style, fillColor: e.target.value } } as any)}
              className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Connector / Line Inspector
  // ---------------------------------------------------------------------------
  if ((isConnector && connectorNode) || (isLine && lineNode)) {
    const conn = connectorNode;
    return (
      <div className="space-y-3">
        <label className={LABEL_CLS}>Line & Connector Options</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Style</span>
            <select
              value={conn?.lineStyle || "straight"}
              onChange={(e) => updateNode({ lineStyle: e.target.value as any } as any)}
              className={INPUT_CLS}
            >
              <option value="straight">Straight</option>
              <option value="curved">Curved</option>
              <option value="elbow">Elbow (90°)</option>
              <option value="orthogonal">Orthogonal</option>
              <option value="bezier">Bezier</option>
            </select>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Arrow Head</span>
            <select
              value={conn?.arrowHead || "end"}
              onChange={(e) => updateNode({ arrowHead: e.target.value as any } as any)}
              className={INPUT_CLS}
            >
              <option value="none">None</option>
              <option value="start">Start</option>
              <option value="end">End</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Stroke Width</span>
            <input
              type="number"
              min={1}
              max={16}
              value={conn?.strokeWidth || lineNode?.strokeWidth || 2}
              onChange={(e) => updateNode({ strokeWidth: parseFloat(e.target.value) || 2 } as any)}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Stroke Color</span>
            <input
              type="color"
              value={conn?.strokeColor || lineNode?.strokeColor || "#3B82F6"}
              onChange={(e) => updateNode({ strokeColor: e.target.value } as any)}
              className="w-full h-8 rounded cursor-pointer border-0 bg-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 8. Temporal Media Inspector (Video / Audio / Lottie)
  // ---------------------------------------------------------------------------
  if ((isVideo && videoNode) || (isAudio && audioNode) || (isLottie && lottieNode)) {
    const playback = videoNode?.playback || audioNode?.playback || {};
    return (
      <div className="space-y-3">
        <label className={LABEL_CLS}>Media Playback Controls</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Speed Rate</span>
            <select
              value={playback.speed ?? 1.0}
              onChange={(e) => updateNode({ playback: { ...playback, speed: parseFloat(e.target.value) || 1 } } as any)}
              className={INPUT_CLS}
            >
              <option value={0.5}>0.5x</option>
              <option value={1.0}>1.0x (Normal)</option>
              <option value={1.5}>1.5x</option>
              <option value={2.0}>2.0x</option>
            </select>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Volume (0-1)</span>
            <input
              type="number"
              step={0.1}
              min={0}
              max={1}
              value={playback.volume ?? 1.0}
              onChange={(e) => updateNode({ playback: { ...playback, volume: parseFloat(e.target.value) || 1 } } as any)}
              className={INPUT_CLS}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-gray-400">Loop Playback</span>
          <input
            type="checkbox"
            checked={playback.loop !== false}
            onChange={(e) => updateNode({ playback: { ...playback, loop: e.target.checked } } as any)}
            className="rounded border-gray-700 text-violet-600"
          />
        </div>
      </div>
    );
  }

  return null;
}
