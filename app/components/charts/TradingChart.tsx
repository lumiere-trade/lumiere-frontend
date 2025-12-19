"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Button } from "@lumiere/shared/components/ui/button"
import { LineChartIcon, CandlestickChart } from "lucide-react"
import { ChartRenderer } from './chartRenderer'
import { calculateViewport } from './chartUtils'
import { Candle, Trade, Mode, ChartState } from './types'

interface TradingChartProps {
  data: Array<{
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    buy?: number | null
    sell?: number | null
  }>
  height?: number
}

export function TradingChart({ data, height = 450 }: TradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<ChartRenderer | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastWidthRef = useRef<number>(0)

  const [state, setState] = useState<ChartState>({
    mode: 'L',
    timeframe: '15m',
    candles: [],
    trades: [],
    viewport: {
      startIdx: 0,
      endIdx: 0,
      priceMin: 0,
      priceMax: 0,
      candleWidth: 8,
      zoom: 1,
      offsetX: 0
    },
    mouse: null,
    isDragging: false,
    dirty: true
  })

  const stateRef = useRef(state)
  stateRef.current = state

  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  // Transform data to optimized format (memoized)
  const { candles, trades } = useMemo(() => {
    const candles: Candle[] = data.map(d => ({
      t: d.timestamp,
      o: d.open,
      h: d.high,
      l: d.low,
      c: d.close
    }))

    const trades: Trade[] = data
      .map((d, idx) => {
        if (d.buy !== null && d.buy !== undefined) {
          return { t: idx, p: d.buy, s: 'B' as const }
        }
        if (d.sell !== null && d.sell !== undefined) {
          return { t: idx, p: d.sell, s: 'S' as const }
        }
        return null
      })
      .filter((t): t is Trade => t !== null)

    return { candles, trades }
  }, [data])

  // Reset zoom/pan when data changes - start from newest data
  useEffect(() => {
    if (candles.length === 0 || containerWidth === 0) return
    
    setZoom(1)
    
    // Calculate initial offset to show last candles (newest data)
    const candleWidth = 8 // default candleWidth at zoom=1
    const visibleCandles = Math.floor(containerWidth / candleWidth)
    const initialOffsetX = -(candles.length - visibleCandles) * candleWidth
    
    setOffsetX(initialOffsetX)
  }, [data, candles.length, containerWidth])

  // Initialize renderer once
  useEffect(() => {
    if (!canvasRef.current) return
    rendererRef.current = new ChartRenderer(canvasRef.current)
  }, [])

  // ResizeObserver - setup once, no circular dependencies
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect

        // Use ref to avoid reading stale state in closure
        if (width > 0 && width !== lastWidthRef.current) {
          lastWidthRef.current = width
          setContainerWidth(width)

          // Force canvas resize
          if (canvasRef.current && rendererRef.current) {
            rendererRef.current.resize(canvasRef.current)
          }
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    // Initial width
    const initialWidth = containerRef.current.clientWidth
    if (initialWidth > 0) {
      lastWidthRef.current = initialWidth
      setContainerWidth(initialWidth)
    }

    return () => resizeObserver.disconnect()
  }, [])

  // Unified viewport calculation
  useEffect(() => {
    if (candles.length === 0 || containerWidth === 0) return

    const viewport = calculateViewport(
      candles,
      containerWidth,
      zoom,
      offsetX
    )

    setState(prev => ({
      ...prev,
      candles,
      trades,
      viewport,
      dirty: true
    }))
  }, [candles, trades, containerWidth, zoom, offsetX])

  // Theme change detection
  useEffect(() => {
    if (!canvasRef.current || !rendererRef.current) return

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'class' ||
           mutation.attributeName === 'data-theme' ||
           mutation.attributeName === 'style')
        ) {
          if (rendererRef.current && canvasRef.current) {
            rendererRef.current.resize(canvasRef.current)
            setState(prev => ({ ...prev, dirty: true }))
          }
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    })

    return () => observer.disconnect()
  }, [])

  // Render loop
  useEffect(() => {
    const render = () => {
      if (stateRef.current.dirty && rendererRef.current) {
        rendererRef.current.render(
          stateRef.current.candles,
          stateRef.current.trades,
          stateRef.current.viewport,
          stateRef.current.mode,
          stateRef.current.mouse
        )

        setState(prev => ({ ...prev, dirty: false }))
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const delta = -e.deltaY
    const zoomFactor = delta > 0 ? 1.1 : 0.9

    setZoom(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Mouse drag pan
  const handleMouseDown = useCallback(() => {
    setState(prev => ({ ...prev, isDragging: true }))
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (stateRef.current.isDragging) {
      setOffsetX(prev => prev + e.movementX)
      setState(prev => ({ ...prev, mouse: { x, y }, dirty: true }))
    } else {
      setState(prev => ({ ...prev, mouse: { x, y }, dirty: true }))
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    setState(prev => ({ ...prev, isDragging: false }))
  }, [])

  const handleMouseLeave = useCallback(() => {
    setState(prev => ({
      ...prev,
      mouse: null,
      isDragging: false,
      dirty: true
    }))
  }, [])

  // Touch support
  const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      touchStartRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        dist: 0
      }

      setState(prev => ({ ...prev, isDragging: true }))
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      touchStartRef.current = { x: 0, y: 0, dist }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()

    if (!touchStartRef.current) return

    if (e.touches.length === 1 && stateRef.current.isDragging) {
      const touch = e.touches[0]
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = touch.clientX - rect.left
      const dx = x - touchStartRef.current.x

      setOffsetX(prev => prev + dx)
      touchStartRef.current.x = x
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )

      const zoomFactor = dist / touchStartRef.current.dist

      setZoom(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)))
      touchStartRef.current.dist = dist
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null
    setState(prev => ({ ...prev, isDragging: false }))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '+':
        case '=':
          setZoom(prev => Math.min(10, prev * 1.2))
          break
        case '-':
          setZoom(prev => Math.max(0.1, prev * 0.8))
          break
        case '0':
          setZoom(1)
          // Reset to show newest data
          if (candles.length > 0 && containerWidth > 0) {
            const candleWidth = 8
            const visibleCandles = Math.floor(containerWidth / candleWidth)
            const initialOffsetX = -(candles.length - visibleCandles) * candleWidth
            setOffsetX(initialOffsetX)
          }
          break
        case 'ArrowLeft':
          setOffsetX(prev => prev + 50)
          break
        case 'ArrowRight':
          setOffsetX(prev => prev - 50)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [candles.length, containerWidth])

  // Mode toggle
  const toggleMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: prev.mode === 'L' ? 'C' : 'L',
      dirty: true
    }))
  }, [])

  const buyCount = trades.filter(t => t.s === 'B').length
  const sellCount = trades.filter(t => t.s === 'S').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 mr-4">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            Buy Signals ({buyCount})
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            Sell Signals ({sellCount})
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={state.mode === 'L' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMode}
          >
            <LineChartIcon className="h-4 w-4 mr-2" />
            Line
          </Button>
          <Button
            variant={state.mode === 'C' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleMode}
          >
            <CandlestickChart className="h-4 w-4 mr-2" />
            Candles
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
          style={{ cursor: state.isDragging ? 'grabbing' : 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Mouse wheel to zoom • Drag to pan • +/- keys • 0 to reset • Arrow keys to scroll
      </div>
    </div>
  )
}
