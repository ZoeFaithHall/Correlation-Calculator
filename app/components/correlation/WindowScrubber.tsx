"use client";

import { useQueryParams } from "../../hooks/useQueryParams";
import { MIN_WINDOW } from "../../lib/assetHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WindowScrubberProps {
  /** Maximum allowed rolling window for the current date range */
  maxWindow: number;
  onDragEnd: (window: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WindowScrubber({ maxWindow, onDragEnd }: WindowScrubberProps) {
  const { params, setRollingWindow } = useQueryParams();

  // Clamp the current value to the allowed range — handles cases where
  // the date range shrinks after a window value was set
  const clamped = Math.min(params.rollingWindow, maxWindow);
  const pct = ((clamped - MIN_WINDOW) / (maxWindow - MIN_WINDOW)) * 100;

  const isClamped = clamped !== params.rollingWindow;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRollingWindow(Number(e.target.value));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLInputElement>) {
    const raw = Number((e.target as HTMLInputElement).value);
    // Ensure we never fire a run with a value above the max
    const safe = Math.min(raw, maxWindow);
    if (safe !== raw) setRollingWindow(safe);
    onDragEnd(safe);
  }

  return (
    <div className="flex items-center gap-3 px-1">
      <span className="text-[10px] font-mono text-zinc-600 whitespace-nowrap w-14 text-right">
        {MIN_WINDOW}d
      </span>

      <div className="relative flex-1 h-4 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-0.5 rounded-full bg-zinc-700" />
        {/* Fill */}
        <div
          className="absolute h-0.5 rounded-full bg-lime-400"
          style={{ width: `${pct}%` }}
        />
        {/* Input */}
        <input
          type="range"
          min={MIN_WINDOW}
          max={maxWindow}
          step={1}
          value={clamped}
          onChange={handleChange}
          onPointerUp={handlePointerUp}
          aria-label="Rolling window in trading days"
          aria-valuemin={MIN_WINDOW}
          aria-valuemax={maxWindow}
          aria-valuenow={clamped}
          className="absolute w-full opacity-0 cursor-pointer h-4"
        />
        {/* Thumb */}
        <div
          className="absolute w-3 h-3 rounded-full bg-lime-400 border-2 border-zinc-900 shadow pointer-events-none"
          style={{ left: `calc(${pct}% - 6px)` }}
          aria-hidden="true"
        />
      </div>

      <span className="text-[10px] font-mono text-zinc-600 whitespace-nowrap w-14">
        {maxWindow}d
      </span>

      <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-full px-2.5 py-1">
        <span className="text-xs font-mono font-semibold text-lime-400">
          {clamped}
        </span>
        <span className="text-[10px] text-zinc-500">day window</span>
        {isClamped && (
          <span
            className="text-[9px] text-amber-400 ml-1"
            title="Window was reduced to fit your date range"
          >
            clamped
          </span>
        )}
      </div>
    </div>
  );
}