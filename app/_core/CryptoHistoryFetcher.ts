import { AxiosError } from "axios";
import { parseUnixSecondsAsDayjs } from "./dayjsHelper";
import { getHistoryClosePrices } from "./yahooFinance";
import {
  AssetData,
  AssetHistoryFetcher,
  PriceHistory,
} from "./correlationTypes";
import { Dayjs } from "dayjs";

/**
 * All supported crypto symbols. Each maps to a {SYMBOL}-USD Yahoo Finance
 * ticker (e.g. BTC → BTC-USD). No API key required.
 */
export const SUPPORTED_CRYPTO_SYMBOLS = new Set([
  "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "AVAX", "DOGE", "DOT", "MATIC",
  "LINK", "LTC", "UNI", "ATOM", "TON", "NEAR", "SHIB", "PEPE", "APT", "ARB",
  "OP", "INJ", "SUI", "AAVE", "MKR",
]);

export class CryptoHistoryFetcher implements AssetHistoryFetcher {
  public symbol: string;
  public startDate: Dayjs;
  public endDate: Dayjs;

  public constructor(symbol: string, startDate: Dayjs, endDate: Dayjs) {
    this.symbol = symbol;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  public async getHistory(): Promise<AssetData[] | Error> {
    const upperSymbol = this.symbol.toUpperCase();

    if (!SUPPORTED_CRYPTO_SYMBOLS.has(upperSymbol)) {
      return new Error(
        `Unsupported crypto symbol: ${this.symbol}. Supported symbols: ${[...SUPPORTED_CRYPTO_SYMBOLS].join(", ")}`
      );
    }

    try {
      // Yahoo Finance crypto tickers are in the format {SYMBOL}-USD
      const yahooSymbol = `${upperSymbol}-USD`;
      const prices: PriceHistory = await getHistoryClosePrices(
        yahooSymbol,
        this.startDate,
        this.endDate
      );
      return this.formatData(upperSymbol, prices);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          `Error fetching crypto history for ${this.symbol} from Yahoo Finance: ${error.message}`
        );
      } else {
        console.error(
          `Error fetching crypto history for ${this.symbol} from Yahoo Finance:`,
          error
        );
      }
      return new Error(`Failed to get data for ${this.symbol}`);
    }
  }

  public formatData(symbol: string, prices: PriceHistory): AssetData[] {
    return prices.map(([timestamp, price]) => ({
      symbol,
      date: parseUnixSecondsAsDayjs(timestamp).format("YYYY-MM-DD"),
      price,
      return: undefined,
    }));
  }
}
