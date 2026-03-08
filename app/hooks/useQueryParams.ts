"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AllAssets } from "../_data/assets";
import type { AssetOption, CorrelationParams } from "../lib/correlationTypes";
import { defaultStartDate, defaultEndDate } from "../lib/assetHelpers";

// ─── URL param keys ───────────────────────────────────────────────────────────

const KEYS = {
  designated: "d",
  comparisons: "c",
  startDate: "start",
  endDate: "end",
  rollingWindow: "window",
} as const;

const DEFAULT_ROLLING_WINDOW = 90;

// ─── Asset lookup ─────────────────────────────────────────────────────────────

// Builds value, AssetOption map once at module level
const assetMap = new Map<string, AssetOption>(
  AllAssets.map((a) => [a.value, a as AssetOption])
);

function lookupAsset(value: string): AssetOption | null {
  return assetMap.get(value) ?? null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQueryParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Read ────────────────────────────────────────────────────────────────────

  const params: CorrelationParams = useMemo(() => {
    const designatedValue = searchParams.get(KEYS.designated);
    const comparisonValues = searchParams.getAll(KEYS.comparisons);

    return {
      designated: designatedValue ? lookupAsset(designatedValue) : null,
      comparisons: comparisonValues
        .map(lookupAsset)
        .filter((a): a is AssetOption => a !== null),
      startDate: searchParams.get(KEYS.startDate) ?? defaultStartDate(),
      endDate: searchParams.get(KEYS.endDate) ?? defaultEndDate(),
      rollingWindow: Number(
        searchParams.get(KEYS.rollingWindow) ?? DEFAULT_ROLLING_WINDOW
      ),
    };
  }, [searchParams]);

  // ── Write ───────────────────────────────────────────────────────────────────

  const setParams = useCallback(
    (updates: Partial<CorrelationParams>) => {
      const next = new URLSearchParams(searchParams.toString());
      const merged = { ...params, ...updates };

      // Designated
      if (merged.designated) {
        next.set(KEYS.designated, merged.designated.value);
      } else {
        next.delete(KEYS.designated);
      }

      // Comparisons — multiple values, same key
      next.delete(KEYS.comparisons);
      merged.comparisons.forEach((a) => next.append(KEYS.comparisons, a.value));

      // Dates
      next.set(KEYS.startDate, merged.startDate);
      next.set(KEYS.endDate, merged.endDate);

      // Rolling window — omit if default to keep URLs clean
      if (merged.rollingWindow !== DEFAULT_ROLLING_WINDOW) {
        next.set(KEYS.rollingWindow, String(merged.rollingWindow));
      } else {
        next.delete(KEYS.rollingWindow);
      }

      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [params, router, searchParams]
  );

  // ── Convenience setters ──────────────────────────────────────────────────────

  const setDesignated = useCallback(
    (asset: AssetOption | null) => setParams({ designated: asset }),
    [setParams]
  );

  const setComparisons = useCallback(
    (assets: AssetOption[]) => setParams({ comparisons: assets }),
    [setParams]
  );

  const setStartDate = useCallback(
    (date: string) => setParams({ startDate: date }),
    [setParams]
  );

  const setEndDate = useCallback(
    (date: string) => setParams({ endDate: date }),
    [setParams]
  );

  const setRollingWindow = useCallback(
    (window: number) => setParams({ rollingWindow: window }),
    [setParams]
  );

  return {
    params,
    setDesignated,
    setComparisons,
    setStartDate,
    setEndDate,
    setRollingWindow,
  };
}