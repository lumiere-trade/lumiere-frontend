/**
 * Multi-Panel Chart Types
 *
 * Supports:
 * - Main price chart with overlay indicators (EMA, SMA, Bollinger)
 * - Oscillator panels (RSI, Stochastic, ADX, MACD)
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
  | { type: 'oscillator'; panelId: string; range: [number, number] }  // RSI, Stochastic, MACD
  | { type: 'volume'; panelId: 'volume' }  // Volume bars

// Helper to determine indicator placement
export function getIndicatorPlacement(indicatorName: string): IndicatorPlacement {
  const name = indicatorName.toUpperCase()

  // Volume-based indicators - check FIRST before general SMA/EMA
  if (name.includes('VOLUME_SMA') || name.includes('VOLUME_EMA') || 
      (name.includes('VOLUME') && (name.includes('SMA') || name.includes('EMA')))) {
    return { type: 'volume', panelId: 'volume' }
  }

  // Raw volume indicator
  if (name.includes('VOLUME')) {
    return { type: 'volume', panelId: 'volume' }
  }

  // MACD indicators - ALL go to oscillator panel
  if (name.includes('MACD')) {
    return { type: 'oscillator', panelId: 'macd', range: [-10, 10] }
  }

  // RSI (0-100 range)
  if (name.includes('RSI')) {
    return { type: 'oscillator', panelId: 'rsi', range: [0, 100] }
  }

  // Stochastic (0-100 range)
  if (name.includes('STOCHASTIC') || name.includes('STOCH')) {
    return { type: 'oscillator', panelId: 'stochastic', range: [0, 100] }
  }

  // ADX (0-100 range)
  if (name.includes('ADX')) {
    return { type: 'oscillator', panelId: 'adx', range: [0, 100] }
  }

  // Overlay indicators (on price chart) - EMA, SMA, Bollinger, etc.
  if (name.includes('EMA') || name.includes('SMA') || name.includes('BOLLINGER')) {
    return { type: 'overlay', panelId: 'price' }
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
  const name = indicatorName.toLowerCase()
  
  // Extract clean panel ID
  let id = 'oscillator'
  let title = indicatorName
  
  if (name.includes('macd')) {
    id = 'macd'
    title = 'MACD'
  } else if (name.includes('rsi')) {
    id = 'rsi'
    title = 'RSI'
  } else if (name.includes('stoch')) {
    id = 'stochastic'
    title = 'Stochastic'
  } else if (name.includes('adx')) {
    id = 'adx'
    title = 'ADX'
  }

  return {
    id,
    type: 'oscillator',
    title,
    height: 20,
    visible: true,
    indicators: [],
    yAxis: {
      min: range[0],
      max: range[1],
      auto: id === 'macd',  // MACD uses auto range
      fixed: id !== 'macd' ? { min: range[0], max: range[1] } : undefined
    },
    showGrid: true
  }
}
