'use client'

import React, { createContext, useContext, useCallback, useState, useRef, useMemo, useEffect } from 'react'
import { SharedViewport, MultiPanelState, PanelConfig, getIndicatorPlacement, createOscillatorPanel } from './panelTypes'
import { Candle, Indicator } from './types'

interface SharedViewportContextValue {
  state: MultiPanelState
  candles: Candle[]
  
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
  children: React.ReactNode
  containerWidth: number
}

export function SharedViewportProvider({ candles, indicators, children, containerWidth }: Props) {
  // Initialize shared viewport
  const initialViewport: SharedViewport = {
    startIdx: Math.max(0, candles.length - 100),
    endIdx: candles.length - 1,
    candleWidth: 8,
    zoom: 1,
    offsetX: 0,
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

    oscillatorPanels.forEach(panel => panels.push(panel))

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

  // Update panels when indicators change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      panels: initialPanels
    }))
  }, [initialPanels])

  // Store candles ref for calculations
  const candlesRef = useRef(candles)
  candlesRef.current = candles

  // Recalculate viewport when zoom/pan changes
  const recalculateViewport = useCallback((
    zoom: number,
    offsetX: number,
    width: number
  ): SharedViewport => {
    const candleWidth = Math.max(2, 8 * zoom)
    const visibleCandles = Math.floor(width / candleWidth)
    
    const endIdx = Math.min(
      candlesRef.current.length - 1,
      Math.floor(-offsetX / candleWidth) + visibleCandles
    )
    const startIdx = Math.max(0, endIdx - visibleCandles)

    return {
      startIdx,
      endIdx,
      candleWidth,
      zoom,
      offsetX,
      totalCandles: candlesRef.current.length
    }
  }, [])

  // Zoom handler - MULTIPLICATIVE like old TradingChart
  const handleZoom = useCallback((delta: number, mouseX: number) => {
    setState(prev => {
      const zoomFactor = delta > 0 ? 1.1 : 0.9
      const newZoom = Math.max(0.1, Math.min(10, prev.sharedViewport.zoom * zoomFactor))
      
      const newOffsetX = prev.sharedViewport.offsetX * (newZoom / prev.sharedViewport.zoom)
      
      return {
        ...prev,
        sharedViewport: recalculateViewport(newZoom, newOffsetX, containerWidth)
      }
    })
  }, [containerWidth, recalculateViewport])

  // Pan handler - DIRECT movement like old TradingChart
  const handlePan = useCallback((movementX: number) => {
    setState(prev => {
      const newOffsetX = prev.sharedViewport.offsetX + movementX
      const maxOffset = 0
      const minOffset = -(candlesRef.current.length * prev.sharedViewport.candleWidth)
      const clampedOffset = Math.max(minOffset, Math.min(maxOffset, newOffsetX))
      
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

  // Reset viewport
  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      sharedViewport: {
        startIdx: Math.max(0, candlesRef.current.length - 100),
        endIdx: candlesRef.current.length - 1,
        candleWidth: 8,
        zoom: 1,
        offsetX: 0,
        totalCandles: candlesRef.current.length
      }
    }))
  }, [])

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
          // Toggle all indicators when panel toggles
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

  // Toggle indicator - if turning ON, also show the panel
  const toggleIndicator = useCallback((indicatorName: string, panelId: string) => {
    setState(prev => ({
      ...prev,
      panels: prev.panels.map(p => {
        if (p.id === panelId) {
          const updatedIndicators = p.indicators.map(i => {
            if (i.name === indicatorName) {
              const newVisibility = !i.visible
              // If turning indicator ON, also show panel
              if (newVisibility && !p.visible) {
                return { ...i, visible: newVisibility }
              }
              return { ...i, visible: newVisibility }
            }
            return i
          })
          
          // Check if any indicator is now visible
          const anyVisible = updatedIndicators.some(ind => ind.visible)
          
          return {
            ...p,
            indicators: updatedIndicators,
            // Show panel if any indicator is visible
            visible: anyVisible ? true : p.visible
          }
        }
        return p
      })
    }))
  }, [])

  // Mouse tracking
  const updateMouse = useCallback((x: number, y: number, panelId: string) => {
    setState(prev => ({
      ...prev,
      mouse: { x, y, panelId }
    }))
  }, [])

  const clearMouse = useCallback(() => {
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
    setDragging
  }

  return (
    <SharedViewportContext.Provider value={value}>
      {children}
    </SharedViewportContext.Provider>
  )
}
