/**
 * Multi-Panel Chart Types
 * 
 * Supports:
 * - Main price chart with overlay indicators (EMA, SMA, Bollinger)
 * - Oscillator panels (RSI, Stochastic, ADX)
 * - Volume panel
 * - Shared time axis with synchronized zoom/pan
 */

import { Indicator, Viewport } from './types'

export type PanelType = 'price' | 'oscillator' | 'volume'

export interface PanelYAxis {
  min: number
  max: number
  auto: boolean  // auto-calculate range from data
  fixed?: { min: number; max: number }  // fixed range (e.g. RSI: 0-100)
}

export interface PanelConfig {
  id: string
  type: PanelType
  title: string
  height: number  // percentage (0-100)
  visible: boolean
  indicators: Indicator[]
  yAxis: PanelYAxis
  showGrid: boolean
}

export interface PanelViewport extends Viewport {
  // Extends base Viewport with panel-specific Y-axis
  panelHeight: number  // actual pixel height
  panelTop: number     // Y offset from top
}

export interface SharedViewport {
  // Shared X-axis (time) - synchronized across all panels
  startIdx: number
  endIdx: number
  candleWidth: number
  zoom: number
  offsetX: number
  totalCandles: number
}

export interface MultiPanelState {
  sharedViewport: SharedViewport
  panels: PanelConfig[]
  mouse: { x: number; y: number; panelId: string | null } | null
  isDragging: boolean
  isResizing: string | null  // panelId being resized
}

// Indicator placement strategy
export type IndicatorPlacement = 
  | { type: 'overlay'; panelId: 'price' }  // EMA, SMA, Bollinger
  | { type: 'oscillator'; panelId: string; range: [number, number] }  // RSI, Stochastic
  | { type: 'volume'; panelId: 'volume' }  // Volume bars

// Helper to determine indicator placement
export function getIndicatorPlacement(indicatorName: string): IndicatorPlacement {
  const name = indicatorName.toUpperCase()
  
  // Overlay indicators (on price chart)
  if (name.includes('EMA') || name.includes('SMA') || 
      name.includes('BOLLINGER') || name.includes('MACD_LINE') ||
      name.includes('MACD_SIGNAL')) {
    return { type: 'overlay', panelId: 'price' }
  }
  
  // RSI (0-100 range)
  if (name.includes('RSI')) {
    return { type: 'oscillator', panelId: 'rsi', range: [0, 100] }
  }
  
  // Stochastic (0-100 range)
  if (name.includes('STOCHASTIC')) {
    return { type: 'oscillator', panelId: 'stochastic', range: [0, 100] }
  }
  
  // MACD Histogram (separate panel)
  if (name.includes('MACD_HISTOGRAM')) {
    return { type: 'oscillator', panelId: 'macd', range: [-5, 5] }
  }
  
  // ADX (0-100 range)
  if (name.includes('ADX')) {
    return { type: 'oscillator', panelId: 'adx', range: [0, 100] }
  }
  
  // Volume
  if (name.includes('VOLUME')) {
    return { type: 'volume', panelId: 'volume' }
  }
  
  // Default: overlay on price
  return { type: 'overlay', panelId: 'price' }
}

// Create default panel configuration
export function createDefaultPanels(): PanelConfig[] {
  return [
    {
      id: 'price',
      type: 'price',
      title: 'Price',
      height: 60,
      visible: true,
      indicators: [],
      yAxis: { min: 0, max: 100, auto: true },
      showGrid: true
    },
    {
      id: 'volume',
      type: 'volume',
      title: 'Volume',
      height: 20,
      visible: true,
      indicators: [],
      yAxis: { min: 0, max: 100, auto: true },
      showGrid: true
    }
  ]
}

// Add oscillator panel dynamically
export function createOscillatorPanel(
  indicatorName: string,
  range: [number, number]
): PanelConfig {
  const id = indicatorName.toLowerCase().replace(/_/g, '-')
  
  return {
    id,
    type: 'oscillator',
    title: indicatorName,
    height: 20,
    visible: true,
    indicators: [],
    yAxis: { 
      min: range[0], 
      max: range[1], 
      auto: false,
      fixed: { min: range[0], max: range[1] }
    },
    showGrid: true
  }
}
