"use client";

import { useMemo } from "react";
import { DesignatedSelector, ComparisonSelector } from "./AssetSelector";
import { Spinner } from "../ui/Badge";
import { useQueryParams } from "../../hooks/useQueryParams";
import { validateParams, getMinStartDate, toISODate } from "../../lib/assetHelpers";
import type { CorrelationState } from "../../lib/correlationTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ControlPanelProps {
  correlationState: CorrelationState;
  onRun: () => void;
  onParamsChange?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ControlPanel({
  correlationState,
  onRun,
  onParamsChange,
}: ControlPanelProps) {
  const {
    params,
    setDesignated,
    setComparisons,
    setStartDate,
    setEndDate,
    setRollingWindow,
  } = useQueryParams();

  const { designated, comparisons, startDate, endDate, rollingWindow } = params;

  // Validation runs on every param change — never on submission
  const validation = useMemo(() => validateParams(params), [params]);

  // Min start date constrained by the latest inception date among selected assets
  const allSelected = useMemo(
    () => (designated ? [designated, ...comparisons] : comparisons),
    [designated, comparisons]
  );
  const minStartDate = useMemo(
    () => getMinStartDate(allSelected),
    [allSelected]
  );

  const today = toISODate(new Date());
  const isLoading = correlationState.status === "loading";

  // Notify parent that params changed so it can mark results stale
  function handleParamChange<T extends unknown[]>(fn: (...args: T) => void) {
    return (...args: T) => {
      fn(...args);
      onParamsChange?.();
    };
  }

  return (
    <aside className="w-72 shrink-0 sticky top-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-5">

        {/* Designated */}
        <DesignatedSelector
          selected={designated}
          onSelect={handleParamChange(setDesignated)}
          exclude={comparisons.map((a) => a.value)}
        />

        {/* Comparisons */}
        <ComparisonSelector
          selected={comparisons}
          onSelect={handleParamChange(setComparisons)}
          exclude={designated ? [designated.value] : []}
          max={5}
        />

        {/* Date range */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-medium text-zinc-400 mb-0.5">
            Date Range
          </legend>

          <div>
            <label
              htmlFor="start-date"
              className="text-xs text-zinc-500 mb-1 block"
            >
              Start
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              min={minStartDate}
              max={endDate}
              onChange={(e) =>
                handleParamChange(setStartDate)(e.target.value)
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="end-date"
              className="text-xs text-zinc-500 mb-1 block"
            >
              End
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              max={today}
              onChange={(e) =>
                handleParamChange(setEndDate)(e.target.value)
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500 transition-colors"
            />
          </div>
        </fieldset>

        {/* Rolling window */}
        <div>
          <label
            htmlFor="rolling-window"
            className="text-xs font-medium text-zinc-400 mb-1.5 block"
          >
            Rolling Window
          </label>
          <div className="flex items-center gap-2">
            <input
              id="rolling-window"
              type="number"
              min={30}
              max={365}
              value={rollingWindow}
              onChange={(e) =>
                handleParamChange(setRollingWindow)(Number(e.target.value))
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-lime-500 transition-colors"
            />
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              trading days
            </span>
          </div>
        </div>

        {/* Validation hint */}
        {!validation.valid && validation.reason && (
          <p
            role="alert"
            className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2"
          >
            {validation.reason}
          </p>
        )}

        {/* Run button */}
        <button
          type="button"
          onClick={onRun}
          disabled={!validation.valid || isLoading}
          aria-busy={isLoading}
          className="w-full bg-lime-400 hover:bg-lime-300 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-sm rounded-lg py-2.5 transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner size={14} />
              Running…
            </>
          ) : (
            "Run Analysis"
          )}
        </button>
      </div>
    </aside>
  );
}