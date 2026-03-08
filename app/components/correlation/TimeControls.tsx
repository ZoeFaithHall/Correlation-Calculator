"use client";

import { useState } from "react";
import { useQueryParams } from "../../hooks/useQueryParams";
import { toISODate } from "../../lib/assetHelpers";
import type { CorrelationParams } from "../../lib/correlationTypes";

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: "1M", months: 1,  maxWindow: 14 },
  { label: "3M", months: 3,  maxWindow: 30 },
  { label: "6M", months: 6,  maxWindow: 60 },
  { label: "1Y", months: 12, maxWindow: 90 },
  { label: "2Y", months: 24, maxWindow: 90 },
  { label: "5Y", months: 60, maxWindow: 90 },
] as const;

function subtractMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return toISODate(d);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeControlsProps {
  params: CorrelationParams;
  onPresetRun: (startDate: string, endDate: string, rollingWindow: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimeControls({ params, onPresetRun }: TimeControlsProps) {
  const { setStartDate, setEndDate, setRollingWindow } = useQueryParams();
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);

  const today = toISODate(new Date());

  function handlePreset(months: number, maxWindow: number, label: string) {
    const start = subtractMonths(months);
    // Clamp rolling window so it never exceeds the date range
    const window = Math.min(params.rollingWindow, maxWindow);
    setCustomOpen(false);
    setActivePreset(label);
    setStartDate(start);
    setEndDate(today);
    setRollingWindow(window);
    onPresetRun(start, today, window);
  }

  function handleCustomRun() {
    setActivePreset(null);
    onPresetRun(params.startDate, params.endDate, params.rollingWindow);
  }

  function handleCustomOpen() {
    setCustomOpen((o) => !o);
    setActivePreset(null);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => handlePreset(p.months, p.maxWindow, p.label)}
          className="px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border"
          style={{
            background: activePreset === p.label ? "rgba(163,230,53,0.12)" : "transparent",
            borderColor: activePreset === p.label ? "#a3e635" : "#3f3f46",
            color: activePreset === p.label ? "#a3e635" : "#71717a",
          }}
        >
          {p.label}
        </button>
      ))}

      <div className="w-px h-4 bg-zinc-800 mx-1" aria-hidden="true" />

      <button
        type="button"
        onClick={handleCustomOpen}
        className="px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border"
        style={{
          background: customOpen ? "rgba(163,230,53,0.08)" : "transparent",
          borderColor: customOpen ? "#a3e635" : "#3f3f46",
          color: customOpen ? "#a3e635" : "#71717a",
        }}
      >
        Custom
      </button>

      {customOpen && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            value={params.startDate}
            max={params.endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-lime-500 transition-colors"
          />
          <span className="text-zinc-600 text-xs">→</span>
          <input
            type="date"
            value={params.endDate}
            max={today}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-lime-500 transition-colors"
          />
          <button
            type="button"
            onClick={handleCustomRun}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-lime-400 text-zinc-950 hover:bg-lime-300 transition-colors"
          >
            Run
          </button>
        </div>
      )}
    </div>
  );
}