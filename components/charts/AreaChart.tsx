'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { OHLCV } from '@/types'
import { fmtPrice } from '@/lib/mock-data'

interface Props {
  data: OHLCV[]
  width?: number
  height?: number
  color?: string
}

interface TooltipState {
  x: number
  y: number
  date: string
  price: number
  change: number
  visible: boolean
}

const MARGIN = { top: 12, right: 16, bottom: 32, left: 70 }

export default function AreaChart({ data, height = 320, color = '#3B82F6' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, date: '', price: 0, change: 0, visible: false })
  const [width, setWidth] = useState(800)

  // Responsive width
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(containerRef.current)
    setWidth(containerRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [])

  const parsed = data.map(d => ({ ...d, dateObj: new Date(d.date) }))
  const innerW = width - MARGIN.left - MARGIN.right
  const innerH = height - MARGIN.top - MARGIN.bottom

  const xScale = d3.scaleTime()
    .domain(d3.extent(parsed, d => d.dateObj) as [Date, Date])
    .range([0, innerW])

  const [yMin, yMax] = d3.extent(parsed, d => d.close) as [number, number]
  const yPad = (yMax - yMin) * 0.08
  const yScale = d3.scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([innerH, 0])
    .nice()

  // Area path
  const areaGen = d3.area<typeof parsed[0]>()
    .x(d => xScale(d.dateObj))
    .y0(innerH)
    .y1(d => yScale(d.close))
    .curve(d3.curveMonotoneX)

  // Line path
  const lineGen = d3.line<typeof parsed[0]>()
    .x(d => xScale(d.dateObj))
    .y(d => yScale(d.close))
    .curve(d3.curveMonotoneX)

  const areaPth = areaGen(parsed) ?? ''
  const linePth = lineGen(parsed) ?? ''

  // X ticks
  const xTicks = xScale.ticks(6)
  // Y ticks
  const yTicks = yScale.ticks(5)

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || parsed.length < 2) return
    const mx = e.clientX - rect.left - MARGIN.left
    const date = xScale.invert(mx)
    const bisect = d3.bisector((d: typeof parsed[0]) => d.dateObj).left
    const idx = Math.min(Math.max(bisect(parsed, date, 1), 1), parsed.length - 1)
    const d0 = parsed[idx - 1], d1 = parsed[idx]
    const closest = +date - +d0.dateObj > +d1.dateObj - +date ? d1 : d0

    const cx = xScale(closest.dateObj) + MARGIN.left
    const cy = yScale(closest.close) + MARGIN.top
    const prevClose = parsed[Math.max(idx - 1, 0)].close
    const change = ((closest.close - prevClose) / prevClose) * 100

    setTooltip({
      x: cx, y: cy,
      date: closest.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      price: closest.close,
      change,
      visible: true,
    })
  }, [parsed, xScale, yScale])

  const gradId = `area-grad-${color.replace('#', '')}`
  const isPositive = parsed.length > 1 && parsed[parsed.length - 1].close >= parsed[0].close

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
        style={{ cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.25} />
            <stop offset="100%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.01} />
          </linearGradient>
          <clipPath id="chart-clip">
            <rect x={0} y={0} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Grid lines */}
          {yTicks.map(tick => (
            <line key={tick} x1={0} x2={innerW} y1={yScale(tick)} y2={yScale(tick)}
              stroke="#1E2535" strokeDasharray="3,5" strokeWidth={1} />
          ))}

          {/* Area */}
          <path d={areaPth} fill={`url(#${gradId})`} clipPath="url(#chart-clip)" />

          {/* Line */}
          <path d={linePth} fill="none"
            stroke={isPositive ? '#10B981' : '#EF4444'}
            strokeWidth={2} clipPath="url(#chart-clip)" />

          {/* X axis */}
          <g transform={`translate(0,${innerH})`}>
            {xTicks.map((tick, i) => (
              <g key={i} transform={`translate(${xScale(tick)},0)`}>
                <line y2={5} stroke="#1E2535" />
                <text y={18} textAnchor="middle" fill="#64748B" fontSize={11}
                  fontFamily="var(--font-jetbrains), monospace">
                  {d3.timeFormat('%b %d')(tick)}
                </text>
              </g>
            ))}
          </g>

          {/* Y axis */}
          {yTicks.map(tick => (
            <text key={tick} x={-8} y={yScale(tick) + 4} textAnchor="end"
              fill="#64748B" fontSize={11} fontFamily="var(--font-jetbrains), monospace">
              ${fmtPrice(tick)}
            </text>
          ))}

          {/* Crosshair */}
          {tooltip.visible && (
            <>
              <line
                x1={tooltip.x - MARGIN.left} x2={tooltip.x - MARGIN.left}
                y1={0} y2={innerH}
                className="crosshair"
              />
              <circle
                cx={tooltip.x - MARGIN.left}
                cy={tooltip.y - MARGIN.top}
                r={4}
                fill={isPositive ? '#10B981' : '#EF4444'}
                stroke="#070B14" strokeWidth={2}
              />
            </>
          )}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="chart-tooltip"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 40,
            transform: tooltip.x > width * 0.7 ? 'translateX(-110%)' : 'none',
          }}
        >
          <div style={{ color: '#94A3B8', fontSize: 11, marginBottom: 4, fontFamily: 'var(--font-jetbrains)' }}>
            {tooltip.date}
          </div>
          <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-jetbrains)' }}>
            ${fmtPrice(tooltip.price)}
          </div>
          <div style={{ color: tooltip.change >= 0 ? '#10B981' : '#EF4444', fontSize: 12, fontFamily: 'var(--font-jetbrains)' }}>
            {tooltip.change >= 0 ? '+' : ''}{tooltip.change.toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  )
}
