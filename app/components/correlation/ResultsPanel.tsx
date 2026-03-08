"use client";

import dynamic from "next/dynamic";
import { WarningBanner } from "./WarningBanner";
import { WindowScrubber } from "./WindowScrubber";
import type { CorrelationState, AssetOption } from "../../lib/correlationTypes";

// ─── Dynamic chart imports ────────────────────────────────────────────────────

const CorrelationHeatmap = dynamic(
  () =>
    import("../charts/CorrelationHeatmap").then((m) => ({
      default: m.CorrelationHeatmap,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

const RollingCorrelationChart = dynamic(
  () =>
    import("../charts/RollingCorrelationChart").then((m) => ({
      default: m.RollingCorrelationChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultsPanelProps {
  correlationState: CorrelationState;
  designated: AssetOption | null;
  isStale: boolean;
  onWindowDragEnd: (window: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResultsPanel({
  correlationState,
  designated,
  isStale,
  onWindowDragEnd,
}: ResultsPanelProps) {
  const { status, data, fatalErrors, warnings } = correlationState;

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div
          className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4"
          aria-hidden="true"
        >
          <svg
            className="w-5 h-5 text-zinc-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-400">
          Select assets and run analysis
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          Choose a time range above or run with the current date window
        </p>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex-1 flex flex-col gap-3" aria-busy="true" aria-label="Loading results">
        <div className="flex gap-3 flex-1">
          <div className="w-[38%] bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse">
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="h-3.5 w-32 bg-zinc-800 rounded" />
            </div>
            <div className="p-4 h-full">
              <ChartSkeleton />
            </div>
          </div>
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse">
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="h-3.5 w-40 bg-zinc-800 rounded" />
            </div>
            <div className="p-4 h-full">
              <ChartSkeleton />
            </div>
          </div>
        </div>
        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (status === "error" || fatalErrors.length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div
          role="alert"
          className="bg-red-900/20 border border-red-800/50 rounded-lg p-5 max-w-md w-full"
        >
          <p className="text-sm font-semibold text-red-400 mb-2">
            Analysis failed
          </p>
          <ul className="flex flex-col gap-1">
            {fatalErrors.map((e, i) => (
              <li key={i} className="text-xs text-red-300/80">
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if ((status === "success" || isStale) && data) {
    return (
      <div className="flex-1 flex flex-col gap-3 min-h-0">

        {/* Stale banner */}
        {isStale && (
          <div
            role="status"
            className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-2 shrink-0"
          >
            <svg
              className="w-3.5 h-3.5 text-zinc-400 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <p className="text-xs text-zinc-400">
              Configuration changed — re-run to update results.
            </p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="shrink-0">
            <WarningBanner warnings={warnings} />
          </div>
        )}

        {/* Charts side by side */}
        <div className="flex gap-3 flex-1 min-h-0">

          {/* Heatmap — fixed width */}
          <section className="w-[38%] shrink-0 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">Correlation Matrix</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Pearson r — all pairs, selected period</p>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <CorrelationHeatmap matrix={data.correlations.correlationMatrix} />
            </div>
          </section>

          {/* Rolling chart — fills remaining space */}
          <section className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col overflow-hidden min-w-0">
            <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
              <h2 className="text-sm font-semibold text-slate-100">Rolling Correlation</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                One line per comparison asset · hover to inspect
              </p>
            </div>
            <div className="p-4 flex-1 min-h-0">
              <RollingCorrelationChart
                data={data.correlations.correlationChart}
                designatedSymbol={designated?.value ?? ""}
              />
            </div>
          </section>
        </div>

        {/* Window scrubber */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-3 shrink-0">
          <WindowScrubber onDragEnd={onWindowDragEnd} />
        </div>
      </div>
    );
  }

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div
      className="w-full h-full rounded-lg bg-zinc-800 min-h-[120px]"
      aria-hidden="true"
    />
  );
}