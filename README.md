# Correlations Tool — Frontend Take-Home

You'll be building a POC/MVP of our Correlations Tool — a UI that lets users visualize correlations between stocks, ETFs, and crypto assets over a given time period, including a rolling correlation chart showing how those correlations change over time. 

Live tool: https://experts.bitwiseinvestments.com/tools/correlations 

The backend is fully scaffolded. You focus entirely on the frontend and UI.

The goal here is not to copy the reference implementation, but to build your own version of the tool. Use whatever tools, agents, llms, and libraries that help you build the best idea you can in the short time you'll have to spend on this project. The goal is not to build a finished product but to make tradeoffs and focus on building one specific feature/area to highlight when we walk through it.

We'll talk through the choices you made, tools you used, and how you approached the problem.

## Setup

```bash
npm install
npm run dev   # http://localhost:3000
npm run build # verify production build
```

No environment variables or external credentials are required.

## Repo

This is a TypeScript Next.js project. No CSS framework is pre-configured — use whatever you're most comfortable with (Tailwind, CSS Modules, plain CSS, etc.) to produce your best work. For charting, we recommend [Recharts](https://recharts.org/en-US/) or [VISX](https://airbnb.io/visx/).

Asset data is in `app/_data/assets.ts`. See [All Assets vs Default Assets](#all-assets-vs-default-assets) below for context on how to use it.

The scaffolded backend lives in `app/_core/` and `app/api/` — you don't need to touch these, but you're welcome to read through them.

## The Task

Build a UI in `app/page.tsx` (and any additional components or pages you like) that lets a user:

1. Select a **designated ticker** to correlate against
2. Select one or more **comparison tickers**
3. Choose a **date range** and **rolling window**
4. Submit and display the results

The response includes two data structures to visualize:

- **`correlationChart`** — rolling correlation over time (good for a line chart)
- **`correlationMatrix`** — a single correlation value for every asset pair (good for a table or heatmap)

How you structure the UI, which charting library you use, and how you style it are entirely up to you.

## Backend API

### `POST /api/correlation`

**Request body:**

```typescript
interface Request {
  compareSymbol: string;           // ticker of the designated asset (e.g. "BTC", "SPY")
  compareType: "stock" | "crypto"; // how to fetch the designated asset
  stockSymbols: string[];          // comparison stock/ETF tickers (e.g. ["SPY", "QQQ"])
  cryptoSymbols: string[];         // comparison crypto tickers (e.g. ["ETH", "SOL"])
  startDateString: string;         // start of date range, YYYY-MM-DD
  endDateString: string;           // end of date range, YYYY-MM-DD
  rollingWindow?: number;          // rolling window in trading days (default: 90)
  debug?: boolean;                 // log extra detail to server console (default: false)
}
```

The total number of assets (1 designated + all comparisons) is capped at **6**.

**Response:**

```typescript
interface Response {
  errors: {
    errors: string[];   // fatal errors (data unavailable, bad request, etc.)
    warnings: Array<{
      symbol: string;
      error: "data_missing" | "data_range_short";
      startDate: string; // YYYY-MM-DD — actual start of available data
      endDate: string;   // YYYY-MM-DD — actual end of available data
    }>;
  };
  correlations: {
    // Rolling Pearson r over time, one series per comparison asset.
    // Each entry is [timestamp_ms, correlation_value].
    // Values range from -1 (perfectly inverse) to 1 (perfectly correlated).
    correlationChart: {
      [symbol: string]: Array<[number, number]>;
    };

    // Full NxN matrix — every asset correlated against every other.
    // Self-correlation is always 1.
    correlationMatrix: Array<{
      [symbol: string]: number;
    }>;
  };
}
```

**Example request:**

```bash
curl -X POST http://localhost:3000/api/correlation \
  -H "Content-Type: application/json" \
  -d '{
    "compareSymbol": "BTC",
    "compareType": "crypto",
    "stockSymbols": ["SPY", "QQQ"],
    "cryptoSymbols": ["ETH", "SOL"],
    "startDateString": "2023-01-01",
    "endDateString": "2024-01-01",
    "rollingWindow": 90
  }'
```

## Supported Assets

**Stocks / ETFs / Crypto:** All fetched via Yahoo Finance. Stocks and ETFs accept any valid Yahoo Finance ticker. For crypto, the following 25 symbols are supported (fetched as `{SYMBOL}-USD` pairs):

| Symbol | Asset         |
| ------ | ------------- |
| BTC    | Bitcoin       |
| ETH    | Ethereum      |
| BNB    | BNB           |
| SOL    | Solana        |
| XRP    | XRP           |
| ADA    | Cardano       |
| AVAX   | Avalanche     |
| DOGE   | Dogecoin      |
| DOT    | Polkadot      |
| MATIC  | Polygon       |
| LINK   | Chainlink     |
| LTC    | Litecoin      |
| UNI    | Uniswap       |
| ATOM   | Cosmos        |
| TON    | Toncoin       |
| NEAR   | NEAR Protocol |
| SHIB   | Shiba Inu     |
| PEPE   | Pepe          |
| APT    | Aptos         |
| ARB    | Arbitrum      |
| OP     | Optimism      |
| INJ    | Injective     |
| SUI    | Sui           |
| AAVE   | Aave          |
| MKR    | Maker         |

## Experience

Don't feel tied to the design we're looking for you to explore and build the best idea you can, not to copy a reference implementation.

### Input

**Designated Ticker:** A single ticker that the others are correlated against.

**Comparison Tickers:** At least 1, up to 5 comparison tickers. A comparison ticker cannot match the designated ticker.

**Date Range:** Minimum range is 90 days. The end date cannot be in the future. The start date must be at least 90 days before the end date. Assets have inception dates — the `inceptionDate` field on `AssetOption` can be used to constrain the date picker.

**Rolling Window:** The number of trading days used to compute each rolling correlation point. Default is 90.

### Output

**Correlation Matrix:** A table (or heatmap) showing the degree to which each asset pair moves in relation to each other. Values are Pearson r, ranging from -1 to 1. Self-correlation is always 1.

**Rolling Correlation:** A line chart with correlation value on the y-axis and date on the x-axis. One line per comparison asset. Should support toggling individual tickers on/off.

## Helpers

### All Assets vs Default Assets

`app/_data/assets.ts` exports two arrays: `AllAssets` and `DefaultAssets`. The asset selector should load `DefaultAssets` immediately and allow the user to search through `AllAssets` for additional options. This avoids loading the full dataset upfront and gives explicit control over which assets appear by default.

Assets are structured as:

```typescript
export interface AssetOption {
  readonly value: string;          // ticker symbol
  readonly label: string;          // display name
  readonly type: string;           // "stock" | "etf" | "trust" | "crypto"
  readonly inceptionDate?: string; // YYYY-MM-DD — earliest valid start date
}
```

### Compare Types

The designated asset's `type` must be mapped to a `compareType` for the API request:

```typescript
const assetToCompareType = (asset: AssetOption): "stock" | "crypto" => {
  return asset.type === "crypto" ? "crypto" : "stock";
};
```

### Split Symbols

Comparison assets must be split into `stockSymbols` and `cryptoSymbols` before calling the API:

```typescript
const splitSymbols = (assets: AssetOption[]) => ({
  stockSymbols: assets.filter((a) => a.type !== "crypto").map((a) => a.value),
  cryptoSymbols: assets.filter((a) => a.type === "crypto").map((a) => a.value),
});
```

### Warnings and Errors

**Warnings** (`errors.warnings`) are non-fatal and per-asset. Two types are returned:

- `data_missing` — data exists but may be incomplete for the requested range. Comes with the actual available `startDate`/`endDate` for that symbol.
- `data_range_short` — the requested range exceeds what's available. Comes with the actual available range for that symbol.

**Errors** (`errors.errors`) are fatal strings — authentication failures, bad requests, data not found, etc. Display these clearly to the user.
