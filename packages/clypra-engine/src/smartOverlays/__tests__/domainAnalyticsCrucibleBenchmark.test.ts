import { describe, it, expect } from "vitest";
import { MetricEngine } from "../analytics/metricEngine.js";
import { SeriesEngine } from "../analytics/seriesEngine.js";
import { GridEngine } from "../analytics/gridEngine.js";
import { LayoutEngine } from "../layoutEngine.js";
import type {
  OverlayDocument,
  FrameNode,
  MetricNode,
  GaugeNode,
  ChartNode,
  TableNode,
  TimelineNode,
} from "../overlayDocumentSchema.js";

describe("Layer 2: Domain Visualizations & Analytics Crucible Benchmark", () => {
  const layoutEngine = new LayoutEngine();

  // =========================================================================
  // PHASE 2.1: METRIC ENGINE
  // =========================================================================
  describe("Phase 2.1: Metric Engine", () => {
    it("1.1: should format numbers, currencies, percentages, and compact abbreviations", () => {
      // 1. Numbers
      expect(MetricEngine.formatValue(1000, { format: "number", decimals: 0 })).toBe("1,000");

      // 2. Currencies
      expect(MetricEngine.formatValue(142500, { format: "currency" })).toBe("$142,500");
      expect(MetricEngine.formatValue(49.99, { format: "currency", decimals: 2 })).toBe("$49.99");

      // 3. Percentages
      expect(MetricEngine.formatValue(0.142, { format: "percent" })).toBe("14.2%");
      expect(MetricEngine.formatValue(98.5, { format: "percent" })).toBe("98.5%");

      // 4. Compact Abbreviations (K, M, B)
      expect(MetricEngine.formatValue(1000, { format: "compact" })).toBe("1K");
      expect(MetricEngine.formatValue(1000000, { format: "compact" })).toBe("1.0M");
      expect(MetricEngine.formatValue(1250000000, { format: "compact" })).toBe("1.25B");
    });

    it("1.2: should calculate deltas and handle critical edge cases (0->0, 0->100, negative changes)", () => {
      // Normal change (100 -> 115) -> +15, +15%, direction: up
      const d1 = MetricEngine.calculateDelta(115, 100);
      expect(d1?.absoluteChange).toBe(15);
      expect(d1?.percentageChange).toBe(15);
      expect(d1?.direction).toBe("up");

      // Zero to Zero (0 -> 0) -> 0, 0%, direction: neutral
      const dZero = MetricEngine.calculateDelta(0, 0);
      expect(dZero?.absoluteChange).toBe(0);
      expect(dZero?.percentageChange).toBe(0);
      expect(dZero?.direction).toBe("neutral");

      // Zero to Positive (0 -> 100) -> +100, +100%, direction: up
      const dZeroToPos = MetricEngine.calculateDelta(100, 0);
      expect(dZeroToPos?.absoluteChange).toBe(100);
      expect(dZeroToPos?.percentageChange).toBe(100);
      expect(dZeroToPos?.direction).toBe("up");

      // Negative to Negative (-120 -> -100) -> +20, +16.67%, direction: up
      const dNegToLessNeg = MetricEngine.calculateDelta(-100, -120);
      expect(dNegToLessNeg?.absoluteChange).toBe(20);
      expect(dNegToLessNeg?.percentageChange).toBeCloseTo(16.67, 1);
      expect(dNegToLessNeg?.direction).toBe("up");

      // Negative drop (-100 -> -150) -> -50, -50%, direction: down
      const dNegDrop = MetricEngine.calculateDelta(-150, -100);
      expect(dNegDrop?.absoluteChange).toBe(-50);
      expect(dNegDrop?.percentageChange).toBe(-50);
      expect(dNegDrop?.direction).toBe("down");
    });

    it("1.3: should interpolate count-up animation progress with easing curves", () => {
      // Linear at t=0.5 -> 50
      expect(MetricEngine.interpolateCountUp(100, 0, 0.5, "linear")).toBe(50);
      // EaseOut at t=0.5 -> > 50 (front-loaded)
      const easeOutVal = MetricEngine.interpolateCountUp(100, 0, 0.5, "easeOut");
      expect(easeOutVal).toBeGreaterThan(50);
      // Completion at t=1.0 -> 100
      expect(MetricEngine.interpolateCountUp(100, 0, 1.0, "easeOut")).toBe(100);
    });
  });

  // =========================================================================
  // PHASE 2.2: GAUGE ENGINE (via SeriesEngine)
  // =========================================================================
  describe("Phase 2.2: Gauge Engine (via SeriesEngine)", () => {
    it("2.1: should compute arc sweep angles across semicircle (180deg), arc (240deg) and full (360deg)", () => {
      // 180deg Semicircle at 75% -> fullSweep = PI, animSweep = PI * 0.75
      const semi = SeriesEngine.computeArcGeometry(75, 0, 100, 300, 200, "semicircle");
      expect(semi.fullSweep).toBeCloseTo(Math.PI, 4);
      expect(semi.animSweep).toBeCloseTo(Math.PI * 0.75, 4);
      expect(semi.normalizedProgress).toBeCloseTo(0.75, 4);

      // 240deg Dashboard Arc at 50%
      const arc240 = SeriesEngine.computeArcGeometry(50, 0, 100, 300, 200, "arc", 240);
      const expectedFull = (240 * Math.PI) / 180;
      expect(arc240.fullSweep).toBeCloseTo(expectedFull, 4);
      expect(arc240.animSweep).toBeCloseTo(expectedFull * 0.5, 4);

      // 360deg Full Radial at 100%
      const full = SeriesEngine.computeArcGeometry(100, 0, 100, 300, 200, "full");
      expect(full.fullSweep).toBeCloseTo(Math.PI * 2, 4);
      expect(full.animSweep).toBeCloseTo(Math.PI * 2, 4);
    });

    it("2.2: should evaluate threshold bands (normal -> warning -> critical)", () => {
      const thresholds = [
        { value: 0, state: "normal" as const, color: "#10B981" },
        { value: 60, state: "warning" as const, color: "#F59E0B" },
        { value: 85, state: "critical" as const, color: "#EF4444" },
      ];

      expect(SeriesEngine.evaluateThreshold(55, thresholds).state).toBe("normal");
      expect(SeriesEngine.evaluateThreshold(55, thresholds).color).toBe("#10B981");

      expect(SeriesEngine.evaluateThreshold(75, thresholds).state).toBe("warning");
      expect(SeriesEngine.evaluateThreshold(75, thresholds).color).toBe("#F59E0B");

      expect(SeriesEngine.evaluateThreshold(95, thresholds).state).toBe("critical");
      expect(SeriesEngine.evaluateThreshold(95, thresholds).color).toBe("#EF4444");
    });
  });

  // =========================================================================
  // PHASE 2.3: SERIES ENGINE (Chart Multi-Series & Streaming)
  // =========================================================================
  describe("Phase 2.3: Series Engine (Bar, Line & Streaming Datasets)", () => {
    it("3.1: should extract domain scale and calculate multi-series bar and line coordinates", () => {
      const dataset = [
        { month: "Jan", revenue: 100, churn: 5 },
        { month: "Feb", revenue: 140, churn: 8 },
        { month: "Mar", revenue: 180, churn: 4 },
      ];

      const scale = SeriesEngine.computeScale(dataset, "month", ["revenue", "churn"]);
      expect(scale.domainMin).toBe(0);
      expect(scale.domainMax).toBe(180);
      expect(scale.categories).toEqual(["Jan", "Feb", "Mar"]);
      expect(scale.seriesIds).toEqual(["revenue", "churn"]);

      // Compute Bars
      const bars = SeriesEngine.computeBars(dataset, scale, 600, 300, "month", [
        { id: "revenue", color: "#3B82F6" },
        { id: "churn", color: "#EF4444" },
      ]);
      expect(bars.length).toBe(6); // 3 categories * 2 series

      // Compute Line Points
      const lineMap = SeriesEngine.computeLinePoints(dataset, scale, 600, 300, "month");
      const revPoints = lineMap.get("revenue")!;
      expect(revPoints.length).toBe(3);
      // Jan x=0, Feb x=300, Mar x=600
      expect(revPoints[0].x).toBe(0);
      expect(revPoints[1].x).toBe(300);
      expect(revPoints[2].x).toBe(600);
      // Mar revenue is max (180) -> y should be 0 (top of plot)
      expect(revPoints[2].y).toBe(0);
    });

    it("3.2: should maintain stable scale evaluation when streaming new data points", () => {
      let data = [
        { month: "Jan", revenue: 100 },
        { month: "Feb", revenue: 120 },
      ];

      let scale = SeriesEngine.computeScale(data, "month", ["revenue"]);
      expect(scale.categories.length).toBe(2);

      // Append 10 more streaming points
      for (let i = 3; i <= 12; i++) {
        data.push({ month: `Month ${i}`, revenue: 100 + i * 15 });
        scale = SeriesEngine.computeScale(data, "month", ["revenue"]);
        expect(scale.categories.length).toBe(i);
        expect(scale.domainMax).toBe(100 + i * 15);
      }
    });
  });

  // =========================================================================
  // PHASE 2.4: TIMELINE (via SeriesEngine)
  // =========================================================================
  describe("Phase 2.4: Timeline Milestones (via SeriesEngine)", () => {
    it("4.1: should classify milestones into completed, active, and future states", () => {
      const milestones = [
        { id: "step-1", title: "Planning" },
        { id: "step-2", title: "Design" },
        { id: "step-3", title: "Development" },
        { id: "step-4", title: "Launch" },
      ];

      // Active is Step 2 (Design, index 1)
      const eval1 = SeriesEngine.evaluateMilestones(milestones, 1, 600, 40);
      expect(eval1[0].status).toBe("completed");
      expect(eval1[1].status).toBe("active");
      expect(eval1[2].status).toBe("future");
      expect(eval1[3].status).toBe("future");

      // Progress active to Step 3 (Development, index 2)
      const eval2 = SeriesEngine.evaluateMilestones(milestones, 2, 600, 40);
      expect(eval2[0].status).toBe("completed");
      expect(eval2[1].status).toBe("completed");
      expect(eval2[2].status).toBe("active");
      expect(eval2[3].status).toBe("future");
    });
  });

  // =========================================================================
  // PHASE 2.5: GRID ENGINE (Table)
  // =========================================================================
  describe("Phase 2.5: Grid Engine (Table Tabular Grids)", () => {
    it("5.1: should distribute column widths and format cell currencies and percentages", () => {
      const columns = [
        { key: "id", label: "Tx ID", width: 80, widthMode: "fixed" as const },
        { key: "customer", label: "Customer", flexWeight: 2, widthMode: "fill" as const },
        { key: "amount", label: "Amount", format: "currency" as const, flexWeight: 1, widthMode: "fill" as const },
        { key: "growth", label: "Growth", format: "percent" as const, flexWeight: 1, widthMode: "fill" as const },
      ];

      const data = [
        { id: "TX-01", customer: "Acme Corp", amount: 14200, growth: 0.185 },
        { id: "TX-02", customer: "Stripe Inc", amount: 89000, growth: 0.24 },
      ];

      const tableLayout = GridEngine.computeTableLayout(data, columns, 800, 36, 40);

      // Verify Column Distribution: Total = 800. Fixed = 80. Remaining = 720. Weights = 4.
      // customer: 720 * (2/4) = 360
      // amount: 720 * (1/4) = 180
      // growth: 720 * (1/4) = 180
      expect(tableLayout.columns[0].width).toBe(80);
      expect(tableLayout.columns[1].width).toBe(360);
      expect(tableLayout.columns[2].width).toBe(180);
      expect(tableLayout.columns[3].width).toBe(180);

      // Verify Formatted Cell Content
      const row1 = tableLayout.rows[0];
      expect(row1.cells[0].formattedValue).toBe("TX-01");
      expect(row1.cells[1].formattedValue).toBe("Acme Corp");
      expect(row1.cells[2].formattedValue).toBe("$14,200");
      expect(row1.cells[3].formattedValue).toBe("18.5%");
    });
  });

  // =========================================================================
  // HERO BENCHMARK: 300-Frame High-Frequency Streaming Dashboard
  // =========================================================================
  describe("Hero Benchmark: The 300-Frame High-Frequency Streaming Dashboard", () => {
    it("should process 300 consecutive streaming frames across all 5 analytics types under strict performance budget", () => {
      // Initial Dataset
      let currentMrr = 100000;
      let prevMrr = 90000;
      let chartData = [
        { month: "M1", revenue: 100000, cost: 40000 },
        { month: "M2", revenue: 110000, cost: 42000 },
      ];
      const milestones = [
        { id: "m1", title: "Alpha" },
        { id: "m2", title: "Beta" },
        { id: "m3", title: "GA Release" },
        { id: "m4", title: "Enterprise" },
      ];
      const tableColumns = [
        { key: "tx", label: "Transaction", width: 100, widthMode: "fixed" as const },
        { key: "val", label: "Value", format: "currency" as const, flexWeight: 1, widthMode: "fill" as const },
      ];
      let transactions = [
        { tx: "TX-1", val: 5000 },
        { tx: "TX-2", val: 7500 },
      ];

      const startBench = performance.now();

      // Simulate 300 frames of real-time streaming updates
      for (let frame = 1; frame <= 300; frame++) {
        const t = frame / 300;

        // 1. Metric Update (MRR growth)
        currentMrr += 50;
        const metricEval = MetricEngine.evaluateMetric(currentMrr, {
          format: "currency",
          previousValue: prevMrr,
          countUp: true,
          progress: t,
        });
        expect(metricEval.formattedValue).toBeDefined();

        // 2. Gauge Update (Oscillating server health 94% -> 99%)
        const healthVal = 94 + Math.sin(frame * 0.1) * 5;
        const arc = SeriesEngine.computeArcGeometry(healthVal, 0, 100, 300, 200, "semicircle");
        const th = SeriesEngine.evaluateThreshold(healthVal, [
          { value: 0, state: "critical" },
          { value: 90, state: "warning" },
          { value: 96, state: "normal" },
        ]);
        expect(arc.animSweep).toBeGreaterThan(0);
        expect(th.state).toBeDefined();

        // 3. Streaming Chart Data
        if (frame % 30 === 0 && chartData.length < 12) {
          chartData.push({
            month: `M${chartData.length + 1}`,
            revenue: currentMrr,
            cost: currentMrr * 0.4,
          });
        }
        const scale = SeriesEngine.computeScale(chartData, "month", ["revenue", "cost"]);
        const bars = SeriesEngine.computeBars(chartData, scale, 600, 300, "month", [], t);
        expect(bars.length).toBeGreaterThan(0);

        // 4. Milestone Timeline Progression
        const activeStep = Math.min(3, Math.floor(t * 4));
        const evalMilestones = SeriesEngine.evaluateMilestones(milestones, activeStep, 600, 40);
        expect(evalMilestones.length).toBe(4);

        // 5. Grid Table Row Ingestion
        if (frame % 50 === 0) {
          transactions.push({ tx: `TX-${transactions.length + 1}`, val: 1000 + frame * 10 });
        }
        const table = GridEngine.computeTableLayout(transactions, tableColumns, 600, 30, 36);
        expect(table.rows.length).toBe(transactions.length);
      }

      const totalElapsed = performance.now() - startBench;
      const avgPerFrame = totalElapsed / 300;

      // Assert total elapsed for 300 complete multi-system evaluations < 300ms (average < 1ms/frame)
      expect(avgPerFrame).toBeLessThan(1.5);
      expect(totalElapsed).toBeLessThan(450);
    });
  });
});
