import { Candle, Trade, Viewport, Mode } from './types'
import { priceToY, indexToX, formatPrice, formatTime, getVisibleCandles } from './chartUtils'

const COLORS = {
  bg: '#0a0a0a',
  grid: '#1a1a1a',
  text: '#888888',
  cross: '#8b5cf6',
  up: '#22c55e',
  down: '#ef4444',
  line: '#8b5cf6',
  buy: '#22c55e',
  sell: '#ef4444'
}

const PADDING = { top: 10, right: 60, bottom: 30, left: 10 }

export class ChartRenderer {
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private chartHeight: number
  
  constructor(canvas: HTMLCanvasElement) {
    this.ctx = this.setupCanvas(canvas)
    this.width = canvas.width
    this.height = canvas.height
    this.chartHeight = this.height - PADDING.top - PADDING.bottom
  }
  
  private setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    this.width = rect.width
    this.height = rect.height
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    
    const ctx = canvas.getContext('2d', { alpha: false })!  // alpha: false = faster
    ctx.scale(dpr, dpr)
    return ctx
  }
  
  public resize(canvas: HTMLCanvasElement) {
    this.ctx = this.setupCanvas(canvas)
  }
  
  public render(
    candles: Candle[],
    trades: Trade[],
    viewport: Viewport,
    mode: Mode,
    mouse: { x: number; y: number } | null
  ) {
    // Clear (optimized - single fillRect)
    this.ctx.fillStyle = COLORS.bg
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // Draw grid
    this.drawGrid(viewport)
    
    // Draw candles/line (viewport culled)
    const visible = getVisibleCandles(candles, viewport)
    
    if (mode === 'C') {
      this.drawCandles(visible, viewport)
    } else {
      this.drawLine(visible, viewport)
    }
    
    // Draw trades (only visible ones)
    this.drawTrades(trades, viewport)
    
    // Draw axes
    this.drawPriceAxis(viewport)
    this.drawTimeAxis(candles, viewport)
    
    // Draw crosshair (if mouse present)
    if (mouse) {
      this.drawCrosshair(mouse, candles, viewport)
    }
  }
  
  private drawGrid(viewport: Viewport) {
    const { priceMin, priceMax } = viewport
    this.ctx.strokeStyle = COLORS.grid
    this.ctx.lineWidth = 1
    
    // Horizontal lines (5 lines)
    const priceStep = (priceMax - priceMin) / 5
    for (let i = 0; i <= 5; i++) {
      const price = priceMin + (priceStep * i)
      const y = priceToY(price, priceMin, priceMax, this.chartHeight, PADDING.top)
      
      this.ctx.beginPath()
      this.ctx.moveTo(PADDING.left, y)
      this.ctx.lineTo(this.width - PADDING.right, y)
      this.ctx.stroke()
    }
    
    // Vertical lines (time grid) - every ~100px
    const step = Math.max(1, Math.floor(100 / viewport.candleWidth))
    for (let i = viewport.startIdx; i <= viewport.endIdx; i += step) {
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, PADDING.left)
      if (x >= PADDING.left && x <= this.width - PADDING.right) {
        this.ctx.beginPath()
        this.ctx.moveTo(x, PADDING.top)
        this.ctx.lineTo(x, this.height - PADDING.bottom)
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
      const x = indexToX(actualIdx, candleWidth, offsetX, PADDING.left)
      
      if (x < PADDING.left || x > this.width - PADDING.right) return
      
      const isUp = candle.c >= candle.o
      const color = isUp ? COLORS.up : COLORS.down
      
      const yHigh = priceToY(candle.h, priceMin, priceMax, this.chartHeight, PADDING.top)
      const yLow = priceToY(candle.l, priceMin, priceMax, this.chartHeight, PADDING.top)
      const yOpen = priceToY(candle.o, priceMin, priceMax, this.chartHeight, PADDING.top)
      const yClose = priceToY(candle.c, priceMin, priceMax, this.chartHeight, PADDING.top)
      
      // Wick (optimized - single path)
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
    
    this.ctx.strokeStyle = COLORS.line
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    
    candles.forEach((candle, idx) => {
      const actualIdx = viewport.startIdx + idx
      const x = indexToX(actualIdx, candleWidth, offsetX, PADDING.left)
      const y = priceToY(candle.c, priceMin, priceMax, this.chartHeight, PADDING.top)
      
      if (idx === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    })
    
    this.ctx.stroke()
  }
  
  private drawTrades(trades: Trade[], viewport: Viewport) {
    const { priceMin, priceMax, candleWidth, offsetX, startIdx, endIdx } = viewport
    const markerSize = 8
    
    trades.forEach(trade => {
      // Binary search would be more optimal here for many trades
      // For now, simple filter
      const idx = trade.t  // Assuming trade.t is already index
      
      if (idx < startIdx || idx > endIdx) return
      
      const x = indexToX(idx, candleWidth, offsetX, PADDING.left)
      const y = priceToY(trade.p, priceMin, priceMax, this.chartHeight, PADDING.top)
      
      const color = trade.s === 'B' ? COLORS.buy : COLORS.sell
      const yOffset = trade.s === 'B' ? markerSize : -markerSize
      
      // Triangle marker (optimized path)
      this.ctx.fillStyle = color
      this.ctx.beginPath()
      
      if (trade.s === 'B') {
        // Up arrow
        this.ctx.moveTo(x, y - yOffset)
        this.ctx.lineTo(x - markerSize / 2, y)
        this.ctx.lineTo(x + markerSize / 2, y)
      } else {
        // Down arrow
        this.ctx.moveTo(x, y - yOffset)
        this.ctx.lineTo(x - markerSize / 2, y)
        this.ctx.lineTo(x + markerSize / 2, y)
      }
      
      this.ctx.closePath()
      this.ctx.fill()
    })
  }
  
  private drawPriceAxis(viewport: Viewport) {
    const { priceMin, priceMax } = viewport
    this.ctx.fillStyle = COLORS.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'
    
    const priceStep = (priceMax - priceMin) / 5
    for (let i = 0; i <= 5; i++) {
      const price = priceMin + (priceStep * i)
      const y = priceToY(price, priceMin, priceMax, this.chartHeight, PADDING.top)
      
      this.ctx.fillText(
        `$${formatPrice(price)}`,
        this.width - PADDING.right + 5,
        y
      )
    }
  }
  
  private drawTimeAxis(candles: Candle[], viewport: Viewport) {
    const { candleWidth, offsetX, startIdx, endIdx } = viewport
    
    this.ctx.fillStyle = COLORS.text
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    
    const step = Math.max(1, Math.floor(100 / candleWidth))
    for (let i = startIdx; i <= endIdx; i += step) {
      if (i >= candles.length) continue
      
      const x = indexToX(i, candleWidth, offsetX, PADDING.left)
      const timeStr = formatTime(candles[i].t)
      
      this.ctx.fillText(
        timeStr,
        x,
        this.height - PADDING.bottom + 5
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
    this.ctx.strokeStyle = COLORS.cross
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([4, 4])
    
    // Vertical
    this.ctx.beginPath()
    this.ctx.moveTo(mouse.x, PADDING.top)
    this.ctx.lineTo(mouse.x, this.height - PADDING.bottom)
    this.ctx.stroke()
    
    // Horizontal
    this.ctx.beginPath()
    this.ctx.moveTo(PADDING.left, mouse.y)
    this.ctx.lineTo(this.width - PADDING.right, mouse.y)
    this.ctx.stroke()
    
    this.ctx.setLineDash([])
    
    // Price label
    const price = priceMax - ((mouse.y - PADDING.top) / this.chartHeight) * (priceMax - priceMin)
    
    this.ctx.fillStyle = COLORS.cross
    this.ctx.fillRect(this.width - PADDING.right, mouse.y - 10, PADDING.right, 20)
    
    this.ctx.fillStyle = '#000'
    this.ctx.font = '11px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(
      `$${formatPrice(price)}`,
      this.width - PADDING.right / 2,
      mouse.y
    )
    
    // Time label
    const candleIdx = Math.floor((mouse.x - PADDING.left - offsetX) / candleWidth)
    if (candleIdx >= 0 && candleIdx < candles.length) {
      const timeStr = formatTime(candles[candleIdx].t)
      const textWidth = this.ctx.measureText(timeStr).width
      
      this.ctx.fillStyle = COLORS.cross
      this.ctx.fillRect(mouse.x - textWidth / 2 - 4, this.height - PADDING.bottom, textWidth + 8, 20)
      
      this.ctx.fillStyle = '#000'
      this.ctx.fillText(
        timeStr,
        mouse.x,
        this.height - PADDING.bottom + 10
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
    
    // Position tooltip (avoid edges)
    let tooltipX = x + 15
    let tooltipY = y + 15
    
    if (tooltipX + width > this.width - PADDING.right) {
      tooltipX = x - width - 15
    }
    if (tooltipY + height > this.height - PADDING.bottom) {
      tooltipY = y - height - 15
    }
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    this.ctx.fillRect(tooltipX, tooltipY, width, height)
    
    // Border
    this.ctx.strokeStyle = COLORS.cross
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(tooltipX, tooltipY, width, height)
    
    // Text
    this.ctx.fillStyle = COLORS.text
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
