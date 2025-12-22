import { Candle, Indicator } from './types'
import { PanelViewport, PanelConfig } from './panelTypes'
import { PanelRenderer } from './panelRenderer'
import { indexToX } from './chartUtils'

function getPadding(width: number) {
  return {
    top: 5,
    right: Math.max(70, width * 0.08),
    bottom: 40,  // More space for X axis dates
    left: Math.max(15, width * 0.02)
  }
}

export class VolumePanelRenderer extends PanelRenderer {
  render(
    candles: Candle[],
    viewport: PanelViewport,
    config: PanelConfig,
    mouse: { x: number; y: number } | null
  ) {
    this.updateColors()

    const padding = getPadding(this.width)
    this.clearCanvas()

    // Calculate volume range (include indicators)
    let volumeMax = 0

    // Check candle volumes
    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i < candles.length && candles[i].v) {
        volumeMax = Math.max(volumeMax, candles[i].v!)
      }
    }

    // Check indicator values (for SMA/EMA range)
    config.indicators.forEach(indicator => {
      if (!indicator.visible) return
      // Skip raw volume indicator (already in bars)
      if (indicator.name.toLowerCase() === 'volume') return

      for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
        if (i < indicator.points.length) {
          const point = indicator.points[i]
          if (point && point.v !== null && point.v !== undefined) {
            volumeMax = Math.max(volumeMax, point.v)
          }
        }
      }
    })

    const volumeMin = 0
    volumeMax = volumeMax * 1.1 // Add 10% padding

    // Draw grid
    if (config.showGrid) {
      this.drawGrid(viewport, volumeMin, volumeMax, padding)
    }

    // Draw volume bars
    this.drawVolumeBars(candles, viewport, volumeMin, volumeMax, padding)

    // Draw indicators (volume_sma lines) - skip raw volume
    config.indicators.forEach(indicator => {
      if (indicator.visible && indicator.name.toLowerCase() !== 'volume') {
        this.drawIndicatorLine(indicator, viewport, volumeMin, volumeMax, padding)
      }
    })

    // Draw Y-axis
    this.drawYAxis(volumeMin, volumeMax, viewport.panelHeight, padding, this.formatVolume)

    // Draw X-axis with dates
    this.drawXAxis(candles, viewport, padding)

    // Draw crosshair
    if (mouse) {
      this.drawCrosshair(mouse, viewport, volumeMin, volumeMax, padding)
    }
  }

  private drawVolumeBars(
    candles: Candle[],
    viewport: PanelViewport,
    volumeMin: number,
    volumeMax: number,
    padding: any
  ) {
    const barWidth = Math.max(1, viewport.candleWidth * 0.8)

    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i >= candles.length) break

      const candle = candles[i]
      if (!candle.v) continue

      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)
      if (x < padding.left || x > this.width - padding.right) continue

      const isUp = candle.c >= candle.o
      const color = isUp ? this.colors.up : this.colors.down

      const barHeight = (candle.v / volumeMax) * viewport.panelHeight
      const barY = padding.top + viewport.panelHeight - barHeight

      this.ctx.fillStyle = color
      this.ctx.globalAlpha = 0.6
      this.ctx.fillRect(
        x - barWidth / 2,
        barY,
        barWidth,
        barHeight
      )
      this.ctx.globalAlpha = 1.0
    }
  }

  private drawIndicatorLine(
    indicator: Indicator,
    viewport: PanelViewport,
    volumeMin: number,
    volumeMax: number,
    padding: any
  ) {
    this.ctx.strokeStyle = indicator.color
    this.ctx.lineWidth = 2
    this.ctx.beginPath()

    let firstPoint = true

    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i >= indicator.points.length) break

      const point = indicator.points[i]
      if (!point || point.v === null || point.v === undefined) continue

      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left)
      if (x < padding.left || x > this.width - padding.right) continue

      const y = padding.top + viewport.panelHeight -
                ((point.v - volumeMin) / (volumeMax - volumeMin)) * viewport.panelHeight

      if (firstPoint) {
        this.ctx.moveTo(x, y)
        firstPoint = false
      } else {
        this.ctx.lineTo(x, y)
      }
    }

    this.ctx.stroke()
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

  private formatVolume(volume: number): string {
    if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(1)}M`
    } else if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(1)}K`
    }
    return volume.toFixed(0)
  }
}
