"use client";

import { useMemo } from "react";
import { DefaultAssets, AllAssets } from "../_data/assets";
import { useSearch } from "./useSearch";
import type { AssetOption } from "../lib/correlationTypes";

// ─── Thin wrapper ─────────────────────────────────────────────────────────────

/**
 * Asset-specific search built on the generic useSearch hook.
 * Filtering logic lives here; useSearch owns the query state and memoization.
 */

interface UseAssetSearchOptions {
  exclude?: string[];
}

export function useAssetSearch({ exclude = [] }: UseAssetSearchOptions = {}) {
  const excludeKeys = useMemo(() => new Set(exclude), [exclude]);

  return useSearch<AssetOption>({
    allItems: AllAssets as AssetOption[],
    defaultItems: DefaultAssets as AssetOption[],
    filterFn: (asset, query) =>
      asset.value.toLowerCase().includes(query) ||
      asset.label.toLowerCase().includes(query),
    excludeKeys,
    getKey: (asset) => asset.value,
  });
}