'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { SECTORS, MARKET_SUMMARY, WATCHLIST, sliceHistory, fmtPrice, fmtPct, fmtVolume, fmtMarketCap } from '@/lib/mock-data'
import { STOCKS as MOCK_STOCKS } from '@/lib/mock-data'
import WatchlistTable from '@/components/dashboard/WatchlistTable'
import SectorHeatmap from '@/components/charts/SectorHeatmap'
import MarketTreemap from '@/components/charts/MarketTreemap'
import type { TimeRange, ChartType, SectorData, WatchlistEntry, OHLCV } from '@/types'

const AreaChart       = dynamic(() => import('@/components/charts/AreaChart'),       { ssr: false })
const CandlestickChart = dynamic(() => import('@/components/charts/CandlestickChart'), { ssr: false })
const VolumeChart     = dynamic(() => import('@/components/charts/VolumeChart'),     { ssr: false })

const TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX']
const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', '5Y']
const HEATMAP_PERIODS = ['1D', '1W', '1M'] as const

// ── Types ─────────────────────────────────────────────────────
interface StockDetail {
  ticker: string
  name: string
  sector: string
  price: number
  change: number
  changePct: number
  marketCap: number
  pe: number
  volume: number
  avgVolume: number
  week52High: number
  week52Low: number
  history: OHLCV[]
}

interface OverviewEntry {
  ticker: string
  name: string
  sector: string
  price: number
  change: number
  changePct: number
  marketCap: number
  pe: number
  volume: number
}

interface MarketOverview {
  stocks: OverviewEntry[]
  sectors: SectorData[]
  indices: typeof MARKET_SUMMARY
  watchlist: WatchlistEntry[]
}

// ── Skeleton ──────────────────────────────────────────────────
function Skeleton({ w, h, radius = 6 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg,#1E2535 25%,#2a3347 50%,#1E2535 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  )
}

// ── Metric Card ───────────────────────────────────────────────
function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: '#0D1117', border: '1px solid #1E2535', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.10em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 700, fontSize: 22, color: accent ?? '#F1F5F9', letterSpacing: '-.02em' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: '#64748B', marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function MetricCardSkeleton() {
  return (
    <div style={{ background: '#0D1117', border: '1px solid #1E2535', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton w={60} h={10} />
      <Skeleton w={90} h={22} />
    </div>
  )
}

// ── Index Ticker ──────────────────────────────────────────────
function IndexTicker({ index, value, changePct }: { index: string; value: number; changePct: number }) {
  const isPos = changePct >= 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px', borderRight: '1px solid #1E2535' }}>
      <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: '#94A3B8' }}>{index}</span>
      <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>
        {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: isPos ? '#10B981' : '#EF4444' }}>
        {fmtPct(changePct)}
      </span>
    </div>
  )
}

// ── Error Banner ──────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
      borderRadius: 10, padding: '10px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 16, fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12,
    }}>
      <span style={{ color: '#EF4444' }}>⚠ {message}</span>
      <button
        onClick={onRetry}
        style={{
          background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)',
          color: '#EF4444', padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11,
        }}
      >
        Retry
      </button>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const [ticker, setTicker]           = useState('AAPL')
  const [range, setRange]             = useState<TimeRange>('1Y')
  const [chartType, setChartType]     = useState<ChartType>('area')
  const [heatmapPeriod, setHeatmapPeriod] = useState<'1D' | '1W' | '1M'>('1D')
  const [activeTab, setActiveTab]     = useState<'watchlist' | 'sectors' | 'treemap'>('watchlist')

  // API state
  const [stock, setStock]             = useState<StockDetail | null>(null)
  const [overview, setOverview]       = useState<MarketOverview | null>(null)
  const [loadingStock, setLoadingStock] = useState(true)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [stockError, setStockError]   = useState<string | null>(null)
  const [overviewError, setOverviewError] = useState<string | null>(null)

  // Fetch stock detail when ticker or range changes
  const fetchStock = useCallback(async () => {
    setLoadingStock(true)
    setStockError(null)
    try {
      const res = await fetch(`/api/market?ticker=${ticker}&range=${range}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: StockDetail = await res.json()
      if ('error' in data) throw new Error((data as { error: string }).error)
      setStock(data)
    } catch (err) {
      console.error('[stock fetch]', err)
      // Graceful fallback to mock data
      const mock = MOCK_STOCKS[ticker]
      if (mock) {
        setStock({ ...mock, history: mock.history.slice(-90) })
        setStockError('Live data unavailable — showing demo data')
      } else {
        setStockError('Failed to load stock data')
      }
    } finally {
      setLoadingStock(false)
    }
  }, [ticker, range])

  // Fetch market overview once
  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true)
    setOverviewError(null)
    try {
      const res = await fetch('/api/market')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: MarketOverview = await res.json()
      if ('error' in data) throw new Error((data as { error: string }).error)
      setOverview(data)
    } catch (err) {
      console.error('[overview fetch]', err)
      // Fallback to static mock overview
      setOverview({
        stocks: Object.values(MOCK_STOCKS).map(s => ({
          ticker: s.ticker, name: s.name, sector: s.sector,
          price: s.price, change: s.change, changePct: s.changePct,
          marketCap: s.marketCap, pe: s.pe, volume: s.volume,
        })),
        sectors: SECTORS,
        indices: MARKET_SUMMARY,
        watchlist: WATCHLIST,
      })
      setOverviewError('Live overview unavailable — showing demo data')
    } finally {
      setLoadingOverview(false)
    }
  }, [])

  useEffect(() => { fetchStock() }, [fetchStock])
  useEffect(() => { fetchOverview() }, [fetchOverview])

  // Sliced history
  const history = useMemo(() => {
    if (!stock?.history?.length) return []
    return sliceHistory(stock.history, range)
  }, [stock, range])

  const treemapData = useMemo(() => {
    if (!overview) return []
    return overview.stocks.map(s => ({
      ticker: s.ticker, name: s.name,
      marketCap: s.marketCap || 100,
      changePct: s.changePct,
    }))
  }, [overview])

  const isPos = (stock?.changePct ?? 0) >= 0
  const indices = overview?.indices ?? MARKET_SUMMARY
  const watchlist = overview?.watchlist ?? WATCHLIST

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', color: '#F1F5F9' }}>

      {/* ── NAV ───────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,11,20,.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1E2535',
      }}>
        {/* Index ticker bar */}
        <div style={{ borderBottom: '1px solid #1E2535', overflowX: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 36, paddingLeft: 16 }}>
            {indices.map(m => (
              <IndexTicker key={m.index} index={m.index} value={m.value} changePct={m.changePct} />
            ))}
          </div>
        </div>

        {/* Main nav */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 3l4 8 5-5 4 6 5-4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 20h18" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 700, fontSize: 16, letterSpacing: '-.02em', color: '#F1F5F9' }}>
              Prism
            </span>
            <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: '#3B82F6', background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.25)', padding: '2px 8px', borderRadius: 999 }}>
              Markets
            </span>
          </div>

          {/* Stock selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {TICKERS.map(t => (
              <button
                key={t}
                onClick={() => setTicker(t)}
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 12, fontWeight: 600,
                  padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                  border: t === ticker ? '1px solid rgba(59,130,246,.5)' : '1px solid #1E2535',
                  background: t === ticker ? 'rgba(59,130,246,.15)' : 'transparent',
                  color: t === ticker ? '#3B82F6' : '#64748B',
                  transition: 'all .15s',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <a
            href="https://github.com/ykessel"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: '#64748B', textDecoration: 'none' }}
          >
            GitHub ↗
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* ── Error banners ─────────────────────────────── */}
        {stockError && <ErrorBanner message={stockError} onRetry={fetchStock} />}
        {overviewError && !stockError && <ErrorBanner message={overviewError} onRetry={fetchOverview} />}

        {/* ── Stock Header ──────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            {loadingStock ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Skeleton w={180} h={28} radius={8} />
                  <Skeleton w={60} h={24} radius={6} />
                </div>
                <Skeleton w={260} h={38} radius={8} />
              </div>
            ) : stock ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <h1 style={{ fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 700, fontSize: 28, letterSpacing: '-.02em' }}>
                    {stock.name}
                  </h1>
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 13, color: '#94A3B8', background: '#1E2535', padding: '3px 10px', borderRadius: 6 }}>
                    {ticker}
                  </span>
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: '#64748B' }}>
                    {stock.sector}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 38, fontWeight: 800, letterSpacing: '-.03em', color: '#F1F5F9' }}>
                    ${fmtPrice(stock.price)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 16, fontWeight: 600, color: isPos ? '#10B981' : '#EF4444' }}>
                    {isPos ? '+' : ''}{fmtPrice(stock.change)} ({fmtPct(stock.changePct)})
                  </span>
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, color: '#64748B' }}>today</span>
                </div>
              </>
            ) : null}
          </div>

          {/* Chart type toggle */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['area', 'candlestick'] as ChartType[]).map(ct => (
              <button
                key={ct}
                onClick={() => setChartType(ct)}
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                  border: ct === chartType ? '1px solid rgba(59,130,246,.5)' : '1px solid #1E2535',
                  background: ct === chartType ? 'rgba(59,130,246,.15)' : 'transparent',
                  color: ct === chartType ? '#3B82F6' : '#64748B',
                  textTransform: 'capitalize',
                }}
              >
                {ct === 'area' ? '📈 Area' : '🕯️ Candle'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Metric Cards ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {loadingStock ? (
            Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : stock ? (
            <>
              <MetricCard label="Market Cap" value={fmtMarketCap(stock.marketCap)} />
              <MetricCard label="P/E Ratio"  value={stock.pe ? stock.pe.toFixed(1) : '—'} />
              <MetricCard label="Volume"     value={fmtVolume(stock.volume)} sub={stock.avgVolume ? `Avg ${fmtVolume(stock.avgVolume)}` : undefined} />
              <MetricCard label="52W High"   value={`$${fmtPrice(stock.week52High)}`} accent="#10B981" />
              <MetricCard label="52W Low"    value={`$${fmtPrice(stock.week52Low)}`}  accent="#EF4444" />
              <MetricCard
                label="Vol / Avg"
                value={stock.avgVolume ? `${((stock.volume / stock.avgVolume) * 100).toFixed(0)}%` : '—'}
                accent={stock.avgVolume && stock.volume > stock.avgVolume ? '#10B981' : '#EF4444'}
              />
            </>
          ) : null}
        </div>

        {/* ── Main Chart ───────────────────────────────── */}
        <div style={{ background: '#0D1117', border: '1px solid #1E2535', borderRadius: 18, padding: 24, marginBottom: 16 }}>
          {/* Time range */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {TIME_RANGES.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  fontFamily: 'var(--font-jetbrains), monospace',
                  fontSize: 12, padding: '4px 12px', borderRadius: 7, cursor: 'pointer',
                  border: r === range ? '1px solid rgba(59,130,246,.5)' : '1px solid transparent',
                  background: r === range ? 'rgba(59,130,246,.15)' : 'transparent',
                  color: r === range ? '#3B82F6' : '#64748B',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {loadingStock ? (
            <Skeleton w="100%" h={300} radius={10} />
          ) : history.length > 0 ? (
            chartType === 'area'
              ? <AreaChart data={history} height={300} />
              : <CandlestickChart data={history} height={300} />
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontFamily: 'var(--font-jetbrains), monospace', fontSize: 13 }}>
              No chart data available
            </div>
          )}
        </div>

        {/* ── Volume Chart ─────────────────────────────── */}
        <div style={{ background: '#0D1117', border: '1px solid #1E2535', borderRadius: 18, padding: '16px 24px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
            Volume
          </div>
          {loadingStock ? (
            <Skeleton w="100%" h={90} radius={8} />
          ) : history.length > 0 ? (
            <VolumeChart data={history} height={90} />
          ) : null}
        </div>

        {/* ── Bottom Tabs ──────────────────────────────── */}
        <div style={{ background: '#0D1117', border: '1px solid #1E2535', borderRadius: 18, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1E2535' }}>
            {(['watchlist', 'sectors', 'treemap'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '14px 16px',
                  fontFamily: 'var(--font-jetbrains), monospace', fontSize: 12, fontWeight: 600,
                  color: tab === activeTab ? '#3B82F6' : '#64748B',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: tab === activeTab ? '2px solid #3B82F6' : '2px solid transparent',
                  textTransform: 'capitalize',
                  transition: 'all .15s',
                }}
              >
                {tab === 'watchlist' ? '⊟ Watchlist' : tab === 'sectors' ? '⊞ Sectors' : '⊟ Treemap'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: activeTab === 'watchlist' ? 0 : 20 }}>
            {activeTab === 'watchlist' && (
              loadingOverview ? (
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} w="100%" h={44} radius={6} />)}
                </div>
              ) : (
                <WatchlistTable
                  data={watchlist}
                  activeTicker={ticker}
                  onSelect={setTicker}
                />
              )
            )}
            {activeTab === 'sectors' && (
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {HEATMAP_PERIODS.map(p => (
                    <button
                      key={p}
                      onClick={() => setHeatmapPeriod(p)}
                      style={{
                        fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, fontWeight: 600,
                        padding: '4px 12px', borderRadius: 7, cursor: 'pointer',
                        border: p === heatmapPeriod ? '1px solid rgba(59,130,246,.5)' : '1px solid #1E2535',
                        background: p === heatmapPeriod ? 'rgba(59,130,246,.15)' : 'transparent',
                        color: p === heatmapPeriod ? '#3B82F6' : '#64748B',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <SectorHeatmap data={SECTORS} period={heatmapPeriod} />
              </div>
            )}
            {activeTab === 'treemap' && (
              <div>
                <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: '#64748B', marginBottom: 12 }}>
                  S&amp;P 500 — Market cap weighted · color = 1D change
                </div>
                {loadingOverview ? (
                  <Skeleton w="100%" h={300} radius={10} />
                ) : (
                  <MarketTreemap data={treemapData} height={300} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, fontFamily: 'var(--font-jetbrains), monospace', fontSize: 11, color: '#2D3748' }}>
          Built by{' '}
          <a href="https://portfolio-ykessel.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>
            Yan Kessel
          </a>
          {' · '}
          Powered by{' '}
          <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer" style={{ color: '#3B82F6', textDecoration: 'none' }}>
            Finnhub
          </a>
        </div>
      </div>
    </div>
  )
}
