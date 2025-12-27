import { parse, formatRgb } from 'culori'
import { DrawdownPoint, DrawdownViewport } from './types'
import { drawdownToY, indexToX, formatDrawdown, formatTime, getVisiblePoints } from './drawdownChartUtils'

// Read CSS variables from document and convert to RGB
function getCSSColorAsRGB(varName: string): string {
  if (typeof document === 'undefined') return 'rgb(0, 0, 0)'

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()

  if (!value) return 'rgb(0, 0, 0)'

  // Parse color (supports oklch, rgb, hex, etc) and convert to RGB
  const parsed = parse(value)
  return parsed ? formatRgb(parsed) : 'rgb(0, 0, 0)'
}

// Parse RGB/RGBA color string to components
function parseColorToRGBA(colorStr: string): { r: number; g: number; b: number; a: number } {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1
    }
  }

  return { r: 0, g: 0, b: 0, a: 1 }
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

export class DrawdownChartRenderer {
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
      bg: getCSSColorAsRGB('--background'),
      grid: getCSSColorAsRGB('--border'),
      text: getCSSColorAsRGB('--muted-foreground'),
      cross: getCSSColorAsRGB('--destructive'),
      line: getCSSColorAsRGB('--destructive'),
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
    points: DrawdownPoint[],
    viewport: DrawdownViewport,
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

    // Draw drawdown curve
    const visible = getVisiblePoints(points, viewport)
    this.drawDrawdownCurve(visible, viewport)

    // Draw axes
    this.drawDrawdownAxis(viewport)
    this.drawTimeAxis(points, viewport)

    // Draw crosshair
    if (mouse) {
      this.drawCrosshair(mouse, points, viewport)
    }
  }

  private drawGrid(viewport: DrawdownViewport) {
    const { drawdownMin, drawdownMax } = viewport
    this.ctx.strokeStyle = this.colors.grid
    this.ctx.lineWidth = 1

    // Horizontal lines
    const drawdownStep = (drawdownMax - drawdownMin) / 5
    for (let i = 0; i <= 5; i++) {
      const drawdown = drawdownMin + (drawdownStep * i)
      const y = drawdownToY(drawdown, drawdownMin, drawdownMax, this.height)

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

  private drawDrawdownCurve(points: DrawdownPoint[], viewport: DrawdownViewport) {
    if (points.length === 0) return

    const { drawdownMin, drawdownMax } = viewport

    // Parse destructive color
    const lineColor = parseColorToRGBA(this.colors.line)

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

    // Calculate zero line Y position
    const zeroY = drawdownToY(0, drawdownMin, drawdownMax, this.height)

    // Build area path
    this.ctx.beginPath()
    points.forEach((point, idx) => {
      const x = indexToX(idx, points.length, this.width)
      const y = drawdownToY(point.d, drawdownMin, drawdownMax, this.height)

      if (idx === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    })

    // Complete area path to zero line
    const lastX = indexToX(points.length - 1, points.length, this.width)
    const firstX = indexToX(0, points.length, this.width)

    this.ctx.lineTo(lastX, zeroY)
    this.ctx.lineTo(firstX, zeroY)
    this.ctx.closePath()

    // Fill area with gradient from zero line to drawdown
    const gradient = this.ctx.createLinearGradient(0, zeroY, 0, this.height - this.padding.bottom)
    gradient.addColorStop(0, rgba(lineColor, 0.3))
    gradient.addColorStop(1, rgba(lineColor, 0))

    this.ctx.fillStyle = gradient
    this.ctx.fill()

    // Draw line
    this.ctx.beginPath()
    points.forEach((point, idx) => {
      const x = indexToX(idx, points.length, this.width)
      const y = drawdownToY(point.d, drawdownMin, drawdownMax, this.height)

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

  private drawDrawdownAxis(viewport: DrawdownViewport) {
    const { drawdownMin, drawdownMax } = viewport
    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'

    const drawdownStep = (drawdownMax - drawdownMin) / 5
    for (let i = 0; i <= 5; i++) {
      const drawdown = drawdownMin + (drawdownStep * i)
      const y = drawdownToY(drawdown, drawdownMin, drawdownMax, this.height)

      this.ctx.fillText(
        formatDrawdown(drawdown),
        this.width - this.padding.right + 5,
        y
      )
    }
  }

  private drawTimeAxis(points: DrawdownPoint[], viewport: DrawdownViewport) {
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
    points: DrawdownPoint[],
    viewport: DrawdownViewport
  ) {
    const { drawdownMin, drawdownMax } = viewport

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

    // Drawdown label
    const drawdown = drawdownMax - ((mouse.y - this.padding.top) / this.chartHeight) * (drawdownMax - drawdownMin)

    this.ctx.fillStyle = this.colors.cross
    this.ctx.fillRect(this.width - this.padding.right, mouse.y - 10, this.padding.right, 20)

    this.ctx.fillStyle = this.colors.bg
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      formatDrawdown(drawdown),
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

  private drawTooltip(x: number, y: number, point: DrawdownPoint) {
    const lines = [
      `Time: ${formatTime(point.t)}`,
      `Drawdown: ${formatDrawdown(point.d)}`
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
