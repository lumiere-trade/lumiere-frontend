'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { useSharedViewport } from './SharedViewportContext'

interface CrosshairOverlayProps {
  containerHeight: number
}

export function CrosshairOverlay({ containerHeight }: CrosshairOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state } = useSharedViewport()

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    if (!parent) return

    const rect = parent.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    canvas.width = rect.width * dpr
    canvas.height = containerHeight * dpr

    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${containerHeight}px`

    const ctx = canvas.getContext('2d', { alpha: true })
    if (ctx) {
      ctx.scale(dpr, dpr)
    }
  }, [containerHeight])

  // Render crosshair
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width / (window.devicePixelRatio || 1)
    const height = containerHeight

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw vertical crosshair line across ALL panels
    if (state.mouse) {
      const crossColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary').trim() || '#8b5cf6'

      ctx.strokeStyle = crossColor
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])

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
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  )
}
