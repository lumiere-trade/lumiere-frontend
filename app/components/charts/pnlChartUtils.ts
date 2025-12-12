interface PnLPoint {
  t: number
  p: number
}

interface PnLViewport {
  startIdx: number
  endIdx: number
  pnlMin: number
  pnlMax: number
  zoom: number
  offsetX: number
  width: number
}

const PADDING = { top: 20, right: 50, bottom: 40, left: 60 }

export function pnlToY(
  pnl: number,
  pnlMin: number,
  pnlMax: number,
  height: number
): number {
  const chartHeight = height - PADDING.top - PADDING.bottom
  const range = pnlMax - pnlMin

  if (range === 0 || !isFinite(range)) {
    return PADDING.top + chartHeight / 2
  }

  const normalized = (pnl - pnlMin) / range
  return PADDING.top + chartHeight * (1 - normalized)
}

export function indexToX(
  index: number,
  totalPoints: number,
  width: number
): number {
  const chartWidth = width - PADDING.left - PADDING.right
  if (totalPoints <= 1) return PADDING.left
  return PADDING.left + (index / (totalPoints - 1)) * chartWidth
}

export function calculatePnLViewport(
  points: PnLPoint[],
  zoom: number,
  offsetX: number,
  width: number
): PnLViewport {
  if (points.length === 0) {
    return {
      startIdx: 0,
      endIdx: 0,
      pnlMin: 0,
      pnlMax: 0,
      zoom: 1,
      offsetX: 0,
      width,
    }
  }

  const totalPoints = points.length
  const visiblePoints = Math.max(10, Math.floor(totalPoints / zoom))
  const maxOffset = Math.max(0, totalPoints - visiblePoints)
  const clampedOffset = Math.max(0, Math.min(offsetX, maxOffset))

  const startIdx = Math.floor(clampedOffset)
  const endIdx = Math.min(startIdx + visiblePoints - 1, totalPoints - 1)

  const visibleSlice = points.slice(startIdx, endIdx + 1)
  let pnlMin = 0
  let pnlMax = 0

  if (visibleSlice.length > 0) {
    pnlMin = Math.min(...visibleSlice.map((p) => p.p))
    pnlMax = Math.max(...visibleSlice.map((p) => p.p))

    // Handle case where all PnL are 0 (no trades)
    if (pnlMin === 0 && pnlMax === 0) {
      pnlMin = -100
      pnlMax = 100
    } else {
      const range = pnlMax - pnlMin
      const padding = range * 0.1
      pnlMin = pnlMin - padding
      pnlMax = pnlMax + padding
    }
  }

  return {
    startIdx,
    endIdx,
    pnlMin,
    pnlMax,
    zoom,
    offsetX: clampedOffset,
    width,
  }
}

export function formatPnL(value: number): string {
  const sign = value >= 0 ? '+' : ''
  if (Math.abs(value) >= 1000) {
    return `${sign}$${(value / 1000).toFixed(1)}K`
  }
  return `${sign}$${value.toFixed(2)}`
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`
}

export function getVisiblePoints(
  points: PnLPoint[],
  viewport: PnLViewport
): PnLPoint[] {
  return points.slice(viewport.startIdx, viewport.endIdx + 1)
}
