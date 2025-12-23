import { Candle, Trade, Viewport, Indicator } from './types'

// Binary search for timestamp (O(log n))
export function findCandleIndex(candles: Candle[], timestamp: number): number {
  let left = 0
  let right = candles.length - 1

  while (left <= right) {
    const mid = (left + right) >>> 1
    if (candles[mid].t === timestamp) return mid
    if (candles[mid].t < timestamp) left = mid + 1
    else right = mid - 1
  }
  return left
}

// Get visible candles (viewport culling)
export function getVisibleCandles(
  candles: Candle[],
  viewport: Viewport
): Candle[] {
  const { startIdx, endIdx } = viewport
  return candles.slice(
    Math.max(0, startIdx - 2),
    Math.min(candles.length, endIdx + 2)
  )
}

// Get visible indicators (viewport culling)
export function getVisibleIndicators(
  indicators: Indicator[],
  viewport: Viewport
): Indicator[] {
  return indicators
    .filter(ind => ind.visible)
    .map(ind => ({
      ...ind,
      points: ind.points.slice(
        Math.max(0, viewport.startIdx - 2),
        Math.min(ind.points.length, viewport.endIdx + 2)
      )
    }))
}

// Calculate price range including indicators
export function calculatePriceRangeWithIndicators(
  candles: Candle[],
  indicators: Indicator[],
  startIdx: number,
  endIdx: number
): { priceMin: number; priceMax: number } {
  let priceMin = Infinity
  let priceMax = -Infinity

  // Price range from candles
  for (let i = startIdx; i <= endIdx; i++) {
    if (i < candles.length) {
      priceMin = Math.min(priceMin, candles[i].l)
      priceMax = Math.max(priceMax, candles[i].h)
    }
  }

  // Price range from visible indicators
  for (const indicator of indicators) {
    if (!indicator.visible) continue

    for (let i = startIdx; i <= endIdx; i++) {
      if (i < indicator.points.length) {
        const value = indicator.points[i].v
        if (!isNaN(value) && isFinite(value)) {
          priceMin = Math.min(priceMin, value)
          priceMax = Math.max(priceMax, value)
        }
      }
    }
  }

  // Add 5% padding to price range
  const padding = (priceMax - priceMin) * 0.05
  priceMin -= padding
  priceMax += padding

  return { priceMin, priceMax }
}

// Price to Y coordinate (hot path - optimized)
export function priceToY(
  price: number,
  priceMin: number,
  priceMax: number,
  chartHeight: number,
  paddingTop: number
): number {
  const priceRange = priceMax - priceMin
  if (priceRange === 0) return chartHeight / 2 + paddingTop
  return paddingTop + ((priceMax - price) / priceRange) * chartHeight
}

// Index to X coordinate - FIXED to use relative positioning
// NOTE: offsetX is NOT used here because startIdx/endIdx already incorporate it
export function indexToX(
  index: number,
  candleWidth: number,
  offsetX: number,
  paddingLeft: number,
  startIdx: number = 0
): number {
  // Use relative index from viewport startIdx
  const relativeIndex = index - startIdx
  // offsetX is already incorporated in startIdx/endIdx calculation
  return paddingLeft + (relativeIndex * candleWidth)
}

// Debounce (optimization for resize/scroll)
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Calculate viewport based on zoom & pan
export function calculateViewport(
  candles: Candle[],
  width: number,
  zoom: number,
  offsetX: number,
  indicators: Indicator[] = []
): Viewport {
  const candleWidth = Math.max(2, 8 * zoom)
  const visibleCandles = Math.floor(width / candleWidth)

  const endIdx = Math.min(
    candles.length - 1,
    Math.floor(-offsetX / candleWidth) + visibleCandles
  )
  const startIdx = Math.max(0, endIdx - visibleCandles)

  // Calculate price range including indicators
  const { priceMin, priceMax } = calculatePriceRangeWithIndicators(
    candles,
    indicators,
    startIdx,
    endIdx
  )

  return {
    startIdx,
    endIdx,
    priceMin,
    priceMax,
    candleWidth,
    zoom,
    offsetX
  }
}

// Format price (optimized string formatting)
export function formatPrice(price: number): string {
  return price < 1
    ? price.toFixed(4)
    : price < 100
    ? price.toFixed(2)
    : price.toFixed(0)
}

// Format timestamp
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const mins = date.getMinutes().toString().padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${mins}`
}

// Assign colors to indicators
const INDICATOR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
]

export function assignIndicatorColor(index: number): string {
  return INDICATOR_COLORS[index % INDICATOR_COLORS.length]
}
