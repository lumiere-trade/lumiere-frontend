import { Candle, Trade, Indicator } from './types'
import { PanelViewport, PanelConfig } from './panelTypes'
import { PanelRenderer } from './panelRenderer'
import { priceToY, indexToX, findCandleIndex } from './chartUtils'

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
    mouse: { x: number; y: number } | null,
    trades?: Trade[]
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

    // Draw trade areas FIRST (behind everything)
    if (trades && trades.length > 0) {
      this.drawTradeAreas(trades, candles, viewport, priceMin, priceMax, padding)
    }

    // Draw candles
    this.drawCandles(candles, viewport, priceMin, priceMax, padding)

    // Draw Bollinger Bands (with fill)
    this.drawBollingerBands(config.indicators, viewport, priceMin, priceMax, padding)

    // Draw other indicator lines (excluding Bollinger)
    const nonBollingerIndicators = config.indicators.filter(
      ind => !ind.name.toLowerCase().includes('bollinger')
    )
    this.drawIndicatorLines(nonBollingerIndicators, viewport, priceMin, priceMax, padding)

    // Draw trade arrows LAST (on top)
    if (trades && trades.length > 0) {
      this.drawTradeArrows(trades, candles, viewport, priceMin, priceMax, padding)
    }

    // Draw Y-axis
    this.drawYAxis(priceMin, priceMax, viewport.panelHeight, padding)

    // Draw price value label if mouse is present
    if (mouse) {
      this.drawPriceValueLabel(mouse, viewport, priceMin, priceMax, padding)
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
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)

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

  private drawTradeAreas(
    trades: Trade[],
    candles: Candle[],
    viewport: PanelViewport,
    priceMin: number,
    priceMax: number,
    padding: any
  ) {
    // Pair buy/sell trades
    const buyTrades = trades.filter(t => t.s === 'B').sort((a, b) => a.t - b.t)
    const sellTrades = trades.filter(t => t.s === 'S').sort((a, b) => a.t - b.t)

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

    // Pair each buy with next sell
    for (let i = 0; i < buyTrades.length; i++) {
      const buyTrade = buyTrades[i]
      const sellTrade = sellTrades[i] // may be undefined if position still open

      if (!sellTrade) continue // Skip if no matching sell

      // Convert timestamps to candle indices
      const buyIdx = findCandleIndex(candles, buyTrade.t)
      const sellIdx = findCandleIndex(candles, sellTrade.t)

      // Only draw if within viewport
      if (sellIdx < viewport.startIdx || buyIdx > viewport.endIdx) continue

      const xBuy = indexToX(buyIdx, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
      const xSell = indexToX(sellIdx, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)

      // Determine profit/loss
      const isProfit = sellTrade.p > buyTrade.p

      // Set fill color (green for profit, red for loss)
      if (isProfit) {
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.15)' // green with 15% opacity
      } else {
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.15)' // red with 15% opacity
      }

      // Draw filled area from buy to sell
      this.ctx.beginPath()
      this.ctx.moveTo(xBuy, padding.top)
      this.ctx.lineTo(xSell, padding.top)
      this.ctx.lineTo(xSell, padding.top + viewport.panelHeight)
      this.ctx.lineTo(xBuy, padding.top + viewport.panelHeight)
      this.ctx.closePath()
      this.ctx.fill()
    }

    this.ctx.restore()
  }

  private drawTradeArrows(
    trades: Trade[],
    candles: Candle[],
    viewport: PanelViewport,
    priceMin: number,
    priceMax: number,
    padding: any
  ) {
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

    const arrowSize = 8

    trades.forEach(trade => {
      // Convert timestamp to candle index
      const tradeIdx = findCandleIndex(candles, trade.t)

      // Only draw if within viewport
      if (tradeIdx < viewport.startIdx || tradeIdx > viewport.endIdx) return

      const x = indexToX(tradeIdx, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
      const yPrice = priceToY(trade.p, priceMin, priceMax, viewport.panelHeight, padding.top)

      const isBuy = trade.s === 'B'
      const color = isBuy ? this.colors.up : this.colors.down

      // Position arrow below price for BUY (↑), above for SELL (↓)
      const yArrow = isBuy ? yPrice + 15 : yPrice - 15

      // Draw triangle arrow
      this.ctx.fillStyle = color
      this.ctx.beginPath()

      if (isBuy) {
        // Up arrow (▲)
        this.ctx.moveTo(x, yArrow - arrowSize)
        this.ctx.lineTo(x - arrowSize, yArrow + arrowSize)
        this.ctx.lineTo(x + arrowSize, yArrow + arrowSize)
      } else {
        // Down arrow (▼)
        this.ctx.moveTo(x, yArrow + arrowSize)
        this.ctx.lineTo(x - arrowSize, yArrow - arrowSize)
        this.ctx.lineTo(x + arrowSize, yArrow - arrowSize)
      }

      this.ctx.closePath()
      this.ctx.fill()

      // Optional: white border for better visibility
      this.ctx.strokeStyle = this.colors.bg
      this.ctx.lineWidth = 1.5
      this.ctx.stroke()
    })

    this.ctx.restore()
  }

  private drawBollingerBands(
    indicators: Indicator[],
    viewport: PanelViewport,
    priceMin: number,
    priceMax: number,
    padding: any
  ) {
    // Find Bollinger Band indicators
    const bollingerIndicators = indicators.filter(ind =>
      ind.visible && ind.name.toLowerCase().includes('bollinger')
    )

    if (bollingerIndicators.length === 0) return

    // Group by base name (e.g., "bollinger_20_2")
    const bollingerGroups = new Map<string, { upper?: Indicator; middle?: Indicator; lower?: Indicator }>()

    bollingerIndicators.forEach(ind => {
      const name = ind.name.toLowerCase()
      // Extract base name (remove _upper, _middle, _lower suffix)
      const baseName = name.replace(/_upper|_middle|_lower/g, '')

      if (!bollingerGroups.has(baseName)) {
        bollingerGroups.set(baseName, {})
      }

      const group = bollingerGroups.get(baseName)!
      if (name.includes('upper')) {
        group.upper = ind
      } else if (name.includes('middle')) {
        group.middle = ind
      } else if (name.includes('lower')) {
        group.lower = ind
      }
    })

    // Draw each Bollinger Band group
    bollingerGroups.forEach((group, baseName) => {
      if (!group.upper || !group.lower) return

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

      // Draw filled area between upper and lower bands
      this.ctx.beginPath()
      this.ctx.fillStyle = group.upper.color + '20' // 20 = ~12% opacity

      // Draw upper band path
      let firstPoint = true
      for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
        if (i >= group.upper.points.length) break

        const point = group.upper.points[i]
        const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
        const y = priceToY(point.v, priceMin, priceMax, viewport.panelHeight, padding.top)

        if (!isFinite(y)) continue

        if (firstPoint) {
          this.ctx.moveTo(x, y)
          firstPoint = false
        } else {
          this.ctx.lineTo(x, y)
        }
      }

      // Draw lower band path in reverse
      for (let i = viewport.endIdx; i >= viewport.startIdx; i--) {
        if (i >= group.lower.points.length) continue

        const point = group.lower.points[i]
        const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
        const y = priceToY(point.v, priceMin, priceMax, viewport.panelHeight, padding.top)

        if (!isFinite(y)) continue

        this.ctx.lineTo(x, y)
      }

      this.ctx.closePath()
      this.ctx.fill()

      // Draw upper band line
      this.ctx.strokeStyle = group.upper.color
      this.ctx.lineWidth = 1.5
      this.ctx.globalAlpha = 0.7
      this.ctx.beginPath()

      firstPoint = true
      for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
        if (i >= group.upper.points.length) break

        const point = group.upper.points[i]
        const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
        const y = priceToY(point.v, priceMin, priceMax, viewport.panelHeight, padding.top)

        if (!isFinite(y)) continue

        if (firstPoint) {
          this.ctx.moveTo(x, y)
          firstPoint = false
        } else {
          this.ctx.lineTo(x, y)
        }
      }

      this.ctx.stroke()

      // Draw middle band line
      if (group.middle) {
        this.ctx.strokeStyle = group.middle.color
        this.ctx.lineWidth = 1.5
        this.ctx.globalAlpha = 0.7
        this.ctx.beginPath()

        firstPoint = true
        for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
          if (i >= group.middle.points.length) break

          const point = group.middle.points[i]
          const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
          const y = priceToY(point.v, priceMin, priceMax, viewport.panelHeight, padding.top)

          if (!isFinite(y)) continue

          if (firstPoint) {
            this.ctx.moveTo(x, y)
            firstPoint = false
          } else {
            this.ctx.lineTo(x, y)
          }
        }

        this.ctx.stroke()
      }

      // Draw lower band line
      this.ctx.strokeStyle = group.lower.color
      this.ctx.lineWidth = 1.5
      this.ctx.globalAlpha = 0.7
      this.ctx.beginPath()

      firstPoint = true
      for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
        if (i >= group.lower.points.length) break

        const point = group.lower.points[i]
        const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
        const y = priceToY(point.v, priceMin, priceMax, viewport.panelHeight, padding.top)

        if (!isFinite(y)) continue

        if (firstPoint) {
          this.ctx.moveTo(x, y)
          firstPoint = false
        } else {
          this.ctx.lineTo(x, y)
        }
      }

      this.ctx.stroke()

      this.ctx.globalAlpha = 1.0
      this.ctx.restore()
    })
  }
}
