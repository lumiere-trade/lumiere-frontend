'use client'

import React, { useRef, useEffect, useMemo, useCallback } from 'react'
import { SharedViewportProvider, useSharedViewport } from './SharedViewportContext'
import { PricePanel } from './PricePanel'
import { OscillatorPanel } from './OscillatorPanel'
import { VolumePanel } from './VolumePanel'
import { Candle, Trade, Indicator, IndicatorPoint } from './types'
import { getIndicatorPlacement, createOscillatorPanel, PanelConfig } from './panelTypes'
import { assignIndicatorColor } from './chartUtils'
import { IndicatorData } from '@/lib/api/cartographe'

interface MultiPanelChartProps {
  candles: Candle[]
  trades: Trade[]
  indicatorData: IndicatorData[]
  mode?: 'L' | 'C'
}

// Inner component that uses the context
function MultiPanelChartInner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, handleZoom, handlePan, handleReset, addPanel, toggleIndicator } = useSharedViewport()

  // Calculate panel positions
  const panelLayout = useMemo(() => {
    const containerHeight = containerRef.current?.clientHeight || 600
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
    const delta = e.deltaY > 0 ? -1 : 1
    handleZoom(delta, mouseX)
  }, [handleZoom])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Mouse drag pan
  const mouseDownRef = useRef<{ x: number; startOffsetX: number } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownRef.current = {
      x: e.clientX,
      startOffsetX: state.sharedViewport.offsetX
    }
  }, [state.sharedViewport.offsetX])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseDownRef.current) return

    const deltaX = e.clientX - mouseDownRef.current.x
    const newOffsetX = mouseDownRef.current.startOffsetX + deltaX
    handlePan(deltaX)
  }, [handlePan])

  const handleMouseUp = useCallback(() => {
    mouseDownRef.current = null
  }, [])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-background"
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
  )
}

// Main component with provider
export function MultiPanelChart({ candles, trades, indicatorData, mode = 'C' }: MultiPanelChartProps) {
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

  // Create panels based on indicators
  const initialPanels = useMemo(() => {
    const panels: PanelConfig[] = [
      {
        id: 'price',
        type: 'price',
        title: 'Price',
        height: 60,
        visible: true,
        indicators: [],
        yAxis: { min: 0, max: 100, auto: true },
        showGrid: true
      }
    ]

    const oscillatorPanels = new Map<string, PanelConfig>()

    // Distribute indicators to panels
    indicators.forEach(indicator => {
      const placement = getIndicatorPlacement(indicator.name)

      if (placement.type === 'overlay') {
        // Add to price panel
        panels[0].indicators.push(indicator)
      } else if (placement.type === 'oscillator') {
        // Create or add to oscillator panel
        if (!oscillatorPanels.has(placement.panelId)) {
          oscillatorPanels.set(
            placement.panelId,
            createOscillatorPanel(indicator.name, placement.range)
          )
        }
        oscillatorPanels.get(placement.panelId)!.indicators.push(indicator)
      } else if (placement.type === 'volume') {
        // Add volume panel if not exists
        if (!panels.find(p => p.id === 'volume')) {
          panels.push({
            id: 'volume',
            type: 'volume',
            title: 'Volume',
            height: 20,
            visible: true,
            indicators: [indicator],
            yAxis: { min: 0, max: 100, auto: true },
            showGrid: true
          })
        }
      }
    })

    // Add oscillator panels
    oscillatorPanels.forEach(panel => panels.push(panel))

    return panels
  }, [indicators])

  return (
    <div ref={containerRef} className="w-full h-full">
      <SharedViewportProvider
        candles={candles}
        indicators={indicators}
        containerWidth={containerWidth}
      >
        <MultiPanelChartInner />
      </SharedViewportProvider>
    </div>
  )
}
