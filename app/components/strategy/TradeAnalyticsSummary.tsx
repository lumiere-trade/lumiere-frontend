"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@lumiere/shared/components/ui/card"
import { Badge } from "@lumiere/shared/components/ui/badge"
import { OctagonX, Target, ArrowUp, ArrowDown } from "lucide-react"

interface Trade {
  timestamp: string
  side: "BUY" | "SELL"
  reason: string
  pnl?: number
}

interface TradeAnalyticsSummaryProps {
  trades: Trade[]
}

interface ReasonStats {
  stopLoss: { count: number; pnl: number }
  takeProfit: { count: number; pnl: number }
  entrySignals: { count: number }
  exitSignals: { count: number; pnl: number }
}

export const TradeAnalyticsSummary = memo(function TradeAnalyticsSummary({
  trades
}: TradeAnalyticsSummaryProps) {

  const stats = useMemo<ReasonStats>(() => {
    const result: ReasonStats = {
      stopLoss: { count: 0, pnl: 0 },
      takeProfit: { count: 0, pnl: 0 },
      entrySignals: { count: 0 },
      exitSignals: { count: 0, pnl: 0 }
    }

    trades.forEach(trade => {
      const lowerReason = trade.reason.toLowerCase()

      if (lowerReason.includes('stop loss')) {
        result.stopLoss.count++
        if (trade.pnl !== null && trade.pnl !== undefined) {
          result.stopLoss.pnl += trade.pnl
        }
      } else if (lowerReason.includes('take profit')) {
        result.takeProfit.count++
        if (trade.pnl !== null && trade.pnl !== undefined) {
          result.takeProfit.pnl += trade.pnl
        }
      } else if (trade.side === 'BUY') {
        result.entrySignals.count++
      } else if (trade.side === 'SELL') {
        result.exitSignals.count++
        if (trade.pnl !== null && trade.pnl !== undefined) {
          result.exitSignals.pnl += trade.pnl
        }
      }
    })

    return result
  }, [trades])

  const totalTrades = trades.length
  const calculatePercentage = (count: number) => {
    return totalTrades > 0 ? ((count / totalTrades) * 100).toFixed(1) : '0.0'
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xl font-semibold text-foreground">Exit Breakdown</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stop Loss */}
        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base font-semibold flex items-center gap-2">
              <OctagonX className="h-5 w-5 text-destructive" />
              Stop Loss
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-base font-semibold">{stats.stopLoss.count}</div>
            <p className="text-md text-muted-foreground mt-1">
              {calculatePercentage(stats.stopLoss.count)}% • {stats.stopLoss.pnl !== 0 && (
                <span className="font-semibold text-red-500">
                  ${stats.stopLoss.pnl.toFixed(0)}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Take Profit */}
        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Take Profit
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-base font-semibold">{stats.takeProfit.count}</div>
            <p className="text-md text-muted-foreground mt-1">
              {calculatePercentage(stats.takeProfit.count)}% • {stats.takeProfit.pnl !== 0 && (
                <span className="font-semibold text-green-500">
                  +${stats.takeProfit.pnl.toFixed(0)}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Entry Signals */}
        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base font-semibold flex items-center gap-2">
              <ArrowUp className="h-5 w-5 text-blue-500" />
              Entry Signals
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-base font-semibold">{stats.entrySignals.count}</div>
            <p className="text-md text-muted-foreground mt-1">
              {calculatePercentage(stats.entrySignals.count)}%
            </p>
          </CardContent>
        </Card>

        {/* Exit Signals */}
        <Card className="py-2 gap-1">
          <CardHeader className="pb-1">
            <CardDescription className="text-base font-semibold flex items-center gap-2">
              <ArrowDown className="h-5 w-5 text-orange-500" />
              Exit Signals
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="text-base font-semibold">{stats.exitSignals.count}</div>
            <p className="text-md text-muted-foreground mt-1">
              {calculatePercentage(stats.exitSignals.count)}% • {stats.exitSignals.pnl !== 0 && (
                <span className={`font-semibold ${
                  stats.exitSignals.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stats.exitSignals.pnl >= 0 ? '+' : ''}${stats.exitSignals.pnl.toFixed(0)}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
