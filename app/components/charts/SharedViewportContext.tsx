'use client'

import React, { createContext, useContext, useCallback, useState, useRef } from 'react'
import { SharedViewport, MultiPanelState, PanelConfig, createDefaultPanels } from './panelTypes'
import { Candle, Indicator } from './types'
import { assignIndicatorColor } from './chartUtils'

interface SharedViewportContextValue {
  state: MultiPanelState
  candles: Candle[]
  
  // Viewport controls (synchronized across panels)
  handleZoom: (delta: number, mouseX: number) => void
  handlePan: (deltaX: number) => void
  handleReset: () => void
  
  // Panel management
  addPanel: (panel: PanelConfig) => void
  removePanel: (panelId: string) => void
  updatePanel: (panelId: string, updates: Partial<PanelConfig>) => void
  resizePanel: (panelId: string, newHeight: number) => void
  
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

  // Initialize panels with default configuration
  const [state, setState] = useState<MultiPanelState>({
    sharedViewport: initialViewport,
    panels: createDefaultPanels(),
    mouse: null,
    isDragging: false,
    isResizing: null
  })

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

  // Zoom handler (synchronized)
  const handleZoom = useCallback((delta: number, mouseX: number) => {
    setState(prev => {
      const newZoom = Math.max(0.1, Math.min(10, prev.sharedViewport.zoom + delta * 0.1))
      
      // Zoom towards mouse position
      const mouseRatio = (mouseX - 60) / (containerWidth - 130)
      const candleAtMouse = prev.sharedViewport.startIdx + 
        Math.floor(mouseRatio * (prev.sharedViewport.endIdx - prev.sharedViewport.startIdx))
      
      const newOffsetX = prev.sharedViewport.offsetX * (newZoom / prev.sharedViewport.zoom)
      
      return {
        ...prev,
        sharedViewport: recalculateViewport(newZoom, newOffsetX, containerWidth)
      }
    })
  }, [containerWidth, recalculateViewport])

  // Pan handler (synchronized)
  const handlePan = useCallback((deltaX: number) => {
    setState(prev => {
      const newOffsetX = prev.sharedViewport.offsetX + deltaX
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
          // Redistribute height proportionally
          const ratio = p.height / otherPanelsHeight
          return { ...p, height: p.height - (heightDiff * ratio) }
        })
      }
    })
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

  const toggleIndicator = useCallback((indicatorName: string, panelId: string) => {
    setState(prev => ({
      ...prev,
      panels: prev.panels.map(p => 
        p.id === panelId
          ? {
              ...p,
              indicators: p.indicators.map(i =>
                i.name === indicatorName ? { ...i, visible: !i.visible } : i
              )
            }
          : p
      )
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
