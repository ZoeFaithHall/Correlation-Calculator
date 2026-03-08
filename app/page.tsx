"use client";

import { useState, useCallback, Suspense } from "react";
import { ControlPanel } from "./components/correlation/ControlPanel";
import { ResultsPanel } from "./components/correlation/ResultsPanel";
import { TimeControls } from "./components/correlation/TimeControls";
import { useCorrelation } from "./hooks/useCorrelation";
import { maxRollingWindow } from "./lib/assetHelpers";
import { useQueryParams } from "./hooks/useQueryParams";
import { useOnboardingStep } from "./hooks/useOnboardingStep";

// ─── Inner page ───────────────────────────────────────────────────────────────

function CorrelationsPage() {
  const { params } = useQueryParams();
  const { state, run } = useCorrelation();
  const step = useOnboardingStep(params);
  const maxWindow = maxRollingWindow(params.startDate, params.endDate);
  const [isStale, setIsStale] = useState(false);

  const handleRun = useCallback(() => {
    setIsStale(false);
    run(params);
  }, [params, run]);

  const handlePresetRun = useCallback(
    (startDate: string, endDate: string, rollingWindow: number) => {
      setIsStale(false);
      run({ ...params, startDate, endDate, rollingWindow });
    },
    [params, run]
  );

  const handleWindowDragEnd = useCallback(
    (rollingWindow: number) => {
      setIsStale(false);
      run({ ...params, rollingWindow });
    },
    [params, run]
  );

  const handleParamsChange = useCallback(() => {
    if (state.status === "success") setIsStale(true);
  }, [state.status]);

  return (
    <div
      className="h-screen flex flex-col bg-zinc-950 text-slate-100 overflow-hidden"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="border-b border-zinc-800 px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-sm bg-lime-400" aria-hidden="true" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight leading-none">
              Correlations
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Rolling Pearson correlation between assets
            </p>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 gap-4 p-4">

        {/* Sidebar */}
        <ControlPanel
          correlationState={state}
          onRun={handleRun}
          onParamsChange={handleParamsChange}
          step={step}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">

          {/* Time controls bar */}
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 shrink-0 flex items-center gap-2 flex-wrap transition-all duration-300"
            style={{
              boxShadow: step === 3
                ? "0 0 0 1px rgba(163,230,53,0.25), 0 0 12px rgba(163,230,53,0.08)"
                : "none",
              opacity: step < 3 ? 0.45 : 1,
              transition: "opacity 0.2s ease, box-shadow 0.3s ease",
            }}
          >
            <TimeControls params={params} onPresetRun={handlePresetRun} />
          </div>

          {/* Results */}
          <ResultsPanel
            correlationState={state}
            designated={params.designated}
            isStale={isStale}
            maxWindow={maxWindow}
            onWindowDragEnd={handleWindowDragEnd}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <Suspense>
      <CorrelationsPage />
    </Suspense>
  );
}