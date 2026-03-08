"use client";

import { useMemo } from "react";
import { DesignatedSelector, ComparisonSelector } from "./AssetSelector";
import { Spinner } from "../ui/Badge";
import { useQueryParams } from "../../hooks/useQueryParams";
import { validateParams } from "../../lib/assetHelpers";
import type { CorrelationState } from "../../lib/correlationTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ControlPanelProps {
  correlationState: CorrelationState;
  onRun: () => void;
  onParamsChange?: () => void;
  // Step passed down from page so TimeControls can also react
  step: 1 | 2 | 3;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ControlPanel({
  correlationState,
  onRun,
  onParamsChange,
  step,
}: ControlPanelProps) {
  const { params, setDesignated, setComparisons } = useQueryParams();
  const { designated, comparisons } = params;

  const validation = useMemo(() => validateParams(params), [params]);
  const isLoading = correlationState.status === "loading";

  function handleParamChange<T extends unknown[]>(fn: (...args: T) => void) {
    return (...args: T) => {
      fn(...args);
      onParamsChange?.();
    };
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-4 flex-1" >

        {/* Step 1 — Designated */}
        <div className="flex flex-col gap-1.5">
          <div
            className="rounded-lg transition-all duration-300"
            style={{
              boxShadow: step === 1
                ? "0 0 0 2px rgba(163,230,53,0.5), 0 0 16px rgba(163,230,53,0.15)"
                : "none",
            }}
          >
            <DesignatedSelector
              selected={designated}
              onSelect={handleParamChange(setDesignated)}
              exclude={comparisons.map((a) => a.value)}
            />
          </div>
        </div>

        {/* Step 2 — Comparisons */}
        <div className="flex flex-col gap-1.5">
          <div
            className="rounded-lg transition-all duration-300"
            style={{
              boxShadow: step === 2
                ? "0 0 0 2px rgba(163,230,53,0.5), 0 0 16px rgba(163,230,53,0.15)"
                : "none",
              opacity: step === 1 ? 0.4 : 1,
              transition: "opacity 0.2s ease, box-shadow 0.3s ease",
            }}
          >
            <ComparisonSelector
              selected={comparisons}
              onSelect={handleParamChange(setComparisons)}
              exclude={designated ? [designated.value] : []}
              max={5}
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Validation hint */}
        {!validation.valid && validation.reason && step === 3 && (
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
          className="w-full font-semibold text-sm rounded-lg py-2.5 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: !validation.valid || isLoading ? "#27272a" : "#a3e635",
            color: !validation.valid || isLoading ? "#52525b" : "#0a0a0a",
            boxShadow: step === 3 && validation.valid
              ? "0 0 0 2px rgba(163,230,53,0.5), 0 0 20px rgba(163,230,53,0.2)"
              : "none",
          }}
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