import { parse as culorParse, formatRgb } from 'culori'

interface DrawdownPoint {
  t: number
  d: number
}

interface DrawdownViewport {
  startIdx: number
  endIdx: number
  drawdownMin: number
  drawdownMax: number
  zoom: number
  offsetX: number
  width: number
}

const PADDING = { top: 20, right: 50, bottom: 40, left: 60 }
const GRID_COLOR = 'rgba(100, 100, 100, 0.2)'
const TEXT_COLOR = 'rgba(150, 150, 150, 1)'
const CROSSHAIR_COLOR = 'rgba(150, 150, 150, 0.5)'

function getCSSColorAsRGB(variable: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()

  if (!value) {
    return 'rgb(239, 68, 68)'
  }

  const parsed = culorParse(value)
  if (!parsed) {
    return 'rgb(239, 68, 68)'
  }

  return formatRgb(parsed)
}

function parseColorToRGBA(rgbString: string, alpha: number = 1): string {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return `rgba(239, 68, 68, ${alpha})`
  
  const [, r, g, b] = match
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawdownToY(
  drawdown: number,
  drawdownMin: number,
  drawdownMax: number,
  height: number
): number {
  const chartHeight = height - PADDING.top - PADDING.bottom
  const range = drawdownMax - drawdownMin
  const normalized = (drawdown - drawdownMin) / range
  return PADDING.top + chartHeight * (1 - normalized)
}

function indexToX(index: number, totalPoints: number, width: number): number {
  const chartWidth = width - PADDING.left - PADDING.right
  return PADDING.left + (index / (totalPoints - 1)) * chartWidth
}

function formatDrawdown(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}`
}

export class DrawdownChartRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private dpr: number = 1
  private destructiveColor: string = 'rgb(239, 68, 68)'

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Could not get canvas context')
    this.ctx = ctx
    this.dpr = window.devicePixelRatio || 1
    this.updateDestructiveColor()
  }

  public updateDestructiveColor(): void {
    this.destructiveColor = getCSSColorAsRGB('--destructive')
  }

  private setupCanvas(width: number, height: number): void {
    this.canvas.width = width * this.dpr
    this.canvas.height = height * this.dpr
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    this.ctx.scale(this.dpr, this.dpr)
  }

  private clearCanvas(width: number, height: number): void {
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--background')
      .trim()
    this.ctx.fillStyle = bgColor || '#ffffff'
    this.ctx.fillRect(0, 0, width, height)
  }

  private drawGrid(
    width: number,
    height: number,
    viewport: DrawdownViewport
  ): void {
    const chartWidth = width - PADDING.left - PADDING.right
    const chartHeight = height - PADDING.top - PADDING.bottom

    this.ctx.save()
    this.ctx.strokeStyle = GRID_COLOR
    this.ctx.lineWidth = 1

    const numHorizontalLines = 5
    for (let i = 0; i <= numHorizontalLines; i++) {
      const y = PADDING.top + (chartHeight * i) / numHorizontalLines
      this.ctx.beginPath()
      this.ctx.moveTo(PADDING.left, y)
      this.ctx.lineTo(PADDING.left + chartWidth, y)
      this.ctx.stroke()
    }

    const numVerticalLines = 6
    for (let i = 0; i <= numVerticalLines; i++) {
      const x = PADDING.left + (chartWidth * i) / numVerticalLines
      this.ctx.beginPath()
      this.ctx.moveTo(x, PADDING.top)
      this.ctx.lineTo(x, PADDING.top + chartHeight)
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  private drawAxes(
    width: number,
    height: number,
    points: DrawdownPoint[],
    viewport: DrawdownViewport
  ): void {
    const chartWidth = width - PADDING.left - PADDING.right
    const chartHeight = height - PADDING.top - PADDING.bottom

    this.ctx.save()
    this.ctx.fillStyle = TEXT_COLOR
    this.ctx.font = '11px sans-serif'
    this.ctx.textAlign = 'right'
    this.ctx.textBaseline = 'middle'

    const numYLabels = 5
    for (let i = 0; i <= numYLabels; i++) {
      const ratio = i / numYLabels
      const drawdown = viewport.drawdownMin + (viewport.drawdownMax - viewport.drawdownMin) * (1 - ratio)
      const y = PADDING.top + chartHeight * ratio
      this.ctx.fillText(formatDrawdown(drawdown), PADDING.left - 10, y)
    }

    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'

    const numXLabels = 6
    const visiblePoints = points.slice(viewport.startIdx, viewport.endIdx + 1)
    for (let i = 0; i <= numXLabels; i++) {
      const ratio = i / numXLabels
      const pointIdx = Math.floor(ratio * (visiblePoints.length - 1))
      const point = visiblePoints[pointIdx]
      if (point) {
        const x = PADDING.left + chartWidth * ratio
        const label = formatTime(point.t)
        this.ctx.fillText(label, x, height - PADDING.bottom + 10)
      }
    }

    this.ctx.restore()
  }

  private drawDrawdownCurve(
    width: number,
    height: number,
    points: DrawdownPoint[],
    viewport: DrawdownViewport
  ): void {
    const visiblePoints = points.slice(viewport.startIdx, viewport.endIdx + 1)
    if (visiblePoints.length < 2) return

    const chartHeight = height - PADDING.top - PADDING.bottom
    const zeroY = drawdownToY(0, viewport.drawdownMin, viewport.drawdownMax, height)

    this.ctx.save()
    this.ctx.beginPath()

    const totalVisible = visiblePoints.length
    visiblePoints.forEach((point, idx) => {
      const x = indexToX(idx, totalVisible, width)
      const y = drawdownToY(point.d, viewport.drawdownMin, viewport.drawdownMax, height)

      if (idx === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    })

    this.ctx.strokeStyle = this.destructiveColor
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    const gradient = this.ctx.createLinearGradient(0, PADDING.top, 0, zeroY)
    gradient.addColorStop(0, parseColorToRGBA(this.destructiveColor, 0.3))
    gradient.addColorStop(1, parseColorToRGBA(this.destructiveColor, 0))

    this.ctx.lineTo(
      indexToX(totalVisible - 1, totalVisible, width),
      zeroY
    )
    this.ctx.lineTo(
      indexToX(0, totalVisible, width),
      zeroY
    )
    this.ctx.closePath()

    this.ctx.fillStyle = gradient
    this.ctx.fill()

    this.ctx.restore()
  }

  private drawCrosshair(
    width: number,
    height: number,
    points: DrawdownPoint[],
    viewport: DrawdownViewport,
    mouseX: number,
    mouseY: number
  ): void {
    const chartWidth = width - PADDING.left - PADDING.right
    const chartHeight = height - PADDING.top - PADDING.bottom

    if (
      mouseX < PADDING.left ||
      mouseX > PADDING.left + chartWidth ||
      mouseY < PADDING.top ||
      mouseY > PADDING.top + chartHeight
    ) {
      return
    }

    const visiblePoints = points.slice(viewport.startIdx, viewport.endIdx + 1)
    if (visiblePoints.length === 0) return

    const relativeX = mouseX - PADDING.left
    const ratio = relativeX / chartWidth
    const pointIdx = Math.floor(ratio * (visiblePoints.length - 1))
    const point = visiblePoints[pointIdx]

    if (!point) return

    const x = indexToX(pointIdx, visiblePoints.length, width)
    const y = drawdownToY(point.d, viewport.drawdownMin, viewport.drawdownMax, height)

    this.ctx.save()

    this.ctx.strokeStyle = CROSSHAIR_COLOR
    this.ctx.lineWidth = 1
    this.ctx.setLineDash([5, 5])

    this.ctx.beginPath()
    this.ctx.moveTo(x, PADDING.top)
    this.ctx.lineTo(x, PADDING.top + chartHeight)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(PADDING.left, y)
    this.ctx.lineTo(PADDING.left + chartWidth, y)
    this.ctx.stroke()

    this.ctx.setLineDash([])

    this.ctx.fillStyle = this.destructiveColor
    this.ctx.beginPath()
    this.ctx.arc(x, y, 4, 0, Math.PI * 2)
    this.ctx.fill()

    const tooltipText = `${formatTime(point.t)} | ${formatDrawdown(point.d)}`
    this.ctx.font = '12px sans-serif'
    const textWidth = this.ctx.measureText(tooltipText).width
    const tooltipPadding = 8
    const tooltipWidth = textWidth + tooltipPadding * 2
    const tooltipHeight = 24

    let tooltipX = x + 10
    let tooltipY = y - 10

    if (tooltipX + tooltipWidth > width - PADDING.right) {
      tooltipX = x - tooltipWidth - 10
    }
    if (tooltipY < PADDING.top) {
      tooltipY = y + 10
    }

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight)

    this.ctx.strokeStyle = this.destructiveColor
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(tooltipText, tooltipX + tooltipPadding, tooltipY + tooltipHeight / 2)

    this.ctx.restore()
  }

  public render(
    width: number,
    height: number,
    points: DrawdownPoint[],
    viewport: DrawdownViewport,
    mouse: { x: number; y: number } | null
  ): void {
    this.setupCanvas(width, height)
    this.clearCanvas(width, height)

    if (points.length === 0) {
      this.ctx.fillStyle = TEXT_COLOR
      this.ctx.font = '14px sans-serif'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText('No data available', width / 2, height / 2)
      return
    }

    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.rect(
      PADDING.left,
      PADDING.top,
      width - PADDING.left - PADDING.right,
      height - PADDING.top - PADDING.bottom
    )
    this.ctx.clip()

    this.drawGrid(width, height, viewport)
    this.drawDrawdownCurve(width, height, points, viewport)

    this.ctx.restore()

    this.drawAxes(width, height, points, viewport)

    if (mouse) {
      this.drawCrosshair(width, height, points, viewport, mouse.x, mouse.y)
    }
  }
}
