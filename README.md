# Prism — Interactive Financial Dashboard

A real-time stock market dashboard built with Next.js 16, D3.js, and the Finnhub API. Dark navy UI with interactive charts, live price data, and sector analysis.

![Prism Dashboard](https://via.placeholder.com/1200x630/070B14/3B82F6?text=Prism+Dashboard)

## Features

- **Live quotes** — real-time prices, change %, and key metrics via Finnhub
- **Area & Candlestick charts** — switchable chart types with crosshair + tooltip
- **Volume chart** — color-coded buy/sell volume bars
- **Sector heatmap** — 11 S&P 500 sectors with 1D/1W/1M performance
- **Market treemap** — market-cap weighted view of all tracked stocks
- **Watchlist** — inline sparklines per ticker, click any row to drill in
- **Time range selector** — 1W / 1M / 3M / 6M / 1Y / 5Y
- **Graceful fallback** — shows demo data with a retry banner if the API is unavailable

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Charts | D3.js 7 (scales/paths) + React SVG rendering |
| Styling | Tailwind CSS + inline CSS variables |
| Data | Finnhub API (free tier) + seeded mock OHLCV |
| Runtime | Node.js 22 |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/ykessel/prism
cd prism
npm install
```

### 2. Set up environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Finnhub API key. Get one free at [finnhub.io/register](https://finnhub.io/register).

```env
FINNHUB_API_KEY=your_key_here
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
Prism/
├── app/
│   ├── api/market/route.ts   # GET /api/market — merges Finnhub + mock data
│   ├── layout.tsx             # Inter + JetBrains Mono fonts
│   ├── page.tsx               # Main dashboard (client component)
│   └── globals.css            # Chart tooltip, crosshair, shimmer animation
├── components/
│   ├── charts/
│   │   ├── AreaChart.tsx      # D3 area + line, gradient fill, crosshair
│   │   ├── CandlestickChart.tsx
│   │   ├── VolumeChart.tsx
│   │   ├── Sparkline.tsx      # Inline 80×28 SVG for watchlist rows
│   │   ├── SectorHeatmap.tsx  # CSS grid, color intensity from change %
│   │   └── MarketTreemap.tsx  # D3 treemap, market-cap weighted
│   └── dashboard/
│       └── WatchlistTable.tsx
├── lib/
│   ├── finnhub.ts             # Server-side API client, 60s in-memory cache
│   ├── mock-data.ts           # Seeded OHLCV history, sectors, indices
│   └── hooks.ts               # useContainerWidth (ResizeObserver)
├── types/index.ts             # OHLCV, Stock, TimeRange, ChartType, etc.
└── .env.local.example
```

## Data Architecture

Finnhub's free tier covers `/quote`, `/stock/profile2`, and `/stock/metric`. The `/stock/candle` endpoint (historical OHLCV) requires a paid plan, so Prism uses:

- **Finnhub** → live prices, change %, P/E, 52W high/low, avg volume
- **Mock data** → deterministic OHLCV history seeded per ticker (for charts)

This means charts look realistic and all financial metrics are real — the only simulated part is the historical candlestick data.

All Finnhub calls go through `/api/market` (server-side), so the API key is never exposed to the browser. Responses are cached for 60 seconds in memory.

## Tracked Stocks

AAPL · MSFT · GOOGL · AMZN · NVDA · META · TSLA · NFLX

## Deployment

Deploy to Vercel in one step. Set `FINNHUB_API_KEY` as an environment variable in your Vercel project settings — the app works without it (falls back to demo data with a warning banner).

```bash
vercel --prod
```

## License

MIT
