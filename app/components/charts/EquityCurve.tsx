"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { EquityCurveRenderer } from './equityCurveRenderer'
import { calculateEquityViewport } from './equityCurveUtils'
import { EquityPoint, EquityState } from './types'

interface EquityCurveProps {
  data: Array<{
    timestamp: number
    equity: number
    drawdown: number
    return_pct: number
  }>
  height?: number
}

export function EquityCurve({ data, height = 350 }: EquityCurveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<EquityCurveRenderer | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastWidthRef = useRef<number>(0)

  const [state, setState] = useState<EquityState>({
    points: [],
    viewport: {
      startIdx: 0,
      endIdx: 0,
      equityMin: 0,
      equityMax: 0,
      zoom: 1,
      offsetX: 0,
      width: 0
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
  const points = useMemo(() => {
    return data.map(d => ({
      t: d.timestamp,
      e: d.equity,
      d: d.drawdown,
      r: d.return_pct
    }))
  }, [data])

  // Reset zoom/pan when data changes
  useEffect(() => {
    setZoom(1)
    setOffsetX(0)
  }, [data])

  // Initialize renderer once
  useEffect(() => {
    if (!canvasRef.current) return
    rendererRef.current = new EquityCurveRenderer(canvasRef.current)
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
  }, []) // EMPTY dependencies - setup once

  // Unified viewport calculation
  useEffect(() => {
    if (points.length === 0 || containerWidth === 0) return

    const viewport = calculateEquityViewport(
      points,
      containerWidth,
      zoom,
      offsetX
    )

    setState(prev => ({
      ...prev,
      points,
      viewport,
      dirty: true
    }))
  }, [points, containerWidth, zoom, offsetX])

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
          stateRef.current.points,
          stateRef.current.viewport,
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
          setOffsetX(0)
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
  }, [])

  return (
    <div className="space-y-4">
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
