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

export class VolumePanelRenderer extends PanelRenderer {
  render(
    candles: Candle[],
    viewport: PanelViewport,
    config: PanelConfig,
    mouse: { x: number; y: number } | null
  ) {
    const padding = getPadding(this.width)
    
    this.clearCanvas()

    // Calculate volume range
    let volumeMax = 0

    for (let i = viewport.startIdx; i <= viewport.endIdx; i++) {
      if (i < candles.length && candles[i].v) {
        volumeMax = Math.max(volumeMax, candles[i].v!)
      }
    }

    const volumeMin = 0
    volumeMax = volumeMax * 1.1 // Add 10% padding

    // Draw grid
    if (config.showGrid) {
      this.drawGrid(viewport, volumeMin, volumeMax, padding)
    }

    // Draw volume bars
    this.drawVolumeBars(candles, viewport, volumeMin, volumeMax, padding)

    // Draw Y-axis
    this.drawYAxis(volumeMin, volumeMax, viewport.panelHeight, padding, this.formatVolume)

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

  private formatVolume(volume: number): string {
    if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(1)}M`
    } else if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(1)}K`
    }
    return volume.toFixed(0)
  }
}
