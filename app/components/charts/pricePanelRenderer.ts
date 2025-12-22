import { Candle, Trade, Mode } from './types'
import { PanelViewport, PanelConfig } from './panelTypes'
import { PanelRenderer } from './panelRenderer'
import { indexToX, formatPrice } from './chartUtils'

function getPadding(width: number) {
  return {
    top: 10,
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
    const padding = getPadding(this.width)
    
    this.clearCanvas()

    // Calculate price range
    let priceMin = Infinity
    let priceMax = -Infinity

    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i < candles.length) {
        priceMin = Math.min(priceMin, candles[i].l)
        priceMax = Math.max(priceMax, candles[i].h)
      }
    }

    // Include visible indicators in range
    config.indicators.filter(ind => ind.visible).forEach(indicator => {
      for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
        if (i < indicator.points.length) {
          const value = indicator.points[i].v
          if (isFinite(value)) {
            priceMin = Math.min(priceMin, value)
            priceMax = Math.max(priceMax, value)
          }
        }
      }
    })

    // Add padding
    const pricePadding = (priceMax - priceMin) * 0.05
    priceMin -= pricePadding
    priceMax += pricePadding

    // Draw grid
    if (config.showGrid) {
      this.drawGrid(viewport, priceMin, priceMax, padding)
    }

    // Draw candles
    this.drawCandles(candles, viewport, priceMin, priceMax, padding)

    // Draw indicators
    this.drawIndicatorLines(config.indicators, viewport, priceMin, priceMax, padding)

    // Draw Y-axis
    this.drawYAxis(priceMin, priceMax, viewport.panelHeight, padding, (v) => `$${formatPrice(v)}`)

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
    const wickWidth = Math.max(1, viewport.candleWidth * 0.1)
    const bodyWidth = Math.max(2, viewport.candleWidth * 0.8)

    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i >= candles.length) break

      const candle = candles[i]
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)

      if (x < padding.left || x > this.width - padding.right) continue

      const isUp = candle.c >= candle.o
      const color = isUp ? this.colors.up : this.colors.down

      const yHigh = this.valueToY(candle.h, priceMin, priceMax, viewport.panelHeight, padding.top)
      const yLow = this.valueToY(candle.l, priceMin, priceMax, viewport.panelHeight, padding.top)
      const yOpen = this.valueToY(candle.o, priceMin, priceMax, viewport.panelHeight, padding.top)
      const yClose = this.valueToY(candle.c, priceMin, priceMax, viewport.panelHeight, padding.top)

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
    }
  }
}
