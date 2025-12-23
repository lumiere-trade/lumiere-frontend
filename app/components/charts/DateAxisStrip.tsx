'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useSharedViewport } from './SharedViewportContext'
import { indexToX } from './chartUtils'

const DATE_STRIP_HEIGHT = 30 // Height of the date strip

export function DateAxisStrip() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastResizeTimeRef = useRef<number>(0)
  const { state, candles } = useSharedViewport()
  const [themeVersion, setThemeVersion] = useState(0)

  // Setup canvas with resize detection
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      const newWidth = rect.width * dpr
      const newHeight = DATE_STRIP_HEIGHT * dpr

      const widthDiff = Math.abs(canvas.width - newWidth)
      const heightDiff = Math.abs(canvas.height - newHeight)

      if (widthDiff > 2 || heightDiff > 2) {
        canvas.width = newWidth
        canvas.height = newHeight

        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${DATE_STRIP_HEIGHT}px`

        const ctx = canvas.getContext('2d', { alpha: false })
        if (ctx) {
          ctx.scale(dpr, dpr)
        }

        // Render immediately after resize
        render()
      }
    }

    // Initial size
    updateCanvasSize()

    // Watch for resize with throttle
    const observer = new ResizeObserver(() => {
      const now = Date.now()
      const timeSinceLastResize = now - lastResizeTimeRef.current

      if (timeSinceLastResize >= 50) {
        lastResizeTimeRef.current = now
        updateCanvasSize()
      }

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
  }, [])

  // Theme detection
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

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width / (window.devicePixelRatio || 1)
    const height = DATE_STRIP_HEIGHT

    // Get colors from CSS
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background').trim() || '#0a0a0a'
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--muted-foreground').trim() || '#888888'
    const highlightColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary').trim() || '#8b5cf6'

    // Clear background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, width, height)

    const padding = { left: 15, right: 70 }
    const viewport = state.sharedViewport

    // Draw date labels
    ctx.fillStyle = textColor
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const step = Math.max(1, Math.floor(100 / viewport.candleWidth))

    for (let i = viewport.startIdx; i <= viewport.endIdx; i += step) {
      if (i >= candles.length) break

      const candle = candles[i]
      // FIXED: Pass startIdx parameter
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)

      if (x < padding.left || x > width - padding.right) continue

      const date = new Date(candle.t * 1000)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

      ctx.fillText(dateStr, x, height / 2)
    }

    // Highlight current crosshair date
    if (state.mouse) {
      const mouseX = state.mouse.x

      // FIXED: Calculate candle index from mouse position using new formula
      // Formula: startIdx = Math.floor(-offsetX / candleWidth)
      // So: index = startIdx + relativePosition
      const relativePosition = Math.floor((mouseX - padding.left) / viewport.candleWidth)
      const candleIndex = viewport.startIdx + relativePosition

      if (candleIndex >= 0 && candleIndex < candles.length) {
        const candle = candles[candleIndex]
        const date = new Date(candle.t * 1000)
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

        // Draw highlight background
        const textWidth = ctx.measureText(dateStr).width
        ctx.fillStyle = highlightColor
        ctx.fillRect(mouseX - textWidth / 2 - 5, 0, textWidth + 10, height)

        // Draw highlighted date text
        ctx.fillStyle = bgColor
        ctx.font = 'bold 11px monospace'
        ctx.fillText(dateStr, mouseX, height / 2)
      }
    }
  }, [state, candles, themeVersion])

  // Trigger render on state/theme change
  useEffect(() => {
    render()
  }, [render])

  return (
    <div
      ref={containerRef}
      className="relative border-t border-border"
      style={{ height: `${DATE_STRIP_HEIGHT}px` }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}
