'use client'

import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import { SharedViewportProvider, useSharedViewport } from './SharedViewportContext'
import { PricePanel } from './PricePanel'
import { OscillatorPanel } from './OscillatorPanel'
import { VolumePanel } from './VolumePanel'
import { IndicatorTogglePanel } from './IndicatorTogglePanel'
import { Candle, Trade, Indicator } from './types'
import { assignIndicatorColor } from './chartUtils'
import { IndicatorData } from '@/lib/api/cartographe'

interface MultiPanelChartProps {
  candles: Candle[]
  trades: Trade[]
  indicatorData: IndicatorData[]
  mode?: 'L' | 'C'
  showIndicatorToggles?: boolean
}

// Inner component that uses the context
function MultiPanelChartInner({ showIndicatorToggles = true }: { showIndicatorToggles?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, handleZoom, handlePan, handleReset, setDragging } = useSharedViewport()

  // Calculate panel positions
  const panelLayout = useMemo(() => {
    const containerHeight = containerRef.current?.clientHeight || 500
    const visiblePanels = state.panels.filter(p => p.visible)
    const totalHeight = visiblePanels.reduce((sum, p) => sum + p.height, 0)

    let currentTop = 0
    return visiblePanels.map(panel => {
      const pixelHeight = (panel.height / totalHeight) * containerHeight
      const layout = {
        config: panel,
        top: currentTop,
        height: pixelHeight
      }
      currentTop += pixelHeight
      return layout
    })
  }, [state.panels])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '0') {
        handleReset()
      } else if (e.key === '+' || e.key === '=') {
        handleZoom(1, containerRef.current?.clientWidth || 0 / 2)
      } else if (e.key === '-') {
        handleZoom(-1, containerRef.current?.clientWidth || 0 / 2)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleZoom, handleReset])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const delta = -e.deltaY > 0 ? 1 : -1  // Use sign of deltaY
    handleZoom(delta, mouseX)
  }, [handleZoom])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Mouse drag pan - FIXED: use movementX directly
  const handleMouseDown = useCallback(() => {
    setDragging(true)
  }, [setDragging])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (state.isDragging) {
      // Use e.movementX directly like old TradingChart
      handlePan(e.movementX)
    }
  }, [state.isDragging, handlePan])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [setDragging])

  return (
    <div className="flex flex-col gap-3">
      {/* Indicator Toggle Panel */}
      {showIndicatorToggles && <IndicatorTogglePanel />}

      {/* Chart Container with fixed height */}
      <div 
        ref={containerRef}
        className="relative w-full h-[500px] bg-background rounded-lg overflow-hidden"
        style={{ cursor: state.isDragging ? 'grabbing' : 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render panels */}
        {panelLayout.map(({ config, top, height }) => {
          if (config.type === 'price') {
            return (
              <PricePanel
                key={config.id}
                config={config}
                panelTop={top}
                panelHeight={height}
              />
            )
          } else if (config.type === 'volume') {
            return (
              <VolumePanel
                key={config.id}
                config={config}
                panelTop={top}
                panelHeight={height}
              />
            )
          } else if (config.type === 'oscillator') {
            return (
              <OscillatorPanel
                key={config.id}
                config={config}
                panelTop={top}
                panelHeight={height}
              />
            )
          }
          return null
        })}

        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded">
          Mouse wheel to zoom • Drag to pan • +/- keys • 0 to reset
        </div>
      </div>
    </div>
  )
}

// Main component with provider
export function MultiPanelChart({
  candles,
  trades,
  indicatorData,
  mode = 'C',
  showIndicatorToggles = true
}: MultiPanelChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(800)

  // Measure container width
  useEffect(() => {
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

  // Transform indicator data to Indicator format
  const indicators: Indicator[] = useMemo(() => {
    return indicatorData.map((ind, idx) => ({
      name: ind.name,
      color: assignIndicatorColor(idx),
      visible: true,
      points: ind.values.map((val, i) => ({
        t: i,
        v: val.value
      })),
      type: 'line'
    }))
  }, [indicatorData])

  return (
    <div ref={containerRef} className="w-full">
      <SharedViewportProvider
        candles={candles}
        indicators={indicators}
        containerWidth={containerWidth}
      >
        <MultiPanelChartInner showIndicatorToggles={showIndicatorToggles} />
      </SharedViewportProvider>
    </div>
  )
}
