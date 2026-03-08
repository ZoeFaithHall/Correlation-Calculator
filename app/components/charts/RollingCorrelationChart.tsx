"use client";

import { useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  buildColorMap,
  mergeTimestampSeries,
  formatAxisDate,
  formatTooltipDate,
  formatCorrelationPrecise,
} from "../../lib/chartHelpers";
import type { RollingCorrelationSeries } from "../../lib/correlationTypes";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  dataKey: string;
  value?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: number;
  colorMap: Record<string, string>;
  designatedSymbol: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  colorMap,
  designatedSymbol,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const sorted = [...payload].sort(
    (a, b) => (b.value ?? 0) - (a.value ?? 0)
  );

  return (
    <div
      className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl px-4 py-3 min-w-[176px]"
      role="tooltip"
    >
      <p className="text-xs text-zinc-400 mb-2.5 font-medium">
        {formatTooltipDate(label as number)}
      </p>

      <div className="flex flex-col gap-1.5">
        {sorted.map((entry) => {
          const val = entry.value ?? 0;
          const color =
            val > 0.2 ? "#86efac" : val < -0.2 ? "#fca5a5" : "#94a3b8";

          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: colorMap[entry.dataKey as string] ?? "#94a3b8",
                  }}
                  aria-hidden="true"
                />
                <span className="text-xs font-mono text-zinc-300">
                  {entry.dataKey}
                </span>
              </div>
              <span
                className="text-xs font-mono font-semibold tabular-nums"
                style={{ color }}
              >
                {formatCorrelationPrecise(val)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-600 mt-2.5 pt-2 border-t border-zinc-800">
        vs{" "}
        <span className="font-mono text-zinc-500">{designatedSymbol}</span>
      </p>
    </div>
  );
}

// ─── Toggle button ────────────────────────────────────────────────────────────

function ToggleButton({
  symbol,
  color,
  active,
  onToggle,
}: {
  symbol: string;
  color: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border"
      style={{
        background: active ? `${color}18` : "transparent",
        borderColor: active ? color : "#3f3f46",
        color: active ? color : "#52525b",
      }}
    >
      <span
        className="w-2 h-2 rounded-full transition-colors"
        style={{ background: active ? color : "#3f3f46" }}
        aria-hidden="true"
      />
      {symbol}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RollingCorrelationChartProps {
  data: Record<string, RollingCorrelationSeries>;
  designatedSymbol: string;
}

export function RollingCorrelationChart({
  data,
  designatedSymbol,
}: RollingCorrelationChartProps) {
  const symbols = useMemo(() => Object.keys(data), [data]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const colorMap = useMemo(() => buildColorMap(symbols), [symbols]);

  // Merge all series into a single flat array for Recharts
  const chartData = useMemo(() => mergeTimestampSeries(data), [data]);

  const toggle = useCallback((sym: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(sym) ? next.delete(sym) : next.add(sym);
      return next;
    });
  }, []);

  if (symbols.length === 0 || chartData.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-8">
        No chart data available.
      </p>
    );
  }

  return (
    <div>
      {/* Per-ticker toggle buttons */}
      <div
        className="flex flex-wrap gap-2 mb-5"
        role="group"
        aria-label="Toggle asset lines"
      >
        {symbols.map((sym) => (
          <ToggleButton
            key={sym}
            symbol={sym}
            color={colorMap[sym]}
            active={!hidden.has(sym)}
            onToggle={() => toggle(sym)}
          />
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={["auto", "auto"]}
            tickFormatter={formatAxisDate}
            tick={{ fontSize: 10, fill: "#52525b", fontFamily: "monospace" }}
            axisLine={{ stroke: "#27272a" }}
            tickLine={false}
          />

          <YAxis
            domain={[-1, 1]}
            tickCount={5}
            tickFormatter={(v: number) =>
              v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1)
            }
            tick={{ fontSize: 10, fill: "#52525b", fontFamily: "monospace" }}
            axisLine={false}
            tickLine={false}
            width={44}
          />

          {/* Reference lines */}
          <ReferenceLine
            y={0}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="4 4"
          />
          <ReferenceLine
            y={0.5}
            stroke="rgba(163,230,53,0.1)"
            strokeDasharray="2 4"
          />
          <ReferenceLine
            y={-0.5}
            stroke="rgba(185,28,28,0.12)"
            strokeDasharray="2 4"
          />

          <Tooltip
            content={
              <CustomTooltip
                colorMap={colorMap}
                designatedSymbol={designatedSymbol}
              />
            }
            cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
          />

          {symbols.map((sym) => (
            <Line
              key={sym}
              type="monotone"
              dataKey={sym}
              stroke={colorMap[sym]}
              strokeWidth={hidden.has(sym) ? 0 : 1.5}
              dot={false}
              activeDot={
                hidden.has(sym)
                  ? false
                  : { r: 3, fill: colorMap[sym], strokeWidth: 0 }
              }
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Axis annotations */}
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-zinc-600">
          ← inverse correlation
        </span>
        <span className="text-[10px] text-zinc-600">
          positive correlation →
        </span>
      </div>
    </div>
  );
}