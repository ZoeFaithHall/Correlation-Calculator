import { useState, useMemo, useCallback } from "react";
import { DefaultAssets, AllAssets } from "../_data/assets";
import type { AssetOption } from "../lib/correlationTypes";

const SEARCH_THRESHOLD = 1;  // characters before switching to AllAssets
const MAX_RESULTS = 24;       // cap dropdown length

interface UseAssetSearchOptions {
  exclude?: string[]; // ticker values to hide from results
}

export function useAssetSearch({ exclude = [] }: UseAssetSearchOptions = {}) {
  const [query, setQuery] = useState("");

  const excludeSet = useMemo(() => new Set(exclude), [exclude]);

  const results = useMemo(() => {
    // Use DefaultAssets until the user starts typing
    // This avoids rendering 500+ items on first open
    const source = query.length >= SEARCH_THRESHOLD ? AllAssets : DefaultAssets;
    const q = query.toLowerCase().trim();

    return source
      .filter((a) => !excludeSet.has(a.value))
      .filter((a) => {
        if (!q) return true;
        return (
          a.value.toLowerCase().includes(q) ||
          a.label.toLowerCase().includes(q)
        );
      })
      .slice(0, MAX_RESULTS);
  }, [query, excludeSet]);

  const clear = useCallback(() => setQuery(""), []);

  const isSearching = query.length >= SEARCH_THRESHOLD;

  return {
    query,
    setQuery,
    clear,
    results,
    isSearching,
    hasResults: results.length > 0,
  };
}