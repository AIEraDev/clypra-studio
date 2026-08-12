/**
 * Phase 4R.2 / 4R.3 — Domain-Specific Visualization Inspector Control
 *
 * Provides a structured, domain-specific authoring panel for ChartNode, GaugeNode,
 * TimelineNode, AnnotationNode, and ConnectorNode in apps/studio.
 */

import React, { useState } from "react";
import type {
  SceneNode,
  ChartNode,
  GaugeNode,
  TimelineNode,
  AnnotationNode,
  ConnectorNode,
  ChartSeries,
  DocumentCommand,
} from "@clypra-studio/engine";
import {
  BarChart3, LineChart, PieChart, Gauge as GaugeIcon, Clock, Plus, Trash2, Sliders, Palette, Eye, ArrowRight
} from "lucide-react";

interface VisualizationControlProps {
  node: SceneNode;
  onExecuteCommand: (command: DocumentCommand) => void;
}

const INPUT_CLS =
  "w-full bg-[#1C1C22] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[12px] text-white font-medium focus:border-violet-500 outline-none transition-colors placeholder:text-gray-600";

const LABEL_CLS = "block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1";

export function VisualizationControl({ node, onExecuteCommand }: VisualizationControlProps) {
  const isChart = node.type === "chart";
  const isGauge = node.type === "gauge";
  const isTimeline = node.type === "timeline";
  const isAnnotation = node.type === "annotation";
  const isConnector = node.type === "connector";

  const chartNode = isChart ? (node as ChartNode) : null;
  const gaugeNode = isGauge ? (node as GaugeNode) : null;
  const timelineNode = isTimeline ? (node as TimelineNode) : null;
  const annotationNode = isAnnotation ? (node as AnnotationNode) : null;
  const connectorNode = isConnector ? (node as ConnectorNode) : null;

  const updateNode = (changes: Partial<SceneNode>) => {
    onExecuteCommand({
      type: "UPDATE_NODE",
      nodeId: node.id,
      changes,
    });
  };

  // ---------------------------------------------------------------------------
  // Chart Inspector
  // ---------------------------------------------------------------------------
  if (isChart && chartNode) {
    const seriesList = chartNode.series ?? [];
    const categories = chartNode.xLabels ?? ["Cat 1", "Cat 2", "Cat 3"];
    const chartType = chartNode.chartType ?? "bar";
    const animConf = chartNode.chartAnimation ?? { mode: "grow", duration: 1.2, countUpLabels: true };
    const axisConf = chartNode.axis ?? { min: 0, tickCount: 5, showGrid: true, showLabels: true };

    const handleTypeChange = (newType: any) => {
      updateNode({ chartType: newType } as any);
    };

    const handleSeriesColorChange = (index: number, color: string) => {
      const updated = [...seriesList];
      updated[index] = { ...updated[index], color };
      updateNode({ series: updated } as any);
    };

    const handleSeriesNameChange = (index: number, name: string) => {
      const updated = [...seriesList];
      updated[index] = { ...updated[index], name };
      updateNode({ series: updated } as any);
    };

    const handleSeriesDataChange = (seriesIndex: number, catIndex: number, valStr: string) => {
      const num = parseFloat(valStr) || 0;
      const updated = [...seriesList];
      const dataCopy = [...(updated[seriesIndex].data ?? [])];
      dataCopy[catIndex] = num;
      updated[seriesIndex] = { ...updated[seriesIndex], data: dataCopy };
      updateNode({ series: updated } as any);
    };

    const handleAddSeries = () => {
      const newId = `series-${seriesList.length + 1}`;
      const defaultColors = ["#45FF72", "#FF4141", "#4ECDC4", "#FFE66D", "#A78BFA"];
      const color = defaultColors[seriesList.length % defaultColors.length];
      const defaultData = categories.map(() => Math.floor(Math.random() * 200) + 50);
      const newSeries: ChartSeries = {
        id: newId,
        name: `Series ${seriesList.length + 1}`,
        color,
        data: defaultData,
      };
      updateNode({ series: [...seriesList, newSeries] } as any);
    };

    const handleDeleteSeries = (index: number) => {
      if (seriesList.length <= 1) return;
      const updated = seriesList.filter((_, i) => i !== index);
      updateNode({ series: updated } as any);
    };

    const handleCategoriesChange = (catStr: string) => {
      const newCats = catStr.split(",").map((s) => s.trim()).filter(Boolean);
      updateNode({ xLabels: newCats } as any);
    };

    return (
      <div className="space-y-4">
        {/* 1. Chart Type Switcher */}
        <div>
          <label className={LABEL_CLS}>Chart Type</label>
          <div className="grid grid-cols-5 gap-1 bg-[#141419] p-1 rounded-lg border border-white/[0.06]">
            {[
              { id: "bar", label: "Bar", icon: BarChart3 },
              { id: "line", label: "Line", icon: LineChart },
              { id: "area", label: "Area", icon: LineChart },
              { id: "pie", label: "Pie", icon: PieChart },
              { id: "donut", label: "Donut", icon: PieChart },
            ].map((item) => {
              const active = chartType === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTypeChange(item.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-violet-600 text-white shadow"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon size={14} className="mb-0.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Orientation & Stacking (For Bar Charts) */}
        {chartType === "bar" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLS}>Orientation</label>
              <select
                value={chartNode.orientation ?? "vertical"}
                onChange={(e) => updateNode({ orientation: e.target.value as any } as any)}
                className={INPUT_CLS}
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Stacking</label>
              <label className="flex items-center gap-2 text-[12px] text-gray-300 mt-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chartNode.stacked ?? false}
                  onChange={(e) => updateNode({ stacked: e.target.checked } as any)}
                  className="rounded border-gray-700 text-violet-600 focus:ring-0"
                />
                <span>Stacked Series</span>
              </label>
            </div>
          </div>
        )}

        {/* 3. Interactive Data & Series Editor */}
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-between">
            <label className={LABEL_CLS}>Data Series & Categories</label>
            <button
              type="button"
              onClick={handleAddSeries}
              className="flex items-center gap-1 text-[11px] font-bold text-violet-400 hover:text-violet-300 cursor-pointer"
            >
              <Plus size={12} />
              <span>Add Series</span>
            </button>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-medium mb-1 block">Categories (X-Axis, comma separated)</label>
            <input
              type="text"
              value={categories.join(", ")}
              onChange={(e) => handleCategoriesChange(e.target.value)}
              className={INPUT_CLS}
              placeholder="Q1, Q2, Q3, Q4"
            />
          </div>

          {/* Series list */}
          <div className="space-y-2 mt-2">
            {seriesList.map((s, si) => (
              <div key={s.id ?? si} className="bg-[#141419] p-2.5 rounded-lg border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) => handleSeriesColorChange(si, e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => handleSeriesNameChange(si, e.target.value)}
                    className={INPUT_CLS}
                    placeholder="Series Name"
                  />
                  {seriesList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSeries(si)}
                      className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Values table */}
                <div className="grid grid-cols-4 gap-1">
                  {categories.map((cat, ci) => (
                    <div key={ci}>
                      <span className="text-[9px] text-gray-500 block truncate">{cat}</span>
                      <input
                        type="number"
                        value={(s.data ?? [])[ci] ?? 0}
                        onChange={(e) => handleSeriesDataChange(si, ci, e.target.value)}
                        className="w-full bg-[#1C1C22] border border-white/[0.06] rounded px-1.5 py-1 text-[11px] text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Appearance Controls */}
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <label className={LABEL_CLS}>Appearance & Styling</label>

          {chartType === "donut" && (
            <div>
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>Hole Ratio</span>
                <span>{Math.round((chartNode.donutHoleRatio ?? 0.55) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.8}
                step={0.05}
                value={chartNode.donutHoleRatio ?? 0.55}
                onChange={(e) => updateNode({ donutHoleRatio: parseFloat(e.target.value) } as any)}
                className="w-full"
              />
            </div>
          )}

          {(chartType === "line" || chartType === "area") && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                  <span>Point Radius</span>
                  <span>{chartNode.pointRadius ?? 4}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={chartNode.pointRadius ?? 4}
                  onChange={(e) => updateNode({ pointRadius: parseInt(e.target.value, 10) } as any)}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-300">Area Fill</span>
                <input
                  type="checkbox"
                  checked={chartType === "area" || (chartNode.showAreaFill ?? false)}
                  onChange={(e) => updateNode({ showAreaFill: e.target.checked } as any)}
                  className="rounded border-gray-700 text-violet-600"
                />
              </div>
            </div>
          )}

          {chartType === "bar" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-500 font-medium block mb-1">Corner Radius</span>
                <input
                  type="number"
                  value={chartNode.barStyle?.rounded ?? 4}
                  onChange={(e) =>
                    updateNode({
                      barStyle: { ...chartNode.barStyle, rounded: parseInt(e.target.value, 10) || 0 },
                    } as any)
                  }
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-medium block mb-1">Group Gap</span>
                <input
                  type="number"
                  value={chartNode.barStyle?.groupGap ?? 6}
                  onChange={(e) =>
                    updateNode({
                      barStyle: { ...chartNode.barStyle, groupGap: parseInt(e.target.value, 10) || 0 },
                    } as any)
                  }
                  className={INPUT_CLS}
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Axes & Legend */}
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <label className={LABEL_CLS}>Axes & Legend</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Tick Count</span>
              <input
                type="number"
                value={axisConf.tickCount ?? 5}
                onChange={(e) =>
                  updateNode({
                    axis: { ...axisConf, tickCount: parseInt(e.target.value, 10) || 5 },
                  } as any)
                }
                className={INPUT_CLS}
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Legend Position</span>
              <select
                value={chartNode.legendPosition ?? "bottom"}
                onChange={(e) => updateNode({ legendPosition: e.target.value as any } as any)}
                className={INPUT_CLS}
              >
                <option value="bottom">Bottom</option>
                <option value="right">Right</option>
                <option value="top">Top</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={chartNode.showLegend !== false}
                onChange={(e) => updateNode({ showLegend: e.target.checked } as any)}
                className="rounded border-gray-700 text-violet-600"
              />
              <span>Show Legend</span>
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={axisConf.showGrid !== false}
                onChange={(e) => updateNode({ axis: { ...axisConf, showGrid: e.target.checked } } as any)}
                className="rounded border-gray-700 text-violet-600"
              />
              <span>Show Grid</span>
            </label>
          </div>
        </div>

        {/* 6. Motion & Animation */}
        <div className="space-y-2 border-t border-white/[0.06] pt-3">
          <label className={LABEL_CLS}>Visualization Motion</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Entrance Mode</span>
              <select
                value={animConf.mode}
                onChange={(e) => updateNode({ chartAnimation: { ...animConf, mode: e.target.value as any } } as any)}
                className={INPUT_CLS}
              >
                <option value="grow">Grow</option>
                <option value="fade">Fade</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-medium block mb-1">Easing</span>
              <select
                value={animConf.easing ?? "easeOutCubic"}
                onChange={(e) => updateNode({ chartAnimation: { ...animConf, easing: e.target.value as any } } as any)}
                className={INPUT_CLS}
              >
                <option value="easeOutCubic">Ease Out Cubic</option>
                <option value="linear">Linear</option>
                <option value="easeInCubic">Ease In Cubic</option>
                <option value="easeInOutCubic">Ease In Out</option>
                <option value="easeOutQuart">Ease Out Quart</option>
                <option value="easeOutElastic">Elastic</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-gray-300">Count-Up Value Labels</span>
            <input
              type="checkbox"
              checked={animConf.countUpLabels !== false}
              onChange={(e) => updateNode({ chartAnimation: { ...animConf, countUpLabels: e.target.checked } } as any)}
              className="rounded border-gray-700 text-violet-600"
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Gauge Inspector
  // ---------------------------------------------------------------------------
  if (isGauge && gaugeNode) {
    return (
      <div className="space-y-3">
        <label className={LABEL_CLS}>Gauge Settings</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-gray-500 font-medium block mb-1">Value</span>
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
              <option value="semicircle">Semicircle</option>
              <option value="full">Full Circle</option>
              <option value="arc">Custom Arc</option>
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
            placeholder="Target Progress"
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Timeline Inspector
  // ---------------------------------------------------------------------------
  if (isTimeline && timelineNode) {
    const events = timelineNode.events ?? [];
    return (
      <div className="space-y-3">
        <label className={LABEL_CLS}>Timeline Events</label>
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={ev.id ?? i} className="bg-[#141419] p-2 rounded-lg border border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={ev.color || "#45FF72"}
                  onChange={(e) => {
                    const updated = [...events];
                    updated[i] = { ...updated[i], color: e.target.value };
                    updateNode({ events: updated } as any);
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
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
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
