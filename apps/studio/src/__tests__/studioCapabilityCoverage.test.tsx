/**
 * Phase 4R.5 — Studio Capability Surface & Authoring UX Coverage Test
 *
 * Verifies that every engine visualization capability has an intentional, functional
 * Studio UI authoring route in apps/studio, dispatching correct DocumentCommands.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VisualizationControl } from "../components/OverlayStudioWorkspace/inspector/controls/VisualizationControl";
import { ComponentLibrary } from "../components/OverlayStudioWorkspace/components/ComponentLibrary";
import type { ChartNode, GaugeNode, TimelineNode, DocumentCommand } from "@clypra-studio/engine";
import { primitiveRegistry } from "@clypra-studio/engine";

describe("Studio Capability Surface — VisualizationControl Inspector", () => {
  const sampleChartNode: ChartNode = {
    id: "test-chart-node",
    name: "Revenue Chart",
    type: "chart",
    x: 0, y: 0,
    width: 600, height: 400,
    chartType: "bar",
    orientation: "vertical",
    stacked: false,
    xLabels: ["Q1", "Q2", "Q3", "Q4"],
    series: [
      { id: "rev", name: "Revenue", color: "#45FF72", data: [100, 200, 300, 400] }
    ],
    axis: { min: 0, tickCount: 5, showGrid: true, showLabels: true },
    chartAnimation: { mode: "grow", duration: 1.2, countUpLabels: true },
    showLegend: true,
    legendPosition: "bottom",
  };

  it("renders Chart Type options and dispatches UPDATE_NODE command on selection", () => {
    const handleCommand = vi.fn();
    render(<VisualizationControl node={sampleChartNode} onExecuteCommand={handleCommand} />);

    expect(screen.getByText("Chart Type")).toBeInTheDocument();
    expect(screen.getByText("Bar")).toBeInTheDocument();
    expect(screen.getByText("Line")).toBeInTheDocument();
    expect(screen.getByText("Area")).toBeInTheDocument();
    expect(screen.getByText("Pie")).toBeInTheDocument();
    expect(screen.getByText("Donut")).toBeInTheDocument();

    const lineBtn = screen.getByText("Line");
    fireEvent.click(lineBtn);

    expect(handleCommand).toHaveBeenCalledTimes(1);
    expect(handleCommand).toHaveBeenCalledWith({
      type: "UPDATE_NODE",
      nodeId: "test-chart-node",
      changes: { chartType: "line" },
    });
  });

  it("edits category labels and dispatches UPDATE_NODE command", () => {
    const handleCommand = vi.fn();
    render(<VisualizationControl node={sampleChartNode} onExecuteCommand={handleCommand} />);

    const categoriesInput = screen.getByDisplayValue("Q1, Q2, Q3, Q4");
    expect(categoriesInput).toBeInTheDocument();

    fireEvent.change(categoriesInput, { target: { value: "Jan, Feb, Mar, Apr" } });

    expect(handleCommand).toHaveBeenCalledWith({
      type: "UPDATE_NODE",
      nodeId: "test-chart-node",
      changes: { xLabels: ["Jan", "Feb", "Mar", "Apr"] },
    });
  });

  it("edits series values in the data table", () => {
    const handleCommand = vi.fn();
    render(<VisualizationControl node={sampleChartNode} onExecuteCommand={handleCommand} />);

    const q1ValueInput = screen.getByDisplayValue("100");
    expect(q1ValueInput).toBeInTheDocument();

    fireEvent.change(q1ValueInput, { target: { value: "150" } });

    expect(handleCommand).toHaveBeenCalledWith({
      type: "UPDATE_NODE",
      nodeId: "test-chart-node",
      changes: {
        series: [
          { id: "rev", name: "Revenue", color: "#45FF72", data: [150, 200, 300, 400] }
        ]
      },
    });
  });

  it("adds a new series to the chart", () => {
    const handleCommand = vi.fn();
    render(<VisualizationControl node={sampleChartNode} onExecuteCommand={handleCommand} />);

    const addSeriesBtn = screen.getByText("Add Series");
    fireEvent.click(addSeriesBtn);

    expect(handleCommand).toHaveBeenCalledTimes(1);
    const lastCmd = handleCommand.mock.calls[0][0] as DocumentCommand;
    expect(lastCmd.type).toBe("UPDATE_NODE");
    expect((lastCmd as any).changes.series.length).toBe(2);
  });

  it("renders Gauge inspector controls for GaugeNode", () => {
    const gaugeNode: GaugeNode = {
      id: "test-gauge",
      name: "Gauge",
      type: "gauge",
      x: 0, y: 0,
      width: 200, height: 200,
      value: 72, min: 0, max: 100,
      gaugeStyle: "semicircle",
    };

    const handleCommand = vi.fn();
    render(<VisualizationControl node={gaugeNode} onExecuteCommand={handleCommand} />);

    expect(screen.getByText("Gauge Settings")).toBeInTheDocument();
    const valInput = screen.getByDisplayValue("72");
    expect(valInput).toBeInTheDocument();

    fireEvent.change(valInput, { target: { value: "85" } });
    expect(handleCommand).toHaveBeenCalledWith({
      type: "UPDATE_NODE",
      nodeId: "test-gauge",
      changes: { value: 85 },
    });
  });
});

describe("Studio Capability Surface — ComponentLibrary Insertion", () => {
  it("renders Visualizations section with insertable primitive items", () => {
    const handleCommand = vi.fn();
    const { container } = render(<ComponentLibrary onExecuteCommand={handleCommand} />);

    expect(screen.getByText("Visualizations")).toBeInTheDocument();
    expect(screen.getByText("Animated Bar Chart")).toBeInTheDocument();
    expect(screen.getByText("Gauge Meter")).toBeInTheDocument();

    const buttons = container.querySelectorAll("button");
    const chartBtn = Array.from(buttons).find((b) => b.textContent?.includes("Animated Bar Chart"));
    const testNode = primitiveRegistry.createDefaultNode("chart" as any);
    expect(testNode).toBeDefined();
    expect(testNode.type).toBe("chart");

    fireEvent.click(chartBtn!);

    expect(handleCommand).toHaveBeenCalledTimes(1);
    const cmd = handleCommand.mock.calls[0][0] as DocumentCommand;
    expect(cmd.type).toBe("ADD_NODE");
    expect((cmd as any).node.type).toBe("chart");
  });
});
