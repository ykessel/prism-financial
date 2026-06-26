'use client'

import Sparkline from '@/components/charts/Sparkline'
import type { WatchlistEntry } from '@/types'
import { fmtPrice, fmtPct } from '@/lib/mock-data'

interface Props {
  data: WatchlistEntry[]
  activeTicker: string
  onSelect: (ticker: string) => void
}

export default function WatchlistTable({ data, activeTicker, onSelect }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1E2535' }}>
            {['Symbol', 'Name', 'Price', 'Change', '30D', 'Sector'].map(h => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: 'left',
                fontFamily: 'var(--font-jetbrains), monospace',
                fontSize: 11, color: '#64748B', fontWeight: 500,
                textTransform: 'uppercase', letterSpacing: '.08em',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => {
            const isActive = row.ticker === activeTicker
            const isPos = row.changePct >= 0
            return (
              <tr
                key={row.ticker}
                onClick={() => onSelect(row.ticker)}
                style={{
                  borderBottom: '1px solid #0D1117',
                  background: isActive ? 'rgba(59,130,246,.08)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.03)' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
              >
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    fontWeight: 700, fontSize: 13,
                    color: isActive ? '#3B82F6' : '#F1F5F9',
                  }}>
                    {row.ticker}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: '#94A3B8', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.name}
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 600, color: '#F1F5F9' }}>
                    ${fmtPrice(row.price)}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-jetbrains), monospace',
                    fontWeight: 600,
                    color: isPos ? '#10B981' : '#EF4444',
                  }}>
                    {fmtPct(row.changePct)}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <Sparkline data={row.sparkline} positive={isPos} />
                </td>
                <td style={{ padding: '10px 12px', color: '#64748B', whiteSpace: 'nowrap', fontSize: 11 }}>
                  {row.sector}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
