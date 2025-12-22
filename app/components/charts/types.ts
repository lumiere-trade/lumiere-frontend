export interface Candle {
  t: number  // timestamp (compact name)
  o: number  // open
  h: number  // high
  l: number  // low
  c: number  // close
  v?: number // volume
}

export interface Trade {
  t: number  // timestamp
  p: number  // price
  s: 'B' | 'S'  // side (B=buy, S=sell)
}

export interface IndicatorPoint {
  t: number   // timestamp (index in candles array)
  v: number   // value
}

export interface Indicator {
  name: string
  color: string
  visible: boolean
  points: IndicatorPoint[]
  type: 'line' | 'area'  // future: support different types
}

export type Mode = 'L' | 'C'  // Line | Candles
export type TF = '5m' | '15m' | '30m' | '1h' | '4h' | '1d'

export interface Viewport {
  startIdx: number
  endIdx: number
  priceMin: number
  priceMax: number
  candleWidth: number
  zoom: number
  offsetX: number
}

export interface ChartState {
  mode: Mode
  timeframe: TF
  candles: Candle[]
  trades: Trade[]
  indicators: Indicator[]
  viewport: Viewport
  mouse: { x: number; y: number } | null
  isDragging: boolean
  dirty: boolean  // needs redraw
}

// Equity Curve types
export interface EquityPoint {
  t: number  // timestamp
  e: number  // equity value
  d: number  // drawdown (0 to 1, where 0.15 = 15%)
  r: number  // return % (cumulative)
}

export interface EquityViewport {
  startIdx: number
  endIdx: number
  equityMin: number
  equityMax: number
  zoom: number
  offsetX: number
  width: number
}

export interface EquityState {
  points: EquityPoint[]
  viewport: EquityViewport
  mouse: { x: number; y: number } | null
  isDragging: boolean
  dirty: boolean
}

// Drawdown chart types
export interface DrawdownPoint {
  t: number  // timestamp
  d: number  // drawdown (0 to 1, negative values)
}

export interface DrawdownViewport {
  startIdx: number
  endIdx: number
  drawdownMin: number
  drawdownMax: number
  zoom: number
  offsetX: number
  width: number
}

export interface DrawdownState {
  points: DrawdownPoint[]
  viewport: DrawdownViewport
  mouse: { x: number; y: number } | null
  isDragging: boolean
  dirty: boolean
}

// PnL chart types
export interface PnLPoint {
  t: number  // timestamp
  p: number  // cumulative PnL in dollars
}

export interface PnLViewport {
  startIdx: number
  endIdx: number
  pnlMin: number
  pnlMax: number
  zoom: number
  offsetX: number
  width: number
}

export interface PnLState {
  points: PnLPoint[]
  viewport: PnLViewport
  mouse: { x: number; y: number } | null
  isDragging: boolean
  dirty: boolean
}
