/**
 * Grid Engine
 *
 * Core engine for tabular data structures and data grids:
 * - Dynamic column width distribution (Fixed, Hug, Fill weights)
 * - Cell value formatting and alignment
 * - Row striping and cell bounding boxes
 * - Row virtualization windowing math
 */

import { MetricEngine } from "./metricEngine.js";

export interface ColumnDefinition {
  key: string;
  label?: string;
  width?: number;
  widthMode?: "fixed" | "hug" | "fill";
  flexWeight?: number;
  align?: "left" | "center" | "right";
  format?: "text" | "number" | "currency" | "percent";
  decimals?: number;
}

export interface ComputedColumn {
  key: string;
  label: string;
  x: number;
  width: number;
  align: "left" | "center" | "right";
  format?: "text" | "number" | "currency" | "percent";
}

export interface ComputedCell {
  columnKey: string;
  rawValue: any;
  formattedValue: string;
  x: number;
  y: number;
  width: number;
  height: number;
  align: "left" | "center" | "right";
}

export interface ComputedRow {
  rowIndex: number;
  y: number;
  height: number;
  isEven: boolean;
  cells: ComputedCell[];
}

export interface TableLayoutResult {
  columns: ComputedColumn[];
  rows: ComputedRow[];
  totalWidth: number;
  totalHeight: number;
  headerHeight: number;
}

export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
}

export class GridEngine {
  /**
   * Compute column horizontal distribution across available container width.
   */
  public static distributeColumns(
    columns: ColumnDefinition[],
    containerWidth: number,
    minColWidth = 60
  ): ComputedColumn[] {
    if (!Array.isArray(columns) || columns.length === 0) return [];

    let fixedWidthTotal = 0;
    let totalFillWeights = 0;

    // 1. Pass 1: Sum fixed widths and count fill weights
    columns.forEach((col) => {
      if (col.widthMode === "fixed" || (col.width && col.widthMode !== "fill")) {
        fixedWidthTotal += Math.max(minColWidth, col.width || minColWidth);
      } else {
        totalFillWeights += col.flexWeight || 1;
      }
    });

    const remainingForFill = Math.max(0, containerWidth - fixedWidthTotal);
    let currentX = 0;

    return columns.map((col) => {
      let colW = minColWidth;

      if (col.widthMode === "fixed" || (col.width && col.widthMode !== "fill")) {
        colW = Math.max(minColWidth, col.width || minColWidth);
      } else {
        const weight = col.flexWeight || 1;
        colW = totalFillWeights > 0
          ? Math.max(minColWidth, Math.floor(remainingForFill * (weight / totalFillWeights)))
          : minColWidth;
      }

      const computed: ComputedColumn = {
        key: col.key,
        label: col.label || col.key,
        x: Math.round(currentX),
        width: Math.round(colW),
        align: col.align || "left",
        format: col.format,
      };

      currentX += colW;
      return computed;
    });
  }

  /**
   * Format individual table cell values based on column formatting schema.
   */
  public static formatCell(value: any, format?: "text" | "number" | "currency" | "percent", decimals?: number): string {
    if (value === null || value === undefined) return "—";
    if (format === "currency") {
      return MetricEngine.formatValue(value, { format: "currency", decimals });
    }
    if (format === "percent") {
      return MetricEngine.formatValue(value, { format: "percent", decimals });
    }
    if (format === "number") {
      return MetricEngine.formatValue(value, { format: "number", decimals });
    }
    return String(value);
  }

  /**
   * Compute full tabular grid layout including headers and rows.
   */
  public static computeTableLayout(
    data: any[],
    columnDefs: ColumnDefinition[],
    containerWidth = 800,
    rowHeight = 36,
    headerHeight = 40
  ): TableLayoutResult {
    const columns = this.distributeColumns(columnDefs, containerWidth);
    const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);

    const rows: ComputedRow[] = [];
    let currentY = headerHeight;

    if (Array.isArray(data)) {
      data.forEach((rowData, rowIdx) => {
        const isEven = rowIdx % 2 === 0;
        const cells: ComputedCell[] = columns.map((col) => {
          const rawValue = rowData[col.key];
          const colDef = columnDefs.find((c) => c.key === col.key);
          const formattedValue = this.formatCell(rawValue, col.format, colDef?.decimals);

          return {
            columnKey: col.key,
            rawValue,
            formattedValue,
            x: col.x,
            y: currentY,
            width: col.width,
            height: rowHeight,
            align: col.align,
          };
        });

        rows.push({
          rowIndex: rowIdx,
          y: currentY,
          height: rowHeight,
          isEven,
          cells,
        });

        currentY += rowHeight;
      });
    }

    return {
      columns,
      rows,
      totalWidth: Math.round(totalWidth),
      totalHeight: Math.round(currentY),
      headerHeight,
    };
  }

  /**
   * Compute virtual windowing bounds for large dataset rendering.
   */
  public static computeVirtualWindow(
    totalRows: number,
    rowHeight = 36,
    scrollTop = 0,
    viewportHeight = 400,
    overscan = 3
  ): VirtualWindow {
    const totalHeight = totalRows * rowHeight;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRowCount = Math.ceil(viewportHeight / rowHeight);
    const endRow = Math.min(totalRows - 1, startRow + visibleRowCount + overscan * 2);
    const offsetY = startRow * rowHeight;

    return {
      startIndex: startRow,
      endIndex: Math.max(0, endRow),
      offsetY,
      totalHeight,
    };
  }
}
