'use client'

import { useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { OHLCV } from '@/types'
import { fmtPrice } from '@/lib/mock-data'
import { useContainerWidth } from '@/lib/hooks'

const MARGIN = { top: 12, right: 16, bottom: 32, left: 70 }

interface TooltipState {
  x: number; y: number; visible: boolean
  date: string; open: number; high: number; low: number; close: number
}

interface Props { data: OHLCV[]; height?: number }

export default function CandlestickChart({ data, height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const width = useContainerWidth(containerRef)
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, visible: false, date: '', open: 0, high: 0, low: 0, close: 0 })

  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = height - MARGIN.top - MARGIN.bottom

  // Limit to last 90 points for readability
  const candles = data.slice(-90)

  const xScale = d3.scaleBand()
    .domain(candles.map(d => d.date))
    .range([0, innerW])
    .padding(0.2)

  const [yMin, yMax] = [
    d3.min(candles, d => d.low)!,
    d3.max(candles, d => d.high)!,
  ]
  const yPad = (yMax - yMin) * 0.06
  const yScale = d3.scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([innerH, 0])
    .nice()

  const yTicks = yScale.ticks(5)
  const xTicks = candles.filter((_, i) => i % Math.ceil(candles.length / 6) === 0)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left - MARGIN.left
    // find closest candle
    const bw = xScale.bandwidth() + xScale.step() * xScale.paddingInner()
    const idx = Math.min(Math.max(Math.floor(mx / xScale.step()), 0), candles.length - 1)
    const d = candles[idx]
    if (!d) return
    const cx = (xScale(d.date) ?? 0) + xScale.bandwidth() / 2 + MARGIN.left
    const cy = yScale((d.open + d.close) / 2) + MARGIN.top
    setTooltip({
      x: cx, y: cy, visible: true,
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      open: d.open, high: d.high, low: d.low, close: d.close,
    })
  }, [candles, xScale, yScale])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height }}>
      <svg ref={svgRef} width={width} height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
        style={{ cursor: 'crosshair' }}>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid */}
          {yTicks.map(t => (
            <line key={t} x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)}
              stroke="#1E2535" strokeDasharray="3,5" />
          ))}

          {/* Candles */}
          {candles.map(d => {
            const isUp = d.close >= d.open
            const color = isUp ? '#10B981' : '#EF4444'
            const x = xScale(d.date) ?? 0
            const bw = xScale.bandwidth()
            const bodyTop = yScale(Math.max(d.open, d.close))
            const bodyBot = yScale(Math.min(d.open, d.close))
            const bodyH = Math.max(bodyBot - bodyTop, 1)
            const midX = x + bw / 2
            return (
              <g key={d.date}>
                {/* Wick */}
                <line x1={midX} x2={midX} y1={yScale(d.high)} y2={yScale(d.low)}
                  stroke={color} strokeWidth={1} />
                {/* Body */}
                <rect x={x} y={bodyTop} width={bw} height={bodyH}
                  fill={isUp ? color : 'none'}
                  stroke={color} strokeWidth={isUp ? 0 : 1.5} rx={1} />
              </g>
            )
          })}

          {/* X axis */}
          <g transform={`translate(0,${innerH})`}>
            {xTicks.map(d => (
              <g key={d.date} transform={`translate(${(xScale(d.date) ?? 0) + xScale.bandwidth() / 2},0)`}>
                <line y2={5} stroke="#1E2535" />
                <text y={18} textAnchor="middle" fill="#64748B" fontSize={11}
                  fontFamily="var(--font-jetbrains), monospace">
                  {d3.timeFormat('%b %d')(new Date(d.date))}
                </text>
              </g>
            ))}
          </g>

          {/* Y axis */}
          {yTicks.map(t => (
            <text key={t} x={-8} y={yScale(t) + 4} textAnchor="end"
              fill="#64748B" fontSize={11} fontFamily="var(--font-jetbrains), monospace">
              ${fmtPrice(t)}
            </text>
          ))}

          {/* Crosshair */}
          {tooltip.visible && (
            <line x1={tooltip.x - MARGIN.left} x2={tooltip.x - MARGIN.left}
              y1={0} y2={innerH} className="crosshair" />
          )}
        </g>
      </svg>

      {tooltip.visible && (
        <div className="chart-tooltip" style={{
          left: tooltip.x + 12,
          top: MARGIN.top + 8,
          transform: tooltip.x > width * 0.7 ? 'translateX(-110%)' : 'none',
        }}>
          <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 6, fontFamily: 'var(--font-jetbrains)' }}>{tooltip.date}</div>
          {[['O', tooltip.open], ['H', tooltip.high], ['L', tooltip.low], ['C', tooltip.close]].map(([label, val]) => (
            <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, marginBottom: 2, fontFamily: 'var(--font-jetbrains)' }}>
              <span style={{ color: '#64748B' }}>{label}</span>
              <span style={{ color: label === 'C' ? (tooltip.close >= tooltip.open ? '#10B981' : '#EF4444') : '#F1F5F9' }}>
                ${fmtPrice(Number(val))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
