import { EquityPoint, EquityViewport } from './types'

// Equity to Y coordinate (same pattern as priceToY)
export function equityToY(
  equity: number,
  equityMin: number,
  equityMax: number,
  chartHeight: number,
  paddingTop: number
): number {
  const equityRange = equityMax - equityMin
  if (equityRange === 0) return chartHeight / 2 + paddingTop
  return paddingTop + ((equityMax - equity) / equityRange) * chartHeight
}

// Index to X coordinate (same as chartUtils)
export function indexToX(
  index: number,
  pointWidth: number,
  offsetX: number,
  paddingLeft: number
): number {
  return paddingLeft + offsetX + (index * pointWidth)
}

// Calculate viewport based on zoom & pan
export function calculateEquityViewport(
  points: EquityPoint[],
  width: number,
  zoom: number,
  offsetX: number
): EquityViewport {
  const pointWidth = Math.max(1, 3 * zoom)
  const visiblePoints = Math.floor(width / pointWidth)

  const endIdx = Math.min(
    points.length - 1,
    Math.floor(-offsetX / pointWidth) + visiblePoints
  )
  const startIdx = Math.max(0, endIdx - visiblePoints)

  // Calculate equity range from visible points
  let equityMin = Infinity
  let equityMax = -Infinity

  for (let i = startIdx; i <= endIdx; i++) {
    if (i < points.length) {
      equityMin = Math.min(equityMin, points[i].e)
      equityMax = Math.max(equityMax, points[i].e)
    }
  }

  // Add 5% padding to equity range
  const padding = (equityMax - equityMin) * 0.05
  equityMin -= padding
  equityMax += padding

  return {
    startIdx,
    endIdx,
    equityMin,
    equityMax,
    zoom,
    offsetX,
    width
  }
}

// Format equity value
export function formatEquity(equity: number): string {
  if (equity >= 1000000) {
    return `$${(equity / 1000000).toFixed(2)}M`
  }
  if (equity >= 1000) {
    return `$${(equity / 1000).toFixed(1)}K`
  }
  return `$${equity.toFixed(2)}`
}

// Format percentage
export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

// Format timestamp (reuse from chartUtils pattern)
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const mins = date.getMinutes().toString().padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${mins}`
}

// Get visible points (viewport culling)
export function getVisiblePoints(
  points: EquityPoint[],
  viewport: EquityViewport
): EquityPoint[] {
  const { startIdx, endIdx } = viewport
  return points.slice(
    Math.max(0, startIdx - 1),
    Math.min(points.length, endIdx + 1)
  )
}
