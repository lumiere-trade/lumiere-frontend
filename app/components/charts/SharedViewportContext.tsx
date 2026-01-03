'use client'

import React, { createContext, useContext, useCallback, useState, useRef, useMemo, useEffect } from 'react'
import { SharedViewport, MultiPanelState, PanelConfig, getIndicatorPlacement, createOscillatorPanel } from './panelTypes'
import { Candle, Indicator, Trade } from './types'

interface SharedViewportContextValue {
  state: MultiPanelState
  candles: Candle[]
  trades: Trade[]
  hoveredTrade: Trade | null
  timeframe: string

  // Viewport controls (synchronized across panels)
  handleZoom: (delta: number, mouseX: number) => void
  handlePan: (movementX: number) => void
  handleReset: () => void

  // Panel management
  addPanel: (panel: PanelConfig) => void
  removePanel: (panelId: string) => void
  updatePanel: (panelId: string, updates: Partial<PanelConfig>) => void
  resizePanel: (panelId: string, newHeight: number) => void
  togglePanelVisibility: (panelId: string) => void

  // Indicator management
  addIndicator: (indicator: Indicator, panelId: string) => void
  removeIndicator: (indicatorName: string, panelId: string) => void
  toggleIndicator: (indicatorName: string, panelId: string) => void

  // Mouse tracking
  updateMouse: (x: number, y: number, panelId: string) => void
  clearMouse: () => void

  // Dragging state
  setDragging: (dragging: boolean) => void

  // Trade hover tracking
  setHoveredTrade: (trade: Trade | null) => void
}

const SharedViewportContext = createContext<SharedViewportContextValue | null>(null)

export function useSharedViewport() {
  const context = useContext(SharedViewportContext)
  if (!context) {
    throw new Error('useSharedViewport must be used within SharedViewportProvider')
  }
  return context
}

interface Props {
  candles: Candle[]
  indicators: Indicator[]
  trades: Trade[]
  children: React.ReactNode
  containerWidth: number
  timeframe: string
  onVisibilityChange?: (visibility: Record<string, boolean>) => void
}

export function SharedViewportProvider({ candles, indicators, trades, children, containerWidth, timeframe, onVisibilityChange }: Props) {
  // Initialize shared viewport - show LAST candles (newest data)
  const candleWidth = 8
  const visibleCandles = Math.floor(containerWidth / candleWidth)
  const initialOffsetX = -(candles.length - visibleCandles) * candleWidth

  const initialViewport: SharedViewport = {
    startIdx: Math.max(0, candles.length - visibleCandles),
    endIdx: candles.length - 1,
    candleWidth,
    zoom: 1,
    offsetX: initialOffsetX,
    totalCandles: candles.length
  }

  // Create panels with indicators distributed
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
    let volumePanel: PanelConfig | null = null

    // Distribute indicators to panels
    indicators.forEach(indicator => {
      const placement = getIndicatorPlacement(indicator.name)

      if (placement.type === 'overlay') {
        panels[0].indicators.push(indicator)
      } else if (placement.type === 'oscillator') {
        if (!oscillatorPanels.has(placement.panelId)) {
          oscillatorPanels.set(
            placement.panelId,
            createOscillatorPanel(indicator.name, placement.range)
          )
        }
        oscillatorPanels.get(placement.panelId)!.indicators.push(indicator)
      } else if (placement.type === 'volume') {
        // Create volume panel if doesn't exist
        if (!volumePanel) {
          volumePanel = {
            id: 'volume',
            type: 'volume',
            title: 'Volume',
            height: 20,
            visible: true,
            indicators: [],
            yAxis: { min: 0, max: 100, auto: true },
            showGrid: true
          }
        }
        // Add indicator to volume panel
        volumePanel.indicators.push(indicator)
      }
    })

    // Add volume panel if it was created - set visible based on indicators
    if (volumePanel) {
      volumePanel.visible = volumePanel.indicators.some(ind => ind.visible)
      panels.push(volumePanel)
    }

    // Add oscillator panels - set visible based on indicators
    oscillatorPanels.forEach(panel => {
      panel.visible = panel.indicators.some(ind => ind.visible)
      panels.push(panel)
    })

    return panels
  }, [indicators])

  // Initialize state with panels
  const [state, setState] = useState<MultiPanelState>({
    sharedViewport: initialViewport,
    panels: initialPanels,
    mouse: null,
    isDragging: false,
    isResizing: null
  })

  const [hoveredTrade, setHoveredTrade] = useState<Trade | null>(null)

  // Store last candle index (absolute) for re-snapping after zoom
  const lastCandleRef = useRef<{ candleIndex: number; y: number; panelId: string } | null>(null)

  // Update panels when indicators change - PRESERVE visibility state
  useEffect(() => {
    setState(prev => {
      // Merge new indicator data with existing visibility state
      const updatedPanels = initialPanels.map(newPanel => {
        const existingPanel = prev.panels.find(p => p.id === newPanel.id)

        if (!existingPanel) {
          // New panel - use default visibility
          return newPanel
        }

        // Existing panel - preserve visibility state
        const updatedIndicators = newPanel.indicators.map(newInd => {
          const existingInd = existingPanel.indicators.find(i => i.name === newInd.name)
          return existingInd
            ? { ...newInd, visible: existingInd.visible } // Preserve visibility
            : newInd // New indicator - use default
        })

        return {
          ...newPanel,
          visible: existingPanel.visible, // Preserve panel visibility
          indicators: updatedIndicators
        }
      })

      return {
        ...prev,
        panels: updatedPanels
      }
    })
  }, [initialPanels])

  // Store candles ref for calculations
  const candlesRef = useRef(candles)
  candlesRef.current = candles

  // Recalculate viewport when zoom/pan changes + DEBUG
  const recalculateViewport = useCallback((
    zoom: number,
    offsetX: number,
    width: number
  ): SharedViewport => {
    const candleWidth = Math.max(2, 8 * zoom)
    const visibleCandles = Math.floor(width / candleWidth)

    // Calculate startIdx from offsetX
    const startIdx = Math.max(0, Math.floor(-offsetX / candleWidth))
    const endIdx = Math.min(candlesRef.current.length - 1, startIdx + visibleCandles - 1)

    console.log('VIEWPORT DEBUG:', {
      width,
      candleWidth,
      visibleCandles,
      offsetX,
      startIdx,
      endIdx,
      totalCandles: candlesRef.current.length
    })

    return {
      startIdx,
      endIdx,
      candleWidth,
      zoom,
      offsetX,
      totalCandles: candlesRef.current.length
    }
  }, [])

  // Zoom handler with FOCAL POINT - zoom towards cursor position
  const handleZoom = useCallback((delta: number, mouseX: number) => {
    setState(prev => {
      const zoomFactor = delta > 0 ? 1.1 : 0.9
      const newZoom = Math.max(0.1, Math.min(10, prev.sharedViewport.zoom * zoomFactor))

      // Calculate padding (match renderer logic)
      const paddingLeft = Math.max(15, containerWidth * 0.02)

      // Calculate current candle position under cursor (in candle units)
      // This is the "focal point" we want to preserve
      const oldCandleWidth = prev.sharedViewport.candleWidth
      const candlePositionUnderCursor = (mouseX - paddingLeft - prev.sharedViewport.offsetX) / oldCandleWidth

      // Calculate new candle width after zoom
      const newCandleWidth = Math.max(2, 8 * newZoom)

      // Calculate new offsetX to keep same candle under cursor
      // Formula: offsetX = mouseX - paddingLeft - candlePosition * newCandleWidth
      let newOffsetX = mouseX - paddingLeft - candlePositionUnderCursor * newCandleWidth

      // Apply bounds clamping
      const visibleCandles = Math.floor(containerWidth / newCandleWidth)
      const maxOffset = -(candlesRef.current.length - visibleCandles) * newCandleWidth
      const minOffset = 0

      newOffsetX = Math.max(maxOffset, Math.min(minOffset, newOffsetX))

      const newViewport = recalculateViewport(newZoom, newOffsetX, containerWidth)

      // Re-snap mouse to SAME candle (by absolute index) in new viewport
      let newMouse = prev.mouse
      if (lastCandleRef.current) {
        const { candleIndex, y, panelId } = lastCandleRef.current
        
        // Check if candle is visible in new viewport
        if (candleIndex >= newViewport.startIdx && candleIndex <= newViewport.endIdx) {
          // Calculate position of SAME candle in new viewport
          const relativeIndex = candleIndex - newViewport.startIdx
          const snappedX = paddingLeft + (relativeIndex * newViewport.candleWidth) + (newViewport.candleWidth / 2)
          newMouse = { x: snappedX, y, panelId }
        }
      }

      return {
        ...prev,
        sharedViewport: newViewport,
        mouse: newMouse
      }
    })
  }, [containerWidth, recalculateViewport])

  // Pan handler - DIRECT movement like old TradingChart
  const handlePan = useCallback((movementX: number) => {
    setState(prev => {
      const newOffsetX = prev.sharedViewport.offsetX + movementX

      // Clamp bounds:
      // maxOffset = -(totalCandles - visibleCandles) * candleWidth
      // This allows panning until the LAST candle is visible on right edge
      const visibleCandles = Math.floor(containerWidth / prev.sharedViewport.candleWidth)
      const maxOffset = -(candlesRef.current.length - visibleCandles) * prev.sharedViewport.candleWidth

      // minOffset = 0 (show first candles on left edge)
      const minOffset = 0

      const clampedOffset = Math.max(maxOffset, Math.min(minOffset, newOffsetX))

      return {
        ...prev,
        sharedViewport: recalculateViewport(
          prev.sharedViewport.zoom,
          clampedOffset,
          containerWidth
        )
      }
    })
  }, [containerWidth, recalculateViewport])

  // Reset viewport - back to LAST candles (newest data)
  const handleReset = useCallback(() => {
    const candleWidth = 8
    const visibleCandles = Math.floor(containerWidth / candleWidth)
    const initialOffsetX = -(candlesRef.current.length - visibleCandles) * candleWidth

    setState(prev => ({
      ...prev,
      sharedViewport: {
        startIdx: Math.max(0, candlesRef.current.length - visibleCandles),
        endIdx: candlesRef.current.length - 1,
        candleWidth,
        zoom: 1,
        offsetX: initialOffsetX,
        totalCandles: candlesRef.current.length
      }
    }))
  }, [containerWidth])

  // Panel management
  const addPanel = useCallback((panel: PanelConfig) => {
    setState(prev => ({
      ...prev,
      panels: [...prev.panels, panel]
    }))
  }, [])

  const removePanel = useCallback((panelId: string) => {
    setState(prev => ({
      ...prev,
      panels: prev.panels.filter(p => p.id !== panelId)
    }))
  }, [])

  const updatePanel = useCallback((panelId: string, updates: Partial<PanelConfig>) => {
    setState(prev => ({
      ...prev,
      panels: prev.panels.map(p =>
        p.id === panelId ? { ...p, ...updates } : p
      )
    }))
  }, [])

  const resizePanel = useCallback((panelId: string, newHeight: number) => {
    setState(prev => {
      const totalHeight = prev.panels.reduce((sum, p) => sum + p.height, 0)
      const panel = prev.panels.find(p => p.id === panelId)
      if (!panel) return prev

      const heightDiff = newHeight - panel.height
      const otherPanelsHeight = totalHeight - panel.height

      return {
        ...prev,
        panels: prev.panels.map(p => {
          if (p.id === panelId) {
            return { ...p, height: newHeight }
          }
          const ratio = p.height / otherPanelsHeight
          return { ...p, height: p.height - (heightDiff * ratio) }
        })
      }
    })
  }, [])

  // Toggle panel visibility - also toggles all indicators in panel
  const togglePanelVisibility = useCallback((panelId: string) => {
    setState(prev => ({
      ...prev,
      panels: prev.panels.map(p => {
        if (p.id === panelId) {
          const newVisibility = !p.visible
          return {
            ...p,
            visible: newVisibility,
            indicators: p.indicators.map(ind => ({ ...ind, visible: newVisibility }))
          }
        }
        return p
      })
    }))
  }, [])

  // Indicator management
  const addIndicator = useCallback((indicator: Indicator, panelId: string) => {
    setState(prev => ({
      ...prev,
      panels: prev.panels.map(p =>
        p.id === panelId
          ? { ...p, indicators: [...p.indicators, indicator] }
          : p
      )
    }))
  }, [])

  const removeIndicator = useCallback((indicatorName: string, panelId: string) => {
    setState(prev => ({
      ...prev,
      panels: prev.panels.map(p =>
        p.id === panelId
          ? { ...p, indicators: p.indicators.filter(i => i.name !== indicatorName) }
          : p
      )
    }))
  }, [])

  // Toggle indicator - auto show/hide panel based on visible indicators
  const toggleIndicator = useCallback((indicatorName: string, panelId: string) => {
    setState(prev => {
      const newPanels = prev.panels.map(p => {
        if (p.id === panelId) {
          const updatedIndicators = p.indicators.map(i => {
            if (i.name === indicatorName) {
              return { ...i, visible: !i.visible }
            }
            return i
          })

          // Check if any indicator is visible
          const anyVisible = updatedIndicators.some(ind => ind.visible)

          return {
            ...p,
            indicators: updatedIndicators,
            // Price panel ALWAYS visible (shows candles even without indicators)
            // Other panels only visible if they have visible indicators
            visible: p.type === 'price' ? true : anyVisible
          }
        }
        return p
      })

      // Call callback with new visibility state
      if (onVisibilityChange) {
        const visibility: Record<string, boolean> = {}
        newPanels.forEach(panel => {
          panel.indicators.forEach(ind => {
            visibility[ind.name] = ind.visible
          })
        })
        onVisibilityChange(visibility)
      }

      return {
        ...prev,
        panels: newPanels
      }
    })
  }, [onVisibilityChange])

  // Mouse tracking with SNAP to candle center (TradingView behavior) + DEBUG
  const updateMouse = useCallback((x: number, y: number, panelId: string) => {
    setState(prev => {
      // Calculate padding (match renderer logic)
      const paddingLeft = Math.max(15, containerWidth * 0.02)

      // Find which candle contains the mouse position
      const exactPosition = (x - paddingLeft) / prev.sharedViewport.candleWidth
      const relativePosition = Math.floor(exactPosition)
      const candleIndex = prev.sharedViewport.startIdx + relativePosition

      // Clamp to valid range
      const clampedIndex = Math.max(
        prev.sharedViewport.startIdx,
        Math.min(prev.sharedViewport.endIdx, candleIndex)
      )

      // Store ABSOLUTE candle index for re-snapping after zoom
      lastCandleRef.current = { candleIndex: clampedIndex, y, panelId }

      // Calculate CENTER X of this candle (snap point)
      const relativeIndex = clampedIndex - prev.sharedViewport.startIdx
      const snappedX = paddingLeft + (relativeIndex * prev.sharedViewport.candleWidth) + (prev.sharedViewport.candleWidth / 2)

      // Calculate what CENTER should be for the candle we're over
      const candleLeftEdge = paddingLeft + (relativePosition * prev.sharedViewport.candleWidth)
      const trueCandleCenter = candleLeftEdge + (prev.sharedViewport.candleWidth / 2)

      console.log('SNAP DEBUG:', {
        rawX: x,
        paddingLeft,
        candleWidth: prev.sharedViewport.candleWidth,
        exactPosition: exactPosition.toFixed(2),
        relativePosition,
        candleIndex,
        clampedIndex,
        relativeIndex,
        snappedX: snappedX.toFixed(2),
        trueCandleCenter: trueCandleCenter.toFixed(2),
        candleLeftEdge: candleLeftEdge.toFixed(2),
        viewport: { start: prev.sharedViewport.startIdx, end: prev.sharedViewport.endIdx }
      })

      return {
        ...prev,
        mouse: { x: snappedX, y, panelId }
      }
    })
  }, [containerWidth])

  const clearMouse = useCallback(() => {
    lastCandleRef.current = null
    setState(prev => ({
      ...prev,
      mouse: null
    }))
  }, [])

  // Dragging state
  const setDragging = useCallback((dragging: boolean) => {
    setState(prev => ({
      ...prev,
      isDragging: dragging
    }))
  }, [])

  const value: SharedViewportContextValue = {
    state,
    candles,
    trades,
    hoveredTrade,
    timeframe,
    handleZoom,
    handlePan,
    handleReset,
    addPanel,
    removePanel,
    updatePanel,
    resizePanel,
    togglePanelVisibility,
    addIndicator,
    removeIndicator,
    toggleIndicator,
    updateMouse,
    clearMouse,
    setDragging,
    setHoveredTrade
  }

  return (
    <SharedViewportContext.Provider value={value}>
      {children}
    </SharedViewportContext.Provider>
  )
}
