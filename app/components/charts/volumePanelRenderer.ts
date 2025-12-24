import { Candle, Indicator } from './types'
import { PanelViewport, PanelConfig } from './panelTypes'
import { PanelRenderer } from './panelRenderer'
import { indexToX } from './chartUtils'

function getPadding(width: number) {
  return {
    top: 5,
    right: Math.max(58, width * 0.075),
    bottom: 5,
    left: Math.max(15, width * 0.02)
  }
}

export class VolumePanelRenderer extends PanelRenderer {
  render(
    candles: Candle[],
    viewport: PanelViewport,
    config: PanelConfig,
    mouse: { x: number; y: number } | null,
    trades?: Trade[]
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

    // Draw volume value label if mouse is present
    if (mouse) {
      this.drawPriceValueLabel(mouse, viewport, volumeMin, volumeMax, padding, this.formatVolume)
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

      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
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

      const x = indexToX(i, viewport.candleWidth, viewport.offsetX, padding.left, viewport.startIdx)
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

  private formatVolume(volume: number): string {
    if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(1)}M`
    } else if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(1)}K`
    }
    return volume.toFixed(0)
  }
}
