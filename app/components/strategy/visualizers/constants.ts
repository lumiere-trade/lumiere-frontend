/**
 * Visual constants for strategy rule visualizations
 * Educational style - clarity over fancy effects
 * 
 * Colors aligned with Lumière design system
 * Font sizes aligned with Tailwind typography scale
 */

export const COLORS = {
  // Signal colors - using theme-aware values
  bullish: '#22c55e',       // green-500
  bearish: '#ef4444',       // red-500
  neutral: '#f97316',       // orange-500
  
  // Indicator colors - softer, theme-integrated
  fastLine: '#3b82f6',      // blue-500
  slowLine: '#f59e0b',      // amber-500 (softer than orange)
  price: '#10b981',         // emerald-500
  
  // Volume colors
  volumeNormal: '#ef4444',  // red-500
  volumeHigh: '#22c55e',    // green-500
  volumeLine: '#f59e0b',    // amber-500
  
  // RSI/Oscillator colors
  oscillator: '#3b82f6',    // blue-500
  
  // UI elements - theme-aware
  grid: 'currentColor',
  gridOpacity: 0.15,        // Subtle, matches muted background
  text: 'currentColor',
  textMuted: 'currentColor',
  textMutedOpacity: 0.4,    // Softer for labels
  
  // Bands/Areas
  bandFill: '#f59e0b',      // amber-500
  bandFillOpacity: 0.08,    // Very subtle
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
  
  // Text - aligned with project Tailwind scale
  fontSize: 12,        // text-base (1rem = 12px) - USE THIS FOR ALL LABELS
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
