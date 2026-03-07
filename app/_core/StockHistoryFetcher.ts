import { AxiosError } from "axios";
import {
  getEtDateOrTodayAsDayjs,
  getMarketCloseTimeAsDayjs,
  getEtTodayAsDayjs,
  parseUnixSecondsAsDayjs,
} from "./dayjsHelper";
import { getHistoryClosePrices } from "./yahooFinance";
import {
  AssetData,
  AssetHistoryFetcher,
  PriceHistory,
} from "./correlationTypes";
import { Dayjs } from "dayjs";

export class StockHistoryFetcher implements AssetHistoryFetcher {
  public symbol: string;
  public startDate: Dayjs;
  public endDate: Dayjs;

  public constructor(symbol: string, startDate: Dayjs, endDate: Dayjs) {
    this.symbol = symbol;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  public async getHistory(): Promise<AssetData[] | Error> {
    const startDate = this.startDate.format("YYYY-MM-DD");
    const endDate = this.endDate.format("YYYY-MM-DD");

    try {
      let historicalPrices: PriceHistory = await getHistoryClosePrices(
        this.symbol,
        getEtDateOrTodayAsDayjs(startDate),
        getEtDateOrTodayAsDayjs(endDate)
      );

      if (
        historicalPrices.length > 0 &&
        historicalPrices[0][0] > this.endDate.unix()
      ) {
        return new Error(
          `No data found for ${this.symbol} from ${startDate} to ${endDate}`
        );
      }

      historicalPrices =
        this.popLastPriceIfBeforeMarketCloseToday(historicalPrices);
      return this.formatData(historicalPrices);
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          `Error fetching stock history for ${this.symbol} from Yahoo Finance: ${error.message}`
        );
      } else {
        console.error(
          `Error fetching stock history for ${this.symbol} from Yahoo Finance.`
        );
      }
      return new Error(`Failed to get data for ${this.symbol}`);
    }
  }

  /**
   * Yahoo Finance sometimes returns today's partial quote before market close.
   * Remove it to avoid skewing returns calculations.
   */
  public popLastPriceIfBeforeMarketCloseToday(
    priceHistory: PriceHistory
  ): PriceHistory {
    const now = getEtTodayAsDayjs();
    const mostRecentTimestamp = priceHistory[priceHistory.length - 1][0];
    if (
      now.isBefore(getMarketCloseTimeAsDayjs()) &&
      parseUnixSecondsAsDayjs(mostRecentTimestamp).isSame(now, "day")
    ) {
      priceHistory.pop();
    }
    return priceHistory;
  }

  public formatData(data: PriceHistory): AssetData[] {
    return data.map((d) => ({
      symbol: this.symbol,
      date: parseUnixSecondsAsDayjs(d[0]).format("YYYY-MM-DD"),
      price: d[1],
      return: undefined,
    }));
  }
}
