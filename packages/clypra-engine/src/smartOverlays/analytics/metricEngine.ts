/**
 * Metric Engine
 *
 * Governing evaluation subsystem for KPI, Metric, and Telemetry cards.
 * Provides deterministic number/currency/percent formatting, robust delta
 * and trend calculations, and keyframe count-up interpolation.
 */

export interface MetricFormatOptions {
  format?: "number" | "currency" | "percent" | "compact";
  currencySymbol?: string;
  decimals?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
}

export interface MetricDelta {
  absoluteChange: number;
  percentageChange: number;
  direction: "up" | "down" | "neutral";
  formattedDelta: string;
  formattedPercentage: string;
}

export interface MetricEvaluationResult {
  rawValue: number;
  animatedValue: number;
  formattedValue: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  delta?: MetricDelta;
  progress: number;
}

export type CountUpEasing = "linear" | "easeIn" | "easeOut" | "easeInOut";

export class MetricEngine {
  /**
   * Format numeric value into human-readable strings (currency, percent, compact abbreviations).
   */
  public static formatValue(value: number | string, options: MetricFormatOptions = {}): string {
    const {
      format = "number",
      currencySymbol = "$",
      decimals,
      locale = "en-US",
      prefix = "",
      suffix = "",
    } = options;

    const num = typeof value === "number" ? value : parseFloat(String(value));
    if (isNaN(num)) return `${prefix}${value}${suffix}`;

    let formattedCore = "";

    switch (format) {
      case "compact": {
        const absVal = Math.abs(num);
        const sign = num < 0 ? "-" : "";

        if (absVal >= 1_000_000_000) {
          const d = decimals !== undefined ? decimals : 2;
          formattedCore = `${sign}${(absVal / 1_000_000_000).toFixed(d)}B`;
        } else if (absVal >= 1_000_000) {
          const d = decimals !== undefined ? decimals : 1;
          formattedCore = `${sign}${(absVal / 1_000_000).toFixed(d)}M`;
        } else if (absVal >= 1_000) {
          const d = decimals !== undefined ? decimals : 0;
          formattedCore = `${sign}${(absVal / 1_000).toFixed(d)}K`;
        } else {
          const d = decimals !== undefined ? decimals : (Number.isInteger(num) ? 0 : 2);
          formattedCore = num.toFixed(d);
        }
        break;
      }

      case "currency": {
        const d = decimals !== undefined ? decimals : (Number.isInteger(num) ? 0 : 2);
        const parts = num.toLocaleString(locale, {
          minimumFractionDigits: d,
          maximumFractionDigits: d,
        });
        formattedCore = `${currencySymbol}${parts}`;
        break;
      }

      case "percent": {
        // If value is a ratio between 0 and 1, convert to percent representation
        const pctValue = Math.abs(num) <= 1.0 && num !== 0 ? num * 100 : num;
        const d = decimals !== undefined ? decimals : (Number.isInteger(pctValue) ? 0 : 1);
        formattedCore = `${pctValue.toFixed(d)}%`;
        break;
      }

      case "number":
      default: {
        const d = decimals !== undefined ? decimals : (Number.isInteger(num) ? 0 : 2);
        formattedCore = num.toLocaleString(locale, {
          minimumFractionDigits: d,
          maximumFractionDigits: d,
        });
        break;
      }
    }

    return `${prefix}${formattedCore}${suffix}`;
  }

  /**
   * Calculate absolute delta, percentage difference, and directional trend with edge-case hardening.
   */
  public static calculateDelta(currentValue: number, previousValue?: number): MetricDelta | undefined {
    if (previousValue === undefined || isNaN(previousValue)) {
      return undefined;
    }

    const absoluteChange = currentValue - previousValue;
    let percentageChange = 0;

    if (previousValue === 0) {
      if (currentValue === 0) {
        percentageChange = 0;
      } else {
        percentageChange = currentValue > 0 ? 100 : -100;
      }
    } else {
      percentageChange = (absoluteChange / Math.abs(previousValue)) * 100;
    }

    let direction: "up" | "down" | "neutral" = "neutral";
    if (Math.abs(absoluteChange) > 0.0001) {
      direction = absoluteChange > 0 ? "up" : "down";
    }

    const sign = absoluteChange > 0 ? "+" : "";
    const formattedDelta = `${sign}${this.formatValue(absoluteChange)}`;
    const formattedPercentage = `${sign}${percentageChange.toFixed(1)}%`;

    return {
      absoluteChange: Math.round(absoluteChange * 1000) / 1000,
      percentageChange: Math.round(percentageChange * 100) / 100,
      direction,
      formattedDelta,
      formattedPercentage,
    };
  }

  /**
   * Interpolate count-up animation progress from start to target value using easing curves.
   */
  public static interpolateCountUp(
    targetValue: number,
    startValue = 0,
    progress = 1.0,
    easing: CountUpEasing = "easeOut"
  ): number {
    const clampedT = Math.min(1.0, Math.max(0.0, progress));

    let easedT = clampedT;
    switch (easing) {
      case "linear":
        easedT = clampedT;
        break;
      case "easeIn":
        easedT = clampedT * clampedT;
        break;
      case "easeOut":
        easedT = 1 - Math.pow(1 - clampedT, 3);
        break;
      case "easeInOut":
        easedT = clampedT < 0.5
          ? 4 * clampedT * clampedT * clampedT
          : 1 - Math.pow(-2 * clampedT + 2, 3) / 2;
        break;
    }

    const interpolated = startValue + (targetValue - startValue) * easedT;
    return Number.isInteger(targetValue) && Number.isInteger(startValue)
      ? Math.round(interpolated)
      : Math.round(interpolated * 100) / 100;
  }

  /**
   * Evaluate full Metric state for animation timestamp t.
   */
  public static evaluateMetric(
    rawValue: number | string,
    options: MetricFormatOptions & {
      previousValue?: number;
      countUp?: boolean;
      progress?: number;
      easing?: CountUpEasing;
      label?: string;
    } = {}
  ): MetricEvaluationResult {
    const num = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue)) || 0;
    const progress = options.progress !== undefined ? options.progress : 1.0;
    const animatedValue = options.countUp
      ? this.interpolateCountUp(num, 0, progress, options.easing || "easeOut")
      : num;

    const formattedValue = this.formatValue(animatedValue, options);
    const delta = this.calculateDelta(num, options.previousValue);

    return {
      rawValue: num,
      animatedValue,
      formattedValue,
      label: options.label,
      prefix: options.prefix,
      suffix: options.suffix,
      delta,
      progress,
    };
  }
}
