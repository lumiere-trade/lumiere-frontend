import { Candle, Trade, Viewport, Mode } from './types'
import { priceToY, indexToX, formatPrice, formatTime, getVisibleCandles } from './chartUtils'

// Read CSS variables from document
function getCSSColor(varName: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()
  return value || fallback
}

// Responsive padding based on canvas width
function getPadding(width: number) {
  return {
    top: 20,
    right: Math.max(70, width * 0.08),
    bottom: 40,
    left: Math.max(15, width * 0.02)
  }
}

export class ChartRenderer {
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
    up: string
    down: string
    line: string
    buy: string
    sell: string
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

    // Initialize colors from CSS variables
    this.colors = {
      bg: getCSSColor('--background', '#0a0a0a'),
      grid: getCSSColor('--border', '#1a1a1a'),
      text: getCSSColor('--muted-foreground', '#888888'),
      cross: getCSSColor('--primary', '#8b5cf6'),
      up: getCSSColor('--chart-green', '#22c55e'),
      down: getCSSColor('--chart-red', '#ef4444'),
      line: getCSSColor('--primary', '#8b5cf6'),
      buy: getCSSColor('--chart-green', '#22c55e'),
      sell: getCSSColor('--chart-red', '#ef4444'),
      tooltipBg: getCSSColor('--popover', '#1a1a1a'),
      tooltipBorder: getCSSColor('--border', '#333333')
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

    // Refresh colors on resize (in case theme changed)
    this.colors = {
      bg: getCSSColor('--background', '#0a0a0a'),
      grid: getCSSColor('--border', '#1a1a1a'),
      text: getCSSColor('--muted-foreground', '#888888'),
      cross: getCSSColor('--primary', '#8b5cf6'),
      up: getCSSColor('--chart-green', '#22c55e'),
      down: getCSSColor('--chart-red', '#ef4444'),
      line: getCSSColor('--primary', '#8b5cf6'),
      buy: getCSSColor('--chart-green', '#22c55e'),
      sell: getCSSColor('--chart-red', '#ef4444'),
      tooltipBg: getCSSColor('--popover', '#1a1a1a'),
      tooltipBorder: getCSSColor('--border', '#333333')
    }
  }

  public render(
    candles: Candle[],
    trades: Trade[],
    viewport: Viewport,
    mode: Mode,
    mouse: { x: number; y: number } | null
  ) {
    // Clear
    this.ctx.fillStyle = this.colors.bg
    this.ctx.fillRect(0, 0, this.width, this.height)

    // Draw grid
    this.drawGrid(viewport)

    // Draw candles/line
    const visible = getVisibleCandles(candles, viewport)

    if (mode === 'C') {
      this.drawCandles(visible, viewport)
    } else {
      this.drawLine(visible, viewport)
    }

    // Draw trades
    this.drawTrades(trades, viewport)

    // Draw axes
    this.drawPriceAxis(viewport)
    this.drawTimeAxis(candles, viewport)

    // Draw crosshair
    if (mouse) {
      this.drawCrosshair(mouse, candles, viewport)
    }
  }

  private drawGrid(viewport: Viewport) {
    const { priceMin, priceMax } = viewport
    this.ctx.strokeStyle = this.colors.grid
    this.ctx.lineWidth = 1

    // Horizontal lines
    const priceStep = (priceMax - priceMin) / 5
    for (let i = 0; i <= 5; i++) {
      const price = priceMin + (priceStep * i)
      const y = priceToY(price, priceMin, priceMax, this.chartHeight, this.padding.top)

      this.ctx.beginPath()
      this.ctx.moveTo(this.padding.left, y)
      this.ctx.lineTo(this.width - this.padding.right, y)
      this.ctx.stroke()
    }

    // Vertical lines
    const step = Math.max(1, Math.floor(100 / viewport.candleWidth))
    for (let i = viewport.startIdx; i <= viewport.endIdx; i += step) {
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, this.padding.left)
      if (x >= this.padding.left && x <= this.width - this.padding.right) {
        this.ctx.beginPath()
        this.ctx.moveTo(x, this.padding.top)
        this.ctx.lineTo(x, this.height - this.padding.bottom)
        this.ctx.stroke()
      }
    }
  }

  private drawCandles(candles: Candle[], viewport: Viewport) {
    const { priceMin, priceMax, candleWidth, offsetX } = viewport
    const wickWidth = Math.max(1, candleWidth * 0.1)
    const bodyWidth = Math.max(2, candleWidth * 0.8)

    candles.forEach((candle, idx) => {
      const actualIdx = viewport.startIdx + idx
      const x = indexToX(actualIdx, candleWidth, offsetX, this.padding.left)

      if (x < this.padding.left || x > this.width - this.padding.right) return

      const isUp = candle.c >= candle.o
      const color = isUp ? this.colors.up : this.colors.down

      const yHigh = priceToY(candle.h, priceMin, priceMax, this.chartHeight, this.padding.top)
      const yLow = priceToY(candle.l, priceMin, priceMax, this.chartHeight, this.padding.top)
      const yOpen = priceToY(candle.o, priceMin, priceMax, this.chartHeight, this.padding.top)
      const yClose = priceToY(candle.c, priceMin, priceMax, this.chartHeight, this.padding.top)

      // Wick
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = wickWidth
      this.ctx.beginPath()
      this.ctx.moveTo(x, yHigh)
      this.ctx.lineTo(x, yLow)
      this.ctx.stroke()

      // Body
      const bodyY = Math.min(yOpen, yClose)
      const bodyHeight = Math.max(1, Math.abs(yClose - yOpen))

      this.ctx.fillStyle = color
      this.ctx.fillRect(
        x - bodyWidth / 2,
        bodyY,
        bodyWidth,
        bodyHeight
      )
    })
  }

  private drawLine(candles: Candle[], viewport: Viewport) {
    if (candles.length === 0) return

    const { priceMin, priceMax, candleWidth, offsetX } = viewport

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
    this.ctx.strokeStyle = this.colors.line
    this.ctx.lineWidth = 2
    this.ctx.beginPath()

    candles.forEach((candle, idx) => {
      const actualIdx = viewport.startIdx + idx
      const x = indexToX(actualIdx, candleWidth, offsetX, this.padding.left)
      const y = priceToY(candle.c, priceMin, priceMax, this.chartHeight, this.padding.top)

      if (idx === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    })

    this.ctx.stroke()

    // Restore context (remove clipping)
    this.ctx.restore()
  }

  private drawTrades(trades: Trade[], viewport: Viewport) {
    const { priceMin, priceMax, candleWidth, offsetX, startIdx, endIdx } = viewport
    const markerSize = 8
    const markerOffset = 15

    trades.forEach(trade => {
      const idx = trade.t

      if (idx < startIdx || idx > endIdx) return

      const x = indexToX(idx, candleWidth, offsetX, this.padding.left)
      const yPrice = priceToY(trade.p, priceMin, priceMax, this.chartHeight, this.padding.top)

      const color = trade.s === 'B' ? this.colors.buy : this.colors.sell
      
      // Position markers below for BUY, above for SELL (away from line)
      const y = trade.s === 'B' ? yPrice + markerOffset : yPrice - markerOffset

      // Triangle marker
      this.ctx.fillStyle = color
      this.ctx.beginPath()

      if (trade.s === 'B') {
        // Up arrow for BUY (below line)
        this.ctx.moveTo(x, y - markerSize)
        this.ctx.lineTo(x - markerSize / 2, y)
        this.ctx.lineTo(x + markerSize / 2, y)
      } else {
        // Down arrow for SELL (above line)
        this.ctx.moveTo(x, y + markerSize)
        this.ctx.lineTo(x - markerSize / 2, y)
        this.ctx.lineTo(x + markerSize / 2, y)
      }

      this.ctx.closePath()
      this.ctx.fill()
    })
  }

  private drawPriceAxis(viewport: Viewport) {
    const { priceMin, priceMax } = viewport
    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'

    const priceStep = (priceMax - priceMin) / 5
    for (let i = 0; i <= 5; i++) {
      const price = priceMin + (priceStep * i)
      const y = priceToY(price, priceMin, priceMax, this.chartHeight, this.padding.top)

      this.ctx.fillText(
        `$${formatPrice(price)}`,
        this.width - this.padding.right + 5,
        y
      )
    }
  }

  private drawTimeAxis(candles: Candle[], viewport: Viewport) {
    const { candleWidth, offsetX, startIdx, endIdx } = viewport

    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'

    const step = Math.max(1, Math.floor(100 / candleWidth))
    for (let i = startIdx; i <= endIdx; i += step) {
      if (i >= candles.length) continue

      const x = indexToX(i, candleWidth, offsetX, this.padding.left)
      const timeStr = formatTime(candles[i].t)

      this.ctx.fillText(
        timeStr,
        x,
        this.height - this.padding.bottom + 5
      )
    }
  }

  private drawCrosshair(
    mouse: { x: number; y: number },
    candles: Candle[],
    viewport: Viewport
  ) {
    const { priceMin, priceMax, candleWidth, offsetX } = viewport

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

    // Price label
    const price = priceMax - ((mouse.y - this.padding.top) / this.chartHeight) * (priceMax - priceMin)

    this.ctx.fillStyle = this.colors.cross
    this.ctx.fillRect(this.width - this.padding.right, mouse.y - 10, this.padding.right, 20)

    this.ctx.fillStyle = this.colors.bg
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      `$${formatPrice(price)}`,
      this.width - this.padding.right / 2,
      mouse.y
    )

    // Time label
    const candleIdx = Math.floor((mouse.x - this.padding.left - offsetX) / candleWidth)
    if (candleIdx >= 0 && candleIdx < candles.length) {
      const timeStr = formatTime(candles[candleIdx].t)
      const textWidth = this.ctx.measureText(timeStr).width

      this.ctx.fillStyle = this.colors.cross
      this.ctx.fillRect(mouse.x - textWidth / 2 - 4, this.height - this.padding.bottom, textWidth + 8, 20)

      this.ctx.fillStyle = this.colors.bg
      this.ctx.fillText(
        timeStr,
        mouse.x,
        this.height - this.padding.bottom + 10
      )

      // Tooltip with OHLC
      const candle = candles[candleIdx]
      this.drawTooltip(mouse.x, mouse.y, candle)
    }
  }

  private drawTooltip(x: number, y: number, candle: Candle) {
    const lines = [
      `O: $${formatPrice(candle.o)}`,
      `H: $${formatPrice(candle.h)}`,
      `L: $${formatPrice(candle.l)}`,
      `C: $${formatPrice(candle.c)}`
    ]

    const padding = 8
    const lineHeight = 16
    const width = 120
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

    // Background with CSS variable
    this.ctx.fillStyle = this.colors.tooltipBg
    this.ctx.fillRect(tooltipX, tooltipY, width, height)

    // Border with CSS variable
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
