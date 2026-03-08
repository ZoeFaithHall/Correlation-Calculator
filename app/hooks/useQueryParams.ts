"use client";

/**
 * URL state management via nuqs.
 *
 * Replaces ~130 lines of manual URLSearchParams wrangling.
 * nuqs handles: serialization, router.replace, batching, SSR safety.
 *
 * Required: wrap root layout with <NuqsAdapter> from "nuqs/adapters/next/app"
 *
 * See: app/layout.tsx
 */

import { useQueryStates, parseAsString, parseAsArrayOf, parseAsInteger } from "nuqs";
import { useMemo } from "react";
import { AllAssets } from "../_data/assets";
import type { AssetOption, CorrelationParams } from "../lib/correlationTypes";
import { defaultStartDate, defaultEndDate } from "../lib/assetHelpers";

// ─── Asset lookup ─────────────────────────────────────────────────────────────

const assetMap = new Map<string, AssetOption>(
  AllAssets.map((a) => [a.value, a as AssetOption])
);

const DEFAULT_ROLLING_WINDOW = 90;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQueryParams() {
  const [raw, setRaw] = useQueryStates(
    {
      d:      parseAsString,
      c:      parseAsArrayOf(parseAsString),
      start:  parseAsString.withDefault(defaultStartDate()),
      end:    parseAsString.withDefault(defaultEndDate()),
      window: parseAsInteger.withDefault(DEFAULT_ROLLING_WINDOW),
    },
    { history: "replace", scroll: false }
  );

  // ── Deserialize raw URL values → typed params ────────────────────────────

  const params: CorrelationParams = useMemo(() => ({
    designated: raw.d ? (assetMap.get(raw.d) ?? null) : null,
    comparisons: (raw.c ?? [])
      .map((v) => assetMap.get(v))
      .filter((a): a is AssetOption => a != null),
    startDate:     raw.start,
    endDate:       raw.end,
    rollingWindow: raw.window,
  }), [raw]);

  // ── Convenience setters ───────────────────────────────────────────────────

  function setDesignated(asset: AssetOption | null) {
    setRaw({ d: asset?.value ?? null });
  }

  function setComparisons(assets: AssetOption[]) {
    setRaw({ c: assets.map((a) => a.value) });
  }

  function setStartDate(date: string) {
    setRaw({ start: date });
  }

  function setEndDate(date: string) {
    setRaw({ end: date });
  }

  function setRollingWindow(window: number) {
    // Omit from URL when default — keeps shared links clean
    setRaw({ window: window === DEFAULT_ROLLING_WINDOW ? null : window });
  }

  return {
    params,
    setDesignated,
    setComparisons,
    setStartDate,
    setEndDate,
    setRollingWindow,
  };
}