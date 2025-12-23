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
  const { state, candles, updateMouse, clearMouse, togglePanelVisibility } = useSharedViewport()
  const animationFrameRef = useRef<number>()
  const [themeVersion, setThemeVersion] = useState(0)

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
      panelMouse = {
        x: state.mouse.x,
        y: state.mouse.y - panelTop
      }
    }

    renderer.render(candles, panelViewport, config, panelMouse)
  }, [state, candles, config, panelHeight, panelTop])

  // Setup canvas size with THROTTLED ResizeObserver (smooth during animation)
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      
      // Skip if container not ready (width/height = 0)
      if (rect.width === 0 || rect.height === 0) {
        // Retry after a frame
        requestAnimationFrame(updateCanvasSize)
        return
      }
      
      const dpr = window.devicePixelRatio || 1

      const newWidth = rect.width * dpr
      const newHeight = panelHeight * dpr

      // Only update if size changed significantly (avoid tiny changes)
      const widthDiff = Math.abs(canvas.width - newWidth)
      const heightDiff = Math.abs(canvas.height - newHeight)

      if (widthDiff > 2 || heightDiff > 2) {
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

    // Initial size (delayed to ensure layout is ready)
    requestAnimationFrame(() => {
      requestAnimationFrame(updateCanvasSize)
    })

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
  }, [panelHeight, createRenderer, renderChart])

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
