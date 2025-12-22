import { Candle, Trade, Indicator } from './types'
import { PanelViewport, PanelConfig } from './panelTypes'
import { priceToY, indexToX, formatPrice, formatTime } from './chartUtils'

// Read CSS variables from document
function getCSSColor(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  return value || fallback
}

export interface PanelColors {
  bg: string
  grid: string
  text: string
  cross: string
  up: string
  down: string
  line: string
  tooltipBg: string
  tooltipBorder: string
}

export abstract class PanelRenderer {
  protected ctx: CanvasRenderingContext2D
  protected width: number
  protected height: number
  protected colors: PanelColors

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Failed to get canvas context')

    this.ctx = ctx
    this.width = canvas.width
    this.height = canvas.height

    // Initialize colors from CSS variables
    this.colors = this.getColors()
  }

  // Get colors from CSS variables
  private getColors(): PanelColors {
    return {
      bg: getCSSColor('--background', '#0a0a0a'),
      grid: getCSSColor('--border', '#1a1a1a'),
      text: getCSSColor('--muted-foreground', '#888888'),
      cross: getCSSColor('--primary', '#8b5cf6'),
      up: getCSSColor('--chart-green', '#22c55e'),
      down: getCSSColor('--chart-red', '#ef4444'),
      line: getCSSColor('--primary', '#8b5cf6'),
      tooltipBg: getCSSColor('--popover', '#1a1a1a'),
      tooltipBorder: getCSSColor('--border', '#333333')
    }
  }

  // Update colors from CSS (call before each render)
  protected updateColors() {
    this.colors = this.getColors()
  }

  // Abstract method - each panel type implements its own rendering
  abstract render(
    candles: Candle[],
    viewport: PanelViewport,
    config: PanelConfig,
    mouse: { x: number; y: number } | null
  ): void

  // Shared utilities
  protected clearCanvas() {
    this.ctx.fillStyle = this.colors.bg
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  protected drawGrid(viewport: PanelViewport, yMin: number, yMax: number, padding: any) {
    this.ctx.strokeStyle = this.colors.grid
    this.ctx.lineWidth = 1

    // Horizontal lines
    const yStep = (yMax - yMin) / 5
    for (let i = 0; i <= 5; i++) {
      const value = yMin + (yStep * i)
      const y = this.valueToY(value, yMin, yMax, viewport.panelHeight, padding.top)

      this.ctx.beginPath()
      this.ctx.moveTo(padding.left, y)
      this.ctx.lineTo(this.width - padding.right, y)
      this.ctx.stroke()
    }

    // Vertical lines (time)
    const step = Math.max(1, Math.floor(100 / viewport.candleWidth))
    for (let i = viewport.startIdx; i <= viewport.endIdx; i += step) {
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)
      if (x >= padding.left && x <= this.width - padding.right) {
        this.ctx.beginPath()
        this.ctx.moveTo(x, padding.top)
        this.ctx.lineTo(x, viewport.panelHeight + padding.top)
        this.ctx.stroke()
      }
    }
  }

  protected valueToY(
    value: number,
    yMin: number,
    yMax: number,
    panelHeight: number,
    paddingTop: number
  ): number {
    const range = yMax - yMin
    if (range === 0) return panelHeight / 2 + paddingTop
    return paddingTop + ((yMax - value) / range) * panelHeight
  }

  protected drawYAxis(
    yMin: number,
    yMax: number,
    panelHeight: number,
    padding: any,
    formatFn?: (val: number) => string
  ) {
    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'

    const formatter = formatFn || ((v: number) => v.toFixed(2))

    const yStep = (yMax - yMin) / 5
    for (let i = 0; i <= 5; i++) {
      const value = yMin + (yStep * i)
      const y = this.valueToY(value, yMin, yMax, panelHeight, padding.top)

      this.ctx.fillText(
        formatter(value),
        this.width - padding.right + 5,
        y
      )
    }
  }

  protected drawCrosshair(
    mouse: { x: number; y: number },
    viewport: PanelViewport,
    yMin: number,
    yMax: number,
    padding: any
  ) {
    this.ctx.strokeStyle = this.colors.cross
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([4, 4])

    // ALWAYS draw vertical line (across ALL panels)
    this.ctx.beginPath()
    this.ctx.moveTo(mouse.x, padding.top)
    this.ctx.lineTo(mouse.x, viewport.panelHeight + padding.top)
    this.ctx.stroke()

    // Only draw horizontal line + value label if mouse is WITHIN this panel
    const mouseInPanel = mouse.y >= padding.top && mouse.y <= viewport.panelHeight + padding.top
    if (mouseInPanel) {
      // Horizontal line
      this.ctx.beginPath()
      this.ctx.moveTo(padding.left, mouse.y)
      this.ctx.lineTo(this.width - padding.right, mouse.y)
      this.ctx.stroke()

      this.ctx.setLineDash([])

      // Value label
      const value = yMax - ((mouse.y - padding.top) / viewport.panelHeight) * (yMax - yMin)

      this.ctx.fillStyle = this.colors.cross
      this.ctx.fillRect(this.width - padding.right, mouse.y - 10, padding.right, 20)

      this.ctx.fillStyle = this.colors.bg
      this.ctx.font = '11px monospace'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(
        value.toFixed(2),
        this.width - padding.right / 2,
        mouse.y
      )
    } else {
      this.ctx.setLineDash([])
    }
  }

  protected drawIndicatorLines(
    indicators: Indicator[],
    viewport: PanelViewport,
    yMin: number,
    yMax: number,
    padding: any
  ) {
    const visibleIndicators = indicators.filter(ind => ind.visible)

    // Save context and setup clipping
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(
      padding.left,
      padding.top,
      this.width - padding.left - padding.right,
      viewport.panelHeight
    )
    this.ctx.clip()

    visibleIndicators.forEach(indicator => {
      if (indicator.points.length === 0) return

      this.ctx.strokeStyle = indicator.color
      this.ctx.lineWidth = 2
      this.ctx.beginPath()

      let firstPoint = true

      for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
        if (i >= indicator.points.length) break

        const point = indicator.points[i]
        const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)
        const y = this.valueToY(point.v, yMin, yMax, viewport.panelHeight, padding.top)

        if (!isFinite(y)) continue

        if (firstPoint) {
          this.ctx.moveTo(x, y)
          firstPoint = false
        } else {
          this.ctx.lineTo(x, y)
        }
      }

      this.ctx.stroke()
    })

    this.ctx.restore()
  }
}
