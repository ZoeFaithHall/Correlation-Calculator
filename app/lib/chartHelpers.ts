import type { RollingCorrelationSeries } from "./correlationTypes";

// ─── Color palette ────────────────────────────────────────────────────────────

/**
 * Ordered color palette for comparison asset lines and chips.
 * Index 0 is lime. Subsequent colors are visually distinct
 * and accessible against darker backgrounds.
 */
export const CHART_COLORS = [
  "#a3e635", // lime   (brand primary)
  "#60a5fa", // blue
  "#f97316", // orange
  "#a78bfa", // purple
  "#f472b6", // pink
] as const;

export type ChartColor = (typeof CHART_COLORS)[number];

/**
 * Returns a stable color for a given symbol index.
 * Wraps if more symbols than palette entries (shouldn't happen — max 5 comparisons).
 */
export function getChartColor(index: number): ChartColor {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Builds a symbol → color map for a given list of symbols.
 */
export function buildColorMap(symbols: string[]): Record<string, ChartColor> {
  return Object.fromEntries(
    symbols.map((sym, i) => [sym, getChartColor(i)])
  );
}

// ─── Correlation color scale ──────────────────────────────────────────────────

/**
 * Maps a Pearson r value (-1 to +1) to a background color string.
 *
 * -1.0 → red-700    rgb(185, 28, 28)
 *  0.0 → zinc-800   rgb(39, 39, 42)   ← neutral midpoint
 * +1.0 → lime-600   rgb(101, 163, 53)
 *
 * Used by the heatmap cells.
 */
export function correlationBgColor(value: number): string {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const lerp = (a: number, b: number, t: number) =>
    Math.round(a + (b - a) * clamp(t));

  // Neutral zero: zinc-800
  const [nr, ng, nb] = [39, 39, 42];
  // Positive: lime-600
  const [pr, pg, pb] = [101, 163, 53];
  // Negative: red-700
  const [rr, rg, rb] = [185, 28, 28];

  if (value >= 0) {
    return `rgb(${lerp(nr, pr, value)},${lerp(ng, pg, value)},${lerp(nb, pb, value)})`;
  }

  const t = Math.abs(value);
  return `rgb(${lerp(nr, rr, t)},${lerp(ng, rg, t)},${lerp(nb, rb, t)})`;
}

/**
 * Returns a readable text color for a given correlation value.
 * Lime end of the scale is bright enough to need dark text.
 */
export function correlationTextColor(value: number): string {
  return value > 0.65 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.90)";
}

// ─── Number formatting ────────────────────────────────────────────────────────

/**
 * Formats a Pearson r value for display.
 * Always shows sign and 2 decimal places: "+0.72", "-0.14", "+1.00"
 */
export function formatCorrelation(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

/**
 * Same as formatCorrelation but 3 decimal places — used in chart tooltips
 * where precision matters more than brevity.
 */
export function formatCorrelationPrecise(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

/**
 * Formats a timestamp for the chart X-axis tick labels.
 * Short form: "Jan '24"
 */
export function formatAxisDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

/**
 * Formats a timestamp for the chart tooltip header.
 * Full form: "January 15, 2024"
 */
export function formatTooltipDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Data transformation ──────────────────────────────────────────────────────

/**
 * Recharts expects a single flat array of objects:
 * [{ ts: 1234567890, BTC: 0.72, ETH: 0.41 }, ...]
 *
 * The API returns separate series per symbol:
 * { BTC: [[ts, val], ...], ETH: [[ts, val], ...] }
 *
 * This merges them. Missing values for a symbol at a given timestamp
 * are left undefined (Recharts handles gaps with connectNulls).
 */
export function mergeTimestampSeries(
  data: Record<string, RollingCorrelationSeries>
): Array<Record<string, number>> {
  const tsMap = new Map<number, Record<string, number>>();

  Object.entries(data).forEach(([symbol, series]) => {
    series.forEach(([ts, value]) => {
      if (!tsMap.has(ts)) tsMap.set(ts, { ts });
      tsMap.get(ts)![symbol] = value;
    });
  });

  return Array.from(tsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row);
}

/**
 * Extracts the ordered list of symbols from a correlation matrix.
 * The matrix is an array of row objects; each row's keys are the symbols.
 */
export function getMatrixSymbols(
  matrix: Array<Record<string, number>>
): string[] {
  if (matrix.length === 0) return [];
  return Object.keys(matrix[0]);
}

/**
 * Converts the matrix array into a keyed lookup:
 * { BTC: { BTC: 1, ETH: 0.72 }, ETH: { BTC: 0.72, ETH: 1 } }
 *
 * Faster than scanning the array on every cell render.
 */
export function buildMatrixLookup(
  matrix: Array<Record<string, number>>
): Record<string, Record<string, number>> {
  const lookup: Record<string, Record<string, number>> = {};

  matrix.forEach((row) => {
    // Find the self-correlation entry (value === 1.0) to identify the row symbol
    const symbol = Object.keys(row).find((k) => row[k] === 1.0);
    if (symbol) lookup[symbol] = row;
  });

  return lookup;
}