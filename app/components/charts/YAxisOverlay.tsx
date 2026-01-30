'use client'

import React, { useMemo } from 'react'

interface YAxisOverlayProps {
  priceMin: number
  priceMax: number
  panelHeight: number
  panelType: 'price' | 'volume' | 'oscillator'
  mouseY?: number
  mousePrice?: number
}

const Y_AXIS_WIDTH = 60 // Must match CHART_RIGHT_PADDING in Panel.tsx

export function YAxisOverlay({
  priceMin,
  priceMax,
  panelHeight,
  panelType,
  mouseY,
  mousePrice
}: YAxisOverlayProps) {
  // Calculate price levels to display (5 evenly spaced)
  const priceLevels = useMemo(() => {
    const levels: { price: number; y: number }[] = []
    const step = (priceMax - priceMin) / 4 // 5 levels (0, 0.25, 0.5, 0.75, 1.0)

    for (let i = 0; i <= 4; i++) {
      const price = priceMax - (step * i)
      const y = (i / 4) * panelHeight

      levels.push({ price, y })
    }

    return levels
  }, [priceMin, priceMax, panelHeight])

  // Format function based on panel type
  const formatValue = (value: number): string => {
    if (panelType === 'volume') {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
      return value.toFixed(0)
    }
    // Price and oscillator - always 2 decimals
    return value.toFixed(2)
  }

  return (
    <div
      className="absolute right-0 top-0 flex flex-col justify-between py-1 pointer-events-none"
      style={{ width: `${Y_AXIS_WIDTH}px`, height: `${panelHeight}px` }}
    >
      {/* Price levels */}
      {priceLevels.map((level, idx) => (
        <div
          key={idx}
          className="text-xs text-muted-foreground text-right pr-2 font-mono"
          style={{
            position: 'absolute',
            top: `${level.y}px`,
            right: '2px',
            transform: 'translateY(-50%)'
          }}
        >
          {formatValue(level.price)}
        </div>
      ))}

      {/* Mouse hover price label */}
      {mouseY !== undefined && mousePrice !== undefined && (
        <div
          className="absolute right-0 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-l font-mono"
          style={{
            top: `${mouseY}px`,
            transform: 'translateY(-50%)'
          }}
        >
          {formatValue(mousePrice)}
        </div>
      )}
    </div>
  )
}
