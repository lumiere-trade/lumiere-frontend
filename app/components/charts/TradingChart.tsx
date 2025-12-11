"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from "@lumiere/shared/components/ui/button"
import { LineChartIcon, CandlestickChart } from "lucide-react"
import { ChartRenderer } from './chartRenderer'
import { calculateViewport, debounce } from './chartUtils'
import { Candle, Trade, Mode, TF, ChartState, Viewport } from './types'

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
  
  // State (minimal - performance)
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
  
  // Convert data to optimized format (once)
  useEffect(() => {
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
    
    setState(prev => ({
      ...prev,
      candles,
      trades,
      dirty: true
    }))
  }, [data])
  
  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return
    
    rendererRef.current = new ChartRenderer(canvasRef.current)
    
    // Initial viewport calculation
    if (state.candles.length > 0 && containerRef.current) {
      const width = containerRef.current.clientWidth
      const viewport = calculateViewport(
        state.candles,
        width,
        state.viewport.zoom,
        state.viewport.offsetX
      )
      
      setState(prev => ({
        ...prev,
        viewport,
        dirty: true
      }))
    }
  }, [])
  
  // Render loop (RAF - 60fps)
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
  
  // Recalculate viewport on data/zoom/pan change
  useEffect(() => {
    if (state.candles.length === 0 || !containerRef.current) return
    
    const width = containerRef.current.clientWidth
    const viewport = calculateViewport(
      state.candles,
      width,
      state.viewport.zoom,
      state.viewport.offsetX
    )
    
    setState(prev => ({
      ...prev,
      viewport,
      dirty: true
    }))
  }, [state.candles, state.viewport.zoom, state.viewport.offsetX])
  
  // Mouse wheel zoom (optimized with passive)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    
    const delta = -e.deltaY
    const zoomFactor = delta > 0 ? 1.1 : 0.9
    
    setState(prev => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        zoom: Math.max(0.1, Math.min(10, prev.viewport.zoom * zoomFactor))
      }
    }))
  }, [])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [handleWheel])
  
  // Mouse drag pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setState(prev => ({
      ...prev,
      isDragging: true
    }))
  }, [])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (stateRef.current.isDragging) {
      // Pan
      setState(prev => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          offsetX: prev.viewport.offsetX + e.movementX
        },
        mouse: { x, y },
        dirty: true
      }))
    } else {
      // Just crosshair
      setState(prev => ({
        ...prev,
        mouse: { x, y },
        dirty: true
      }))
    }
  }, [])
  
  const handleMouseUp = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDragging: false
    }))
  }, [])
  
  const handleMouseLeave = useCallback(() => {
    setState(prev => ({
      ...prev,
      mouse: null,
      isDragging: false,
      dirty: true
    }))
  }, [])
  
  // Touch support (mobile)
  const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null)
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan
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
      // Pinch zoom
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
      // Pan
      const touch = e.touches[0]
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = touch.clientX - rect.left
      const dx = x - touchStartRef.current.x
      
      setState(prev => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          offsetX: prev.viewport.offsetX + dx
        },
        dirty: true
      }))
      
      touchStartRef.current.x = x
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      const zoomFactor = dist / touchStartRef.current.dist
      
      setState(prev => ({
        ...prev,
        viewport: {
          ...prev.viewport,
          zoom: Math.max(0.1, Math.min(10, prev.viewport.zoom * zoomFactor))
        },
        dirty: true
      }))
      
      touchStartRef.current.dist = dist
    }
  }, [])
  
  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null
    setState(prev => ({ ...prev, isDragging: false }))
  }, [])
  
  // Resize handler (debounced)
  useEffect(() => {
    const handleResize = debounce(() => {
      if (!canvasRef.current || !rendererRef.current || !containerRef.current) return
      
      rendererRef.current.resize(canvasRef.current)
      
      const width = containerRef.current.clientWidth
      const viewport = calculateViewport(
        stateRef.current.candles,
        width,
        stateRef.current.viewport.zoom,
        stateRef.current.viewport.offsetX
      )
      
      setState(prev => ({
        ...prev,
        viewport,
        dirty: true
      }))
    }, 100)
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '+':
        case '=':
          setState(prev => ({
            ...prev,
            viewport: {
              ...prev.viewport,
              zoom: Math.min(10, prev.viewport.zoom * 1.2)
            }
          }))
          break
        case '-':
          setState(prev => ({
            ...prev,
            viewport: {
              ...prev.viewport,
              zoom: Math.max(0.1, prev.viewport.zoom * 0.8)
            }
          }))
          break
        case '0':
          // Reset zoom
          setState(prev => ({
            ...prev,
            viewport: {
              ...prev.viewport,
              zoom: 1,
              offsetX: 0
            }
          }))
          break
        case 'ArrowLeft':
          setState(prev => ({
            ...prev,
            viewport: {
              ...prev.viewport,
              offsetX: prev.viewport.offsetX + 50
            }
          }))
          break
        case 'ArrowRight':
          setState(prev => ({
            ...prev,
            viewport: {
              ...prev.viewport,
              offsetX: prev.viewport.offsetX - 50
            }
          }))
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Mode toggle
  const toggleMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: prev.mode === 'L' ? 'C' : 'L',
      dirty: true
    }))
  }, [])
  
  const buyCount = state.trades.filter(t => t.s === 'B').length
  const sellCount = state.trades.filter(t => t.s === 'S').length
  
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
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        />
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Mouse wheel to zoom • Drag to pan • +/- keys • 0 to reset • Arrow keys to scroll
      </div>
    </div>
  )
}
