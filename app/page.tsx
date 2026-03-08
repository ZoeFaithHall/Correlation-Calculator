"use client";

import { useState, useCallback, Suspense } from "react";
import { ControlPanel } from "./components/correlation/ControlPanel";
import { ResultsPanel } from "./components/correlation/ResultsPanel";
import { useCorrelation } from "./hooks/useCorrelation";
import { useQueryParams } from "./hooks/useQueryParams";

// ─── Inner page (needs Suspense boundary for useSearchParams) ─────────────────

function CorrelationsPage() {
  const { params } = useQueryParams();
  const { state, run } = useCorrelation();
  const [isStale, setIsStale] = useState(false);

  const handleRun = useCallback(() => {
    setIsStale(false);
    run(params);
  }, [params, run]);

  const handleParamsChange = useCallback(() => {
    if (state.status === "success") setIsStale(true);
  }, [state.status]);

  return (
    <div
      className="min-h-screen bg-zinc-950 text-slate-100"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-2 h-6 rounded-sm bg-lime-400" aria-hidden="true" />
          <div>
            <h1 className="text-base font-semibold tracking-tight leading-none">
              Correlations
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Rolling Pearson correlation between assets
            </p>
          </div>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="max-w-7xl mx-auto p-6 flex gap-6 items-start">
        <ControlPanel
          correlationState={state}
          onRun={handleRun}
          onParamsChange={handleParamsChange}
        />
        <main className="flex-1 min-w-0">
          <ResultsPanel
            correlationState={state}
            designated={params.designated}
            isStale={isStale}
          />
        </main>
      </div>
    </div>
  );
}

// ─── Export (Suspense required for useSearchParams in App Router) ─────────────

export default function Page() {
  return (
    <Suspense>
      <CorrelationsPage />
    </Suspense>
  );
}