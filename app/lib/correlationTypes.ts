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
  // One series per comparison asset, keyed by symbol
  correlationChart: Record<string, RollingCorrelationSeries>;
  // NxN matrix — every asset pair. Self-correlation is always 1.
  correlationMatrix: Array<Record<string, number>>;
}

export interface CorrelationResponse {
  errors: CorrelationErrors;
  correlations: CorrelationData;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

// What the hook returns to the page
export interface CorrelationState {
  status: "idle" | "loading" | "success" | "error";
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