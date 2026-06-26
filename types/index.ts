export interface OHLCV {
  date: string      // ISO date string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Stock {
  ticker: string
  name: string
  sector: string
  price: number
  change: number        // absolute $ change
  changePct: number     // % change
  marketCap: number     // in billions
  pe: number            // P/E ratio
  volume: number        // today's volume
  avgVolume: number     // 30-day avg volume
  week52High: number
  week52Low: number
  history: OHLCV[]      // price history
}

export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'
export type ChartType = 'area' | 'candlestick'

export interface SectorData {
  sector: string
  change1D: number
  change1W: number
  change1M: number
  marketCap: number
  topStock: string
}

export interface MarketSummary {
  index: string
  value: number
  change: number
  changePct: number
}

export interface WatchlistEntry {
  ticker: string
  name: string
  price: number
  changePct: number
  sparkline: number[]   // last 30 close prices
  sector: string
}
