declare module "statistics.js" {
  interface StatisticsOptions {
    [column: string]: "interval" | "ordinal" | "nominal" | "metric";
  }

  interface CorrelationResult {
    correlationCoefficient: number;
    missedData: number;
  }

  class Statistics {
    constructor(data: Record<string, number>[], columns: StatisticsOptions);
    correlationCoefficient(col1: string, col2: string): CorrelationResult;
  }

  export = Statistics;
}
