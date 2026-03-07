export interface AssetOption {
  readonly value: string;
  readonly label: string;
  readonly type: string; // "stock" | "etf" | "trust" | "crypto"
  readonly inceptionDate?: string; // YYYY-MM-DD
}

/**
 * Curated set of assets shown immediately in the selector.
 * Keep this list short — compliance implications apply to default visibility.
 */
export const DefaultAssets: AssetOption[] = [
  // Crypto
  { value: "BTC", label: "Bitcoin", type: "crypto", inceptionDate: "2014-09-17" },
  { value: "ETH", label: "Ethereum", type: "crypto", inceptionDate: "2015-08-07" },
  { value: "SOL", label: "Solana", type: "crypto", inceptionDate: "2020-04-10" },
  { value: "XRP", label: "XRP", type: "crypto", inceptionDate: "2014-01-01" },
  // Equities
  { value: "SPY", label: "SPDR S&P 500 ETF", type: "etf", inceptionDate: "1993-01-29" },
  { value: "QQQ", label: "Invesco QQQ Trust", type: "etf", inceptionDate: "1999-03-10" },
  { value: "GLD", label: "SPDR Gold Shares", type: "etf", inceptionDate: "2004-11-18" },
  { value: "IWM", label: "iShares Russell 2000 ETF", type: "etf", inceptionDate: "2000-05-26" },
  // Bitwise funds
  { value: "BITW", label: "Bitwise 10 Crypto Index Fund", type: "trust", inceptionDate: "2017-11-22" },
  { value: "BITQ", label: "Bitwise Crypto Industry Innovators ETF", type: "etf", inceptionDate: "2021-05-11" },
  { value: "BWEB", label: "Bitwise Web3 ETF", type: "etf", inceptionDate: "2022-10-04" },
];

/**
 * Full searchable asset list. Includes everything in DefaultAssets plus
 * additional stocks, ETFs, and crypto assets.
 */
export const AllAssets: AssetOption[] = [
  // ── Crypto ────────────────────────────────────────────────────────────────
  { value: "BTC", label: "Bitcoin", type: "crypto", inceptionDate: "2014-09-17" },
  { value: "ETH", label: "Ethereum", type: "crypto", inceptionDate: "2015-08-07" },
  { value: "BNB", label: "BNB", type: "crypto", inceptionDate: "2017-07-25" },
  { value: "SOL", label: "Solana", type: "crypto", inceptionDate: "2020-04-10" },
  { value: "XRP", label: "XRP", type: "crypto", inceptionDate: "2014-01-01" },
  { value: "ADA", label: "Cardano", type: "crypto", inceptionDate: "2017-10-02" },
  { value: "AVAX", label: "Avalanche", type: "crypto", inceptionDate: "2020-09-23" },
  { value: "DOGE", label: "Dogecoin", type: "crypto", inceptionDate: "2014-01-01" },
  { value: "DOT", label: "Polkadot", type: "crypto", inceptionDate: "2020-08-22" },
  { value: "MATIC", label: "Polygon", type: "crypto", inceptionDate: "2019-04-29" },
  { value: "LINK", label: "Chainlink", type: "crypto", inceptionDate: "2017-09-20" },
  { value: "LTC", label: "Litecoin", type: "crypto", inceptionDate: "2013-04-28" },
  { value: "UNI", label: "Uniswap", type: "crypto", inceptionDate: "2020-09-17" },
  { value: "ATOM", label: "Cosmos", type: "crypto", inceptionDate: "2019-03-15" },
  { value: "TON", label: "Toncoin", type: "crypto", inceptionDate: "2021-08-26" },
  { value: "NEAR", label: "NEAR Protocol", type: "crypto", inceptionDate: "2020-10-13" },
  { value: "SHIB", label: "Shiba Inu", type: "crypto", inceptionDate: "2021-05-10" },
  { value: "PEPE", label: "Pepe", type: "crypto", inceptionDate: "2023-04-17" },
  { value: "APT", label: "Aptos", type: "crypto", inceptionDate: "2022-10-19" },
  { value: "ARB", label: "Arbitrum", type: "crypto", inceptionDate: "2023-03-23" },
  { value: "OP", label: "Optimism", type: "crypto", inceptionDate: "2022-05-31" },
  { value: "INJ", label: "Injective", type: "crypto", inceptionDate: "2020-10-22" },
  { value: "SUI", label: "Sui", type: "crypto", inceptionDate: "2023-05-03" },
  { value: "AAVE", label: "Aave", type: "crypto", inceptionDate: "2020-10-07" },
  { value: "MKR", label: "Maker", type: "crypto", inceptionDate: "2017-12-18" },
  // ── Bitwise funds ─────────────────────────────────────────────────────────
  { value: "BITW", label: "Bitwise 10 Crypto Index Fund", type: "trust", inceptionDate: "2017-11-22" },
  { value: "BITQ", label: "Bitwise Crypto Industry Innovators ETF", type: "etf", inceptionDate: "2021-05-11" },
  { value: "BWEB", label: "Bitwise Web3 ETF", type: "etf", inceptionDate: "2022-10-04" },
  // ── Broad market ETFs ─────────────────────────────────────────────────────
  { value: "SPY", label: "SPDR S&P 500 ETF", type: "etf", inceptionDate: "1993-01-29" },
  { value: "QQQ", label: "Invesco QQQ Trust (Nasdaq-100)", type: "etf", inceptionDate: "1999-03-10" },
  { value: "IWM", label: "iShares Russell 2000 ETF", type: "etf", inceptionDate: "2000-05-26" },
  { value: "VTI", label: "Vanguard Total Stock Market ETF", type: "etf", inceptionDate: "2001-05-31" },
  { value: "DIA", label: "SPDR Dow Jones Industrial Average ETF", type: "etf", inceptionDate: "1998-01-20" },
  // ── Sector & thematic ETFs ────────────────────────────────────────────────
  { value: "XLK", label: "Technology Select Sector SPDR", type: "etf", inceptionDate: "1998-12-22" },
  { value: "XLF", label: "Financial Select Sector SPDR", type: "etf", inceptionDate: "1998-12-22" },
  { value: "XLE", label: "Energy Select Sector SPDR", type: "etf", inceptionDate: "1998-12-22" },
  { value: "XLV", label: "Health Care Select Sector SPDR", type: "etf", inceptionDate: "1998-12-22" },
  { value: "ARKK", label: "ARK Innovation ETF", type: "etf", inceptionDate: "2014-10-31" },
  // ── Commodities & alternatives ────────────────────────────────────────────
  { value: "GLD", label: "SPDR Gold Shares", type: "etf", inceptionDate: "2004-11-18" },
  { value: "SLV", label: "iShares Silver Trust", type: "etf", inceptionDate: "2006-04-28" },
  { value: "USO", label: "United States Oil Fund", type: "etf", inceptionDate: "2006-04-10" },
  { value: "TLT", label: "iShares 20+ Year Treasury Bond ETF", type: "etf", inceptionDate: "2002-07-30" },
  // ── Large-cap stocks ──────────────────────────────────────────────────────
  { value: "AAPL", label: "Apple", type: "stock" },
  { value: "MSFT", label: "Microsoft", type: "stock" },
  { value: "GOOGL", label: "Alphabet (Google)", type: "stock" },
  { value: "AMZN", label: "Amazon", type: "stock" },
  { value: "NVDA", label: "NVIDIA", type: "stock" },
  { value: "META", label: "Meta Platforms", type: "stock" },
  { value: "TSLA", label: "Tesla", type: "stock" },
  { value: "NFLX", label: "Netflix", type: "stock" },
  { value: "JPM", label: "JPMorgan Chase", type: "stock" },
  { value: "GS", label: "Goldman Sachs", type: "stock" },
  { value: "COIN", label: "Coinbase", type: "stock", inceptionDate: "2021-04-14" },
  { value: "MSTR", label: "MicroStrategy", type: "stock" },
];
