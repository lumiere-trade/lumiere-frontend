interface DrawdownPoint {
  t: number
  d: number
}

interface DrawdownViewport {
  startIdx: number
  endIdx: number
  drawdownMin: number
  drawdownMax: number
  zoom: number
  offsetX: number
  width: number
}

const PADDING = { top: 20, right: 50, bottom: 40, left: 60 }

export function drawdownToY(
  drawdown: number,
  drawdownMin: number,
  drawdownMax: number,
  height: number
): number {
  const chartHeight = height - PADDING.top - PADDING.bottom
  const range = drawdownMax - drawdownMin
  
  // Handle zero range (no drawdown variation)
  if (range === 0 || !isFinite(range)) {
    return PADDING.top + chartHeight / 2
  }
  
  const normalized = (drawdown - drawdownMin) / range
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

export function calculateDrawdownViewport(
  points: DrawdownPoint[],
  zoom: number,
  offsetX: number,
  width: number
): DrawdownViewport {
  if (points.length === 0) {
    return {
      startIdx: 0,
      endIdx: 0,
      drawdownMin: 0,
      drawdownMax: 0,
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
  let drawdownMin = 0
  let drawdownMax = 0

  if (visibleSlice.length > 0) {
    drawdownMin = Math.min(...visibleSlice.map((p) => p.d))
    drawdownMax = Math.max(...visibleSlice.map((p) => p.d))

    // Handle case where all drawdowns are 0 (no drawdown)
    if (drawdownMin === 0 && drawdownMax === 0) {
      drawdownMin = -0.01  // -1%
      drawdownMax = 0
    } else {
      const range = drawdownMax - drawdownMin
      const padding = range * 0.1
      drawdownMin = Math.min(0, drawdownMin - padding)
      drawdownMax = Math.max(0, drawdownMax + padding)
    }
  }

  return {
    startIdx,
    endIdx,
    drawdownMin,
    drawdownMax,
    zoom,
    offsetX: clampedOffset,
    width,
  }
}

export function formatDrawdown(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`
}

export function getVisiblePoints(
  points: DrawdownPoint[],
  viewport: DrawdownViewport
): DrawdownPoint[] {
  return points.slice(viewport.startIdx, viewport.endIdx + 1)
}
