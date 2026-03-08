"use client";

import { useQueryParams } from "../../hooks/useQueryParams";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WindowScrubberProps {
  onDragEnd: (window: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WindowScrubber({ onDragEnd }: WindowScrubberProps) {
  const { params, setRollingWindow } = useQueryParams();
  const { rollingWindow } = params;

  const MIN = 14;
  const MAX = 365;
  const pct = ((rollingWindow - MIN) / (MAX - MIN)) * 100;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Update URL param on every tick for visual feedback
    setRollingWindow(Number(e.target.value));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLInputElement>) {
    // Fire the actual run only when drag ends
    onDragEnd(Number((e.target as HTMLInputElement).value));
  }

  return (
    <div className="flex items-center gap-3 px-1">
      <span className="text-[10px] font-mono text-zinc-600 whitespace-nowrap w-14 text-right">
        {MIN}d
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
          min={MIN}
          max={MAX}
          step={1}
          value={rollingWindow}
          onChange={handleChange}
          onPointerUp={handlePointerUp}
          aria-label="Rolling window in trading days"
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
        {MAX}d
      </span>

      <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-full px-2.5 py-1">
        <span className="text-xs font-mono font-semibold text-lime-400">
          {rollingWindow}
        </span>
        <span className="text-[10px] text-zinc-500">day window</span>
      </div>
    </div>
  );
}