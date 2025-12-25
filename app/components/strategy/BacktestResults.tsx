"use client"

import { useMemo, memo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import { Badge } from "@lumiere/shared/components/ui/badge"
import { Button } from "@lumiere/shared/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lumiere/shared/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Clock, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react"
import { BacktestResponse } from "@/lib/api/cartographe"
import { format } from "date-fns"
import { MultiPanelChart } from "@/components/charts/MultiPanelChart"
import { EquityCurve, DrawdownChart, PnLChart } from "@/components/charts"
import { Candle, Trade } from "@/components/charts/types"
import { TradeReasonBadge } from "./TradeReasonBadge"
import { TradeAnalyticsSummary } from "./TradeAnalyticsSummary"

interface BacktestResultsProps {
  results: BacktestResponse
  onClose?: () => void
  isTransitioning?: boolean
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

export const BacktestResults = memo(function BacktestResults({ results, onClose, isTransitioning = false }: BacktestResultsProps) {
  const { metrics, equity_curve, trades, trade_analysis, market_data, indicator_data } = results
  const [activeTab, setActiveTab] = useState('price')
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [indicatorVisibility, setIndicatorVisibility] = useState<Record<string, boolean>>({})
  const tradesPerPage = 15

  const normalizedMetrics = useMemo(() => ({
    ...metrics,
    win_rate_pct: metrics.win_rate,
    total_return_pct: metrics.total_return_pct,
    max_drawdown_pct: metrics.max_drawdown_pct,
    cagr_pct: metrics.cagr * 100
  }), [metrics])

  // Pagination for trades - newest first
  const totalPages = Math.ceil(trades.length / tradesPerPage)
  const paginatedTrades = useMemo(() => {
    const reversed = [...trades].reverse()
    const start = (currentPage - 1) * tradesPerPage
    const end = start + tradesPerPage
    return reversed.slice(start, end)
  }, [trades, currentPage])

  // Reset page when switching to details tab
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'details') {
      setCurrentPage(1)
    }
  }

  // Transform market data to Candle format
  const candles: Candle[] = useMemo(() => {
    if (!market_data || market_data.length === 0) return []

    return market_data.map((candle) => ({
      t: new Date(candle.timestamp).getTime(),
      o: candle.open,
      h: candle.high,
      l: candle.low,
      c: candle.close,
      v: candle.volume
    }))
  }, [market_data])

  // Transform trades to Trade format - WITH detailed reasons and indicators
  const chartTrades: Trade[] = useMemo(() => {
    return trades.map((trade) => ({
      t: new Date(trade.timestamp).getTime(),
      p: trade.price,
      s: trade.side === 'BUY' ? 'B' : 'S',
      reason: trade.reason,
      indicators: trade.indicators,
      pnl: trade.pnl,
      pnl_pct: trade.pnl_pct
    }))
  }, [trades])

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

  const isPositive = normalizedMetrics.total_return_pct > 0

  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTrade(expandedTrade === tradeId ? null : tradeId)
  }

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
        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base">Final Equity</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">${metrics.final_equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Initial: ${results.initial_capital.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base">Win Rate</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">{normalizedMetrics.win_rate_pct.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.winning_trades}W / {metrics.losing_trades}L
            </p>
          </CardContent>
        </Card>

        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base">Sharpe Ratio</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold">{metrics.sharpe_ratio.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sortino: {metrics.sortino_ratio.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base">Max Drawdown</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-2xl font-bold text-destructive">{normalizedMetrics.max_drawdown_pct.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${Math.abs(metrics.max_drawdown).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trade Analytics Summary - NEW */}
      <TradeAnalyticsSummary trades={trades} />

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="price">Price & Trades</TabsTrigger>
          <TabsTrigger value="details">Trade Details</TabsTrigger>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          <TabsTrigger value="trades">Trade PnL</TabsTrigger>
        </TabsList>

        {activeTab === 'price' && (
          <TabsContent value="price" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Price Chart with Trade Signals</CardTitle>
                <CardDescription>
                  {indicator_data && indicator_data.length > 0
                    ? `${indicator_data.length} indicators loaded • Toggle visibility below`
                    : 'Price chart with buy/sell signals'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Render chart ONLY when NOT transitioning */}
                {!isTransitioning && candles.length > 0 && (
                  <MultiPanelChart
                    candles={candles}
                    trades={chartTrades}
                    indicatorData={indicator_data || []}
                    mode="C"
                    showIndicatorToggles={true}
                    initialVisibility={indicatorVisibility}
                    onVisibilityChange={setIndicatorVisibility}
                  />
                )}

                {/* Clean blur placeholder during transition */}
                {isTransitioning && (
                  <div className="h-[600px] bg-background/60 backdrop-blur-sm rounded-lg" />
                )}

                {/* No data fallback */}
                {!isTransitioning && candles.length === 0 && (
                  <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                    No price data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {activeTab === 'details' && (
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trade Execution Details</CardTitle>
                    <CardDescription>Complete trade history with detailed reasons and indicator values</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * tradesPerPage) + 1}-{Math.min(currentPage * tradesPerPage, trades.length)} of {trades.length} trades
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-primary/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[120px]">Time</TableHead>
                        <TableHead className="w-[80px]">Side</TableHead>
                        <TableHead className="w-[100px] text-right">Price</TableHead>
                        <TableHead className="w-[100px] text-right">Quantity</TableHead>
                        <TableHead className="w-[110px] text-right">Value</TableHead>
                        <TableHead className="w-[100px] text-right">PnL</TableHead>
                        <TableHead className="w-[200px]">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTrades.map((trade) => {
                        const isExpanded = expandedTrade === trade.id
                        const hasIndicators = Object.keys(trade.indicators || {}).length > 0

                        return (
                          <>
                            <TableRow key={trade.id} className="cursor-pointer hover:bg-muted/50" onClick={() => hasIndicators && toggleTradeExpansion(trade.id)}>
                              <TableCell className="w-[50px]">
                                {hasIndicators && (
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="w-[120px] font-mono text-xs">
                                {format(new Date(trade.timestamp), 'MMM dd HH:mm')}
                              </TableCell>
                              <TableCell className="w-[80px]">
                                <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'} className="font-mono">
                                  {trade.side}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[100px] text-right font-mono text-sm">
                                ${trade.price.toFixed(2)}
                              </TableCell>
                              <TableCell className="w-[100px] text-right font-mono text-sm">
                                {trade.quantity.toFixed(4)}
                              </TableCell>
                              <TableCell className="w-[110px] text-right font-mono text-sm">
                                ${trade.value.toFixed(2)}
                              </TableCell>
                              <TableCell className={`w-[100px] text-right font-mono text-sm ${trade.pnl !== null && trade.pnl !== undefined ? (trade.pnl >= 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                                {trade.pnl !== null && trade.pnl !== undefined ? `$${trade.pnl.toFixed(2)}` : '-'}
                              </TableCell>
                              <TableCell className="w-[200px]">
                                {/* Enhanced with TradeReasonBadge */}
                                <TradeReasonBadge 
                                  reason={trade.reason} 
                                  side={trade.side}
                                  compact
                                />
                              </TableCell>
                            </TableRow>
                            {isExpanded && hasIndicators && (
                              <TableRow key={`${trade.id}-indicators`}>
                                <TableCell colSpan={8} className="bg-muted/30">
                                  <div className="p-4 space-y-2">
                                    <p className="text-sm font-semibold text-foreground mb-3">Indicator Values at Execution:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {Object.entries(trade.indicators).map(([name, value]) => (
                                        <div key={name} className="bg-background border border-primary/20 rounded-lg p-3">
                                          <p className="text-xs text-muted-foreground mb-1">{name.replace(/_/g, ' ').toUpperCase()}</p>
                                          <p className="text-sm font-mono text-foreground">{value.toFixed(4)}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
