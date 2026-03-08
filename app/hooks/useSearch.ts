"use client";

import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseSearchOptions<T> {
  /** Full dataset — searched when query meets threshold */
  allItems: T[];
  /** Items shown before the user types anything */
  defaultItems: T[];
  /** Return true if the item matches the query string */
  filterFn: (item: T, query: string) => boolean;
  /** Items whose keys are in this set are excluded from results */
  excludeKeys?: Set<string>;
  /** Key extractor — used for exclusion */
  getKey: (item: T) => string;
  /** Minimum query length before switching to allItems (default: 1) */
  threshold?: number;
  /** Maximum results returned (default: 24) */
  maxResults?: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Generic search hook. Works with any list of items — assets, users, tags, etc.
 * Replaces useAssetSearch, which was hardwired to AssetOption.
 */
export function useSearch<T>({
  allItems,
  defaultItems,
  filterFn,
  excludeKeys,
  getKey,
  threshold = 1,
  maxResults = 24,
}: UseSearchOptions<T>) {
  const [query, setQuery] = useState("");

  const results = useMemo((): T[] => {
    const source = query.length >= threshold ? allItems : defaultItems;
    const q = query.toLowerCase().trim();

    return source
      .filter((item) => !excludeKeys?.has(getKey(item)))
      .filter((item) => !q || filterFn(item, q))
      .slice(0, maxResults);
  }, [query, allItems, defaultItems, filterFn, excludeKeys, getKey, threshold, maxResults]);

  return {
    query,
    setQuery,
    clear: () => setQuery(""),
    results,
    isSearching: query.length >= threshold,
    hasResults: results.length > 0,
  };
}