"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import { Badge } from "@lumiere/shared/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lumiere/shared/components/ui/tabs"
import { 
  LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter
} from 'recharts'
import { TrendingUp, TrendingDown, Clock } from "lucide-react"
import { BacktestResponse } from "@/lib/api/cartographe"
import { format } from "date-fns"

interface BacktestResultsProps {
  results: BacktestResponse
  onClose?: () => void
}

export function BacktestResults({ results, onClose }: BacktestResultsProps) {
  const { metrics, equity_curve, trades, trade_analysis, market_data } = results

  // Backend is inconsistent: win_rate is already percentage, but other *_pct fields are decimals
  // Normalize to always display as percentage
  const normalizedMetrics = useMemo(() => ({
    ...metrics,
    // win_rate comes as 20.0 (already percent), don't multiply
    win_rate_pct: metrics.win_rate,
    // These come as -0.0607 (decimal), multiply by 100
    total_return_pct: metrics.total_return_pct * 100,
    max_drawdown_pct: metrics.max_drawdown_pct * 100,
    cagr_pct: metrics.cagr * 100
  }), [metrics])

  // Format equity curve data for Recharts
  const equityData = useMemo(() => {
    return equity_curve.map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      date: format(new Date(point.timestamp), 'MMM dd HH:mm'),
      equity: point.equity,
      drawdown: point.drawdown * 100,
      return: point.return_pct * 100
    }))
  }, [equity_curve])

  // Format trades for display
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

  // Calculate cumulative PnL
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

  // Prepare price chart data with buy/sell markers
  // Handle inconsistent timestamp formats from backend
  const priceChartData = useMemo(() => {
    if (!market_data || market_data.length === 0) {
      return []
    }

    // Normalize timestamps to milliseconds for comparison
    const normalizeTimestamp = (ts: string): number => {
      return new Date(ts).getTime()
    }

    // Create map of normalized timestamps to trades
    const tradeMap = new Map<number, { side: 'BUY' | 'SELL', price: number, pnl?: number }>()
    
    trades.forEach(trade => {
      const ts = normalizeTimestamp(trade.timestamp)
      tradeMap.set(ts, {
        side: trade.side,
        price: trade.price,
        pnl: trade.pnl || undefined
      })
    })

    // Combine market data with trades
    return market_data.map((candle) => {
      const ts = normalizeTimestamp(candle.timestamp)
      const trade = tradeMap.get(ts)
      
      return {
        timestamp: ts,
        date: format(new Date(candle.timestamp), 'MMM dd HH:mm'),
        close: candle.close,
        high: candle.high,
        low: candle.low,
        buy: trade?.side === 'BUY' ? trade.price : undefined,
        sell: trade?.side === 'SELL' ? trade.price : undefined,
        sellPnl: trade?.side === 'SELL' ? trade.pnl : undefined
      }
    })
  }, [market_data, trades])

  // Count buy/sell signals
  const buyCount = priceChartData.filter(d => d.buy !== undefined).length
  const sellCount = priceChartData.filter(d => d.sell !== undefined).length

  const isPositive = normalizedMetrics.total_return_pct > 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
      <Tabs defaultValue="price" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="price">Price & Trades</TabsTrigger>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          <TabsTrigger value="trades">Trade PnL</TabsTrigger>
        </TabsList>

        <TabsContent value="price" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Chart with Trade Signals</CardTitle>
              <CardDescription>
                <span className="inline-flex items-center gap-2 mr-4">
                  <span className="inline-block w-3 h-3 rounded-full bg-chart-2"></span>
                  Buy Signals ({buyCount})
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-destructive"></span>
                  Sell Signals ({sellCount})
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={priceChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'close') return [`$${value.toFixed(2)}`, 'Price']
                      if (name === 'buy') return [`$${value.toFixed(2)}`, 'Buy']
                      if (name === 'sell') return [`$${value.toFixed(2)}`, 'Sell']
                      return [value, name]
                    }}
                  />
                  {/* Price line */}
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    name="close"
                  />
                  {/* Buy signals */}
                  <Scatter 
                    dataKey="buy"
                    fill="hsl(var(--chart-2))"
                    shape="circle"
                    r={6}
                    name="buy"
                  />
                  {/* Sell signals */}
                  <Scatter 
                    dataKey="sell"
                    fill="hsl(var(--destructive))"
                    shape="circle"
                    r={6}
                    name="sell"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

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
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Equity']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#equityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

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
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="drawdown" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    fill="url(#drawdownGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Trade PnL</CardTitle>
              <CardDescription>Profit and loss per trade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cumulativePnL}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--border))"
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
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
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
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
              <span className="font-semibold text-chart-2">${trade_analysis.avg_win.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Loss</span>
              <span className="font-semibold text-destructive">${Math.abs(trade_analysis.avg_loss).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Win</span>
              <span className="font-semibold text-chart-2">${trade_analysis.largest_win.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Loss</span>
              <span className="font-semibold text-destructive">${Math.abs(trade_analysis.largest_loss).toFixed(2)}</span>
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
}
