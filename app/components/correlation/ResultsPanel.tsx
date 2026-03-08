"use client";

import dynamic from "next/dynamic";
import { WarningBanner } from "./WarningBanner";
import type { CorrelationState, AssetOption } from "../../lib/correlationTypes";

// ─── Dynamic chart imports ────────────────────────────────────────────────────
// Recharts is heavy — lazy load both charts so they don't block the initial bundle.
// ssr: false because Recharts uses browser APIs unavailable during server render.

const CorrelationHeatmap = dynamic(
  () =>
    import("../charts/CorrelationHeatmap").then((m) => ({
      default: m.CorrelationHeatmap,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={200} /> }
);

const RollingCorrelationChart = dynamic(
  () =>
    import("../charts/RollingCorrelationChart").then((m) => ({
      default: m.RollingCorrelationChart,
    })),
  { ssr: false, loading: () => <ChartSkeleton height={320} /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResultsPanelProps {
  correlationState: CorrelationState;
  designated: AssetOption | null;
  isStale: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResultsPanel({
  correlationState,
  designated,
  isStale,
}: ResultsPanelProps) {
  const { status, data, fatalErrors, warnings } = correlationState;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (status === "idle") {
    return <EmptyState />;
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading results">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
          <div className="px-5 py-4 border-b border-zinc-800">
            <div className="h-4 w-36 bg-zinc-800 rounded" />
            <div className="h-3 w-56 bg-zinc-800 rounded mt-2" />
          </div>
          <div className="p-5">
            <ChartSkeleton height={200} />
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
          <div className="px-5 py-4 border-b border-zinc-800">
            <div className="h-4 w-44 bg-zinc-800 rounded" />
            <div className="h-3 w-64 bg-zinc-800 rounded mt-2" />
          </div>
          <div className="p-5">
            <ChartSkeleton height={320} />
          </div>
        </div>
      </div>
    );
  }

  // ── Fatal error ────────────────────────────────────────────────────────────
  if (status === "error" || fatalErrors.length > 0) {
    return (
      <div
        role="alert"
        className="bg-red-900/20 border border-red-800/50 rounded-xl p-5"
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
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if ((status === "success" || isStale) && data) {
    return (
      <div className="flex flex-col gap-6">
        {/* Stale banner */}
        {isStale && (
          <div
            role="status"
            className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-2.5"
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
        {warnings.length > 0 && <WarningBanner warnings={warnings} />}

        {/* Correlation Matrix */}
        <Section
          title="Correlation Matrix"
          description="Pearson r — all asset pairs over the selected period"
        >
          <CorrelationHeatmap
            matrix={data.correlations.correlationMatrix}
          />
        </Section>

        {/* Rolling Chart */}
        <Section
          title="Rolling Correlation"
          description={`One line per comparison asset · hover to inspect values`}
        >
          <RollingCorrelationChart
            data={data.correlations.correlationChart}
            designatedSymbol={designated?.value ?? ""}
          />
        </Section>
      </div>
    );
  }

  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full rounded-lg bg-zinc-800"
      style={{ height }}
      aria-hidden="true"
    />
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
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
        Correlation matrix and rolling chart will appear here
      </p>
    </div>
  );
}