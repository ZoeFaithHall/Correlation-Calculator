// ─── Asset ────────────────────────────────────────────────────────────────────

export interface AssetOption {
  readonly value: string;
  readonly label: string;
  readonly type: "stock" | "etf" | "trust" | "crypto";
  readonly inceptionDate?: string; // YYYY-MM-DD
}

// ─── API Request ──────────────────────────────────────────────────────────────

export interface CorrelationRequest {
  compareSymbol: string;
  compareType: "stock" | "crypto";
  stockSymbols: string[];
  cryptoSymbols: string[];
  startDateString: string; // YYYY-MM-DD
  endDateString: string;   // YYYY-MM-DD
  rollingWindow?: number;  // trading days, default 90
  debug?: boolean;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export type WarningType = "data_missing" | "data_range_short";

export interface CorrelationWarning {
  symbol: string;
  error: WarningType;
  startDate: string; // YYYY-MM-DD — actual available start
  endDate: string;   // YYYY-MM-DD — actual available end
}

export interface CorrelationErrors {
  errors: string[];
  warnings: CorrelationWarning[];
}

// Rolling Pearson r over time: [timestamp_ms, correlation_value]
export type RollingCorrelationSeries = Array<[number, number]>;

export interface CorrelationData {
  correlationChart: Record<string, RollingCorrelationSeries>;
  correlationMatrix: Array<Record<string, number>>;
}

export interface CorrelationResponse {
  errors: CorrelationErrors;
  correlations: CorrelationData;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

// "stale" = successful run, params have changed since — show old data with warning
export type CorrelationStatus = "idle" | "loading" | "success" | "stale" | "error";

export interface CorrelationState {
  status: CorrelationStatus;
  data: CorrelationResponse | null;
  fatalErrors: string[];
  warnings: CorrelationWarning[];
}

// What gets serialized to/from the URL
export interface CorrelationParams {
  designated: AssetOption | null;
  comparisons: AssetOption[];
  startDate: string;
  endDate: string;
  rollingWindow: number;
}