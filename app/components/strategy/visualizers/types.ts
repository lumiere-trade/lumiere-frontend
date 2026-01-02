export type RuleType = 
  | 'macd_crossover'
  | 'macd_histogram'
  | 'macd_comparison'
  | 'ma_crossover'
  | 'ma_comparison'
  | 'price_vs_ma'
  | 'rsi_threshold'
  | 'bollinger_bands'
  | 'bollinger_width'
  | 'bollinger_middle'
  | 'volume_divergence'
  | 'volume_spike'
  | 'stochastic'
  | 'adx'
  | 'atr'
  | 'trend'
  | 'candle_direction'
  | 'unknown'

export interface ParsedRule {
  type: RuleType
  rawText: string
  params: Record<string, any>
}

// ... rest of type definitions (keep existing)
export interface MACDCrossoverParams {
  direction: 'above' | 'below'
}

export interface MACDHistogramParams {
  condition: 'crosses_above' | 'crosses_below' | 'positive' | 'negative' | 'rising' | 'falling'
}

export interface MACDComparisonParams {
  operator: 'gt' | 'lt'
}

export interface MACrossoverParams {
  fastPeriod: number
  slowPeriod: number
  type: 'EMA' | 'SMA'
  direction: 'above' | 'below'
}

export interface MAComparisonParams {
  firstMA: string
  secondMA: string
  operator: 'gt' | 'lt'
}

export interface PriceVsMAParams {
  maPeriod: number
  maType: 'EMA' | 'SMA'
  operator: 'gt' | 'lt' | 'crosses_above' | 'crosses_below'
}

export interface RSIThresholdParams {
  period: number
  threshold: number
  operator: 'gt' | 'lt'
}

export interface BollingerBandsParams {
  band: 'upper' | 'lower'
  action: 'touches' | 'breaks'
}

export interface BollingerWidthParams {
  condition: 'wide' | 'narrow' | 'expanding' | 'contracting'
  threshold?: number
}

export interface BollingerMiddleParams {
  priceAbove: boolean
}

export interface VolumeDivergenceParams {
  shortPeriod: number
  longPeriod: number
  multiplier: number
}

export interface VolumeSpikeParams {
  period: number
  multiplier: number
}

export interface StochasticParams {
  threshold: number
  operator: 'gt' | 'lt'
  zone: 'overbought' | 'oversold'
}

export interface ADXParams {
  threshold: number
  condition: 'strong_trend' | 'weak_trend'
}

export interface ATRParams {
  condition: 'high_volatility' | 'low_volatility'
}

export interface TrendParams {
  direction: 'rising' | 'falling'
}

export interface CandleDirectionParams {
  bullish: boolean
}

// SVG Component Props
export interface SVGLineProps {
  x1: number
  y1: number
  x2: number
  y2: number
  color?: string
  width?: number
  opacity?: number
  dash?: string
}

export interface SVGPathProps {
  d: string
  color?: string
  width?: number
  opacity?: number
  fill?: string
  fillOpacity?: number
}

export interface SVGCircleProps {
  cx: number
  cy: number
  r?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

export interface SVGTextProps {
  x: number
  y: number
  text: string
  color?: string
  fontSize?: number
  fontWeight?: number
  opacity?: number
  anchor?: 'start' | 'middle' | 'end'
}

export interface SVGRectProps {
  x: number
  y: number
  width: number
  height: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  rx?: number
}

export interface CandlestickProps {
  x: number
  open: number
  high: number
  low: number
  close: number
  bullish: boolean
  width?: number
}
