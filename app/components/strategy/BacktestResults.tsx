"use client"

import { useMemo, memo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import { Badge } from "@lumiere/shared/components/ui/badge"
import { Button } from "@lumiere/shared/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lumiere/shared/components/ui/tabs"
import { TrendingUp, TrendingDown, Clock, X } from "lucide-react"
import { BacktestResponse } from "@/lib/api/cartographe"
import { format } from "date-fns"
import { TradingChart, EquityCurve, DrawdownChart, PnLChart } from "@/components/charts"

interface BacktestResultsProps {
  results: BacktestResponse
  onClose?: () => void
}

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

export const BacktestResults = memo(function BacktestResults({ results, onClose }: BacktestResultsProps) {
  const { metrics, equity_curve, trades, trade_analysis, market_data } = results
  const [activeTab, setActiveTab] = useState('price')

  const normalizedMetrics = useMemo(() => ({
    ...metrics,
    win_rate_pct: metrics.win_rate,
    total_return_pct: metrics.total_return_pct * 100,
    max_drawdown_pct: metrics.max_drawdown_pct * 100,
    cagr_pct: metrics.cagr * 100
  }), [metrics])

  // Equity data for custom EquityCurve component
  const equityCurveData = useMemo(() => {
    const full = equity_curve.map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      equity: point.equity,
      drawdown: point.drawdown,
      return_pct: point.return_pct
    }))
    return decimateData(full, 300)
  }, [equity_curve])

  // Drawdown data for custom DrawdownChart component
  const drawdownChartData = useMemo(() => {
    const full = equity_curve.map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      drawdown: point.drawdown
    }))
    return decimateData(full, 300)
  }, [equity_curve])

  // PnL data for custom PnLChart component
  const pnlChartData = useMemo(() => {
    const tradesWithPnL = trades.filter(t => t.side === 'SELL' && t.pnl !== null)
    
    let cumulative = 0
    const full = tradesWithPnL.map((trade) => {
      cumulative += trade.pnl || 0
      return {
        timestamp: new Date(trade.timestamp).getTime(),
        pnl: cumulative
      }
    })
    
    return decimateData(full, 300)
  }, [trades])

  // Price chart data for custom TradingChart
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

      return {
        timestamp: ts,
        date: format(new Date(candle.timestamp), 'MMM dd HH:mm'),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        buy: trade?.side === 'BUY' ? trade.price : null,
        sell: trade?.side === 'SELL' ? trade.price : null,
      }
    })

    return decimateData(full, 300)
  }, [market_data, trades])

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
                <CardTitle>Price Chart with Trade Signals</CardTitle>
              </CardHeader>
              <CardContent>
                {priceChartData.length > 0 ? (
                  <TradingChart data={priceChartData} height={450} />
                ) : (
                  <div className="h-[450px] flex items-center justify-center text-muted-foreground">
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
                {equityCurveData.length > 0 ? (
                  <EquityCurve data={equityCurveData} height={450} />
                ) : (
                  <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                    No equity data available
                  </div>
                )}
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
                {drawdownChartData.length > 0 ? (
                  <DrawdownChart data={drawdownChartData} height={450} />
                ) : (
                  <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                    No drawdown data available
                  </div>
                )}
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
                {pnlChartData.length > 0 ? (
                  <PnLChart data={pnlChartData} height={450} />
                ) : (
                  <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                    No trade data available
                  </div>
                )}
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

      {/* Close Button - Centered at bottom */}
      {onClose && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Close Results
          </Button>
        </div>
      )}
    </div>
  )
})
