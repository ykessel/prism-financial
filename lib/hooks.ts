import { useEffect, useState, RefObject } from 'react'

export function useContainerWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(800)

  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width))
    ro.observe(ref.current)
    setWidth(ref.current.offsetWidth)
    return () => ro.disconnect()
  }, [ref])

  return width
}
