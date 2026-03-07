import {
  checkIsSameOrAfterDay,
  parseEtDateStringAsDayjs,
} from "./dayjsHelper";
import {
  AssetData,
  CorrelationDataList,
  CorrelationErrors,
  CorrelationMatrix,
  CorrelationsOutput,
  RollingCorrelations,
} from "./correlationTypes";
import { Dayjs } from "dayjs";
import Statistics from "statistics.js";

interface CorrelationResult {
  correlationCoefficient: number;
  missedData: number;
}

export class CorrelationCalculator {
  public static calculate(
    compareAsset: AssetData[],
    comparisonAssets: AssetData[][],
    startDate: Dayjs,
    rollingWindow = 90
  ): CorrelationsOutput {
    const errors = this.validateData(
      compareAsset,
      comparisonAssets,
      rollingWindow
    );
    if (errors.errors.length > 0) {
      return { errors, correlations: null };
    }

    // Work from newest to oldest
    const reversedCompareAsset = compareAsset.slice().reverse();
    const reversedComparisonAssets = comparisonAssets.map((asset) =>
      asset.slice().reverse()
    );

    // Rolling correlations for the chart (compareAsset vs each comparison)
    const rollingCorrelations: Record<string, RollingCorrelations> = {};
    reversedComparisonAssets.forEach((asset: AssetData[]) => {
      const symbol = asset[0].symbol;
      rollingCorrelations[symbol] = this.calculateRollingCorrelation(
        reversedCompareAsset,
        asset,
        startDate,
        rollingWindow
      );
    });

    // Full NxN correlation matrix
    const correlation: CorrelationMatrix = [];
    const allAssets = [reversedCompareAsset, ...reversedComparisonAssets];
    const correlationCache = new Map<string, number>();

    allAssets.forEach((asset: AssetData[]) => {
      const assetSymbol = asset[0].symbol;
      const correlationRow: Record<string, number> = {};

      allAssets.forEach((comparisonAsset: AssetData[]) => {
        const comparisonSymbol = comparisonAsset[0].symbol;

        if (assetSymbol === comparisonSymbol) {
          correlationRow[comparisonSymbol] = 1.0;
        } else {
          const pairKey = [assetSymbol, comparisonSymbol].sort().join("_");
          if (!correlationCache.has(pairKey)) {
            const value = this.calculateCorrelationCoefficient(
              asset,
              comparisonAsset,
              startDate
            );
            correlationCache.set(pairKey, value ?? 0);
          }
          correlationRow[comparisonSymbol] = correlationCache.get(pairKey) ?? 0;
        }
      });

      correlation.push(correlationRow);
    });

    return {
      errors,
      correlations: {
        correlationChart: rollingCorrelations,
        correlationMatrix: correlation,
      },
    };
  }

  public static validateData(
    compareAsset: AssetData[],
    _comparisonAssets: AssetData[][],
    rollingWindow: number
  ): CorrelationErrors {
    const errors: CorrelationErrors = { errors: [], warnings: [] };
    if (compareAsset.length < rollingWindow) {
      errors.errors.push(
        `Not enough data for ${compareAsset[0].symbol} to calculate correlation`
      );
    }
    return errors;
  }

  private static calculateCorrelation(
    dataArr: CorrelationDataList
  ): number | null {
    if (dataArr.length === 0) return null;

    const stats = new Statistics(dataArr, {
      compare: "interval",
      comparison: "interval",
    });

    if (!stats) {
      console.error("Failed to calculate correlation for data");
      return null;
    }

    const r: CorrelationResult = stats.correlationCoefficient(
      "compare",
      "comparison"
    );
    return r.correlationCoefficient;
  }

  private static calculateRollingCorrelation = (
    compare: AssetData[],
    comparison: AssetData[],
    startDate: Dayjs,
    rollingWindow: number
  ): RollingCorrelations => {
    const correlations: RollingCorrelations = [];

    const comparisonByDate = new Map<string, AssetData>();
    for (const item of comparison) {
      comparisonByDate.set(item.date, item);
    }

    let i = 0;
    let currentDate = parseEtDateStringAsDayjs(compare[i].date);

    while (
      i < compare.length &&
      checkIsSameOrAfterDay(currentDate, startDate)
    ) {
      const correlationWindow: CorrelationDataList = [];
      let offset = 0;

      while (
        correlationWindow.length < rollingWindow &&
        i + offset < compare.length
      ) {
        const compareItem = compare[i + offset];
        const comparisonItem = comparisonByDate.get(compareItem.date);
        if (
          comparisonItem !== undefined &&
          compareItem.return !== undefined &&
          comparisonItem.return !== undefined
        ) {
          correlationWindow.push({
            compare: compareItem.return,
            comparison: comparisonItem.return,
          });
        }
        offset += 1;
      }

      if (correlationWindow.length >= rollingWindow) {
        const correlation = this.calculateCorrelation(correlationWindow);
        if (correlation !== null) {
          correlations.push([currentDate.valueOf(), correlation]);
        }
      }

      i++;
      if (i < compare.length) {
        currentDate = parseEtDateStringAsDayjs(compare[i].date);
      }
    }

    return correlations;
  };

  private static calculateCorrelationCoefficient = (
    compare: AssetData[],
    comparison: AssetData[],
    startDate: Dayjs
  ): number | null => {
    const correlationWindow: CorrelationDataList = [];

    const comparisonMap = new Map<string, AssetData>();
    comparison.forEach((item) => comparisonMap.set(item.date, item));

    compare.forEach((compareItem) => {
      const currentDate = parseEtDateStringAsDayjs(compareItem.date);
      if (currentDate.isSameOrAfter(startDate)) {
        const comparisonItem = comparisonMap.get(compareItem.date);
        if (
          comparisonItem &&
          compareItem.return !== undefined &&
          comparisonItem.return !== undefined
        ) {
          correlationWindow.push({
            compare: compareItem.return,
            comparison: comparisonItem.return,
          });
        }
      }
    });

    return this.calculateCorrelation(correlationWindow);
  };
}
