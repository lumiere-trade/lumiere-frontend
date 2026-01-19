"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import { Badge } from "@lumiere/shared/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@lumiere/shared/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Wifi, WifiOff, Clock, Target, ChevronDown, ChevronUp } from "lucide-react"
import { format } from "date-fns"
import { MultiPanelChart } from "@/components/charts/MultiPanelChart"
import { EquityCurve, PnLChart } from "@/components/charts"
import { useLiveDashboard } from "@/contexts/LiveDashboardContext"
import { cn } from "@/lib/utils"

interface LiveStrategyViewProps {
  deploymentStatus: string
  deploymentVersion: number
}

export function LiveStrategyView({ deploymentStatus, deploymentVersion }: LiveStrategyViewProps) {
  const {
    config,
    connectionStatus,
    isConnected,
    latencyMs,
    chartCandles,
    chartTrades,
    indicatorData,
    position,
    equity,
    initialCapital,
    realizedPnL,
    totalTrades,
    recentTrades,
    indicators,
    error,
    isWarmingUp,
  } = useLiveDashboard()

  const [activeTab, setActiveTab] = useState('price')
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null)

  // Calculate metrics
  const totalReturn = equity - initialCapital
  const totalReturnPct = ((totalReturn / initialCapital) * 100)
  const isPositive = totalReturn >= 0

  const winningTrades = recentTrades.filter(t => t.pnl && t.pnl > 0).length
  const losingTrades = recentTrades.filter(t => t.pnl && t.pnl < 0).length
  const completedTrades = winningTrades + losingTrades
  const winRate = completedTrades > 0 ? (winningTrades / completedTrades) * 100 : 0

  // Connection status formatting
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return "Never"
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    if (diffSecs < 5) return "Just now"
    if (diffSecs < 60) return `${diffSecs}s ago`
    return `${Math.floor(diffSecs / 60)}m ago`
  }

  // Equity curve data
  const equityCurveData = useMemo(() => {
    if (recentTrades.length === 0) return []
    
    let cumulative = initialCapital
    return recentTrades
      .filter(t => t.pnl !== null)
      .map(t => {
        cumulative += t.pnl!
        return {
          timestamp: t.timestamp.getTime(),
          equity: cumulative,
          drawdown: 0, // TODO: Calculate properly
          return_pct: ((cumulative - initialCapital) / initialCapital) * 100
        }
      })
  }, [recentTrades, initialCapital])

  // PnL chart data
  const pnlChartData = useMemo(() => {
    if (recentTrades.length === 0) return []
    
    let cumulative = 0
    return recentTrades
      .filter(t => t.side === 'SELL' && t.pnl !== null)
      .map(t => {
        cumulative += t.pnl!
        return {
          timestamp: t.timestamp.getTime(),
          pnl: cumulative
        }
      })
  }, [recentTrades])

  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTrade(expandedTrade === tradeId ? null : tradeId)
  }

  // Current price from last candle
  const currentPrice = chartCandles.length > 0 
    ? chartCandles[chartCandles.length - 1].c 
    : 0

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">Live Trading</h2>
          <Badge variant={deploymentStatus === 'ACTIVE' ? 'default' : 'secondary'}>
            {deploymentStatus} • v{deploymentVersion}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <div className="flex h-2 w-2 rounded-full bg-green-500">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-green-400 opacity-75" />
                </div>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Connected</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-500">Disconnected</span>
              </>
            )}
          </div>
          
          {/* Latency */}
          {latencyMs !== null && (
            <div className="flex items-center gap-1">
              <span className={cn(
                "font-mono text-sm",
                latencyMs < 100 ? "text-green-500" :
                latencyMs < 500 ? "text-yellow-500" :
                "text-red-500"
              )}>
                {latencyMs}ms
              </span>
            </div>
          )}

          {/* Last Update */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatLastUpdate(connectionStatus.lastMessageAt)}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error.last_error}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base font-semibold">Current Equity</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-base font-semibold">${equity.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Initial: ${initialCapital.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base font-semibold">Total Return</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className={cn(
              "text-base font-semibold flex items-center gap-1",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? '+' : ''}{totalReturnPct.toFixed(2)}%
            </div>
            <p className={cn(
              "text-sm mt-1",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {isPositive ? '+' : ''${totalReturn.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base font-semibold">Win Rate</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-base font-semibold">
              {completedTrades > 0 ? `${winRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {winningTrades}W / {losingTrades}L
            </p>
          </CardContent>
        </Card>

        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base font-semibold">Position</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-base font-semibold">
              {position ? position.side : 'FLAT'}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {position ? `${position.quantity.toFixed(4)} ${config.symbol.split('/')[0]}` : 'No open trades'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Position Details */}
      {position && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Current Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Entry Price</p>
                <p className="text-base font-mono font-medium">${position.entryPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-base font-mono font-medium">${position.currentPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                <p className={cn(
                  "text-base font-mono font-medium",
                  position.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {position.unrealizedPnL >= 0 ? '+' : ''}{position.unrealizedPnL.toFixed(2)} 
                  ({position.unrealizedPnLPct >= 0 ? '+' : ''}{position.unrealizedPnLPct.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Value</p>
                <p className="text-base font-mono font-medium">${position.value.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 items-center !p-0">
          <TabsTrigger value="price" className="text-md !h-auto">Price & Trades</TabsTrigger>
          <TabsTrigger value="trades" className="text-md !h-auto">Trade History</TabsTrigger>
          <TabsTrigger value="equity" className="text-md !h-auto">Equity Curve</TabsTrigger>
          <TabsTrigger value="pnl" className="text-md !h-auto">Cumulative P&L</TabsTrigger>
        </TabsList>

        {/* Price & Trades Tab */}
        <TabsContent value="price" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {config.symbol} • {config.timeframe}
              </CardTitle>
              <CardDescription className="text-sm">
                {chartCandles.length} candles loaded • {indicatorData.length} indicators (GPU)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isWarmingUp && chartCandles.length === 0 ? (
                <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
                    <p className="text-lg font-medium">Loading Historical Data...</p>
                    <p className="text-sm mt-1">Fetching market history from Chronicler</p>
                  </div>
                </div>
              ) : chartCandles.length > 0 ? (
                <MultiPanelChart
                  candles={chartCandles}
                  trades={chartTrades}
                  indicatorData={indicatorData}
                  timeframe={config.timeframe}
                  mode="C"
                  showIndicatorToggles={true}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                  No price data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade History Tab */}
        <TabsContent value="trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade Execution History</CardTitle>
              <CardDescription>
                {recentTrades.length} trades • Real-time updates via WebSocket
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTrades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No trades yet - waiting for entry signal
                </div>
              ) : (
                <div className="rounded-lg border border-primary/20">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px] text-md"></TableHead>
                        <TableHead className="w-[140px] text-md">Time</TableHead>
                        <TableHead className="w-[80px] text-md">Side</TableHead>
                        <TableHead className="w-[100px] text-right text-md">Price</TableHead>
                        <TableHead className="w-[100px] text-right text-md">Quantity</TableHead>
                        <TableHead className="w-[110px] text-right text-md">P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...recentTrades].reverse().map((trade) => {
                        const isExpanded = expandedTrade === trade.id

                        return (
                          <TableRow 
                            key={trade.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleTradeExpansion(trade.id)}
                          >
                            <TableCell className="w-[50px]">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </TableCell>
                            <TableCell className="w-[140px] font-mono text-md">
                              {format(trade.timestamp, 'MMM dd HH:mm:ss')}
                            </TableCell>
                            <TableCell className="w-[80px]">
                              <Badge variant={trade.side === 'BUY' ? 'default' : 'destructive'}>
                                {trade.side}
                              </Badge>
                            </TableCell>
                            <TableCell className="w-[100px] text-right font-mono text-md">
                              ${trade.price.toFixed(2)}
                            </TableCell>
                            <TableCell className="w-[100px] text-right font-mono text-md">
                              {trade.quantity.toFixed(4)}
                            </TableCell>
                            <TableCell className={cn(
                              "w-[110px] text-right font-mono text-md",
                              trade.pnl !== null ? (trade.pnl >= 0 ? 'text-green-500' : 'text-red-500') : ''
                            )}>
                              {trade.pnl !== null ? `$${trade.pnl.toFixed(2)}` : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equity Curve Tab */}
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
                  No equity data yet - waiting for completed trades
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cumulative P&L Tab */}
        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative Profit & Loss</CardTitle>
              <CardDescription>Running total of realized P&L</CardDescription>
            </CardHeader>
            <CardContent>
              {pnlChartData.length > 0 ? (
                <PnLChart data={pnlChartData} height={450} />
              ) : (
                <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                  No P&L data yet - waiting for completed trades
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-md text-muted-foreground">Total Trades</span>
              <span className="text-md font-semibold">{totalTrades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-md text-muted-foreground">Completed Trades</span>
              <span className="text-md font-semibold">{completedTrades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-md text-muted-foreground">Realized P&L</span>
              <span className={cn(
                "text-md font-semibold",
                realizedPnL >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {realizedPnL >= 0 ? '+' : ''}${realizedPnL.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-md text-muted-foreground">Current Price</span>
              <span className="text-md font-mono font-semibold">${currentPrice.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Indicators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(indicators).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Waiting for indicator data...
              </div>
            ) : (
              Object.entries(indicators).slice(0, 4).map(([name, value]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-md text-muted-foreground">{name.toUpperCase()}</span>
                  <span className="text-md font-mono font-semibold">{value.toFixed(2)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
