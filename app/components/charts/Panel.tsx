'use client'

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useSharedViewport } from './SharedViewportContext'
import { PanelViewport, PanelConfig } from './panelTypes'
import { PanelRenderer } from './panelRenderer'
import { Eye, EyeOff } from 'lucide-react'

interface PanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
  createRenderer: (canvas: HTMLCanvasElement) => PanelRenderer
}

const PANEL_HEADER_HEIGHT = 18 // px height of panel header (must match MultiPanelChart.tsx)

export function Panel({ config, panelTop, panelHeight, createRenderer }: PanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<PanelRenderer | null>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastResizeTimeRef = useRef<number>(0)
  const retryCountRef = useRef(0)
  const { state, candles, trades, togglePanelVisibility } = useSharedViewport()
  const animationFrameRef = useRef<number>()
  const [themeVersion, setThemeVersion] = useState(0)

  // Calculate hovered candle for OHLC/Volume display
  const hoveredCandle = useMemo(() => {
    if (!state.mouse || candles.length === 0) return null
    if (!containerRef.current) return null

    // Check if mouse is within this panel vertically
    if (state.mouse.y < panelTop || state.mouse.y > panelTop + panelHeight) {
      return null
    }

    const { candleWidth, startIdx } = state.sharedViewport

    // Calculate padding EXACTLY as renderer does (match getPadding function)
    const containerWidth = containerRef.current.getBoundingClientRect().width
    const paddingLeft = Math.max(15, containerWidth * 0.02)

    // FIXED: state.mouse.x is already CENTER of candle (after snap in SharedViewportContext)
    // So we just need: (center - paddingLeft) / candleWidth to find which candle
    // OLD (WRONG): const relativeIdx = Math.floor((state.mouse.x - paddingLeft + candleWidth / 2) / candleWidth)
    const relativeIdx = Math.floor((state.mouse.x - paddingLeft) / candleWidth)

    // Convert to ABSOLUTE index in candles array
    const candleIdx = startIdx + relativeIdx

    // DEBUG - verify correct candle is selected
    console.log('OHLC CANDLE DEBUG:', {
      mouseX: state.mouse.x,
      paddingLeft,
      candleWidth,
      relativeIdx,
      candleIdx,
      startIdx,
      candleData: candleIdx >= 0 && candleIdx < candles.length ? candles[candleIdx] : null
    })

    // Clamp to valid range
    if (candleIdx < 0 || candleIdx >= candles.length) return null

    return candles[candleIdx]
  }, [state.mouse, state.sharedViewport, candles, panelTop, panelHeight])

  // Calculate hovered candle INDEX for indicator values
  const hoveredCandleIdx = useMemo(() => {
    if (!state.mouse || candles.length === 0) return null
    if (!containerRef.current) return null

    // Check if mouse is within this panel vertically
    if (state.mouse.y < panelTop || state.mouse.y > panelTop + panelHeight) {
      return null
    }

    const { candleWidth, startIdx } = state.sharedViewport

    // Calculate padding EXACTLY as renderer does
    const containerWidth = containerRef.current.getBoundingClientRect().width
    const paddingLeft = Math.max(15, containerWidth * 0.02)

    // FIXED: Same formula as hoveredCandle
    const relativeIdx = Math.floor((state.mouse.x - paddingLeft) / candleWidth)

    // Convert to ABSOLUTE index in candles array
    const candleIdx = startIdx + relativeIdx

    // Clamp to valid range
    if (candleIdx < 0 || candleIdx >= candles.length) return null

    return candleIdx
  }, [state.mouse, state.sharedViewport, candles, panelTop, panelHeight])

  // Render function
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    if (!canvas || !renderer) return

    // Don't render if no data
    if (candles.length === 0) return

    const panelViewport: PanelViewport = {
      ...state.sharedViewport,
      priceMin: config.yAxis.min,
      priceMax: config.yAxis.max,
      panelHeight,
      panelTop
    }

    let panelMouse: { x: number; y: number } | null = null
    if (state.mouse) {
      // Convert wrapper-relative mouse Y to canvas-relative Y
      // panelTop now includes header height, so we subtract both panelTop AND header
      panelMouse = {
        x: state.mouse.x,
        y: state.mouse.y - panelTop - PANEL_HEADER_HEIGHT
      }
    }

    renderer.render(candles, panelViewport, config, panelMouse, trades)
  }, [state, candles, trades, config, panelHeight, panelTop])

  // Setup canvas size with THROTTLED ResizeObserver (smooth during animation)
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()

      // If container not ready, retry up to 10 times (every 50ms)
      if (rect.width === 0 || rect.height === 0) {
        if (retryCountRef.current < 10) {
          retryCountRef.current++
          setTimeout(updateCanvasSize, 50)
        }
        return
      }

      // Reset retry count on successful setup
      retryCountRef.current = 0

      const dpr = window.devicePixelRatio || 1

      const newWidth = rect.width * dpr
      const newHeight = panelHeight * dpr

      // Always update on first setup or significant changes
      const isFirstSetup = canvas.width === 0 || canvas.height === 0
      const widthDiff = Math.abs(canvas.width - newWidth)
      const heightDiff = Math.abs(canvas.height - newHeight)

      if (isFirstSetup || widthDiff > 2 || heightDiff > 2) {
        canvas.width = newWidth
        canvas.height = newHeight

        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${panelHeight}px`

        const ctx = canvas.getContext('2d', { alpha: false })
        if (ctx) {
          ctx.scale(dpr, dpr)
        }

        // Recreate renderer with new canvas size
        rendererRef.current = createRenderer(canvas)

        // Render immediately (no black flash)
        renderChart()
      }
    }

    // Initial size - start immediately
    updateCanvasSize()

    // Watch for container resize with THROTTLE (max 60fps during animation)
    const observer = new ResizeObserver(() => {
      const now = Date.now()
      const timeSinceLastResize = now - lastResizeTimeRef.current

      // Throttle: Update max once per 50ms (20fps during resize)
      if (timeSinceLastResize >= 50) {
        lastResizeTimeRef.current = now
        updateCanvasSize()
      }

      // Also schedule final update after animation stops
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }

      resizeTimeoutRef.current = setTimeout(() => {
        updateCanvasSize()
      }, 100)
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [panelHeight, createRenderer, renderChart, candles.length])

  // Theme change detection
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'class' ||
           mutation.attributeName === 'data-theme' ||
           mutation.attributeName === 'style')
        ) {
          setThemeVersion(v => v + 1)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    })

    return () => observer.disconnect()
  }, [])

  // Trigger render on state/theme change
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(renderChart)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [renderChart, themeVersion])

  // Toggle panel visibility
  const handleToggleVisibility = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    togglePanelVisibility(config.id)
  }, [config.id, togglePanelVisibility])

  // Don't render volume/oscillator panels if not visible
  if (!config.visible && config.type !== 'price') {
    return null
  }

  // OHLC colors
  const isUp = hoveredCandle ? hoveredCandle.c >= hoveredCandle.o : false
  const textColor = isUp ? 'text-green-500' : 'text-red-500'

  return (
    <div className="mb-2">
      {/* Panel header - OUTSIDE canvas, above panel */}
      <div className="flex items-center px-2 pt-1">
        <span className="text-md font-medium text-muted-foreground">
          {config.title}
        </span>

        {/* OHLC data - only for price panel when hovering */}
        {config.type === 'price' && hoveredCandle && (
          <div className="flex items-center gap-1.5 text-sm font-mono ml-3">
            {/* O - Open */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-3">O</span>
              <span className={`${textColor} w-14 text-right`}>
                {hoveredCandle.o.toFixed(2)}
              </span>
            </div>
            {/* H - High */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-3">H</span>
              <span className={`${textColor} w-14 text-right`}>
                {hoveredCandle.h.toFixed(2)}
              </span>
            </div>
            {/* L - Low */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-3">L</span>
              <span className={`${textColor} w-14 text-right`}>
                {hoveredCandle.l.toFixed(2)}
              </span>
            </div>
            {/* C - Close */}
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground w-3">C</span>
              <span className={`${textColor} w-14 text-right`}>
                {hoveredCandle.c.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Eye icon - only for volume/oscillator panels - FIXED position after title */}
        {config.type !== 'price' && (
          <button
            onClick={handleToggleVisibility}
            className="p-0.5 hover:bg-muted rounded transition-colors ml-2"
            title={config.visible ? 'Hide panel' : 'Show panel'}
          >
            {config.visible ? (
              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        )}

        {/* Volume data - only for volume panel when hovering - next to eye icon */}
        {config.type === 'volume' && hoveredCandle && hoveredCandle.v !== undefined && (
          <div className="flex items-center gap-1 text-sm font-mono ml-3">
            <span className="text-muted-foreground">Vol</span>
            <span className="text-foreground w-24 text-right">
              {hoveredCandle.v.toLocaleString()}
            </span>
          </div>
        )}

        {/* Oscillator data - show all indicator values when hovering */}
        {config.type === 'oscillator' && hoveredCandleIdx !== null && config.indicators.length > 0 && (
          <div className="flex items-center gap-3 text-sm font-mono ml-3">
            {config.indicators.map((indicator) => {
              // Find indicator value at hovered candle index
              const point = indicator.points.find(p => p.t === hoveredCandleIdx)
              if (!point) return null

              return (
                <div key={indicator.name} className="flex items-center gap-1">
                  <span className="text-muted-foreground">{indicator.name}</span>
                  <span className="text-foreground w-16 text-right">
                    {point.v.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Canvas container - panel itself */}
      <div
        ref={containerRef}
        className="relative border-b border-border"
        style={{ height: `${panelHeight}px` }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}
