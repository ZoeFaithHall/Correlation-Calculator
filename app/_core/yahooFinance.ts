import axios from "axios";
import { Dayjs } from "dayjs";
import { PriceHistory } from "./correlationTypes";

/**
 * Fetches adjusted close price history for a stock symbol from Yahoo Finance.
 */
export async function getHistoryClosePrices(
  symbol: string,
  startDate: Dayjs,
  endDate: Dayjs
): Promise<PriceHistory> {
  const sanitizedSymbol = symbol.replace(".", "-");
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sanitizedSymbol}`;
  const params = {
    period1: startDate.subtract(1, "day").unix(), // inclusive
    period2: endDate.add(1, "day").unix(), // inclusive
    interval: "1d",
  };

  const result = await axios({ method: "get", url, params });

  const chart = result.data?.chart?.result?.[0];
  const timestamps: number[] | undefined = chart?.timestamp;
  // Prefer adjusted close; fall back to regular close (crypto has no adjustments)
  const prices: (number | null)[] | undefined =
    chart?.indicators?.adjclose?.[0]?.adjclose ??
    chart?.indicators?.quote?.[0]?.close;

  if (!timestamps || !prices) {
    throw new Error(
      `Error getting Yahoo Finance chart for ${sanitizedSymbol}: no data returned`
    );
  }

  // Return adjusted close prices as [timestamp_seconds, price] pairs,
  // filtering out any null entries (can occur at boundaries of the date range)
  return timestamps
    .map((ts, i): [number, number] | null => {
      const price = prices[i];
      return price != null ? [ts, price] : null;
    })
    .filter((entry): entry is [number, number] => entry !== null);
}
