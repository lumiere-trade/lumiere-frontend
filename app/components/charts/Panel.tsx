'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { useSharedViewport } from './SharedViewportContext'
import { PanelViewport, PanelConfig } from './panelTypes'
import { PanelRenderer } from './panelRenderer'

interface PanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
  createRenderer: (canvas: HTMLCanvasElement) => PanelRenderer
}

export function Panel({ config, panelTop, panelHeight, createRenderer }: PanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<PanelRenderer | null>(null)
  const { state, candles, updateMouse, clearMouse } = useSharedViewport()
  const animationFrameRef = useRef<number>()

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

    // Create renderer with actual canvas
    rendererRef.current = createRenderer(canvas)
  }, [panelHeight, createRenderer])

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    if (!canvas || !renderer) return

    // Create panel viewport
    const panelViewport: PanelViewport = {
      ...state.sharedViewport,
      priceMin: config.yAxis.min,
      priceMax: config.yAxis.max,
      panelHeight,
      panelTop
    }

    // Get mouse position relative to this panel
    let panelMouse: { x: number; y: number } | null = null
    if (state.mouse && state.mouse.panelId === config.id) {
      panelMouse = { x: state.mouse.x, y: state.mouse.y - panelTop }
    }

    // Render
    renderer.render(candles, panelViewport, config, panelMouse)
  }, [state, candles, config, panelHeight, panelTop])

  // Trigger render on state change
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

  return (
    <div 
      className="relative border-b border-border"
      style={{ height: `${panelHeight}px` }}
    >
      {/* Panel title */}
      <div className="absolute top-2 left-4 z-10 text-xs font-medium text-muted-foreground">
        {config.title}
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
