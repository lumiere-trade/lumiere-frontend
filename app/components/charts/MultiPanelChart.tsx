'use client'

import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import { SharedViewportProvider, useSharedViewport } from './SharedViewportContext'
import { PricePanel } from './PricePanel'
import { OscillatorPanel } from './OscillatorPanel'
import { VolumePanel } from './VolumePanel'
import { IndicatorTogglePanel } from './IndicatorTogglePanel'
import { DateAxisStrip } from './DateAxisStrip'
import { CrosshairOverlay } from './CrosshairOverlay'
import { TradeTooltip } from './TradeTooltip'
import { Candle, Trade, Indicator } from './types'
import { assignIndicatorColor } from './chartUtils'
import { IndicatorData } from '@/lib/api/cartographe'

interface MultiPanelChartProps {
  candles: Candle[]
  trades: Trade[]
  indicatorData: IndicatorData[]
  mode?: 'L' | 'C'
  showIndicatorToggles?: boolean
  initialVisibility?: Record<string, boolean>
  onVisibilityChange?: (visibility: Record<string, boolean>) => void
}

const PANEL_GAP = 10
const PANEL_HEADER_HEIGHT = 18
const BASE_PANEL_HEIGHT = 350
const SECONDARY_PANEL_HEIGHT = 150

// Inner component that uses the context
function MultiPanelChartInner({ showIndicatorToggles = true }: { showIndicatorToggles?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const {
    state,
    hoveredTrade,
    handleZoom,
    handlePan,
    handleReset,
    setDragging,
    updateMouse,
    clearMouse
  } = useSharedViewport()

  // Calculate cursor style based on state
  const cursorStyle = useMemo(() => {
    if (state.isDragging) return 'grabbing'
    if (hoveredTrade) return 'pointer'
    return 'crosshair'
  }, [state.isDragging, hoveredTrade])

  // Calculate dynamic container height based on visible panels
  const containerHeight = useMemo(() => {
    const visiblePanels = state.panels.filter(p => p.visible)
    const pricePanel = visiblePanels.find(p => p.type === 'price')
    const secondaryPanels = visiblePanels.filter(p => p.type !== 'price')

    const totalGaps = (visiblePanels.length - 1) * PANEL_GAP
    const totalHeaders = visiblePanels.length * PANEL_HEADER_HEIGHT
    const baseHeight = pricePanel ? BASE_PANEL_HEIGHT : 0
    const secondaryHeight = secondaryPanels.length * SECONDARY_PANEL_HEIGHT

    return baseHeight + secondaryHeight + totalGaps + totalHeaders
  }, [state.panels])

  // Calculate panel positions
  const panelLayout = useMemo(() => {
    const visiblePanels = state.panels.filter(p => p.visible)
    const totalGaps = (visiblePanels.length - 1) * PANEL_GAP
    const availableHeight = containerHeight - totalGaps - (visiblePanels.length * PANEL_HEADER_HEIGHT)
    const totalHeight = visiblePanels.reduce((sum, p) => sum + p.height, 0)

    let currentTop = 0
    const layouts = visiblePanels.map((panel) => {
      const pixelHeight = (panel.height / totalHeight) * availableHeight
      const layout = {
        config: panel,
        top: currentTop,
        height: pixelHeight
      }

      currentTop += PANEL_HEADER_HEIGHT + pixelHeight + PANEL_GAP
      return layout
    })

    return layouts
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

  // Mouse tracking for wrapper
  const handleWrapperMouseMove = useCallback((e: React.MouseEvent) => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    updateMouse(x, y, 'wrapper')

    if (state.isDragging) {
      handlePan(e.movementX)
    }
  }, [state.isDragging, handlePan, updateMouse])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [setDragging])

  const handleMouseLeave = useCallback(() => {
    setDragging(false)
    clearMouse()
  }, [setDragging, clearMouse])

  // Calculate tooltip position
  const tooltipPosition = useMemo(() => {
    if (!hoveredTrade || !state.mouse || !containerRef.current) return null

    const rect = containerRef.current.getBoundingClientRect()

    return {
      x: state.mouse.x,
      y: state.mouse.y,
      canvasWidth: rect.width,
      canvasHeight: containerHeight
    }
  }, [hoveredTrade, state.mouse, containerHeight])

  return (
    <div className="flex flex-col">
      {/* Chart Container + DateAxisStrip */}
      <div
        ref={wrapperRef}
        className="bg-background rounded-lg overflow-hidden relative"
        style={{ cursor: cursorStyle }}
        onMouseMove={handleWrapperMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Chart Container */}
        <div
          ref={containerRef}
          className="relative w-full transition-all duration-300"
          style={{ height: `${containerHeight}px` }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
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

          {/* Crosshair Overlay */}
          <CrosshairOverlay containerHeight={containerHeight} />

          {/* Trade Tooltip Overlay */}
          {hoveredTrade && tooltipPosition && (
            <TradeTooltip
              trade={hoveredTrade}
              x={tooltipPosition.x}
              y={tooltipPosition.y}
              canvasWidth={tooltipPosition.canvasWidth}
              canvasHeight={tooltipPosition.canvasHeight}
            />
          )}
        </div>

        {/* Date Axis Strip */}
        <DateAxisStrip />
      </div>

      {/* Indicator Toggle Panel */}
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
  showIndicatorToggles = true,
  initialVisibility,
  onVisibilityChange
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
    console.log("DEBUG: USEMEMO RUNNING - indicatorData:", indicatorData.length)
    const baseIndicators = indicatorData.map((ind, idx) => {
      // Detect indicator type based on name
      const nameLower = ind.name.toLowerCase()
      let type: 'line' | 'area' | 'histogram' = 'line'

      if (nameLower.includes('histogram')) {
        type = 'histogram'
      }

      return {
        name: ind.name,
        color: assignIndicatorColor(idx),
        visible: initialVisibility?.[ind.name] ?? true,
        points: ind.values.map((val, i) => ({
          t: i,
          v: val.value
        })),
        type
      }
    })

    // Synthesize MACD Histogram from MACD and MACD_Signal
    console.log('DEBUG: All indicators:', baseIndicators.map(i => i.name))
    const macdIndicator = baseIndicators.find(ind => {
      const name = ind.name.toLowerCase()
      return name.startsWith('macd_') && !name.includes('signal')
    })
    const macdSignalIndicator = baseIndicators.find(ind => {
      const name = ind.name.toLowerCase()
      return name.startsWith('macd_') && name.includes('signal')
    })
    console.log('DEBUG: Found MACD:', macdIndicator?.name, 'Signal:', macdSignalIndicator?.name)

    if (macdIndicator && macdSignalIndicator) {
      // Calculate histogram: MACD - Signal
      const histogramPoints = macdIndicator.points.map((macdPoint, i) => {
        const signalPoint = macdSignalIndicator.points[i]
        return {
          t: macdPoint.t,
          v: macdPoint.v - signalPoint.v
        }
      })

      // Extract parameters from MACD name (e.g., "macd_12_26_9" -> "12, 26, 9")
      const paramsMatch = macdIndicator.name.match(/(\d+)_(\d+)_(\d+)/)
      const params = paramsMatch ? `${paramsMatch[1]}, ${paramsMatch[2]}, ${paramsMatch[3]}` : '12, 26, 9'

      const histogramIndicator: Indicator = {
        name: `MACD_Histogram(${params})`,
        color: 'rgba(139, 92, 246, 0.7)', // Purple
        visible: initialVisibility?.[`MACD_Histogram(${params})`] ?? true,
        points: histogramPoints,
        type: 'histogram'
      }

      console.log('DEBUG: MACD Histogram created:', histogramIndicator.name, 'points:', histogramIndicator.points.length)
      return [...baseIndicators, histogramIndicator]
    }

    return baseIndicators
  }, [indicatorData, initialVisibility])

  return (
    <div ref={containerRef} className="w-full">
      <SharedViewportProvider
        candles={candles}
        indicators={indicators}
        containerWidth={containerWidth}
        trades={trades}
        onVisibilityChange={onVisibilityChange}
      >
        <MultiPanelChartInner showIndicatorToggles={showIndicatorToggles} />
      </SharedViewportProvider>
    </div>
  )
}
