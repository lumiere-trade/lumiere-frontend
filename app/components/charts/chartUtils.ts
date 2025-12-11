import { Candle, Trade, Viewport } from './types'

// Binary search for timestamp (O(log n))
export function findCandleIndex(candles: Candle[], timestamp: number): number {
  let left = 0
  let right = candles.length - 1
  
  while (left <= right) {
    const mid = (left + right) >>> 1  // Fast division by 2
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
    Math.max(0, startIdx - 2),  // +2 buffer for smooth edges
    Math.min(candles.length, endIdx + 2)
  )
}

// Price to Y coordinate (hot path - optimized)
export function priceToY(
  price: number,
  priceMin: number,
  priceMax: number,
  chartHeight: number,
  padding: number
): number {
  const priceRange = priceMax - priceMin
  if (priceRange === 0) return chartHeight / 2
  return padding + ((priceMax - price) / priceRange) * (chartHeight - padding * 2)
}

// Index to X coordinate
export function indexToX(
  index: number,
  candleWidth: number,
  offsetX: number,
  padding: number
): number {
  return padding + offsetX + (index * candleWidth)
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
  offsetX: number
): Viewport {
  const candleWidth = Math.max(2, 8 * zoom)  // Min 2px, scales with zoom
  const visibleCandles = Math.floor(width / candleWidth)
  
  const endIdx = Math.min(
    candles.length - 1,
    Math.floor(-offsetX / candleWidth) + visibleCandles
  )
  const startIdx = Math.max(0, endIdx - visibleCandles)
  
  // Calculate price range from visible candles
  let priceMin = Infinity
  let priceMax = -Infinity
  
  for (let i = startIdx; i <= endIdx; i++) {
    if (i < candles.length) {
      priceMin = Math.min(priceMin, candles[i].l)
      priceMax = Math.max(priceMax, candles[i].h)
    }
  }
  
  // Add 5% padding to price range
  const padding = (priceMax - priceMin) * 0.05
  priceMin -= padding
  priceMax += padding
  
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
