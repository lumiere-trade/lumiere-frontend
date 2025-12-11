"use client"

import { useMemo, memo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import { Badge } from "@lumiere/shared/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lumiere/shared/components/ui/tabs"
import { Button } from "@lumiere/shared/components/ui/button"
import {
  LineChart, Line, AreaChart, Area, ComposedChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter
} from 'recharts'
import { TrendingUp, TrendingDown, Clock, CandlestickChart, LineChartIcon } from "lucide-react"
import { BacktestResponse } from "@/lib/api/cartographe"
import { format } from "date-fns"

interface BacktestResultsProps {
  results: BacktestResponse
  onClose?: () => void
}

type ChartMode = 'line' | 'candles'

// Decimate data to max N points for performance
function decimateData<T>(data: T[], maxPoints: number = 300): T[] {
  if (data.length <= maxPoints) return data

  const step = Math.ceil(data.length / maxPoints)
  const decimated: T[] = []

  for (let i = 0; i < data.length; i += step) {
    decimated.push(data[i])
  }

  // Always include last point
  if (decimated[decimated.length - 1] !== data[data.length - 1]) {
    decimated.push(data[data.length - 1])
  }

  return decimated
}

// Custom candlestick shape
const CandleShape = (props: any) => {
  const { x, y, width, height, low, high, open, close } = props
  const isGreen = close > open
  const color = isGreen ? '#22c55e' : '#ef4444'
  const wickX = x + width / 2

  return (
    <g>
      {/* Wick (high-low line) */}
      <line
        x1={wickX}
        y1={y + (isGreen ? 0 : height)}
        x2={wickX}
        y2={y + (isGreen ? height : 0)}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body (open-close box) */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}

export const BacktestResults = memo(function BacktestResults({ results, onClose }: BacktestResultsProps) {
  const { metrics, equity_curve, trades, trade_analysis, market_data } = results
  const [activeTab, setActiveTab] = useState('price')
  const [chartMode, setChartMode] = useState<ChartMode>('line')

  const normalizedMetrics = useMemo(() => ({
    ...metrics,
    win_rate_pct: metrics.win_rate,
    total_return_pct: metrics.total_return_pct * 100,
    max_drawdown_pct: metrics.max_drawdown_pct * 100,
    cagr_pct: metrics.cagr * 100
  }), [metrics])

  // Decimated equity data - max 300 points
  const equityData = useMemo(() => {
    const full = equity_curve.map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      date: format(new Date(point.timestamp), 'MMM dd HH:mm'),
      equity: point.equity,
      drawdown: point.drawdown * 100,
      return: point.return_pct * 100
    }))
    return decimateData(full, 300)
  }, [equity_curve])

  const tradesData = useMemo(() => {
    return trades
      .filter(t => t.side === 'SELL' && t.pnl !== null)
      .map((trade) => ({
        timestamp: new Date(trade.timestamp).getTime(),
        date: format(new Date(trade.timestamp), 'MMM dd HH:mm'),
        pnl: trade.pnl || 0,
        pnl_pct: trade.pnl_pct ? trade.pnl_pct * 100 : 0,
        price: trade.price
      }))
  }, [trades])

  const cumulativePnL = useMemo(() => {
    let cumulative = 0
    return tradesData.map((trade) => {
      cumulative += trade.pnl
      return {
        ...trade,
        cumulative_pnl: cumulative
      }
    })
  }, [tradesData])

  // Decimated price chart - max 300 points
  const priceChartData = useMemo(() => {
    if (!market_data || market_data.length === 0) {
      return []
    }

    const normalizeTimestamp = (ts: string): number => {
      return new Date(ts).getTime()
    }

    const tradeMap = new Map<number, { side: 'BUY' | 'SELL', price: number, pnl?: number }>()

    trades.forEach(trade => {
      const ts = normalizeTimestamp(trade.timestamp)
      tradeMap.set(ts, {
        side: trade.side,
        price: trade.price,
        pnl: trade.pnl || undefined
      })
    })

    const full = market_data.map((candle) => {
      const ts = normalizeTimestamp(candle.timestamp)
      const trade = tradeMap.get(ts)
      
      // For candlestick: map OHLC to y-coordinates
      const isGreen = candle.close > candle.open
      const bodyTop = Math.max(candle.open, candle.close)
      const bodyBottom = Math.min(candle.open, candle.close)

      return {
        timestamp: ts,
        date: format(new Date(candle.timestamp), 'MMM dd HH:mm'),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        // For Bar component in candlestick mode
        candleData: [bodyBottom, bodyTop],
        buy: trade?.side === 'BUY' ? trade.price : null,
        sell: trade?.side === 'SELL' ? trade.price : null,
        sellPnl: trade?.side === 'SELL' ? trade.pnl : null
      }
    })

    return decimateData(full, 300)
  }, [market_data, trades])

  const buyCount = useMemo(() =>
    priceChartData.filter(d => d.buy !== null && d.buy !== undefined).length,
    [priceChartData]
  )

  const sellCount = useMemo(() =>
    priceChartData.filter(d => d.sell !== null && d.sell !== undefined).length,
    [priceChartData]
  )

  const isPositive = normalizedMetrics.total_return_pct > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Backtest Results</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {results.symbol} • {format(new Date(results.start_date), 'MMM dd, yyyy')} - {format(new Date(results.end_date), 'MMM dd, yyyy')}
          </p>
        </div>
        <Badge variant={isPositive ? "default" : "destructive"} className="text-lg px-4 py-2">
          {isPositive ? <TrendingUp className="h-4 w-4 mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
          {normalizedMetrics.total_return_pct > 0 ? '+' : ''}{normalizedMetrics.total_return_pct.toFixed(2)}%
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Final Equity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.final_equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Initial: ${results.initial_capital.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{normalizedMetrics.win_rate_pct.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.winning_trades}W / {metrics.losing_trades}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sharpe Ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sharpe_ratio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sortino: {metrics.sortino_ratio.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Max Drawdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{normalizedMetrics.max_drawdown_pct.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${Math.abs(metrics.max_drawdown).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="price">Price & Trades</TabsTrigger>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          <TabsTrigger value="trades">Trade PnL</TabsTrigger>
        </TabsList>

        {activeTab === 'price' && (
          <TabsContent value="price" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Price Chart with Trade Signals</CardTitle>
                    <CardDescription className="mt-2">
                      <span className="inline-flex items-center gap-2 mr-4">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                        Buy Signals ({buyCount})
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                        Sell Signals ({sellCount})
                      </span>
                    </CardDescription>
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
              </CardHeader>
              <CardContent>
                {priceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    {chartMode === 'line' ? (
                      <ComposedChart data={priceChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any, name: string) => {
                            if (!value) return null
                            if (name === 'close') return [`$${value.toFixed(2)}`, 'Price']
                            if (name === 'buy') return [`$${value.toFixed(2)}`, 'Buy']
                            if (name === 'sell') return [`$${value.toFixed(2)}`, 'Sell']
                            return [value, name]
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="close"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Scatter
                          dataKey="buy"
                          fill="#22c55e"
                          stroke="#000"
                          strokeWidth={1}
                          shape="circle"
                          r={5}
                        />
                        <Scatter
                          dataKey="sell"
                          fill="#ef4444"
                          stroke="#000"
                          strokeWidth={1}
                          shape="circle"
                          r={5}
                        />
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={priceChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                        <XAxis
                          dataKey="date"
                          stroke="#888888"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          domain={['auto', 'auto']}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any, name: string) => {
                            if (!value) return null
                            if (name === 'open') return [`$${value.toFixed(2)}`, 'Open']
                            if (name === 'high') return [`$${value.toFixed(2)}`, 'High']
                            if (name === 'low') return [`$${value.toFixed(2)}`, 'Low']
                            if (name === 'close') return [`$${value.toFixed(2)}`, 'Close']
                            if (name === 'buy') return [`$${value.toFixed(2)}`, 'Buy']
                            if (name === 'sell') return [`$${value.toFixed(2)}`, 'Sell']
                            return [value, name]
                          }}
                        />
                        <Bar
                          dataKey="candleData"
                          shape={<CandleShape />}
                          maxBarSize={8}
                        />
                        <Scatter
                          dataKey="buy"
                          fill="#22c55e"
                          stroke="#000"
                          strokeWidth={1}
                          shape="circle"
                          r={5}
                        />
                        <Scatter
                          dataKey="sell"
                          fill="#ef4444"
                          stroke="#000"
                          strokeWidth={1}
                          shape="circle"
                          r={5}
                        />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No price data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {activeTab === 'equity' && (
          <TabsContent value="equity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Equity Growth</CardTitle>
                <CardDescription>Portfolio value over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={equityData}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Equity']}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#equityGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {activeTab === 'drawdown' && (
          <TabsContent value="drawdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Drawdown Analysis</CardTitle>
                <CardDescription>Peak-to-trough decline</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={equityData}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#drawdownGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {activeTab === 'trades' && (
          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Trade PnL</CardTitle>
                <CardDescription>Profit and loss per trade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cumulativePnL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'cumulative_pnl') {
                          return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Cumulative PnL']
                        }
                        return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Trade PnL']
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative_pnl"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Trade Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Trades</span>
              <span className="font-semibold">{metrics.total_trades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Profit Factor</span>
              <span className="font-semibold">{metrics.profit_factor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">CAGR</span>
              <span className="font-semibold">{normalizedMetrics.cagr_pct.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Holding Time</span>
              <span className="font-semibold">{trade_analysis.avg_holding_time_minutes} min</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trade Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Win</span>
              <span className="font-semibold text-green-500">${trade_analysis.avg_win.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Loss</span>
              <span className="font-semibold text-red-500">${Math.abs(trade_analysis.avg_loss).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Win</span>
              <span className="font-semibold text-green-500">${trade_analysis.largest_win.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Loss</span>
              <span className="font-semibold text-red-500">${Math.abs(trade_analysis.largest_loss).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Details */}
      {results.execution_time_seconds && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Execution Time: {results.execution_time_seconds.toFixed(2)}s</span>
              </div>
              <div>
                Backtest ID: {results.backtest_id.slice(0, 8)}...
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})
