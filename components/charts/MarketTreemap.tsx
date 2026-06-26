'use client'

import { useRef } from 'react'
import * as d3 from 'd3'
import { useContainerWidth } from '@/lib/hooks'
import { fmtMarketCap } from '@/lib/mock-data'

interface TreeNode {
  ticker: string
  name: string
  marketCap: number
  changePct: number
}

type HierarchyData = TreeNode & { children?: TreeNode[] }

interface Props {
  data: TreeNode[]
  height?: number
}

function getColor(change: number): string {
  if (change > 3)   return '#065F46'
  if (change > 1)   return '#047857'
  if (change > 0)   return '#059669'
  if (change > -1)  return '#7F1D1D'
  if (change > -3)  return '#991B1B'
  return '#DC2626'
}

export default function MarketTreemap({ data, height = 280 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const width = useContainerWidth(containerRef)

  const root = d3.hierarchy<HierarchyData>({ children: data } as HierarchyData)
    .sum((d) => d.marketCap)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  d3.treemap<TreeNode>()
    .size([width, height])
    .padding(3)
    .round(true)(root)

  const leaves = root.leaves() as d3.HierarchyRectangularNode<TreeNode>[]

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height }}>
      <svg width={width} height={height} style={{ borderRadius: 12, overflow: 'hidden' }}>
        {leaves.map(leaf => {
          const d = leaf.data as TreeNode
          const w = leaf.x1 - leaf.x0
          const h = leaf.y1 - leaf.y0
          const showLabel = w > 50 && h > 36
          const showMeta  = w > 80 && h > 56
          return (
            <g key={d.ticker} transform={`translate(${leaf.x0},${leaf.y0})`}>
              <rect
                width={w} height={h}
                fill={getColor(d.changePct)}
                rx={6}
                style={{ transition: 'fill .2s' }}
              />
              {showLabel && (
                <>
                  <text
                    x={8} y={22}
                    fill="#F1F5F9"
                    fontSize={Math.min(14, w / 4)}
                    fontWeight={700}
                    fontFamily="var(--font-jetbrains), monospace"
                  >
                    {d.ticker}
                  </text>
                  {showMeta && (
                    <>
                      <text x={8} y={38} fill="rgba(241,245,249,.6)" fontSize={10}
                        fontFamily="var(--font-jetbrains), monospace">
                        {d.changePct >= 0 ? '+' : ''}{d.changePct.toFixed(2)}%
                      </text>
                      <text x={8} y={52} fill="rgba(241,245,249,.4)" fontSize={10}
                        fontFamily="var(--font-jetbrains), monospace">
                        {fmtMarketCap(d.marketCap)}
                      </text>
                    </>
                  )}
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
