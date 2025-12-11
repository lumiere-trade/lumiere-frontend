"use client"

import { useEffect, useRef, useState, useMemo, memo } from 'react'
import { DrawdownChartRenderer } from './drawdownChartRenderer'
import { calculateDrawdownViewport } from './drawdownChartUtils'
import type { DrawdownPoint, DrawdownState } from './types'

interface DrawdownChartProps {
  data: Array<{
    timestamp: number
    drawdown: number  // 0 to 1 (not percentage, e.g. 0.15 for -15%)
  }>
  height?: number
}

export const DrawdownChart = memo(function DrawdownChart({ 
  data, 
  height = 350 
}: DrawdownChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<DrawdownChartRenderer | null>(null)
  const rafRef = useRef<number>()
  const lastWidthRef = useRef<number>(0)
  const touchStartRef = useRef<{ x: number; dist: number } | null>(null)

  const [state, setState] = useState<DrawdownState>({
    points: [],
    viewport: { startIdx: 0, endIdx: 0, drawdownMin: 0, drawdownMax: 0, zoom: 1, offsetX: 0, width: 0 },
    mouse: null,
    isDragging: false,
    dirty: true
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // Transform data
  const points = useMemo((): DrawdownPoint[] => {
    return data.map(d => ({
      t: d.timestamp,
      d: d.drawdown
    }))
  }, [data])

  // Reset zoom when data changes
  useEffect(() => {
    setZoom(1)
    setOffsetX(0)
  }, [data])

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    rendererRef.current = new DrawdownChartRenderer(canvas)
  }, [])

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (width !== lastWidthRef.current) {
          lastWidthRef.current = width
          setContainerWidth(width)

          const canvas = canvasRef.current
          const renderer = rendererRef.current
          if (canvas && renderer) {
            renderer.resize(canvas)
            setState(s => ({ ...s, dirty: true }))
          }
        }
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Theme change detection
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const canvas = canvasRef.current
      const renderer = rendererRef.current
      if (canvas && renderer) {
        renderer.resize(canvas)
        setState(s => ({ ...s, dirty: true }))
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // Calculate viewport
  useEffect(() => {
    if (points.length === 0) return

    const viewport = calculateDrawdownViewport(points, containerWidth, zoom, offsetX)
    setState(s => ({
      ...s,
      points,
      viewport,
      dirty: true
    }))
  }, [points, containerWidth, zoom, offsetX])

  // Render loop
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current
      const renderer = rendererRef.current
      const currentState = stateRef.current

      if (canvas && renderer && currentState.dirty) {
        renderer.render(currentState.points, currentState.viewport, currentState.mouse)
        setState(s => ({ ...s, dirty: false }))
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY
      const factor = delta > 0 ? 0.9 : 1.1
      setZoom(z => Math.max(1, Math.min(10, z * factor)))
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setZoom(z => Math.min(10, z * 1.2))
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        setZoom(z => Math.max(1, z / 1.2))
      } else if (e.key === '0') {
        e.preventDefault()
        setZoom(1)
        setOffsetX(0)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setOffsetX(o => o - 50)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setOffsetX(o => o + 50)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (state.isDragging) {
      const dx = e.movementX
      setOffsetX(o => o + dx)
    }

    setState(s => ({
      ...s,
      mouse: { x, y },
      dirty: true
    }))
  }

  const handleMouseDown = () => {
    setState(s => ({ ...s, isDragging: true }))
  }

  const handleMouseUp = () => {
    setState(s => ({ ...s, isDragging: false }))
  }

  const handleMouseLeave = () => {
    setState(s => ({
      ...s,
      mouse: null,
      isDragging: false,
      dirty: true
    }))
  }

  // Touch support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        touchStartRef.current = { x: touch.clientX, dist: 0 }
      }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchStartRef.current = { x: 0, dist: Math.sqrt(dx * dx + dy * dy) }
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0]
      const dx = touch.clientX - touchStartRef.current.x
      setOffsetX(o => o + dx)
      touchStartRef.current.x = touch.clientX
    } else if (e.touches.length === 2 && touchStartRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const factor = dist / touchStartRef.current.dist
      setZoom(z => Math.max(1, Math.min(10, z * factor)))
      touchStartRef.current.dist = dist
    }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  return (
    <div className="relative w-full" style={{ height }} ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded">
        Mouse wheel to zoom • Drag to pan • +/- keys • 0 to reset • Arrow keys to scroll
      </div>
    </div>
  )
})
