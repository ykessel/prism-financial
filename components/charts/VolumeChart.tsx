'use client'

import { useRef } from 'react'
import * as d3 from 'd3'
import type { OHLCV } from '@/types'
import { fmtVolume } from '@/lib/mock-data'
import { useContainerWidth } from '@/lib/hooks'

const MARGIN = { top: 8, right: 16, bottom: 28, left: 70 }

interface Props { data: OHLCV[]; height?: number }

export default function VolumeChart({ data, height = 100 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useContainerWidth(containerRef)

  const candles = data.slice(-90)
  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = height - MARGIN.top - MARGIN.bottom

  const xScale = d3.scaleBand()
    .domain(candles.map(d => d.date))
    .range([0, innerW])
    .padding(0.15)

  const yMax = d3.max(candles, d => d.volume) ?? 1
  const yScale = d3.scaleLinear().domain([0, yMax * 1.1]).range([innerH, 0])

  const yTicks = [yMax * 0.5, yMax].map(v => Math.round(v))
  const xTicks = candles.filter((_, i) => i % Math.ceil(candles.length / 6) === 0)

  return (
    <div ref={containerRef} style={{ width: '100%', height }}>
      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid */}
          {yTicks.map(t => (
            <line key={t} x1={0} x2={innerW} y1={yScale(t)} y2={yScale(t)}
              stroke="#1E2535" strokeDasharray="3,5" />
          ))}

          {/* Bars */}
          {candles.map(d => {
            const isUp = d.close >= d.open
            return (
              <rect
                key={d.date}
                x={xScale(d.date) ?? 0}
                y={yScale(d.volume)}
                width={xScale.bandwidth()}
                height={innerH - yScale(d.volume)}
                fill={isUp ? 'rgba(16,185,129,.55)' : 'rgba(239,68,68,.55)'}
                rx={1}
              />
            )
          })}

          {/* X axis */}
          <g transform={`translate(0,${innerH})`}>
            {xTicks.map(d => (
              <text key={d.date}
                x={(xScale(d.date) ?? 0) + xScale.bandwidth() / 2}
                y={16} textAnchor="middle" fill="#64748B" fontSize={10}
                fontFamily="var(--font-jetbrains), monospace">
                {d3.timeFormat('%b %d')(new Date(d.date))}
              </text>
            ))}
          </g>

          {/* Y axis */}
          {yTicks.map(t => (
            <text key={t} x={-8} y={yScale(t) + 4} textAnchor="end"
              fill="#64748B" fontSize={10} fontFamily="var(--font-jetbrains), monospace">
              {fmtVolume(t)}
            </text>
          ))}
        </g>
      </svg>
    </div>
  )
}
