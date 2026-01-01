/**
 * Visual constants for strategy rule visualizations
 * Educational style - clarity over fancy effects
 */

export const COLORS = {
  // Signal colors
  bullish: '#22c55e',
  bearish: '#ef4444',
  neutral: '#f97316',
  
  // Indicator colors
  fastLine: '#3b82f6',      // Blue for fast indicators (EMA 50, MACD)
  slowLine: '#f97316',      // Orange for slow indicators (EMA 100, Signal)
  price: '#22c55e',         // Green for price/close
  
  // Volume colors
  volumeNormal: '#ef4444',  // Red for normal volume
  volumeHigh: '#22c55e',    // Green for high volume
  volumeLine: '#f97316',    // Orange for volume SMA
  
  // RSI/Oscillator colors
  oscillator: '#3b82f6',    // Blue for oscillator line
  
  // UI elements
  grid: 'currentColor',
  gridOpacity: 0.3,
  text: 'currentColor',
  textMuted: 'currentColor',
  textMutedOpacity: 0.5,
  
  // Bands/Areas
  bandFill: '#f97316',
  bandFillOpacity: 0.1,
} as const

export const DIMENSIONS = {
  // ViewBox
  width: 400,
  height: 120,
  
  // Margins
  marginTop: 10,
  marginRight: 10,
  marginBottom: 20,
  marginLeft: 10,
  
  // Candlestick dimensions
  candleWidth: 16,
  candleGap: 8,
  candleWickWidth: 2,
  
  // Line widths
  lineThick: 2.5,
  lineThin: 1,
  lineReference: 1,
  
  // Points/Circles
  pointRadius: 6,
  pointStroke: 2,
  
  // Text
  fontSize: 12,
  fontSizeSmall: 10,
  fontWeight: 600,
} as const

export const LAYOUT = {
  // Y-axis positions for different chart types
  centerY: 60,
  topY: 20,
  bottomY: 100,
  
  // Common reference lines
  overboughtY: 20,   // RSI 70
  neutralY: 60,      // RSI 50
  oversoldY: 100,    // RSI 30
  
  // Label positions
  labelY: 110,       // Bottom label position
  labelStartY: 35,   // Top label position
  labelEndY: 95,     // Bottom area label position
} as const

export const VIEWBOX = `0 0 ${DIMENSIONS.width} ${DIMENSIONS.height}` as const

export const TEXT_ANCHOR = {
  start: 'start',
  middle: 'middle',
  end: 'end',
} as const
