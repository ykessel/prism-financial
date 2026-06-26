import type { Stock, SectorData, MarketSummary, WatchlistEntry, OHLCV } from '@/types'

// ── Deterministic pseudo-random ───────────────────────────────
function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateOHLCV(
  startPrice: number,
  days: number,
  volatility: number,
  trend: number,
  seed: number
): OHLCV[] {
  const rand = seededRand(seed)
  const result: OHLCV[] = []
  let price = startPrice
  const now = new Date('2026-06-25')

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const change = (rand() - 0.48) * volatility + trend
    const open = price
    price = Math.max(price * (1 + change), 1)
    const close = price
    const swing = price * (rand() * 0.02 + 0.005)
    const high = Math.max(open, close) + swing
    const low  = Math.min(open, close) - swing
    const volume = Math.round((rand() * 0.8 + 0.6) * 45_000_000 * (startPrice / 200))

    result.push({
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low:  +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    })
  }
  return result
}

// ── Stocks ────────────────────────────────────────────────────
const AAPL_hist = generateOHLCV(148, 365 * 5, 0.015, 0.00045, 1001)
const TSLA_hist = generateOHLCV(180, 365 * 5, 0.032, 0.00030, 1002)
const GOOGL_hist = generateOHLCV(120, 365 * 5, 0.014, 0.00050, 1003)
const MSFT_hist = generateOHLCV(290, 365 * 5, 0.013, 0.00055, 1004)
const AMZN_hist = generateOHLCV(130, 365 * 5, 0.016, 0.00048, 1005)
const NVDA_hist = generateOHLCV(200, 365 * 5, 0.028, 0.00090, 1006)
const META_hist = generateOHLCV(190, 365 * 5, 0.020, 0.00060, 1007)
const NFLX_hist = generateOHLCV(380, 365 * 5, 0.022, 0.00025, 1008)

function lastClose(hist: OHLCV[]) { return hist[hist.length - 1].close }
function prevClose(hist: OHLCV[]) { return hist[hist.length - 2].close }
function chg(hist: OHLCV[]) { return +(lastClose(hist) - prevClose(hist)).toFixed(2) }
function chgPct(hist: OHLCV[]) { return +((chg(hist) / prevClose(hist)) * 100).toFixed(2) }
function sparkline(hist: OHLCV[]) { return hist.slice(-30).map(d => d.close) }

export const STOCKS: Record<string, Stock> = {
  AAPL: {
    ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology',
    price: lastClose(AAPL_hist), change: chg(AAPL_hist), changePct: chgPct(AAPL_hist),
    marketCap: 3100, pe: 28.4, volume: 58_200_000, avgVolume: 54_800_000,
    week52High: +(lastClose(AAPL_hist) * 1.32).toFixed(2),
    week52Low:  +(lastClose(AAPL_hist) * 0.72).toFixed(2),
    history: AAPL_hist,
  },
  TSLA: {
    ticker: 'TSLA', name: 'Tesla, Inc.', sector: 'Consumer Discretionary',
    price: lastClose(TSLA_hist), change: chg(TSLA_hist), changePct: chgPct(TSLA_hist),
    marketCap: 780, pe: 52.1, volume: 98_400_000, avgVolume: 112_000_000,
    week52High: +(lastClose(TSLA_hist) * 1.58).toFixed(2),
    week52Low:  +(lastClose(TSLA_hist) * 0.48).toFixed(2),
    history: TSLA_hist,
  },
  GOOGL: {
    ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services',
    price: lastClose(GOOGL_hist), change: chg(GOOGL_hist), changePct: chgPct(GOOGL_hist),
    marketCap: 2050, pe: 22.8, volume: 24_600_000, avgVolume: 26_100_000,
    week52High: +(lastClose(GOOGL_hist) * 1.28).toFixed(2),
    week52Low:  +(lastClose(GOOGL_hist) * 0.74).toFixed(2),
    history: GOOGL_hist,
  },
  MSFT: {
    ticker: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology',
    price: lastClose(MSFT_hist), change: chg(MSFT_hist), changePct: chgPct(MSFT_hist),
    marketCap: 3250, pe: 34.2, volume: 22_100_000, avgVolume: 20_800_000,
    week52High: +(lastClose(MSFT_hist) * 1.25).toFixed(2),
    week52Low:  +(lastClose(MSFT_hist) * 0.75).toFixed(2),
    history: MSFT_hist,
  },
  AMZN: {
    ticker: 'AMZN', name: 'Amazon.com, Inc.', sector: 'Consumer Discretionary',
    price: lastClose(AMZN_hist), change: chg(AMZN_hist), changePct: chgPct(AMZN_hist),
    marketCap: 1980, pe: 44.6, volume: 38_900_000, avgVolume: 36_200_000,
    week52High: +(lastClose(AMZN_hist) * 1.35).toFixed(2),
    week52Low:  +(lastClose(AMZN_hist) * 0.70).toFixed(2),
    history: AMZN_hist,
  },
  NVDA: {
    ticker: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology',
    price: lastClose(NVDA_hist), change: chg(NVDA_hist), changePct: chgPct(NVDA_hist),
    marketCap: 2780, pe: 48.9, volume: 142_000_000, avgVolume: 138_000_000,
    week52High: +(lastClose(NVDA_hist) * 1.45).toFixed(2),
    week52Low:  +(lastClose(NVDA_hist) * 0.52).toFixed(2),
    history: NVDA_hist,
  },
  META: {
    ticker: 'META', name: 'Meta Platforms', sector: 'Communication Services',
    price: lastClose(META_hist), change: chg(META_hist), changePct: chgPct(META_hist),
    marketCap: 1420, pe: 26.3, volume: 18_700_000, avgVolume: 17_400_000,
    week52High: +(lastClose(META_hist) * 1.30).toFixed(2),
    week52Low:  +(lastClose(META_hist) * 0.68).toFixed(2),
    history: META_hist,
  },
  NFLX: {
    ticker: 'NFLX', name: 'Netflix, Inc.', sector: 'Communication Services',
    price: lastClose(NFLX_hist), change: chg(NFLX_hist), changePct: chgPct(NFLX_hist),
    marketCap: 340, pe: 38.7, volume: 5_200_000, avgVolume: 4_800_000,
    week52High: +(lastClose(NFLX_hist) * 1.38).toFixed(2),
    week52Low:  +(lastClose(NFLX_hist) * 0.66).toFixed(2),
    history: NFLX_hist,
  },
}

export const TICKER_LIST = Object.keys(STOCKS)

// ── Sectors ──────────────────────────────────────────────────
export const SECTORS: SectorData[] = [
  { sector: 'Technology',              change1D:  1.24, change1W:  3.82, change1M:  8.14, marketCap: 14200, topStock: 'MSFT' },
  { sector: 'Communication Services',  change1D: -0.48, change1W:  1.20, change1M:  4.60, marketCap:  5800, topStock: 'GOOGL' },
  { sector: 'Consumer Discretionary',  change1D:  0.72, change1W: -1.44, change1M:  2.30, marketCap:  7200, topStock: 'AMZN' },
  { sector: 'Healthcare',              change1D: -0.19, change1W:  0.64, change1M:  1.80, marketCap:  6400, topStock: 'JNJ' },
  { sector: 'Financials',              change1D:  0.55, change1W:  2.10, change1M:  5.40, marketCap:  8100, topStock: 'JPM' },
  { sector: 'Industrials',             change1D:  0.38, change1W:  1.74, change1M:  3.20, marketCap:  4300, topStock: 'CAT' },
  { sector: 'Consumer Staples',        change1D: -0.22, change1W: -0.88, change1M:  0.60, marketCap:  4100, topStock: 'PG' },
  { sector: 'Energy',                  change1D: -1.05, change1W: -3.20, change1M: -4.80, marketCap:  3200, topStock: 'XOM' },
  { sector: 'Real Estate',             change1D: -0.62, change1W: -1.10, change1M: -2.30, marketCap:  2100, topStock: 'PLD' },
  { sector: 'Utilities',               change1D:  0.14, change1W:  0.42, change1M:  1.10, marketCap:  1600, topStock: 'NEE' },
  { sector: 'Materials',               change1D:  0.29, change1W:  0.96, change1M:  2.10, marketCap:  2400, topStock: 'LIN' },
]

// ── Market indices ────────────────────────────────────────────
export const MARKET_SUMMARY: MarketSummary[] = [
  { index: 'S&P 500',  value: 5412.84, change:  28.46, changePct:  0.53 },
  { index: 'NASDAQ',   value: 17284.10, change:  94.22, changePct:  0.55 },
  { index: 'DOW',      value: 40142.28, change: 112.50, changePct:  0.28 },
  { index: 'VIX',      value:  13.42, change:  -0.68, changePct: -4.82 },
]

// ── Watchlist ─────────────────────────────────────────────────
export const WATCHLIST: WatchlistEntry[] = TICKER_LIST.map(ticker => {
  const s = STOCKS[ticker]
  return {
    ticker: s.ticker,
    name: s.name,
    price: s.price,
    changePct: s.changePct,
    sparkline: sparkline(s.history),
    sector: s.sector,
  }
})

// ── Helper: slice history by time range ───────────────────────
export function sliceHistory(history: OHLCV[], range: string): OHLCV[] {
  const daysMap: Record<string, number> = {
    '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825,
  }
  const days = daysMap[range] ?? 365
  return history.slice(-days)
}

// ── Format helpers ────────────────────────────────────────────
export function fmtPrice(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}
export function fmtVolume(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return n.toLocaleString()
}
export function fmtMarketCap(n: number) {
  return `$${n.toFixed(0)}B`
}
