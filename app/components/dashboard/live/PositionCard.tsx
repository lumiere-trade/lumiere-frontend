"use client"

import { ArrowUpRight, ArrowDownRight, Clock, Target, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@lumiere/shared/lib/utils"

export interface Position {
  side: "LONG" | "SHORT"
  entryPrice: number
  currentPrice: number
  quantity: number
  value: number
  unrealizedPnL: number
  unrealizedPnLPct: number
  stopLoss: number | null
  takeProfit: number | null
  entryTime: Date
}

interface PositionCardProps {
  position: Position | null
  symbol: string
  isLoading?: boolean
}

export function PositionCard({ position, symbol, isLoading = false }: PositionCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-4">
        <div className="h-6 w-32 bg-muted/50 animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-muted/50 animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="rounded-xl border border-primary/20 bg-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Current Position
        </h3>
        <div className="text-center py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mx-auto mb-3">
            <Target className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground">No Open Position</p>
          <p className="text-sm text-muted-foreground mt-1">
            Waiting for entry signal
          </p>
        </div>
      </div>
    )
  }

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

  const isProfit = position.unrealizedPnL >= 0
  const SideIcon = position.side === "LONG" ? ArrowUpRight : ArrowDownRight

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Current Position
        </h3>
        <Badge
          variant={position.side === "LONG" ? "success" : "destructive"}
          className="gap-1"
        >
          <SideIcon className="h-3 w-3" />
          {position.side}
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Entry Info */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Entry Price</span>
          <span className="text-base font-mono font-medium">
            {formatCurrency(position.entryPrice)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Price</span>
          <span className="text-base font-mono font-medium">
            {formatCurrency(position.currentPrice)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Size</span>
          <span className="text-base font-mono font-medium">
            {position.quantity.toFixed(4)} {symbol.split('/')[0]}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Value</span>
          <span className="text-base font-mono font-medium">
            {formatCurrency(position.value)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-primary/10 my-2" />

        {/* P&L */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Unrealized P&L</span>
          <div className="text-right">
            <span className={cn(
              "text-base font-mono font-semibold",
              isProfit ? "text-green-500" : "text-red-500"
            )}>
              {isProfit ? "+" : "-"}{formatCurrency(position.unrealizedPnL)}
            </span>
            <span className={cn(
              "text-sm ml-1",
              isProfit ? "text-green-500" : "text-red-500"
            )}>
              ({isProfit ? "+" : ""}{position.unrealizedPnLPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary/10 my-2" />

        {/* Risk Management */}
        {position.stopLoss && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3 text-red-500" />
              Stop Loss
            </span>
            <span className="text-base font-mono text-red-500">
              {formatCurrency(position.stopLoss)}
            </span>
          </div>
        )}

        {position.takeProfit && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3 text-green-500" />
              Take Profit
            </span>
            <span className="text-base font-mono text-green-500">
              {formatCurrency(position.takeProfit)}
            </span>
          </div>
        )}

        {/* Entry Time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Entry Time
          </span>
          <span>{formatTime(position.entryTime)}</span>
        </div>
      </div>
    </div>
  )
}
