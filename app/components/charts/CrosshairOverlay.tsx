'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { useSharedViewport } from './SharedViewportContext'

interface CrosshairOverlayProps {
  containerHeight: number
}

export function CrosshairOverlay({ containerHeight }: CrosshairOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { state } = useSharedViewport()

  // Setup canvas with resize detection
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      canvas.width = rect.width * dpr
      canvas.height = containerHeight * dpr

      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${containerHeight}px`

      const ctx = canvas.getContext('2d', { alpha: true })
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      render()
    }

    updateCanvasSize()

    const observer = new ResizeObserver(() => {
      updateCanvasSize()
    })

    observer.observe(container)

    return () => observer.disconnect()
  }, [containerHeight])

  // Render ONLY vertical crosshair line
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width / (window.devicePixelRatio || 1)
    const height = containerHeight

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw ONLY vertical crosshair line
    if (state.mouse) {
      const crossColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary').trim() || '#8b5cf6'

      ctx.strokeStyle = crossColor
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])

      // ONLY vertical line (full height)
      ctx.beginPath()
      ctx.moveTo(state.mouse.x, 0)
      ctx.lineTo(state.mouse.x, height)
      ctx.stroke()

      ctx.setLineDash([])
    }
  }, [state.mouse, containerHeight])

  // Trigger render on mouse change
  useEffect(() => {
    render()
  }, [render])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}
