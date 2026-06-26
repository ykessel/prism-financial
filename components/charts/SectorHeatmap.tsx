'use client'

import type { SectorData } from '@/types'

interface Props {
  data: SectorData[]
  period?: '1D' | '1W' | '1M'
}

function getColor(change: number): string {
  if (change > 3)    return 'rgba(16,185,129,.85)'
  if (change > 1.5)  return 'rgba(16,185,129,.60)'
  if (change > 0.5)  return 'rgba(16,185,129,.35)'
  if (change > 0)    return 'rgba(16,185,129,.18)'
  if (change > -0.5) return 'rgba(239,68,68,.18)'
  if (change > -1.5) return 'rgba(239,68,68,.35)'
  if (change > -3)   return 'rgba(239,68,68,.60)'
  return 'rgba(239,68,68,.85)'
}

function getTextColor(change: number): string {
  return Math.abs(change) > 0.3
    ? change >= 0 ? '#10B981' : '#EF4444'
    : '#94A3B8'
}

export default function SectorHeatmap({ data, period = '1D' }: Props) {
  const sortedData = [...data].sort((a, b) => {
    const va = period === '1D' ? a.change1D : period === '1W' ? a.change1W : a.change1M
    const vb = period === '1D' ? b.change1D : period === '1W' ? b.change1W : b.change1M
    return vb - va
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
      {sortedData.map(s => {
        const change = period === '1D' ? s.change1D : period === '1W' ? s.change1W : s.change1M
        return (
          <div
            key={s.sector}
            style={{
              background: getColor(change),
              border: '1px solid rgba(255,255,255,.06)',
              borderRadius: 12,
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#F1F5F9',
              lineHeight: 1.3,
            }}>
              {s.sector}
            </span>
            <span style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 15,
              fontWeight: 700,
              color: getTextColor(change),
            }}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
            <span style={{
              fontFamily: 'var(--font-jetbrains), monospace',
              fontSize: 10,
              color: 'rgba(241,245,249,.45)',
              marginTop: 2,
            }}>
              {s.topStock} · ${(s.marketCap / 1000).toFixed(1)}T
            </span>
          </div>
        )
      })}
    </div>
  )
}
