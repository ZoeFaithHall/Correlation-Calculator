import type { RollingCorrelationSeries } from "./correlationTypes";

// ─── Color palette ────────────────────────────────────────────────────────────

export const CHART_COLORS = [
  "#a3e635", // lime (brand primary)
  "#60a5fa", // blue
  "#f97316", // orange
  "#a78bfa", // purple
  "#f472b6", // pink
] as const;

export type ChartColor = (typeof CHART_COLORS)[number];

export function getChartColor(index: number): ChartColor {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function buildColorMap(symbols: string[]): Record<string, ChartColor> {
  return Object.fromEntries(symbols.map((sym, i) => [sym, getChartColor(i)]));
}

// ─── Correlation color scale ──────────────────────────────────────────────────

export function correlationBgColor(value: number): string {
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  const lerp = (a: number, b: number, t: number) =>
    Math.round(a + (b - a) * clamp(t));

  const [nr, ng, nb] = [39, 39, 42];   // zinc-800 — neutral
  const [pr, pg, pb] = [101, 163, 53]; // lime-600 — positive
  const [rr, rg, rb] = [185, 28, 28];  // red-700  — negative

  if (value >= 0) {
    return `rgb(${lerp(nr, pr, value)},${lerp(ng, pg, value)},${lerp(nb, pb, value)})`;
  }

  const t = Math.abs(value);
  return `rgb(${lerp(nr, rr, t)},${lerp(ng, rg, t)},${lerp(nb, rb, t)})`;
}

export function correlationTextColor(value: number): string {
  return value > 0.65 ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.90)";
}

// ─── Number formatting ────────────────────────────────────────────────────────

export function formatCorrelation(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

export function formatCorrelationPrecise(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(3)}`;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatAxisDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export function formatTooltipDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Data transformation ──────────────────────────────────────────────────────

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

export function getMatrixSymbols(
  matrix: Array<Record<string, number>>
): string[] {
  if (matrix.length === 0) return [];
  return Object.keys(matrix[0]);
}

/**
 * Converts the matrix array into a keyed lookup.
 *
 * Previously identified row symbols by finding value === 1.0 (self-correlation),
 * which is fragile — floating point can return 0.9999999. Now uses the ordered
 * symbols from getMatrixSymbols, which we already have from the matrix keys.
 */
export function buildMatrixLookup(
  matrix: Array<Record<string, number>>
): Record<string, Record<string, number>> {
  const symbols = getMatrixSymbols(matrix);
  const lookup: Record<string, Record<string, number>> = {};

  matrix.forEach((row, i) => {
    const symbol = symbols[i];
    if (symbol) lookup[symbol] = row;
  });

  return lookup;
}