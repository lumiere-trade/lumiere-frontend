"use client"

import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@lumiere/shared/components/ui/button"
import { cn } from "@lumiere/shared/lib/utils"

export interface RecentTrade {
  id: string
  side: "BUY" | "SELL"
  price: number
  quantity: number
  pnl: number | null
  pnlPct: number | null
  timestamp: Date
}

interface RecentTradesCardProps {
  trades: RecentTrade[]
  symbol: string
  onViewAll?: () => void
  isLoading?: boolean
}

export function RecentTradesCard({
  trades,
  symbol,
  onViewAll,
  isLoading = false
}: RecentTradesCardProps) {
  const formatCurrency = (value: number) => {
    return `$${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-card p-5">
        <div className="h-6 w-32 bg-muted/50 animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted/50 animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Recent Trades
        </h3>
        {onViewAll && trades.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="h-7 text-xs">
            View All
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {trades.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No trades yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trades.slice(0, 5).map((trade) => {
            const SideIcon = trade.side === "BUY" ? ArrowUpRight : ArrowDownRight
            const hasPnL = trade.pnl !== null && trade.pnlPct !== null
            const isProfit = hasPnL && trade.pnl! >= 0

            return (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-lg border border-primary/10 bg-background/50"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={trade.side === "BUY" ? "success" : "destructive"}
                    className="w-14 justify-center"
                  >
                    <SideIcon className="h-3 w-3 mr-0.5" />
                    {trade.side}
                  </Badge>
                  <div>
                    <p className="text-base font-mono font-medium">
                      {formatCurrency(trade.price)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {trade.quantity.toFixed(4)} {symbol.split('/')[0]}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {hasPnL ? (
                    <>
                      <p className={cn(
                        "text-base font-mono font-medium",
                        isProfit ? "text-green-500" : "text-red-500"
                      )}>
                        {isProfit ? "+" : "-"}{formatCurrency(trade.pnl!)}
                      </p>
                      <p className={cn(
                        "text-sm",
                        isProfit ? "text-green-500" : "text-red-500"
                      )}>
                        {isProfit ? "+" : ""}{trade.pnlPct!.toFixed(2)}%
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {formatTime(trade.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
