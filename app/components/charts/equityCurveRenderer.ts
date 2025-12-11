import { EquityPoint, EquityViewport } from './types'
import { equityToY, indexToX, formatEquity, formatPercent, formatTime, getVisiblePoints } from './equityCurveUtils'

// Read CSS variables from document
function getCSSColor(varName: string): string {
  if (typeof document === 'undefined') return 'transparent'
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  
  return value || 'transparent'
}

// Parse CSS color to RGBA using canvas API
function parseColorToRGBA(ctx: CanvasRenderingContext2D, cssColor: string): { r: number; g: number; b: number; a: number } {
  // Let canvas parse any CSS color format (oklch, rgb, hex, etc)
  ctx.fillStyle = cssColor
  const parsed = ctx.fillStyle

  // Canvas always returns rgb/rgba format
  const match = parsed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1
    }
  }

  // Fallback to transparent
  return { r: 0, g: 0, b: 0, a: 0 }
}

// Create RGBA string with alpha
function rgba(color: { r: number; g: number; b: number }, alpha: number): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
}

// Responsive padding based on canvas width
function getPadding(width: number) {
  return {
    top: 20,
    right: Math.max(70, width * 0.08),
    bottom: 40,
    left: Math.max(60, width * 0.08)
  }
}

export class EquityCurveRenderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private chartHeight: number
  private padding: { top: number; right: number; bottom: number; left: number }
  private colors: {
    bg: string
    grid: string
    text: string
    cross: string
    line: string
    tooltipBg: string
    tooltipBorder: string
  }

  constructor(canvas: HTMLCanvasElement) {
    const parent = canvas.parentElement
    if (!parent) throw new Error('Canvas must have parent element')

    const rect = parent.getBoundingClientRect()
    const { ctx, width, height } = this.setupCanvas(canvas, rect.width, rect.height)

    this.ctx = ctx
    this.width = width
    this.height = height
    this.padding = getPadding(width)
    this.chartHeight = height - this.padding.top - this.padding.bottom

    this.colors = this.loadColors()
  }

  private loadColors() {
    return {
      bg: getCSSColor('--background'),
      grid: getCSSColor('--border'),
      text: getCSSColor('--muted-foreground'),
      cross: getCSSColor('--primary'),
      line: getCSSColor('--primary'),
      tooltipBg: getCSSColor('--popover'),
      tooltipBorder: getCSSColor('--border')
    }
  }

  private setupCanvas(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
  ): { ctx: CanvasRenderingContext2D; width: number; height: number } {
    const dpr = window.devicePixelRatio || 1

    canvas.width = width * dpr
    canvas.height = height * dpr

    const ctx = canvas.getContext('2d', { alpha: false })!
    ctx.scale(dpr, dpr)

    return { ctx, width, height }
  }

  public resize(canvas: HTMLCanvasElement) {
    const parent = canvas.parentElement
    if (!parent) return

    const rect = parent.getBoundingClientRect()
    const { ctx, width, height } = this.setupCanvas(canvas, rect.width, rect.height)

    this.ctx = ctx
    this.width = width
    this.height = height
    this.padding = getPadding(width)
    this.chartHeight = height - this.padding.top - this.padding.bottom

    this.colors = this.loadColors()
  }

  public render(
    points: EquityPoint[],
    viewport: EquityViewport,
    mouse: { x: number; y: number } | null
  ) {
    // Clear
    this.ctx.fillStyle = this.colors.bg
    this.ctx.fillRect(0, 0, this.width, this.height)

    // Draw grid
    this.drawGrid(viewport)

    // Draw equity curve
    const visible = getVisiblePoints(points, viewport)
    this.drawEquityCurve(visible, viewport)

    // Draw axes
    this.drawEquityAxis(viewport)
    this.drawTimeAxis(points, viewport)

    // Draw crosshair
    if (mouse) {
      this.drawCrosshair(mouse, points, viewport)
    }
  }

  private drawGrid(viewport: EquityViewport) {
    const { equityMin, equityMax } = viewport
    this.ctx.strokeStyle = this.colors.grid
    this.ctx.lineWidth = 1

    // Horizontal lines
    const equityStep = (equityMax - equityMin) / 5
    for (let i = 0; i <= 5; i++) {
      const equity = equityMin + (equityStep * i)
      const y = equityToY(equity, equityMin, equityMax, this.chartHeight, this.padding.top)

      this.ctx.beginPath()
      this.ctx.moveTo(this.padding.left, y)
      this.ctx.lineTo(this.width - this.padding.right, y)
      this.ctx.stroke()
    }

    // Vertical lines
    const pointWidth = Math.max(1, 3 * viewport.zoom)
    const step = Math.max(1, Math.floor(100 / pointWidth))
    for (let i = viewport.startIdx; i <= viewport.endIdx; i += step) {
      const x = indexToX(i, pointWidth, viewport.offsetX, this.padding.left)
      if (x >= this.padding.left && x <= this.width - this.padding.right) {
        this.ctx.beginPath()
        this.ctx.moveTo(x, this.padding.top)
        this.ctx.lineTo(x, this.height - this.padding.bottom)
        this.ctx.stroke()
      }
    }
  }

  private drawEquityCurve(points: EquityPoint[], viewport: EquityViewport) {
    if (points.length === 0) return

    const { equityMin, equityMax, offsetX } = viewport
    const pointWidth = Math.max(1, 3 * viewport.zoom)

    // Parse primary color from theme (works with oklch, rgb, hex, etc)
    const lineColor = parseColorToRGBA(this.ctx, this.colors.line)

    // Save context and setup clipping region
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(
      this.padding.left,
      this.padding.top,
      this.width - this.padding.left - this.padding.right,
      this.chartHeight
    )
    this.ctx.clip()

    // Build area path
    this.ctx.beginPath()
    points.forEach((point, idx) => {
      const actualIdx = viewport.startIdx + idx
      const x = indexToX(actualIdx, pointWidth, offsetX, this.padding.left)
      const y = equityToY(point.e, equityMin, equityMax, this.chartHeight, this.padding.top)

      if (idx === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    })

    // Complete area path to bottom
    const lastPoint = points[points.length - 1]
    const lastIdx = viewport.startIdx + points.length - 1
    const lastX = indexToX(lastIdx, pointWidth, offsetX, this.padding.left)
    const firstX = indexToX(viewport.startIdx, pointWidth, offsetX, this.padding.left)
    const bottomY = this.height - this.padding.bottom

    this.ctx.lineTo(lastX, bottomY)
    this.ctx.lineTo(firstX, bottomY)
    this.ctx.closePath()

    // Fill area with gradient using theme primary color
    const gradient = this.ctx.createLinearGradient(
      0,
      this.padding.top,
      0,
      this.height - this.padding.bottom
    )
    gradient.addColorStop(0, rgba(lineColor, 0.3))
    gradient.addColorStop(1, rgba(lineColor, 0))

    this.ctx.fillStyle = gradient
    this.ctx.fill()

    // Draw line with theme primary color
    this.ctx.beginPath()
    points.forEach((point, idx) => {
      const actualIdx = viewport.startIdx + idx
      const x = indexToX(actualIdx, pointWidth, offsetX, this.padding.left)
      const y = equityToY(point.e, equityMin, equityMax, this.chartHeight, this.padding.top)

      if (idx === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    })

    this.ctx.strokeStyle = this.colors.line
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    // Restore context
    this.ctx.restore()
  }

  private drawEquityAxis(viewport: EquityViewport) {
    const { equityMin, equityMax } = viewport
    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'

    const equityStep = (equityMax - equityMin) / 5
    for (let i = 0; i <= 5; i++) {
      const equity = equityMin + (equityStep * i)
      const y = equityToY(equity, equityMin, equityMax, this.chartHeight, this.padding.top)

      this.ctx.fillText(
        formatEquity(equity),
        this.width - this.padding.right + 5,
        y
      )
    }
  }

  private drawTimeAxis(points: EquityPoint[], viewport: EquityViewport) {
    const { offsetX, startIdx, endIdx } = viewport
    const pointWidth = Math.max(1, 3 * viewport.zoom)

    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'

    const step = Math.max(1, Math.floor(100 / pointWidth))
    for (let i = startIdx; i <= endIdx; i += step) {
      if (i >= points.length) continue

      const x = indexToX(i, pointWidth, offsetX, this.padding.left)
      const timeStr = formatTime(points[i].t)

      this.ctx.fillText(
        timeStr,
        x,
        this.height - this.padding.bottom + 5
      )
    }
  }

  private drawCrosshair(
    mouse: { x: number; y: number },
    points: EquityPoint[],
    viewport: EquityViewport
  ) {
    const { equityMin, equityMax, offsetX } = viewport
    const pointWidth = Math.max(1, 3 * viewport.zoom)

    // Crosshair lines
    this.ctx.strokeStyle = this.colors.cross
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([4, 4])

    // Vertical
    this.ctx.beginPath()
    this.ctx.moveTo(mouse.x, this.padding.top)
    this.ctx.lineTo(mouse.x, this.height - this.padding.bottom)
    this.ctx.stroke()

    // Horizontal
    this.ctx.beginPath()
    this.ctx.moveTo(this.padding.left, mouse.y)
    this.ctx.lineTo(this.width - this.padding.right, mouse.y)
    this.ctx.stroke()

    this.ctx.setLineDash([])

    // Equity label
    const equity = equityMax - ((mouse.y - this.padding.top) / this.chartHeight) * (equityMax - equityMin)

    this.ctx.fillStyle = this.colors.cross
    this.ctx.fillRect(this.width - this.padding.right, mouse.y - 10, this.padding.right, 20)

    this.ctx.fillStyle = this.colors.bg
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      formatEquity(equity),
      this.width - this.padding.right / 2,
      mouse.y
    )

    // Time label & tooltip
    const pointIdx = Math.floor((mouse.x - this.padding.left - offsetX) / pointWidth)
    if (pointIdx >= 0 && pointIdx < points.length) {
      const timeStr = formatTime(points[pointIdx].t)
      const textWidth = this.ctx.measureText(timeStr).width

      this.ctx.fillStyle = this.colors.cross
      this.ctx.fillRect(mouse.x - textWidth / 2 - 4, this.height - this.padding.bottom, textWidth + 8, 20)

      this.ctx.fillStyle = this.colors.bg
      this.ctx.fillText(
        timeStr,
        mouse.x,
        this.height - this.padding.bottom + 10
      )

      // Tooltip
      const point = points[pointIdx]
      this.drawTooltip(mouse.x, mouse.y, point)
    }
  }

  private drawTooltip(x: number, y: number, point: EquityPoint) {
    const lines = [
      `Equity: ${formatEquity(point.e)}`,
      `Return: ${formatPercent(point.r * 100)}`,
      `Drawdown: ${formatPercent(point.d * 100)}`
    ]

    const padding = 8
    const lineHeight = 16
    const width = 160
    const height = lines.length * lineHeight + padding * 2

    // Position tooltip
    let tooltipX = x + 15
    let tooltipY = y + 15

    if (tooltipX + width > this.width - this.padding.right) {
      tooltipX = x - width - 15
    }
    if (tooltipY + height > this.height - this.padding.bottom) {
      tooltipY = y - height - 15
    }

    // Background
    this.ctx.fillStyle = this.colors.tooltipBg
    this.ctx.fillRect(tooltipX, tooltipY, width, height)

    // Border
    this.ctx.strokeStyle = this.colors.tooltipBorder
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(tooltipX, tooltipY, width, height)

    // Text
    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'

    lines.forEach((line, idx) => {
      this.ctx.fillText(
        line,
        tooltipX + padding,
        tooltipY + padding + (idx * lineHeight)
      )
    })
  }
}
