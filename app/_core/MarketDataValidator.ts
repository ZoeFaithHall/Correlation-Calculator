import { parseEtDateStringAsDayjs } from "./dayjsHelper";
import { AssetData, CompareType } from "./correlationTypes";

export class MarketDataValidator {
  /**
   * Aligns all asset histories to the same trading-day calendar.
   *
   * Crypto trades 24/7 while stocks only trade on market days. This method
   * uses one asset as the "source of truth" calendar and filters all others
   * to only include dates present in that calendar.
   *
   * If the compareType is Crypto and stock symbols are present, the first
   * stock symbol is used as the calendar source of truth. Otherwise the
   * compareSymbol is used.
   */
  public static adjustForMarketData = (
    compareType: CompareType,
    compareSymbol: string,
    stockSymbols: string[],
    histories: AssetData[][],
    debug = false
  ): AssetData[][] => {
    let adjustment = compareSymbol;
    if (compareType === CompareType.Crypto && stockSymbols.length > 0) {
      adjustment = stockSymbols[0];
    }

    const adjustmentAsset = histories.find((h) => h[0]?.symbol === adjustment);
    if (!adjustmentAsset) {
      // If we can't find the source-of-truth asset, return histories unchanged
      return histories;
    }

    const needsAdjustmentAssets = histories.filter(
      (h) => h[0]?.symbol !== adjustment
    );

    const marketDates = new Set<string>(adjustmentAsset.map((d) => d.date));
    const adjustmentStart = parseEtDateStringAsDayjs(adjustmentAsset[0].date);

    const adjustedHistories = needsAdjustmentAssets.map((history) => {
      const adjusted = history.filter((asset: AssetData) => {
        const assetDate = parseEtDateStringAsDayjs(asset.date);
        if (assetDate.isBefore(adjustmentStart)) return false;
        return marketDates.has(asset.date);
      });

      if (debug) {
        const adjustedDates = new Set(adjusted.map((d) => d.date));
        adjustmentAsset.forEach((asset: AssetData) => {
          if (!adjustedDates.has(asset.date)) {
            console.error(
              `Missing data for ${history[0].symbol} on ${asset.date}`
            );
          }
        });
      }

      return adjusted;
    });

    adjustedHistories.push(adjustmentAsset);
    return adjustedHistories;
  };
}
