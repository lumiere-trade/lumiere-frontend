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
    console.log('[PricePanelRenderer] render START', {
      candlesCount: candles.length,
      viewport,
      width: this.width,
      height: this.height
    })
    
    // Update colors for theme changes
    this.updateColors()

    const padding = getPadding(this.width)
    console.log('[PricePanelRenderer] padding', padding)
    
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

    console.log('[PricePanelRenderer] price range', { priceMin, priceMax, priceRange })

    // Draw grid
    if (config.showGrid) {
      console.log('[PricePanelRenderer] drawing grid')
      this.drawGrid(viewport, priceMin, priceMax, padding)
    }

    // Draw candles
    console.log('[PricePanelRenderer] drawing candles')
    this.drawCandles(candles, viewport, priceMin, priceMax, padding)

    // Draw indicator lines
    console.log('[PricePanelRenderer] drawing indicators', {
      indicatorCount: config.indicators.length
    })
    this.drawIndicatorLines(config.indicators, viewport, priceMin, priceMax, padding)

    // Draw Y-axis
    console.log('[PricePanelRenderer] drawing Y axis')
    this.drawYAxis(priceMin, priceMax, viewport.panelHeight, padding)

    console.log('[PricePanelRenderer] render COMPLETE')
  }

  private drawCandles(
    candles: Candle[],
    viewport: PanelViewport,
    priceMin: number,
    priceMax: number,
    padding: any
  ) {
    console.log('[PricePanelRenderer] drawCandles START', {
      startIdx: viewport.startIdx,
      endIdx: viewport.endIdx,
      candleWidth: viewport.candleWidth,
      offsetX: viewport.offsetX,
      paddingLeft: padding.left,
      paddingRight: padding.right,
      canvasWidth: this.width,
      upColor: this.colors.up,
      downColor: this.colors.down
    })
    
    const bodyWidth = Math.max(1, viewport.candleWidth * 0.8)
    const wickWidth = Math.max(1, viewport.candleWidth * 0.1)

    let candlesDrawn = 0
    let candlesSkipped = 0
    let skipReasons: { tooLeft: number; tooRight: number } = { tooLeft: 0, tooRight: 0 }

    // Sample first 3 candles for detailed debug
    for (let i = viewport.startIdx; i <= Math.min(viewport.startIdx + 2, viewport.endIdx); i++) {
      if (i >= candles.length) break

      const candle = candles[i]
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)

      console.log(`[PricePanelRenderer] Candle ${i}:`, {
        x,
        candleWidth: viewport.candleWidth,
        offsetX: viewport.offsetX,
        paddingLeft: padding.left,
        canvasWidth: this.width,
        paddingRight: padding.right,
        visibleRange: `${padding.left} - ${this.width - padding.right}`,
        isVisible: x >= padding.left && x <= this.width - padding.right
      })
    }

    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i >= candles.length) break

      const candle = candles[i]
      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)

      if (x < padding.left) {
        skipReasons.tooLeft++
        candlesSkipped++
        continue
      }
      
      if (x > this.width - padding.right) {
        skipReasons.tooRight++
        candlesSkipped++
        continue
      }

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
      
      candlesDrawn++
    }
    
    console.log('[PricePanelRenderer] drawCandles COMPLETE', {
      candlesDrawn,
      candlesSkipped,
      skipReasons,
      totalInViewport: viewport.endIdx - viewport.startIdx + 1
    })
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
    const yPosition = padding.top + viewport.panelHeight + padding.bottom / 2 - 5

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
