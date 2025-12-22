'use client'

import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import { SharedViewportProvider, useSharedViewport } from './SharedViewportContext'
import { PricePanel } from './PricePanel'
import { OscillatorPanel } from './OscillatorPanel'
import { VolumePanel } from './VolumePanel'
import { IndicatorTogglePanel } from './IndicatorTogglePanel'
import { DateAxisStrip } from './DateAxisStrip'
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

const PANEL_GAP = 10 // px gap between panels
const BASE_PANEL_HEIGHT = 350 // Base height for price panel
const SECONDARY_PANEL_HEIGHT = 150 // Height for volume/oscillator panels

// Inner component that uses the context
function MultiPanelChartInner({ showIndicatorToggles = true }: { showIndicatorToggles?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, handleZoom, handlePan, handleReset, setDragging } = useSharedViewport()

  // Calculate dynamic container height based on visible panels
  const containerHeight = useMemo(() => {
    const visiblePanels = state.panels.filter(p => p.visible)
    const pricePanel = visiblePanels.find(p => p.type === 'price')
    const secondaryPanels = visiblePanels.filter(p => p.type !== 'price')
    
    const totalGaps = (visiblePanels.length - 1) * PANEL_GAP
    const baseHeight = pricePanel ? BASE_PANEL_HEIGHT : 0
    const secondaryHeight = secondaryPanels.length * SECONDARY_PANEL_HEIGHT
    
    return baseHeight + secondaryHeight + totalGaps
  }, [state.panels])

  // Calculate panel positions with gaps
  const panelLayout = useMemo(() => {
    const visiblePanels = state.panels.filter(p => p.visible)
    const totalGaps = (visiblePanels.length - 1) * PANEL_GAP
    const availableHeight = containerHeight - totalGaps
    const totalHeight = visiblePanels.reduce((sum, p) => sum + p.height, 0)

    let currentTop = 0
    return visiblePanels.map((panel) => {
      const pixelHeight = (panel.height / totalHeight) * availableHeight
      const layout = {
        config: panel,
        top: currentTop,
        height: pixelHeight
      }
      currentTop += pixelHeight + PANEL_GAP
      return layout
    })
  }, [state.panels, containerHeight])

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
    const delta = -e.deltaY > 0 ? 1 : -1
    handleZoom(delta, mouseX)
  }, [handleZoom])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Mouse drag pan
  const handleMouseDown = useCallback(() => {
    setDragging(true)
  }, [setDragging])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (state.isDragging) {
      handlePan(e.movementX)
    }
  }, [state.isDragging, handlePan])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [setDragging])

  return (
    <div className="flex flex-col">
      {/* Chart Container + DateAxisStrip as single visual unit */}
      <div className="bg-background rounded-lg overflow-hidden">
        {/* Chart Container with DYNAMIC height */}
        <div 
          ref={containerRef}
          className="relative w-full transition-all duration-300"
          style={{ 
            height: `${containerHeight}px`,
            cursor: state.isDragging ? 'grabbing' : 'crosshair'
          }}
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

        </div>

        {/* Date Axis Strip - part of chart visual unit */}
        <DateAxisStrip />
      </div>

      {/* Indicator Toggle Panel - separate below */}
      {showIndicatorToggles && (
        <div className="mt-3">
          <IndicatorTogglePanel />
        </div>
      )}
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
    return indicatorData.map((ind, idx) => {
      // MACD signal is invisible by default (too cluttered)
      const isVisible = !ind.name.toLowerCase().includes('macd_signal')
      
      return {
        name: ind.name,
        color: assignIndicatorColor(idx),
        visible: isVisible,
        points: ind.values.map((val, i) => ({
          t: i,
          v: val.value
        })),
        type: 'line'
      }
    })
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
