/**
 * Finnhub API client — server-side only
 * Free tier: 60 requests/minute
 * Note: /stock/candle requires a paid plan — we use it only for quotes/profile/metrics.
 * Historical OHLCV data for charts comes from mock-data.
 */

const BASE = 'https://finnhub.io/api/v1'

// ── In-memory cache ───────────────────────────────────────────
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60_000 // 1 minute

async function get<T>(path: string): Promise<T> {
  const key = path
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data as T

  const token = process.env.FINNHUB_API_KEY
  if (!token) throw new Error('FINNHUB_API_KEY not set')

  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}token=${token}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Finnhub ${res.status}: ${path}`)

  const data = await res.json()
  cache.set(key, { data, ts: Date.now() })
  return data as T
}

// ── Raw types ─────────────────────────────────────────────────
interface FinnhubQuote {
  c: number   // current price
  d: number   // change
  dp: number  // change %
  h: number   // day high
  l: number   // day low
  o: number   // day open
  pc: number  // prev close
  t: number   // timestamp
  v?: number  // volume (not always present on free tier)
}

interface FinnhubProfile {
  name: string
  ticker: string
  finnhubIndustry: string
  marketCapitalization: number  // in millions
  shareOutstanding: number
}

interface FinnhubMetrics {
  metric: {
    peNormalizedAnnual?: number
    peBasicExclExtraTTM?: number
    '52WeekHigh'?: number
    '52WeekLow'?: number
    averageDailyVolume10Day?: number
    averageDailyVolume3Month?: number
  }
}

// ── Public helpers ────────────────────────────────────────────
export async function fetchQuote(ticker: string): Promise<FinnhubQuote> {
  return get<FinnhubQuote>(`/quote?symbol=${ticker}`)
}

export async function fetchProfile(ticker: string): Promise<FinnhubProfile> {
  return get<FinnhubProfile>(`/stock/profile2?symbol=${ticker}`)
}

export async function fetchMetrics(ticker: string): Promise<FinnhubMetrics> {
  return get<FinnhubMetrics>(`/stock/metric?symbol=${ticker}&metric=all`)
}

// ── Stock detail — no candles (paid-only endpoint) ────────────
// History is injected by the API route from mock-data.
export async function fetchStockDetail(ticker: string) {
  const [quote, profile, metrics] = await Promise.all([
    fetchQuote(ticker),
    fetchProfile(ticker).catch(() => null),
    fetchMetrics(ticker).catch(() => null),
  ])

  const m = metrics?.metric ?? {}
  const pe = m.peNormalizedAnnual ?? m.peBasicExclExtraTTM ?? 0
  const week52High = m['52WeekHigh'] ?? quote.h
  const week52Low  = m['52WeekLow']  ?? quote.l
  const avgVolume  = m.averageDailyVolume10Day ?? m.averageDailyVolume3Month ?? 0

  return {
    ticker,
    name:       profile?.name             ?? ticker,
    sector:     profile?.finnhubIndustry  ?? '—',
    price:      quote.c,
    change:     +quote.d.toFixed(2),
    changePct:  +quote.dp.toFixed(2),
    marketCap:  profile ? +(profile.marketCapitalization / 1000).toFixed(0) : 0, // M → B
    pe:         +pe.toFixed(1),
    volume:     quote.v ?? 0,
    avgVolume:  Math.round(avgVolume),
    week52High: +week52High.toFixed(2),
    week52Low:  +week52Low.toFixed(2),
  }
}

// ── Batch quotes for watchlist / overview ─────────────────────
export async function fetchQuotes(tickers: string[]) {
  return Promise.all(tickers.map(async t => {
    const q = await fetchQuote(t)
    return { ticker: t, price: q.c, change: q.d, changePct: q.dp }
  }))
}
