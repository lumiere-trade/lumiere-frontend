"use client"

import { memo, useMemo } from "react"
import { Card, CardContent } from "@lumiere/shared/components/ui/card"
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
      <h3 className="text-xl font-bold text-foreground">Exit Breakdown</h3>
      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Stop Loss */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <OctagonX className="h-5 w-5 text-destructive" />
                <span className="text-base font-semibold">Stop Loss</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.stopLoss.count}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm font-medium">
                    {calculatePercentage(stats.stopLoss.count)}%
                  </Badge>
                  {stats.stopLoss.pnl !== 0 && (
                    <span className="text-sm font-mono font-semibold text-red-500">
                      ${stats.stopLoss.pnl.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Take Profit */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <span className="text-base font-semibold">Take Profit</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.takeProfit.count}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm font-medium">
                    {calculatePercentage(stats.takeProfit.count)}%
                  </Badge>
                  {stats.takeProfit.pnl !== 0 && (
                    <span className="text-sm font-mono font-semibold text-green-500">
                      +${stats.takeProfit.pnl.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Entry Signals */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowUp className="h-5 w-5 text-blue-500" />
                <span className="text-base font-semibold">Entry Signals</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.entrySignals.count}</div>
                <Badge variant="outline" className="text-sm font-medium">
                  {calculatePercentage(stats.entrySignals.count)}%
                </Badge>
              </div>
            </div>

            {/* Exit Signals */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ArrowDown className="h-5 w-5 text-orange-500" />
                <span className="text-base font-semibold">Exit Signals</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stats.exitSignals.count}</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm font-medium">
                    {calculatePercentage(stats.exitSignals.count)}%
                  </Badge>
                  {stats.exitSignals.pnl !== 0 && (
                    <span className={`text-sm font-mono font-semibold ${
                      stats.exitSignals.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stats.exitSignals.pnl >= 0 ? '+' : ''}${stats.exitSignals.pnl.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
