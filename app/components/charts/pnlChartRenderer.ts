import { parse, formatRgb } from 'culori'
import { PnLPoint, PnLViewport } from './types'
import { pnlToY, indexToX, formatPnL, formatTime, getVisiblePoints } from './pnlChartUtils'

// Read CSS variables from document and convert to RGB
function getCSSColorAsRGB(varName: string): string {
  if (typeof document === 'undefined') return 'rgb(0, 0, 0)'

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()

  if (!value) return 'rgb(0, 0, 0)'

  const parsed = parse(value)
  return parsed ? formatRgb(parsed) : 'rgb(0, 0, 0)'
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

export class PnLChartRenderer {
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
    zeroLine: string
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
      bg: getCSSColorAsRGB('--background'),
      grid: getCSSColorAsRGB('--border'),
      text: getCSSColorAsRGB('--muted-foreground'),
      cross: getCSSColorAsRGB('--primary'),
      line: 'rgb(139, 92, 246)', // Purple #8b5cf6
      zeroLine: getCSSColorAsRGB('--muted-foreground'),
      tooltipBg: getCSSColorAsRGB('--popover'),
      tooltipBorder: getCSSColorAsRGB('--border')
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
    points: PnLPoint[],
    viewport: PnLViewport,
    mouse: { x: number; y: number } | null
  ) {
    // Clear
    this.ctx.fillStyle = this.colors.bg
    this.ctx.fillRect(0, 0, this.width, this.height)

    if (points.length === 0) {
      this.ctx.fillStyle = this.colors.text
      this.ctx.font = '14px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText('No data available', this.width / 2, this.height / 2)
      return
    }

    // Draw grid
    this.drawGrid(viewport)

    // Draw zero line
    this.drawZeroLine(viewport)

    // Draw PnL curve
    const visible = getVisiblePoints(points, viewport)
    this.drawPnLCurve(visible, viewport)

    // Draw axes
    this.drawPnLAxis(viewport)
    this.drawTimeAxis(points, viewport)

    // Draw crosshair
    if (mouse) {
      this.drawCrosshair(mouse, points, viewport)
    }
  }

  private drawGrid(viewport: PnLViewport) {
    const { pnlMin, pnlMax } = viewport
    this.ctx.strokeStyle = this.colors.grid
    this.ctx.lineWidth = 1

    // Horizontal lines
    const pnlStep = (pnlMax - pnlMin) / 5
    for (let i = 0; i <= 5; i++) {
      const pnl = pnlMin + (pnlStep * i)
      const y = pnlToY(pnl, pnlMin, pnlMax, this.height)

      this.ctx.beginPath()
      this.ctx.moveTo(this.padding.left, y)
      this.ctx.lineTo(this.width - this.padding.right, y)
      this.ctx.stroke()
    }

    // Vertical lines
    const visiblePoints = viewport.endIdx - viewport.startIdx + 1
    const step = Math.max(1, Math.floor(visiblePoints / 6))

    for (let i = 0; i <= 6; i++) {
      const idx = viewport.startIdx + Math.floor((visiblePoints * i) / 6)
      if (idx <= viewport.endIdx) {
        const x = indexToX(i, 6, this.width)

        this.ctx.beginPath()
        this.ctx.moveTo(x, this.padding.top)
        this.ctx.lineTo(x, this.height - this.padding.bottom)
        this.ctx.stroke()
      }
    }
  }

  private drawZeroLine(viewport: PnLViewport) {
    const { pnlMin, pnlMax } = viewport
    
    // Only draw zero line if it's in view
    if (pnlMin > 0 || pnlMax < 0) return

    const y = pnlToY(0, pnlMin, pnlMax, this.height)

    this.ctx.strokeStyle = this.colors.zeroLine
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([4, 4])

    this.ctx.beginPath()
    this.ctx.moveTo(this.padding.left, y)
    this.ctx.lineTo(this.width - this.padding.right, y)
    this.ctx.stroke()

    this.ctx.setLineDash([])
  }

  private drawPnLCurve(points: PnLPoint[], viewport: PnLViewport) {
    if (points.length === 0) return

    const { pnlMin, pnlMax } = viewport

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

    // Draw line
    this.ctx.beginPath()
    points.forEach((point, idx) => {
      const x = indexToX(idx, points.length, this.width)
      const y = pnlToY(point.p, pnlMin, pnlMax, this.height)

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

  private drawPnLAxis(viewport: PnLViewport) {
    const { pnlMin, pnlMax } = viewport
    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'

    const pnlStep = (pnlMax - pnlMin) / 5
    for (let i = 0; i <= 5; i++) {
      const pnl = pnlMin + (pnlStep * i)
      const y = pnlToY(pnl, pnlMin, pnlMax, this.height)

      this.ctx.fillText(
        formatPnL(pnl),
        this.width - this.padding.right + 5,
        y
      )
    }
  }

  private drawTimeAxis(points: PnLPoint[], viewport: PnLViewport) {
    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'

    const visiblePoints = getVisiblePoints(points, viewport)
    const step = Math.max(1, Math.floor(visiblePoints.length / 6))

    for (let i = 0; i <= 6; i++) {
      const idx = Math.floor((visiblePoints.length - 1) * i / 6)
      if (idx < visiblePoints.length) {
        const point = visiblePoints[idx]
        const x = indexToX(i, 6, this.width)
        const timeStr = formatTime(point.t)

        this.ctx.fillText(timeStr, x, this.height - this.padding.bottom + 5)
      }
    }
  }

  private drawCrosshair(
    mouse: { x: number; y: number },
    points: PnLPoint[],
    viewport: PnLViewport
  ) {
    const { pnlMin, pnlMax } = viewport

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

    // PnL label
    const pnl = pnlMax - ((mouse.y - this.padding.top) / this.chartHeight) * (pnlMax - pnlMin)

    this.ctx.fillStyle = this.colors.cross
    this.ctx.fillRect(this.width - this.padding.right, mouse.y - 10, this.padding.right, 20)

    this.ctx.fillStyle = this.colors.bg
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      formatPnL(pnl),
      this.width - this.padding.right / 2,
      mouse.y
    )

    // Find closest point
    const visiblePoints = getVisiblePoints(points, viewport)
    const chartWidth = this.width - this.padding.left - this.padding.right
    const relativeX = mouse.x - this.padding.left
    const ratio = relativeX / chartWidth
    const pointIdx = Math.floor(ratio * (visiblePoints.length - 1))

    if (pointIdx >= 0 && pointIdx < visiblePoints.length) {
      const point = visiblePoints[pointIdx]
      const timeStr = formatTime(point.t)
      const textWidth = this.ctx.measureText(timeStr).width

      this.ctx.fillStyle = this.colors.cross
      this.ctx.fillRect(mouse.x - textWidth / 2 - 4, this.height - this.padding.bottom, textWidth + 8, 20)

      this.ctx.fillStyle = this.colors.bg
      this.ctx.fillText(timeStr, mouse.x, this.height - this.padding.bottom + 10)

      // Tooltip
      this.drawTooltip(mouse.x, mouse.y, point)
    }
  }

  private drawTooltip(x: number, y: number, point: PnLPoint) {
    const lines = [
      `Time: ${formatTime(point.t)}`,
      `PnL: ${formatPnL(point.p)}`
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
    this.ctx.font = '11px monospace'
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
