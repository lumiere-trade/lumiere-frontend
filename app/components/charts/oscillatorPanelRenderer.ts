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

    // Draw reference lines based on oscillator type
    if (config.id === 'rsi') {
      this.drawRSIReferences(yMin, yMax, viewport.panelHeight, padding)
    } else if (config.id.toLowerCase().includes('stochastic')) {
      this.drawStochasticReferences(yMin, yMax, viewport.panelHeight, padding)
    }

    // Draw indicator lines
    this.drawIndicatorLines(config.indicators, viewport, yMin, yMax, padding)

    // Draw Y-axis
    this.drawYAxis(yMin, yMax, viewport.panelHeight, padding)

    // Draw value label if mouse is present
    if (mouse) {
      this.drawPriceValueLabel(mouse, viewport, yMin, yMax, padding)
    }
  }

  private drawRSIReferences(
    yMin: number,
    yMax: number,
    panelHeight: number,
    padding: any
  ) {
    this.ctx.lineWidth = 1.5
    this.ctx.setLineDash([5, 3])

    // Overbought (70) - red
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'
    const y70 = this.valueToY(70, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y70)
    this.ctx.lineTo(this.width - padding.right, y70)
    this.ctx.stroke()

    // Oversold (30) - green
    this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'
    const y30 = this.valueToY(30, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y30)
    this.ctx.lineTo(this.width - padding.right, y30)
    this.ctx.stroke()

    // Middle (50) - gray
    this.ctx.strokeStyle = 'rgba(136, 136, 136, 0.5)'
    const y50 = this.valueToY(50, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y50)
    this.ctx.lineTo(this.width - padding.right, y50)
    this.ctx.stroke()

    this.ctx.setLineDash([])
  }

  private drawStochasticReferences(
    yMin: number,
    yMax: number,
    panelHeight: number,
    padding: any
  ) {
    this.ctx.lineWidth = 1.5
    this.ctx.setLineDash([5, 3])

    // Overbought (80) - red
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'
    const y80 = this.valueToY(80, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y80)
    this.ctx.lineTo(this.width - padding.right, y80)
    this.ctx.stroke()

    // Oversold (20) - green
    this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'
    const y20 = this.valueToY(20, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y20)
    this.ctx.lineTo(this.width - padding.right, y20)
    this.ctx.stroke()

    // Middle (50) - gray
    this.ctx.strokeStyle = 'rgba(136, 136, 136, 0.5)'
    const y50 = this.valueToY(50, yMin, yMax, panelHeight, padding.top)
    this.ctx.beginPath()
    this.ctx.moveTo(padding.left, y50)
    this.ctx.lineTo(this.width - padding.right, y50)
    this.ctx.stroke()

    this.ctx.setLineDash([])
  }
}
