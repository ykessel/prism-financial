import { NextRequest, NextResponse } from 'next/server'
import { fetchStockDetail, fetchQuotes } from '@/lib/finnhub'
import { STOCKS, SECTORS, MARKET_SUMMARY, WATCHLIST, sliceHistory } from '@/lib/mock-data'

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ticker = searchParams.get('ticker')?.toUpperCase()
  const range  = searchParams.get('range') ?? '1Y'

  try {
    if (ticker) {
      if (!TICKERS.includes(ticker)) {
        return NextResponse.json({ error: 'Unknown ticker' }, { status: 404 })
      }

      // Real-time data from Finnhub (quote + profile + metrics)
      const liveDetail = await fetchStockDetail(ticker)

      // Historical OHLCV from mock data (Finnhub candles = paid tier)
      const mockStock = STOCKS[ticker]
      const history = mockStock ? sliceHistory(mockStock.history, range) : []

      return NextResponse.json({ ...liveDetail, history })
    }

    // Overview: batch quotes from Finnhub, static mock data for sectors/watchlist sparklines
    const quotes = await fetchQuotes(TICKERS)

    // Merge live prices into watchlist entries
    const watchlist = WATCHLIST.map(entry => {
      const live = quotes.find(q => q.ticker === entry.ticker)
      if (!live) return entry
      return { ...entry, price: live.price, change: live.change, changePct: live.changePct }
    })

    // Build stocks array (marketCap/pe stay as mock — not worth 16 extra API calls)
    const stocks = TICKERS.map(t => {
      const live = quotes.find(q => q.ticker === t)
      const mock = STOCKS[t]
      return {
        ticker:    t,
        name:      mock?.name   ?? t,
        sector:    mock?.sector ?? '—',
        price:     live?.price     ?? mock?.price     ?? 0,
        change:    live?.change    ?? mock?.change    ?? 0,
        changePct: live?.changePct ?? mock?.changePct ?? 0,
        marketCap: mock?.marketCap ?? 0,
        pe:        mock?.pe        ?? 0,
        volume:    mock?.volume    ?? 0,
      }
    })

    return NextResponse.json({
      stocks,
      sectors:   SECTORS,
      indices:   MARKET_SUMMARY,
      watchlist,
    })

  } catch (err) {
    console.error('[/api/market]', err)
    return NextResponse.json(
      { error: 'Failed to fetch market data', detail: String(err) },
      { status: 502 }
    )
  }
}
