import { Candle } from './types'
import { PanelViewport, PanelConfig } from './panelTypes'
import { PanelRenderer } from './panelRenderer'
import { indexToX } from './chartUtils'

function getPadding(width: number) {
  return {
    top: 5,
    right: Math.max(70, width * 0.08),
    bottom: 5,
    left: Math.max(15, width * 0.02)
  }
}

export class OscillatorPanelRenderer extends PanelRenderer {
  render(
    candles: Candle[],
    viewport: PanelViewport,
    config: PanelConfig,
    mouse: { x: number; y: number } | null
  ) {
    this.updateColors()
    
    const padding = getPadding(this.width)
    this.clearCanvas()

    // Use fixed range or auto-calculate
    let yMin = config.yAxis.fixed?.min ?? 0
    let yMax = config.yAxis.fixed?.max ?? 100

    if (config.yAxis.auto && !config.yAxis.fixed) {
      yMin = Infinity
      yMax = -Infinity

      config.indicators.filter(ind => ind.visible).forEach(indicator => {
        for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
          if (i < indicator.points.length) {
            const value = indicator.points[i].v
            if (isFinite(value)) {
              yMin = Math.min(yMin, value)
              yMax = Math.max(yMax, value)
            }
          }
        }
      })

      // Add padding
      const rangePadding = (yMax - yMin) * 0.1
      yMin -= rangePadding
      yMax += rangePadding
    }

    // Draw grid
    if (config.showGrid) {
      this.drawGrid(viewport, yMin, yMax, padding)
    }

    // Draw reference lines (for RSI: 30, 50, 70)
    if (config.id === 'rsi') {
      this.drawRSIReferences(yMin, yMax, viewport.panelHeight, padding)
    }

    // Draw indicator lines
    this.drawIndicatorLines(config.indicators, viewport, yMin, yMax, padding)

    // Draw Y-axis
    this.drawYAxis(yMin, yMax, viewport.panelHeight, padding)

    // Draw X-axis with dates
    // this.drawXAxis(candles, viewport, padding) - Moved to DateAxisStrip

    // Draw crosshair - DISABLED (now handled by CrosshairOverlay)
    // if (mouse) {
    //   this.drawCrosshair(mouse, viewport, yMin, yMax, padding)
    // }
  }

  private drawRSIReferences(
    yMin: number,
    yMax: number,
    panelHeight: number,
    padding: any
  ) {
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)' // red transparent
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([2, 2])

    // Overbought (70)
    const y70 = this.valueToY(70, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y70)
    this.ctx.lineTo(this.width - padding.right, y70)
    this.ctx.stroke()

    // Oversold (30)
    this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)' // green transparent
    const y30 = this.valueToY(30, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y30)
    this.ctx.lineTo(this.width - padding.right, y30)
    this.ctx.stroke()

    // Middle (50)
    this.ctx.strokeStyle = 'rgba(136, 136, 136, 0.3)' // gray transparent
    const y50 = this.valueToY(50, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y50)
    this.ctx.lineTo(this.width - padding.right, y50)
    this.ctx.stroke()

    this.ctx.setLineDash([])
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
