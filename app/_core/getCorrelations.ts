import { parseEtDateStringAsDayjs } from "./dayjsHelper";
import { CorrelationCalculator } from "./CorrelationCalculator";
import {
  AssetData,
  AssetHistoryFetcher,
  CompareType,
  CORRELATION_WARNINGS,
  CorrelationsOutput,
  ErrorData,
  MAX_CORRELATION_ASSETS,
} from "./correlationTypes";
import { CryptoHistoryFetcher } from "./CryptoHistoryFetcher";
import { MarketDataValidator } from "./MarketDataValidator";
import { StockHistoryFetcher } from "./StockHistoryFetcher";
import { Dayjs } from "dayjs";

export async function getCorrelations(
  compareSymbol: string,
  compareType: CompareType,
  stockSymbols: string[],
  cryptoSymbols: string[],
  startDate: Dayjs,
  endDate: Dayjs,
  rollingWindow = 90,
  debug = false
): Promise<CorrelationsOutput> {
  const errors: string[] = [];
  const warnings: ErrorData[] = [];

  // Date range must exceed the rolling window
  if (endDate.diff(startDate, "days") < rollingWindow) {
    return errorOutput("Date range must be greater than rolling window");
  }

  // Fetch extra data before startDate so rolling correlations can begin on startDate
  const fetchStartDate = startDate.subtract(rollingWindow * 2, "days");

  const compareFetcher = getCompareFetcher(
    compareType,
    compareSymbol,
    fetchStartDate,
    endDate
  );

  if (compareFetcher === null) {
    return errorOutput("No asset to correlate against was provided.");
  }

  // Build the full list of fetchers — max 6 total assets
  const historyFetchers: AssetHistoryFetcher[] = [compareFetcher]
    .concat(
      stockSymbols.map(
        (symbol) => new StockHistoryFetcher(symbol, fetchStartDate, endDate)
      )
    )
    .concat(
      cryptoSymbols.map(
        (symbol) => new CryptoHistoryFetcher(symbol, fetchStartDate, endDate)
      )
    )
    .slice(0, MAX_CORRELATION_ASSETS);

  // Fetch all histories in parallel
  const allHistory = await Promise.all(
    historyFetchers.map((fetcher) => fetcher.getHistory())
  );

  // Separate failures from successes
  let compareHistoryFetched = false;
  const allHistoryClean: AssetData[][] = allHistory.filter((history) => {
    if (history instanceof Error) {
      errors.push(history.message);
      return false;
    }
    if (history[0].symbol === compareSymbol) {
      compareHistoryFetched = true;
    }
    return true;
  }) as AssetData[][];

  if (!compareHistoryFetched) {
    return errorOutput(`No data found for ${compareSymbol}`);
  }

  // Align all asset histories to the same trading-day calendar
  let adjustedHistory = MarketDataValidator.adjustForMarketData(
    compareType,
    compareSymbol,
    stockSymbols,
    allHistoryClean,
    debug
  );

  // Sort each history by date ascending
  adjustedHistory = adjustedHistory.map((history) =>
    history.sort((a, b) => {
      const dateA = parseEtDateStringAsDayjs(a.date);
      const dateB = parseEtDateStringAsDayjs(b.date);
      return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
    })
  );

  // Calculate daily returns for each asset
  adjustedHistory.forEach((assetHistory) => {
    for (let i = 1; i < assetHistory.length; i++) {
      const prev = assetHistory[i - 1];
      const current = assetHistory[i];
      current.return = (current.price - prev.price) / prev.price;
    }
  });

  // Split into the primary asset and the comparison assets
  let compare: AssetData[] | undefined;
  const comparisons: AssetData[][] = [];
  adjustedHistory.forEach((history) => {
    if (history[0].symbol === compareSymbol) {
      compare = history;
    } else {
      comparisons.push(history);
    }
  });

  if (!compare) {
    return errorOutput(
      `No data found for ${compareSymbol} after market data alignment`
    );
  }

  // Warn if the available data is shorter than the requested date range
  const compareStart = parseEtDateStringAsDayjs(compare[0].date);
  const compareEnd = parseEtDateStringAsDayjs(compare[compare.length - 1].date);
  if (compareStart.isAfter(startDate)) {
    warnings.push({
      symbol: compareSymbol,
      error: CORRELATION_WARNINGS.RANGE_SHORT,
      startDate: compareStart.format("YYYY-MM-DD"),
      endDate: compareEnd.format("YYYY-MM-DD"),
    });
  }

  const correlations = CorrelationCalculator.calculate(
    compare,
    comparisons,
    startDate,
    rollingWindow
  );

  return {
    errors: {
      errors: errors.concat(correlations.errors.errors),
      warnings: warnings.concat(correlations.errors.warnings),
    },
    correlations: correlations.correlations,
  };
}

function errorOutput(error: string): CorrelationsOutput {
  return {
    errors: { errors: [error], warnings: [] },
    correlations: { correlationChart: {}, correlationMatrix: [] },
  };
}

function getCompareFetcher(
  compareType: CompareType,
  compareSymbol: string,
  startDate: Dayjs,
  endDate: Dayjs
): AssetHistoryFetcher | null {
  switch (compareType) {
    case CompareType.Stock:
      return new StockHistoryFetcher(compareSymbol, startDate, endDate);
    case CompareType.Crypto:
      return new CryptoHistoryFetcher(compareSymbol, startDate, endDate);
    default:
      return null;
  }
}
