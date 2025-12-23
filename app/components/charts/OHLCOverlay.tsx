'use client'

import { useSharedViewport } from './SharedViewportContext'
import { useMemo } from 'react'

interface OHLCOverlayProps {
  panelTop: number
  panelHeight: number
}

export function OHLCOverlay({ panelTop, panelHeight }: OHLCOverlayProps) {
  const { state, candles } = useSharedViewport()

  // Find candle under mouse cursor
  const hoveredCandle = useMemo(() => {
    if (!state.mouse || candles.length === 0) return null

    // Check if mouse is within this panel vertically
    if (state.mouse.y < panelTop || state.mouse.y > panelTop + panelHeight) {
      return null
    }

    const { candleWidth, offsetX } = state.sharedViewport
    const padding = { left: Math.max(15, window.innerWidth * 0.02) }

    // Calculate candle index from mouse X position
    const candleIdx = Math.floor((state.mouse.x - padding.left - offsetX) / candleWidth)

    // Clamp to valid range
    if (candleIdx < 0 || candleIdx >= candles.length) return null

    return candles[candleIdx]
  }, [state.mouse, state.sharedViewport, candles, panelTop, panelHeight])

  if (!hoveredCandle) return null

  const isUp = hoveredCandle.c >= hoveredCandle.o
  const textColor = isUp ? 'text-green-500' : 'text-red-500'

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        top: `${panelTop + 8}px`,
        left: '8px'
      }}
    >
      <div className="flex items-center gap-4 text-xs font-mono bg-background/90 backdrop-blur-sm border border-border rounded px-3 py-1.5 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">O</span>
          <span className={textColor}>{hoveredCandle.o.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">H</span>
          <span className={textColor}>{hoveredCandle.h.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">L</span>
          <span className={textColor}>{hoveredCandle.l.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">C</span>
          <span className={textColor}>{hoveredCandle.c.toFixed(2)}</span>
        </div>
        {hoveredCandle.v !== undefined && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-3">
            <span className="text-muted-foreground">Vol</span>
            <span className="text-foreground">{hoveredCandle.v.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
