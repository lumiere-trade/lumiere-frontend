"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from "@lumiere/shared/components/ui/button"
import { LineChartIcon, CandlestickChart } from "lucide-react"

interface PriceDataPoint {
  timestamp: number
  date: string
  open: number
  high: number
  low: number
  close: number
  buy: number | null
  sell: number | null
}

interface PriceChartProps {
  data: PriceDataPoint[]
  height?: number
}

type ChartMode = 'line' | 'candles'

export function PriceChart({ data, height = 450 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const [chartMode, setChartMode] = useState<ChartMode>('line')
  const [isClient, setIsClient] = useState(false)

  // Client-side only flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !chartContainerRef.current || data.length === 0) return

    // Dynamic import of lightweight-charts (client-side only)
    import('lightweight-charts').then(({ createChart }) => {
      if (!chartContainerRef.current || chartRef.current) return

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { color: '#0a0a0a' },
          textColor: '#888888',
        },
        grid: {
          vertLines: { color: '#1a1a1a' },
          horzLines: { color: '#1a1a1a' },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#8b5cf6',
            labelBackgroundColor: '#8b5cf6',
          },
          horzLine: {
            color: '#8b5cf6',
            labelBackgroundColor: '#8b5cf6',
          },
        },
        rightPriceScale: {
          borderColor: '#333333',
          textColor: '#888888',
        },
        timeScale: {
          borderColor: '#333333',
          textColor: '#888888',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      })

      chartRef.current = chart

      // Create appropriate series
      if (chartMode === 'candles') {
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })

        // Convert data to candlestick format
        const candleData = data.map(d => ({
          time: Math.floor(d.timestamp / 1000),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))

        candlestickSeries.setData(candleData)
        seriesRef.current = candlestickSeries
      } else {
        const lineSeries = chart.addLineSeries({
          color: '#8b5cf6',
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 6,
          crosshairMarkerBorderColor: '#8b5cf6',
          crosshairMarkerBackgroundColor: '#8b5cf6',
        })

        // Convert data to line format
        const lineData = data.map(d => ({
          time: Math.floor(d.timestamp / 1000),
          value: d.close,
        }))

        lineSeries.setData(lineData)
        seriesRef.current = lineSeries
      }

      // Add buy/sell markers
      const markers = data
        .filter(d => d.buy !== null || d.sell !== null)
        .map(d => {
          if (d.buy !== null) {
            return {
              time: Math.floor(d.timestamp / 1000),
              position: 'belowBar' as const,
              color: '#22c55e',
              shape: 'arrowUp' as const,
              text: `BUY @ $${d.buy.toFixed(2)}`,
            }
          } else {
            return {
              time: Math.floor(d.timestamp / 1000),
              position: 'aboveBar' as const,
              color: '#ef4444',
              shape: 'arrowDown' as const,
              text: `SELL @ $${d.sell!.toFixed(2)}`,
            }
          }
        })

      if (markers.length > 0 && seriesRef.current) {
        seriesRef.current.setMarkers(markers)
      }

      // Fit content
      chart.timeScale().fitContent()

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
          seriesRef.current = null
        }
      }
    })
  }, [isClient, data, chartMode, height])

  const buyCount = data.filter(d => d.buy !== null).length
  const sellCount = data.filter(d => d.sell !== null).length

  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Loading chart...
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <LineChartIcon className="h-4 w-4 mr-2" />
              Line
            </Button>
            <Button variant="outline" size="sm" disabled>
              <CandlestickChart className="h-4 w-4 mr-2" />
              Candles
            </Button>
          </div>
        </div>
        <div style={{ height: `${height}px`, background: '#0a0a0a' }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 mr-4">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
            Buy Signals ({buyCount})
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            Sell Signals ({sellCount})
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartMode === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartMode('line')}
          >
            <LineChartIcon className="h-4 w-4 mr-2" />
            Line
          </Button>
          <Button
            variant={chartMode === 'candles' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartMode('candles')}
          >
            <CandlestickChart className="h-4 w-4 mr-2" />
            Candles
          </Button>
        </div>
      </div>
      <div ref={chartContainerRef} style={{ position: 'relative' }} />
      <div className="text-xs text-muted-foreground text-center">
        Mouse wheel to zoom • Drag to pan • Pinch on mobile
      </div>
    </div>
  )
}
