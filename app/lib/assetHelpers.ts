import type { AssetOption, CorrelationRequest, CorrelationParams } from "./correlationTypes";

// ─── Asset type mapping ───────────────────────────────────────────────────────

/**
 * Maps an AssetOption's type to the API's compareType field.
 * The API only distinguishes crypto vs everything else.
 */
export function assetToCompareType(asset: AssetOption): "stock" | "crypto" {
  return asset.type === "crypto" ? "crypto" : "stock";
}

// ─── Symbol splitting ─────────────────────────────────────────────────────────

/**
 * Splits a comparison asset list into the two arrays the API expects.
 * Crypto and stocks/ETFs/trusts are fetched differently server-side.
 */
export function splitSymbols(assets: AssetOption[]): {
  stockSymbols: string[];
  cryptoSymbols: string[];
} {
  return {
    stockSymbols: assets
      .filter((a) => a.type !== "crypto")
      .map((a) => a.value),
    cryptoSymbols: assets
      .filter((a) => a.type === "crypto")
      .map((a) => a.value),
  };
}

// ─── Request builder ──────────────────────────────────────────────────────────

/**
 * Converts UI param state into a typed API request body.
 * Returns null if designated is missing (shouldn't reach the API).
 */
export function buildCorrelationRequest(
  params: CorrelationParams
): CorrelationRequest | null {
  if (!params.designated) return null;

  const { stockSymbols, cryptoSymbols } = splitSymbols(params.comparisons);

  return {
    compareSymbol: params.designated.value,
    compareType: assetToCompareType(params.designated),
    stockSymbols,
    cryptoSymbols,
    startDateString: params.startDate,
    endDateString: params.endDate,
    rollingWindow: params.rollingWindow,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

const MIN_RANGE_DAYS = 90;
const MAX_COMPARISONS = 5;

export interface ValidationResult {
  valid: boolean;
  reason: string | null;
}

export function validateParams(params: CorrelationParams): ValidationResult {
  if (!params.designated) {
    return { valid: false, reason: "Select a designated asset." };
  }

  if (params.comparisons.length === 0) {
    return { valid: false, reason: "Select at least one comparison asset." };
  }

  if (params.comparisons.length > MAX_COMPARISONS) {
    return {
      valid: false,
      reason: `Maximum ${MAX_COMPARISONS} comparison assets.`,
    };
  }

  const start = new Date(params.startDate);
  const end = new Date(params.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (end > today) {
    return { valid: false, reason: "End date cannot be in the future." };
  }

  const diffDays = (end.getTime() - start.getTime()) / 86_400_000;
  if (diffDays < MIN_RANGE_DAYS) {
    return {
      valid: false,
      reason: `Date range must be at least ${MIN_RANGE_DAYS} days.`,
    };
  }

  // Respect asset inception dates. Start can't predate the
  // latest inception date among all selected assets
  const allAssets = [params.designated, ...params.comparisons];
  const latestInception = allAssets.reduce<string | null>((latest, asset) => {
    if (!asset.inceptionDate) return latest;
    if (!latest) return asset.inceptionDate;
    return asset.inceptionDate > latest ? asset.inceptionDate : latest;
  }, null);

  if (latestInception && params.startDate < latestInception) {
    return {
      valid: false,
      reason: `Start date must be on or after ${latestInception} (earliest supported by all selected assets).`,
    };
  }

  return { valid: true, reason: null };
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function defaultStartDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return toISODate(d);
}

export function defaultEndDate(): string {
  return toISODate(new Date());
}

/**
 * Returns the minimum valid start date for a set of assets
 * the latest of all their inception dates, or undefined if none have one.
 */
export function getMinStartDate(assets: AssetOption[]): string | undefined {
  return assets.reduce<string | undefined>((latest, asset) => {
    if (!asset.inceptionDate) return latest;
    if (!latest) return asset.inceptionDate;
    return asset.inceptionDate > latest ? asset.inceptionDate : latest;
  }, undefined);
}