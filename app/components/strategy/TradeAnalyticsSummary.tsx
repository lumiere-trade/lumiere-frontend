"use client"

import { memo, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@lumiere/shared/components/ui/card"
import { Badge } from "@lumiere/shared/components/ui/badge"
import { StopCircle, Target, Activity, TrendingUp } from "lucide-react"

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
    <Card>
      <CardHeader>
        <CardTitle>Exit Breakdown</CardTitle>
        <CardDescription>Trade exit analysis by reason type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Stop Loss */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StopCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Stop Loss</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stats.stopLoss.count}</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {calculatePercentage(stats.stopLoss.count)}%
                </Badge>
                {stats.stopLoss.pnl !== 0 && (
                  <span className="text-xs font-mono text-red-500">
                    ${stats.stopLoss.pnl.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Take Profit */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Take Profit</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stats.takeProfit.count}</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {calculatePercentage(stats.takeProfit.count)}%
                </Badge>
                {stats.takeProfit.pnl !== 0 && (
                  <span className="text-xs font-mono text-green-500">
                    +${stats.takeProfit.pnl.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Entry Signals */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Entry Signals</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stats.entrySignals.count}</div>
              <Badge variant="outline" className="text-xs">
                {calculatePercentage(stats.entrySignals.count)}%
              </Badge>
            </div>
          </div>
          
          {/* Exit Signals */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Exit Signals</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stats.exitSignals.count}</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {calculatePercentage(stats.exitSignals.count)}%
                </Badge>
                {stats.exitSignals.pnl !== 0 && (
                  <span className={`text-xs font-mono ${
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
  )
})
