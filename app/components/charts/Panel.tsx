'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
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

export function Panel({ config, panelTop, panelHeight, createRenderer }: PanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<PanelRenderer | null>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastResizeTimeRef = useRef<number>(0)
  const retryCountRef = useRef(0)
  const { state, candles, updateMouse, clearMouse, togglePanelVisibility } = useSharedViewport()
  const animationFrameRef = useRef<number>()
  const [themeVersion, setThemeVersion] = useState(0)

  // Render function
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    
    console.log(`[${config.id}] renderChart called`, {
      hasCanvas: !!canvas,
      hasRenderer: !!renderer,
      candlesCount: candles.length,
      canvasWidth: canvas?.width,
      canvasHeight: canvas?.height
    })
    
    if (!canvas || !renderer) {
      console.log(`[${config.id}] Early return: no canvas or renderer`)
      return
    }

    // Don't render if no data
    if (candles.length === 0) {
      console.log(`[${config.id}] Early return: no candles`)
      return
    }

    const panelViewport: PanelViewport = {
      ...state.sharedViewport,
      priceMin: config.yAxis.min,
      priceMax: config.yAxis.max,
      panelHeight,
      panelTop
    }

    console.log(`[${config.id}] Calling renderer.render with viewport`, {
      startIdx: panelViewport.startIdx,
      endIdx: panelViewport.endIdx,
      candleWidth: panelViewport.candleWidth,
      panelHeight
    })

    let panelMouse: { x: number; y: number } | null = null
    if (state.mouse) {
      panelMouse = {
        x: state.mouse.x,
        y: state.mouse.y - panelTop
      }
    }

    renderer.render(candles, panelViewport, config, panelMouse)
    console.log(`[${config.id}] renderer.render completed`)
  }, [state, candles, config, panelHeight, panelTop])

  // Setup canvas size with THROTTLED ResizeObserver (smooth during animation)
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()

      console.log(`[${config.id}] updateCanvasSize`, {
        width: rect.width,
        height: rect.height,
        retryCount: retryCountRef.current
      })

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
        console.log(`[${config.id}] Setting canvas size`, {
          isFirstSetup,
          oldWidth: canvas.width,
          newWidth,
          oldHeight: canvas.height,
          newHeight,
          dpr
        })

        canvas.width = newWidth
        canvas.height = newHeight

        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${panelHeight}px`

        const ctx = canvas.getContext('2d', { alpha: false })
        if (ctx) {
          ctx.scale(dpr, dpr)
          console.log(`[${config.id}] Canvas context scaled by ${dpr}`)
        }

        // Recreate renderer with new canvas size
        rendererRef.current = createRenderer(canvas)
        console.log(`[${config.id}] Renderer created`)

        // Render immediately (no black flash)
        console.log(`[${config.id}] Calling renderChart immediately after setup`)
        renderChart()
      }
    }

    // Initial size - start immediately
    console.log(`[${config.id}] Initial updateCanvasSize call`)
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
    console.log(`[${config.id}] Render effect triggered`, {
      hasCanvas: !!canvasRef.current,
      hasRenderer: !!rendererRef.current,
      candlesCount: candles.length,
      themeVersion
    })

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      console.log(`[${config.id}] RAF executing renderChart`)
      renderChart()
    })

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [renderChart, themeVersion])

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    updateMouse(x, panelTop + y, config.id)
  }, [updateMouse, config.id, panelTop])

  const handleMouseLeave = useCallback(() => {
    clearMouse()
  }, [clearMouse])

  // Toggle panel visibility
  const handleToggleVisibility = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    togglePanelVisibility(config.id)
  }, [config.id, togglePanelVisibility])

  // Don't render volume/oscillator panels if not visible
  if (!config.visible && config.type !== 'price') {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="relative border-b border-border"
      style={{ height: `${panelHeight}px` }}
    >
      {/* Panel title with eye icon */}
      <div className="absolute top-2 left-4 z-10 flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {config.title}
        </span>

        {/* Eye icon - only for volume/oscillator panels */}
        {config.type !== 'price' && (
          <button
            onClick={handleToggleVisibility}
            className="p-0.5 hover:bg-muted rounded transition-colors"
            title={config.visible ? 'Hide panel' : 'Show panel'}
          >
            {config.visible ? (
              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Canvas - inherits cursor from parent container */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}
