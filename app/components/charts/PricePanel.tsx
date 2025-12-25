'use client'

import React, { useCallback } from 'react'
import { Panel } from './Panel'
import { PricePanelRenderer } from './pricePanelRenderer'
import { TradeHoverDetector } from './TradeHoverDetector'
import { PanelConfig } from './panelTypes'

interface PricePanelProps {
  config: PanelConfig
  panelTop: number
  panelHeight: number
}

export function PricePanel({ config, panelTop, panelHeight }: PricePanelProps) {
  const [containerWidth, setContainerWidth] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const createRenderer = useCallback((canvas: HTMLCanvasElement) => {
    return new PricePanelRenderer(canvas)
  }, [])

  // Measure container width
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef}>
      <Panel
        config={config}
        panelTop={panelTop}
        panelHeight={panelHeight}
        createRenderer={createRenderer}
      />
      
      {/* Invisible hover detector for trade arrows */}
      {containerWidth > 0 && (
        <TradeHoverDetector
          panelTop={panelTop}
          panelHeight={panelHeight}
          width={containerWidth}
        />
      )}
    </div>
  )
}
