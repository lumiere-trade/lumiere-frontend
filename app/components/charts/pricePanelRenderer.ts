import { Candle, Trade, Indicator } from './types'
import { PanelViewport, PanelConfig } from './panelTypes'
import { PanelRenderer } from './panelRenderer'
import { priceToY, indexToX } from './chartUtils'

function getPadding(width: number) {
  return {
    top: 30,
    right: Math.max(70, width * 0.08),
    bottom: 5,
    left: Math.max(15, width * 0.02)
  }
}

export class PricePanelRenderer extends PanelRenderer {
  render(
    candles: Candle[],
    viewport: PanelViewport,
    config: PanelConfig,
    mouse: { x: number; y: number } | null
  ) {
    // Update colors for theme changes
    this.updateColors()
    
    const padding = getPadding(this.width)
    this.clearCanvas()

    // Calculate price range
    let priceMin = Infinity
    let priceMax = -Infinity

    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i < candles.length) {
        const candle = candles[i]
        priceMin = Math.min(priceMin, candle.l)
        priceMax = Math.max(priceMax, candle.h)
      }
    }

    const priceRange = priceMax - priceMin
    priceMin -= priceRange * 0.05
    priceMax += priceRange * 0.05

    // Draw grid
    if (config.showGrid) {
      this.drawGrid(viewport, priceMin, priceMax, padding)
    }

    // Draw candles
    this.drawCandles(candles, viewport, priceMin, priceMax, padding)

    // Draw indicator lines
    this.drawIndicatorLines(config.indicators, viewport, priceMin, priceMax, padding)

    // Draw Y-axis
    this.drawYAxis(priceMin, priceMax, viewport.panelHeight, padding)

    // Draw X-axis with dates
    // this.drawXAxis(candles, viewport, padding) - Moved to DateAxisStrip

    // Draw crosshair
    if (mouse) {
      this.drawCrosshair(mouse, viewport, priceMin, priceMax, padding)
    }
  }

  private drawCandles(
    candles: Candle[],
    viewport: PanelViewport,
    priceMin: number,
    priceMax: number,
    padding: any
  ) {
    const bodyWidth = Math.max(1, viewport.candleWidth * 0.8)
    const wickWidth = Math.max(1, viewport.candleWidth * 0.1)

    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i >= candles.length) break

      const candle = candles[i]
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)

      if (x < padding.left || x > this.width - padding.right) continue

      const isUp = candle.c >= candle.o
      const color = isUp ? this.colors.up : this.colors.down

      const yHigh = priceToY(candle.h, priceMin, priceMax, viewport.panelHeight, padding.top)
      const yLow = priceToY(candle.l, priceMin, priceMax, viewport.panelHeight, padding.top)
      const yOpen = priceToY(candle.o, priceMin, priceMax, viewport.panelHeight, padding.top)
      const yClose = priceToY(candle.c, priceMin, priceMax, viewport.panelHeight, padding.top)

      // Draw wick
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = wickWidth
      this.ctx.beginPath()
      this.ctx.moveTo(x, yHigh)
      this.ctx.lineTo(x, yLow)
      this.ctx.stroke()

      // Draw body
      const bodyHeight = Math.abs(yClose - yOpen)
      const bodyY = Math.min(yOpen, yClose)

      this.ctx.fillStyle = color
      this.ctx.fillRect(
        x - bodyWidth / 2,
        bodyY,
        bodyWidth,
        Math.max(1, bodyHeight)
      )
    }
  }

  private drawXAxis(
    candles: Candle[],
    viewport: PanelViewport,
    padding: any
  ) {
    this.ctx.fillStyle = this.colors.text
    this.ctx.font = '10px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'

    // Draw date labels at intervals
    const step = Math.max(1, Math.floor(100 / viewport.candleWidth))
    
    // Position dates below the chart (at actual canvas bottom)
    const yPosition = padding.top + viewport.panelHeight + 10

    for (let i = viewport.startIdx; i <= viewport.endIdx; i += step) {
      if (i >= candles.length) break

      const candle = candles[i]
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)

      if (x < padding.left || x > this.width - padding.right) continue

      // Format timestamp to date
      const date = new Date(candle.t * 1000)
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

      this.ctx.fillText(dateStr, x, yPosition)
    }
  }
}
