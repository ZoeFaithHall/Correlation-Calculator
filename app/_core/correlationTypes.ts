import { Dayjs } from "dayjs";

export enum CompareType {
  Crypto = "crypto",
  Stock = "stock",
}

export interface AssetData {
  symbol: string;
  date: string; // YYYY-MM-DD
  price: number;
  return?: number;
}

export type PriceHistory = Array<[timestamp: number, price: number]>;

export type CorrelationDataList = Array<{
  compare: number;
  comparison: number;
}>;

export type RollingCorrelations = Array<[timestamp: number, value: number]>;

export interface CorrelationChart {
  [symbol: string]: RollingCorrelations;
}

export type CorrelationMatrix = Array<{
  [symbol: string]: number;
}>;

export interface Correlations {
  correlationChart: CorrelationChart;
  correlationMatrix: CorrelationMatrix;
}

export interface ErrorData {
  symbol: string;
  error: string;
  startDate: string;
  endDate: string;
}

export interface CorrelationErrors {
  errors: string[]; // fatal errors — no data returned
  warnings: ErrorData[]; // non-fatal per-asset issues
}

export interface CorrelationsOutput {
  errors: CorrelationErrors;
  correlations: Correlations | null;
}

export interface AssetHistoryFetcher {
  symbol: string;
  startDate: Dayjs;
  endDate: Dayjs;
  getHistory: () => Promise<AssetData[] | Error>;
}

export const MAX_CORRELATION_ASSETS = 6;

export const CORRELATION_WARNINGS = {
  MISSING: "data_missing",
  RANGE_SHORT: "data_range_short",
};
