'use client'

import * as d3 from 'd3'

interface Props {
  data: number[]
  width?: number
  height?: number
  positive?: boolean
}

export default function Sparkline({ data, width = 80, height = 28, positive }: Props) {
  if (data.length < 2) return null

  const isPositive = positive ?? data[data.length - 1] >= data[0]
  const color = isPositive ? '#10B981' : '#EF4444'

  const xScale = d3.scaleLinear().domain([0, data.length - 1]).range([0, width])
  const [yMin, yMax] = d3.extent(data) as [number, number]
  const yPad = (yMax - yMin) * 0.1 || 1
  const yScale = d3.scaleLinear().domain([yMin - yPad, yMax + yPad]).range([height, 0])

  const lineGen = d3.line<number>()
    .x((_, i) => xScale(i))
    .y(d => yScale(d))
    .curve(d3.curveMonotoneX)

  const areaGen = d3.area<number>()
    .x((_, i) => xScale(i))
    .y0(height)
    .y1(d => yScale(d))
    .curve(d3.curveMonotoneX)

  const linePth = lineGen(data) ?? ''
  const areaPth = areaGen(data) ?? ''

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPth} fill={`url(#sg-${color.replace('#','')})`} />
      <path d={linePth} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}
