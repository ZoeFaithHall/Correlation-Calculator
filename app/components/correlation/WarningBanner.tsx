"use client";

import { useState } from "react";
import type { CorrelationWarning } from "../../lib/correlationTypes";

// ─── Single warning ───────────────────────────────────────────────────────────

const WARNING_COPY: Record<CorrelationWarning["error"], string> = {
  data_missing:
    "Data exists but may be incomplete for the requested range.",
  data_range_short:
    "Requested range exceeds available data.",
};

interface WarningItemProps {
  warning: CorrelationWarning;
  onDismiss: (symbol: string) => void;
}

function WarningItem({ warning, onDismiss }: WarningItemProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 bg-amber-400/8 border border-amber-400/20 rounded-lg px-3 py-2"
    >
      <svg
        className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-amber-300/90">
          <span className="font-mono font-semibold">{warning.symbol}</span>
          {" — "}
          {WARNING_COPY[warning.error]}
        </p>
        <p className="text-[10px] text-amber-400/60 mt-0.5">
          Available: {warning.startDate} → {warning.endDate}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(warning.symbol)}
        aria-label={`Dismiss warning for ${warning.symbol}`}
        className="text-amber-400/50 hover:text-amber-400 transition-colors shrink-0 mt-0.5"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Warning list ─────────────────────────────────────────────────────────────

interface WarningBannerProps {
  warnings: CorrelationWarning[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = warnings.filter((w) => !dismissed.has(w.symbol));

  if (visible.length === 0) return null;

  const dismiss = (symbol: string) =>
    setDismissed((prev) => new Set([...prev, symbol]));

  return (
    <div className="flex flex-col gap-2" aria-label="Data warnings">
      {visible.map((w) => (
        <WarningItem key={w.symbol} warning={w} onDismiss={dismiss} />
      ))}
    </div>
  );
}