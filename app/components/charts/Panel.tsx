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
  const rendererRef = useRef<PanelRenderer | null>(null)
  const { state, candles, updateMouse, clearMouse, togglePanelVisibility } = useSharedViewport()
  const animationFrameRef = useRef<number>()
  const [themeVersion, setThemeVersion] = useState(0)

  // Setup canvas and create renderer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const rect = parent.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = panelHeight * dpr

    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${panelHeight}px`

    const ctx = canvas.getContext('2d', { alpha: false })
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    rendererRef.current = createRenderer(canvas)
  }, [panelHeight, createRenderer])

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
          // Force re-render by updating theme version
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

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    if (!canvas || !renderer) return

    const panelViewport: PanelViewport = {
      ...state.sharedViewport,
      priceMin: config.yAxis.min,
      priceMax: config.yAxis.max,
      panelHeight,
      panelTop
    }

    let panelMouse: { x: number; y: number } | null = null
    if (state.mouse && state.mouse.panelId === config.id) {
      panelMouse = { x: state.mouse.x, y: state.mouse.y - panelTop }
    }

    renderer.render(candles, panelViewport, config, panelMouse)
  }, [state, candles, config, panelHeight, panelTop, themeVersion])

  // Trigger render on state change OR theme change
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [render])

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
      className="relative border-b border-border"
      style={{ height: `${panelHeight}px` }}
    >
      {/* Panel title with eye icon */}
      <div className="absolute top-2 left-4 z-10 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
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
              <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}
